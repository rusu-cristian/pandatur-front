import {
  Textarea,
  Flex,
  ActionIcon,
  Box,
  Button,
  Select,
  Loader,
  FileButton,
  Badge,
} from "@mantine/core";
import { AttachmentsPreview } from "../AttachmentsPreview";
import { useDisclosure } from "@mantine/hooks";
import { FaTasks, FaEnvelope, FaCheckCircle } from "react-icons/fa";
import { useState, useRef, useMemo, useEffect, memo, useCallback } from "react";
import { LuSmile, LuStickyNote } from "react-icons/lu";
import { RiAttachment2 } from "react-icons/ri";
import { useSnackbar } from "notistack";
import { getLanguageByKey } from "../../../utils";
import { getEmailsByGroupTitle } from "../../../utils/emailUtils";
import { templateOptions, templateGroupsByKey, TEMPLATE_GROUP_BY_TITLE } from "../../../../FormOptions";
import { useUploadMediaFile, filterPagesByGroupTitle } from "../../../../hooks";
import { getMediaType } from "../../renderContent";
import { useSocket, useUser } from "@hooks";
import { useTickets } from "../../../../contexts/TicketsContext";
import Can from "../../../CanComponent/Can";
import { TYPE_SOCKET_EVENTS } from "@app-constants";
import { api } from "../../../../api";
import { EmailForm } from "../EmailForm/EmailForm";
import { getPagesByType } from "../../../../constants/webhookPagesConfig";
import { socialMediaIcons } from "../../../utils/socialMediaIcons";
import { SimpleEmojiPicker } from "../SimpleEmojiPicker";
import "./ChatInput.css";

const MESSAGE_LENGTH_LIMIT = 999;
const LIMITED_PLATFORMS = ["facebook", "instagram"];

const resolveTemplateGroup = (groupTitle) => {
  if (!groupTitle) {
    return null;
  }

  const normalized = groupTitle.toUpperCase();
  return TEMPLATE_GROUP_BY_TITLE[normalized] || null;
};

// Вынесено наружу — не зависит от props/state
const renderPlatformOption = ({ option }) => (
  <Flex align="center" justify="space-between" w="100%">
    <span>{option.label}</span>
    {socialMediaIcons[option.value] && (
      <Flex>{socialMediaIcons[option.value]}</Flex>
    )}
  </Flex>
);

export const ChatInput = memo(({
  onSendMessage,
  onHandleFileSelect,
  onCreateTask,
  ticketId,
  unseenCount,
  onToggleNoteComposer,
  personalInfo,
  // Props из useClientContacts (передаются из Chat.js → ChatMessages)
  platformOptions: platformOptionsProp,
  selectedPlatform: selectedPlatformProp,
  changePlatform: changePlatformProp,
  contactOptions: contactOptionsProp,
  changeContact: changeContactProp,
  selectedClient: selectedClientProp,
  selectedPageId: selectedPageIdProp,
  changePageId: changePageIdProp,
  clientContactsLoading: loadingProp,
}) => {
  const [opened, handlers] = useDisclosure(false);
  const [message, setMessage] = useState("");
  const [template, setTemplate] = useState();
  const [isDragOver, setIsDragOver] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const [attachments, setAttachments] = useState([]);
  const textAreaRef = useRef(null);
  const warningShownRef = useRef(false);

  const { uploadFile } = useUploadMediaFile();
  const { userId } = useUser();
  const { socketRef } = useSocket();
  const { markMessagesAsRead, getTicketById } = useTickets();
  const { enqueueSnackbar } = useSnackbar();

  // Получаем данные о воронке и email адресах
  const groupTitle = personalInfo?.group_title || "";
  const fromEmails = getEmailsByGroupTitle(groupTitle);

  // Получаем responsibleId для проверки прав доступа
  const responsibleId = personalInfo?.technician_id
    ? String(personalInfo.technician_id)
    : undefined;

  // ✅ УПРОЩЕНИЕ: Все данные приходят только через props
  // Никакой условной логики - компонент просто отображает данные
  const platformOptions = platformOptionsProp || [];
  const selectedPlatform = selectedPlatformProp;
  const changePlatform = changePlatformProp || (() => { });
  const contactOptions = contactOptionsProp || [];
  const changeContact = changeContactProp || (() => { });
  const currentClient = selectedClientProp;
  const selectedPageId = selectedPageIdProp;
  const changePageId = changePageIdProp || (() => { });
  const loading = loadingProp || false;

  // Валидация props в dev режиме
  useEffect(() => {
    if (import.meta.env.DEV) {
      if (!platformOptionsProp) {
        console.warn('[ChatInput] platformOptions not provided via props');
      }
      if (!changePlatformProp) {
        console.warn('[ChatInput] changePlatform not provided via props');
      }
      if (!changeContactProp) {
        console.warn('[ChatInput] changeContact not provided via props');
      }
      if (!changePageIdProp) {
        console.warn('[ChatInput] changePageId not provided via props');
      }
    }
  }, [platformOptionsProp, changePlatformProp, changeContactProp, changePageIdProp]);

  const isLengthLimited = useMemo(
    () => LIMITED_PLATFORMS.includes((selectedPlatform || "").toLowerCase()),
    [selectedPlatform]
  );

  useEffect(() => {
    if (!isLengthLimited) {
      warningShownRef.current = false;
    }
  }, [isLengthLimited]);

  const templateGroup = useMemo(() => resolveTemplateGroup(groupTitle), [groupTitle]);

  const templateSelectOptions = useMemo(() => {
    if (!templateGroup) {
      return [];
    }

    return Object.keys(templateOptions)
      .filter((key) => templateGroupsByKey[key] === templateGroup)
      .map((key) => ({
        value: key,
        label: key,
      }));
  }, [templateGroup]);

  useEffect(() => {
    if (!templateGroup) {
      setTemplate(undefined);
      return;
    }

    if (template && templateGroupsByKey[template] !== templateGroup) {
      setTemplate(undefined);
    }
  }, [template, templateGroup]);

  // Получаем список page_id для выбранной платформы, отфильтрованный по group_title тикета
  const pageIdOptions = useMemo(() => {
    if (!selectedPlatform) return [];

    const pages = getPagesByType(selectedPlatform);
    const filteredPages = filterPagesByGroupTitle(pages, groupTitle);

    return filteredPages.map(page => ({
      value: page.page_id,
      label: `${page.page_name}`
    }));
  }, [selectedPlatform, groupTitle]);

  // ✅ Проверяем что selectedPageId существует в списке доступных опций
  // Это защита от случая когда pageId из lastMessage не соответствует текущей воронке
  const isPageIdValid = useMemo(() => {
    return selectedPageId && pageIdOptions.some(opt => opt.value === selectedPageId);
  }, [selectedPageId, pageIdOptions]);

  // Получаем actionNeeded из personalInfo (приоритет) или из AppContext (fallback)
  // personalInfo содержит актуальные данные тикета, загруженные напрямую
  // getTicketById может содержать устаревшие данные из кэша списков
  const currentTicketFromContext = getTicketById(ticketId);
  const actionNeeded = personalInfo?.action_needed !== undefined
    ? Boolean(personalInfo.action_needed)
    : currentTicketFromContext
      ? Boolean(currentTicketFromContext.action_needed)
      : false;

  const uploadAndAddFiles = useCallback(async (files) => {
    if (!files?.length) return;
    handlers.open();
    try {
      for (const file of files) {
        const url = await uploadFile(file);
        if (url) {
          const media_type = getMediaType(file.type);
          setAttachments((prev) => [
            ...prev,
            { media_url: url, media_type, name: file.name, size: file.size },
          ]);
        }
      }
    } catch (e) {
      // Upload error
    } finally {
      handlers.close();
      requestAnimationFrame(() => textAreaRef.current?.focus());
    }
  }, [handlers, uploadFile]);

  const handleFileButton = useCallback(async (fileOrFiles) => {
    const files = Array.isArray(fileOrFiles) ? fileOrFiles : [fileOrFiles];
    await uploadAndAddFiles(files);
  }, [uploadAndAddFiles]);

  const handleDrop = useCallback(async (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files || []);
    await uploadAndAddFiles(files);
  }, [uploadAndAddFiles]);

  const handlePaste = useCallback(async (e) => {
    const files = Array.from(e.clipboardData?.files || []);
    if (!files.length) return;
    e.preventDefault();
    await uploadAndAddFiles(files);
  }, [uploadAndAddFiles]);

  const removeAttachment = useCallback((url) => {
    setAttachments((prev) => prev.filter((a) => a.media_url !== url));
  }, []);

  const clearState = useCallback(() => {
    setMessage("");
    setAttachments([]);
    setTemplate(null);
    warningShownRef.current = false;
  }, []);

  const handleMessageChange = useCallback((e) => {
    const newValue = e.target.value;
    setMessage(newValue);

    if (!isLengthLimited) {
      warningShownRef.current = false;
      return;
    }

    // Показываем уведомление только один раз при превышении лимита
    if (newValue.length > MESSAGE_LENGTH_LIMIT && !warningShownRef.current) {
      warningShownRef.current = true;
      enqueueSnackbar(getLanguageByKey("TooLongMessages"), {
        variant: "warning",
      });
    } else if (newValue.length <= MESSAGE_LENGTH_LIMIT) {
      // Сбрасываем флаг, если длина вернулась в норму
      warningShownRef.current = false;
    }
  }, [isLengthLimited, enqueueSnackbar]);

  const buildBasePayload = () => {
    // Проверка актуальности: убеждаемся, что currentClient соответствует текущему ticketId
    if (!currentClient?.payload) {
      throw new Error("Client not selected");
    }

    // Извлекаем только ID клиента из составного ключа (например, "4492-5843" -> "4492")
    const clientId = currentClient?.value ? currentClient.value.split('-')[0] : null;

    // Дополнительная проверка: если client_id не извлечен, выбрасываем ошибку
    if (!clientId || clientId === "x") {
      throw new Error("Invalid client ID");
    }

    const contactValue = currentClient?.payload?.contact_value || null;
    const pageReference = selectedPageId || null;

    return {
      page_id: selectedPageId,
      platform: selectedPlatform,
      client_id: clientId,
      ticket_id: ticketId,
      sender_id: userId,
      contact_value: contactValue,
      from_reference: pageReference,
      to_reference: contactValue,
    };
  };

  const handleMarkAsRead = async () => {
    if (!ticketId) return;

    try {
      // Отправляем CONNECT через сокет
      if (socketRef?.current?.readyState === WebSocket.OPEN) {
        const connectPayload = {
          type: TYPE_SOCKET_EVENTS.CONNECT,
          data: { ticket_id: [ticketId] },
        };
        socketRef.current.send(JSON.stringify(connectPayload));
      }

      // Отправляем seen через API (вместо WebSocket)
      await api.messages.send.markSeen({
        ticket_id: ticketId,
        user_id: userId
      });

      // Локально обновляем UI
      markMessagesAsRead(ticketId, unseenCount);
    } catch (error) {
      // Failed to mark messages as read
    }
  };

  const sendMessage = async () => {
    const trimmedText = message.trim();
    const hasText = !!trimmedText;
    const hasFiles = attachments.length > 0;

    if (!hasText && !hasFiles) return;

    if (isLengthLimited && message.length > MESSAGE_LENGTH_LIMIT) {
      return;
    }

    // Проверка актуальности перед отправкой
    if (!currentClient?.payload) {
      enqueueSnackbar(getLanguageByKey("Selectează contact") || "Please select a contact", {
        variant: "error",
      });
      return;
    }

    // Проверка, что платформа и контакт соответствуют текущему тикету
    if (!selectedPlatform || !ticketId) {
      enqueueSnackbar(getLanguageByKey("Invalid ticket or platform") || "Invalid ticket or platform", {
        variant: "error",
      });
      return;
    }

    // ✅ Проверка что pageId валиден для текущей воронки
    if (!isPageIdValid) {
      enqueueSnackbar(
        getLanguageByKey("Selectează pagina") || "Please select a valid page",
        { variant: "error" }
      );
      return;
    }

    // Дополнительная проверка: убеждаемся, что selectedClient присутствует в contactOptions
    // Это гарантирует, что контакт актуален для текущего тикета
    const isClientValid = contactOptions?.some(
      (option) => option.value === currentClient?.value
    );
    if (!isClientValid) {
      enqueueSnackbar(
        getLanguageByKey("Contact is not available for this ticket") ||
        "Contact is not available for this ticket",
        { variant: "error" }
      );
      return;
    }

    try {
      // Отправляем каждый медиа файл отдельным сообщением
      for (const att of attachments) {
        const payloadFile = {
          ...buildBasePayload(),
          media_url: att.media_url,
          message_text: null,
          last_message_type: att.media_type,
          media_type: att.media_type,
        };
        await Promise.resolve(onSendMessage(payloadFile));
      }

      // Отправляем текст отдельным сообщением (если есть)
      if (hasText) {
        const payloadText = {
          ...buildBasePayload(),
          media_url: null,
          message_text: trimmedText,
          last_message_type: "text",
          media_type: "text",
        };
        await Promise.resolve(onSendMessage(payloadText));
      }

      await handleMarkAsRead();
      clearState();
    } catch (e) {
      enqueueSnackbar(
        e?.message || getLanguageByKey("Failed to send message") || "Failed to send message",
        { variant: "error" }
      );
    }
  };

  const handleMarkActionResolved = async () => {
    if (!ticketId) return;
    const newValue = !actionNeeded;

    try {
      await api.tickets.updateById({
        id: ticketId,
        action_needed: newValue ? "true" : "false",
      });
      // НЕ меняем локально - ждем TICKET_UPDATE от сервера
      // Successfully updated action_needed
    } catch (e) {
      // Failed to update action_needed
    }
    handleMarkAsRead();
  };

  const handleEmailSend = async (emailData) => {
    try {
      // Email sent successfully
      setShowEmailForm(false);
      // ✅ email тоже считаем реакцией — помечаем чат прочитанным
      handleMarkAsRead();
    } catch (e) {
      // Failed to process email response
    }
  };

  return (
    <>
      <Box className="chat-input" p="10">
        {!showEmailForm ? (
          <>
            <Flex w="100%" gap="xs" mb="xs" align="center">
              {loading ? (
                <Loader size="xs" />
              ) : (
                <Flex direction="column" gap="xs" w="100%">
                  {/* Первый ряд: Platform + Template */}
                  <Flex gap="xs" w="100%">
                    {/* 1. Platform select */}
                    <Select
                      onChange={changePlatform}
                      className="w-full"
                      placeholder={getLanguageByKey("Selectează platforma")}
                      value={selectedPlatform}
                      data={platformOptions}
                      searchable
                      clearable
                      label={getLanguageByKey("Platforma")}
                      renderOption={renderPlatformOption}
                      rightSection={selectedPlatform && socialMediaIcons[selectedPlatform] ? (
                        <Flex>{socialMediaIcons[selectedPlatform]}</Flex>
                      ) : null}
                      size="xs"
                      styles={{
                        input: {
                          fontSize: '11px',
                          minHeight: '28px',
                          padding: '4px 8px'
                        }
                      }}
                    />

                    {/* 2. Template select */}
                    <Select
                      searchable
                      label={getLanguageByKey("Șablon")}
                      className="w-full"
                      onChange={(value) => {
                        setMessage(value ? templateOptions[value] : "");
                        setTemplate(value || undefined);
                      }}
                      value={template || null}
                      placeholder={getLanguageByKey("select_message_template")}
                      data={templateSelectOptions}
                      disabled={templateSelectOptions.length === 0}
                      size="xs"
                      styles={{
                        input: {
                          fontSize: '11px',
                          minHeight: '28px',
                          padding: '4px 8px'
                        }
                      }}
                    />
                  </Flex>

                  {/* Второй ряд: User pick number + Void select */}
                  <Flex gap="xs" w="100%">
                    {/* 3. User pick number (contact) */}
                    <Select
                      onChange={changeContact}
                      placeholder={getLanguageByKey("Selectează contact")}
                      value={currentClient?.value}
                      data={contactOptions}
                      label={getLanguageByKey("Contact")}
                      className="w-full"
                      searchable
                      clearable
                      disabled={!selectedPlatform}
                      size="xs"
                      styles={{
                        input: {
                          fontSize: '11px',
                          minHeight: '28px',
                          padding: '4px 8px'
                        }
                      }}
                    />

                    {/* 4. Page ID select */}
                    <Select
                      searchable
                      label={getLanguageByKey("Pagina Panda")}
                      placeholder={getLanguageByKey("Selectează pagina")}
                      value={selectedPageId}
                      onChange={changePageId}
                      data={pageIdOptions}
                      className="w-full"
                      disabled={!selectedPlatform}
                      size="xs"
                      styles={{
                        input: {
                          fontSize: '11px',
                          minHeight: '28px',
                          padding: '4px 8px',
                        }
                      }}
                    />
                  </Flex>
                </Flex>
              )}
            </Flex>

            <AttachmentsPreview attachments={attachments} onRemove={removeAttachment} />

            <Textarea
              ref={textAreaRef}
              autosize
              size="md"
              minRows={6}
              maxRows={15}
              w="100%"
              mb="xs"
              value={message}
              onChange={handleMessageChange}
              placeholder={getLanguageByKey("Introduceți mesaj")}
              onPaste={handlePaste}
              onDragEnter={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                setIsDragOver(false);
              }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              styles={{
                input: {
                  border: isDragOver ? "2px dashed #69db7c" : undefined,
                  backgroundColor: isDragOver ? "#ebfbee" : undefined,
                  fontSize: '14px',
                },
              }}
            />

            <Flex align="center" justify="space-between">
              <Flex gap="xs">
                <Can permission={{ module: "CHAT", action: "CREATE" }} context={{ responsibleId }}>
                  <Button
                    size="xs"
                    disabled={
                      (!message.trim() && attachments.length === 0) ||
                      !selectedPlatform ||
                      !currentClient?.payload ||
                      !isPageIdValid || // ✅ Проверяем что pageId валиден для текущей воронки
                      currentClient.payload.platform === "sipuni" ||
                      (isLengthLimited && message.length > MESSAGE_LENGTH_LIMIT)
                    }
                    variant="filled"
                    onClick={sendMessage}
                    loading={opened}
                  >
                    {getLanguageByKey("Trimite")}
                  </Button>
                </Can>

                <Button
                  size="xs"
                  onClick={clearState}
                  variant="default"
                  color="gray"
                  styles={{
                    root: {
                      backgroundColor: 'var(--mantine-color-gray-2) !important',
                      color: 'var(--mantine-color-gray-7) !important',
                      '&:hover': {
                        backgroundColor: 'var(--mantine-color-gray-3) !important',
                      }
                    }
                  }}
                >
                  {getLanguageByKey("Anulează")}
                </Button>

                <Can permission={{ module: "CHAT", action: "EDIT" }} context={{ responsibleId }}>
                  <Flex gap="xs" align="center">
                    {unseenCount === 0 ? (
                      <Badge
                        color="var(--crm-ui-kit-palette-link-primary)"
                        size="md"
                        styles={{
                          root: {
                            cursor: 'default',
                            textTransform: 'none',
                            paddingLeft: '8px',
                          }
                        }}
                      >
                        <Flex align="center" gap={4}>
                          {getLanguageByKey("closedChat")}
                        </Flex>
                      </Badge>
                    ) : (
                      <Button
                        size="xs"
                        onClick={handleMarkAsRead}
                        variant="filled"
                        styles={{
                          root: unseenCount > 0 ? {
                            backgroundColor: 'var(--mantine-color-red-6) !important',
                            color: 'white !important',
                            '&:hover': {
                              backgroundColor: 'var(--mantine-color-red-7) !important',
                            }
                          } : {
                            backgroundColor: 'var(--crm-ui-kit-palette-link-primary) !important',
                            color: 'white !important',
                            '&:hover': {
                              backgroundColor: 'var(--crm-ui-kit-palette-link-hover-primary) !important',
                            }
                          }
                        }}
                      >
                        {unseenCount > 0
                          ? getLanguageByKey("openedChat")
                          : getLanguageByKey("closedChat")}
                      </Button>
                    )}

                    {!actionNeeded ? (
                      <Badge
                        color="var(--crm-ui-kit-palette-link-primary)"
                        size="md"
                        styles={{
                          root: {
                            cursor: 'default',
                            textTransform: 'none',
                            paddingLeft: '8px',
                          }
                        }}
                      >
                        <Flex align="center" gap={4}>
                          {getLanguageByKey("Nu acțiune necesară")}
                        </Flex>
                      </Badge>
                    ) : (
                      <Button
                        size="xs"
                        onClick={handleMarkActionResolved}
                        variant="filled"
                        styles={{
                          root: actionNeeded ? {
                            backgroundColor: 'var(--mantine-color-orange-6) !important',
                            color: 'white !important',
                            '&:hover': {
                              backgroundColor: 'var(--mantine-color-orange-7) !important',
                            }
                          } : {
                            backgroundColor: 'var(--crm-ui-kit-palette-link-primary) !important',
                            color: 'white !important',
                            '&:hover': {
                              backgroundColor: 'var(--crm-ui-kit-palette-link-hover-primary) !important',
                            }
                          }
                        }}
                      >
                        {getLanguageByKey(
                          actionNeeded ? "Acțiune necesară" : "Nu acțiune necesară"
                        )}
                      </Button>
                    )}
                  </Flex>
                </Can>
              </Flex>

              <Flex gap="xs">
                <Can permission={{ module: "CHAT", action: "CREATE" }} context={{ responsibleId }}>
                  <ActionIcon
                    size="sm"
                    onClick={() => setShowEmailForm(true)}
                    variant="default"
                    title="Trimite Email"
                  >
                    <FaEnvelope size={14} />
                  </ActionIcon>

                  <FileButton
                    onChange={handleFileButton}
                    accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.ppt,.pptx"
                    multiple
                    title={getLanguageByKey("attachFiles")}
                  >
                    {(props) => (
                      <ActionIcon {...props} size="sm" variant="default" title={getLanguageByKey("attachFiles")}>
                        <RiAttachment2 size={14} />
                      </ActionIcon>
                    )}
                  </FileButton>

                  <Box style={{ position: 'relative' }}>
                    <ActionIcon
                      size="sm"
                      onClick={() => setShowEmojiPicker(prev => !prev)}
                      variant="default"
                      title="Emoji"
                    >
                      <LuSmile size={14} />
                    </ActionIcon>
                    {showEmojiPicker && (
                      <SimpleEmojiPicker
                        onSelect={(emoji) => {
                          setMessage(prev => prev + emoji);
                          textAreaRef.current?.focus();
                        }}
                        onClose={() => setShowEmojiPicker(false)}
                      />
                    )}
                  </Box>

                  <ActionIcon
                    size="sm"
                    onClick={onToggleNoteComposer}
                    variant="default"
                    title={getLanguageByKey("Заметка")}
                  >
                    <LuStickyNote size={14} />
                  </ActionIcon>
                </Can>

                <Can permission={{ module: "TASK", action: "CREATE" }} context={{ responsibleId }}>
                  <ActionIcon
                    size="sm"
                    onClick={onCreateTask}
                    variant="default"
                    title={getLanguageByKey("New Task")}
                  >
                    <FaTasks size={14} />
                  </ActionIcon>
                </Can>
              </Flex>
            </Flex>
          </>
        ) : (
          <EmailForm
            onSend={handleEmailSend}
            onCancel={() => setShowEmailForm(false)}
            ticketId={ticketId}
            clientEmail={currentClient?.payload?.email}
            ticketClients={platformOptions}
            groupTitle={groupTitle}
            fromEmails={fromEmails}
          />
        )}
      </Box>
    </>
  );
});

ChatInput.displayName = "ChatInput";
