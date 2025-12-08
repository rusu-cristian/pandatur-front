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
  CloseButton,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { FaTasks, FaEnvelope } from "react-icons/fa";
import { useState, useRef, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import EmojiPicker from "emoji-picker-react";
import { LuSmile, LuStickyNote } from "react-icons/lu";
import { RiAttachment2 } from "react-icons/ri";
import { useSnackbar } from "notistack";
import { getLanguageByKey } from "../../../utils";
import { getEmailsByGroupTitle } from "../../../utils/emailUtils";
import { templateOptions, templateGroupsByKey, TEMPLATE_GROUP_BY_TITLE } from "../../../../FormOptions";
import { useUploadMediaFile, useMessagesContext } from "../../../../hooks";
import { getMediaType } from "../../renderContent";
import { useApp, useSocket, useUser } from "@hooks";
import Can from "../../../CanComponent/Can";
import { TYPE_SOCKET_EVENTS } from "@app-constants";
import { api } from "../../../../api";
import { EmailForm } from "../EmailForm/EmailForm";
import { getPagesByType } from "../../../../constants/webhookPagesConfig";
import { socialMediaIcons } from "../../../utils/socialMediaIcons";
import { useClientContactsContext } from "../../../../context/ClientContactsContext";
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

export const ChatInput = ({
  onSendMessage,
  onHandleFileSelect,
  onCreateTask,
  ticketId,
  unseenCount,
  onToggleNoteComposer,
  personalInfo,
}) => {
  const [opened, handlers] = useDisclosure(false);
  const [message, setMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [template, setTemplate] = useState();
  const [emojiPickerPosition, setEmojiPickerPosition] = useState({ top: 0, left: 0 });
  const [isDragOver, setIsDragOver] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);

  const [attachments, setAttachments] = useState([]);
  const textAreaRef = useRef(null);
  const warningShownRef = useRef(false);

  const { uploadFile } = useUploadMediaFile();
  const { userId } = useUser();
  const { socketRef } = useSocket();
  const { markMessagesAsRead, getTicketById } = useApp();
  const { enqueueSnackbar } = useSnackbar();
  const { messages } = useMessagesContext();

  // Получаем данные о воронке и email адресах
  const groupTitle = personalInfo?.group_title || "";
  const fromEmails = getEmailsByGroupTitle(groupTitle);

  // Получаем responsibleId для проверки прав доступа
  const responsibleId = personalInfo?.technician_id
    ? String(personalInfo.technician_id)
    : undefined;

  // Получаем данные о контактах из контекста
  const {
    platformOptions,
    selectedPlatform,
    changePlatform,
    contactOptions,
    changeContact,
    selectedClient: currentClient,
    selectedPageId,
    changePageId,
    loading,
  } = useClientContactsContext();

  const isLengthLimited = useMemo(
    () => LIMITED_PLATFORMS.includes((selectedPlatform || "").toLowerCase()),
    [selectedPlatform]
  );

  useEffect(() => {
    if (!isLengthLimited) {
      warningShownRef.current = false;
    }
  }, [isLengthLimited]);

  // Функция для рендеринга опций с иконками
  const renderPlatformOption = ({ option }) => (
    <Flex align="center" justify="space-between" w="100%">
      <span>{option.label}</span>
      {socialMediaIcons[option.value] && (
        <Flex>{socialMediaIcons[option.value]}</Flex>
      )}
    </Flex>
  );

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

    // Фильтруем страницы по group_title тикета
    const filteredPages = groupTitle
      ? pages.filter(page => {
        if (Array.isArray(page.group_title)) {
          return page.group_title.includes(groupTitle);
        }
        return page.group_title === groupTitle;
      })
      : pages;

    return filteredPages.map(page => ({
      value: page.page_id,
      label: `${page.page_name}`
    }));
  }, [selectedPlatform, groupTitle]);

  // Получаем actionNeeded всегда из тикета из AppContext
  // НЕ используем локальное состояние - всегда берем актуальное значение из AppContext
  // Тикет обновляется автоматически через TICKET_UPDATE от сервера
  const currentTicketFromContext = getTicketById(ticketId);
  const actionNeeded = currentTicketFromContext ? Boolean(currentTicketFromContext.action_needed) : false;

  // actionNeeded меняется только:
  // 1. При получении сообщения от клиента (в AppContext)
  // 2. При нажатии кнопки NeedAnswer (через сервер)

  // actionNeeded всегда берется из тикета через AppContext

  const handleEmojiClickButton = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const emojiPickerHeight = 450;
    setEmojiPickerPosition({
      top: rect.top + window.scrollY - emojiPickerHeight,
      left: rect.left + window.scrollX,
    });
    setShowEmojiPicker((prev) => !prev);
  };

  const uploadAndAddFiles = async (files) => {
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
  };

  const handleFileButton = async (fileOrFiles) => {
    const files = Array.isArray(fileOrFiles) ? fileOrFiles : [fileOrFiles];
    await uploadAndAddFiles(files);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files || []);
    await uploadAndAddFiles(files);
  };

  const handlePaste = async (e) => {
    const files = Array.from(e.clipboardData?.files || []);
    if (!files.length) return;
    e.preventDefault();
    await uploadAndAddFiles(files);
  };

  const removeAttachment = (url) => {
    setAttachments((prev) => prev.filter((a) => a.media_url !== url));
  };

  const clearState = () => {
    setMessage("");
    setAttachments([]);
    setTemplate(null);
    warningShownRef.current = false;
  };

  const handleMessageChange = (e) => {
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
  };

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

  const AttachmentsPreview = () => {
    if (!attachments.length) return null;
    return (
      <Flex gap={8} wrap="wrap" mb="xs">
        {attachments.map((att) => {
          const isImage = att.media_type === "image" || att.media_type === "photo" || att.media_type === "image_url";
          return (
            <Box
              key={att.media_url}
              style={{
                position: "relative",
                width: 72,
                height: 72,
                borderRadius: 8,
                overflow: "hidden",
                border: "1px solid var(--mantine-color-gray-3)",
                background: "var(--crm-ui-kit-palette-background-default)",
              }}
              title={att.name}
            >
              {isImage ? (
                // eslint-disable-next-line jsx-a11y/img-redundant-alt
                <img
                  src={att.media_url}
                  alt={att.name || "attachment"}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <Flex w="100%" h="100%" align="center" justify="center">
                  <Badge size="xs">{att.media_type}</Badge>
                </Flex>
              )}
              <CloseButton
                size="sm"
                onClick={() => removeAttachment(att.media_url)}
                style={{ position: "absolute", top: 2, right: 2, background: "var(--crm-ui-kit-palette-background-primary)" }}
              />
            </Box>
          );
        })}
      </Flex>
    );
  };

  return (
    <>
      <Box className="chat-input" p="16">
        {!showEmailForm ? (
          <>
            <Flex w="100%" gap="xs" mb="xs" align="center">
              {loading ? (
                <Loader size="xs" />
              ) : (
                <Flex direction="column" gap="xs" w="100%">
                  {/* Первый ряд: Platform + Template */}
                  <Flex gap="md" w="100%">
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
                      styles={{
                        input: {
                          fontSize: '16px',
                          minHeight: '48px',
                          padding: '12px 16px'
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
                      styles={{
                        input: {
                          fontSize: '16px',
                          minHeight: '48px',
                          padding: '12px 16px'
                        }
                      }}
                    />
                  </Flex>

                  {/* Второй ряд: User pick number + Void select */}
                  <Flex gap="md" w="100%">
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
                      styles={{
                        input: {
                          fontSize: '16px',
                          minHeight: '48px',
                          padding: '12px 16px'
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
                      styles={{
                        input: {
                          fontSize: '16px',
                          minHeight: '48px',
                          padding: '12px 16px',
                        }
                      }}
                    />
                  </Flex>
                </Flex>
              )}
            </Flex>

            <AttachmentsPreview />

            <Textarea
              ref={textAreaRef}
              autosize
              minRows={6}
              maxRows={8}
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
                },
              }}
            />

            <Flex align="center" justify="space-between">
              <Flex gap="xs">
                <Can permission={{ module: "CHAT", action: "CREATE" }} context={{ responsibleId }}>
                  <Button
                    disabled={
                      (!message.trim() && attachments.length === 0) ||
                      !currentClient?.payload ||
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
                  <Flex gap="xs">
                    <Button
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
                        ? getLanguageByKey("ReadChat")
                        : getLanguageByKey("ChatRead")}
                    </Button>
                  </Flex>

                  <Button
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
                </Can>
              </Flex>

              <Flex gap="xs">
                <Can permission={{ module: "CHAT", action: "CREATE" }} context={{ responsibleId }}>
                  <ActionIcon
                    onClick={() => setShowEmailForm(true)}
                    variant="default"
                    title="Trimite Email"
                  >
                    <FaEnvelope size={20} />
                  </ActionIcon>

                  <FileButton
                    onChange={handleFileButton}
                    accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.ppt,.pptx"
                    multiple
                    title={getLanguageByKey("attachFiles")}
                  >
                    {(props) => (
                      <ActionIcon {...props} variant="default" title={getLanguageByKey("attachFiles")}>
                        <RiAttachment2 size={20} />
                      </ActionIcon>
                    )}
                  </FileButton>

                  <ActionIcon onClick={handleEmojiClickButton} variant="default">
                    <LuSmile size={20} />
                  </ActionIcon>

                  <ActionIcon
                    onClick={onToggleNoteComposer}
                    variant="default"
                    title={getLanguageByKey("Заметка")}
                  >
                    <LuStickyNote size={20} />
                  </ActionIcon>
                </Can>

                <Can permission={{ module: "TASK", action: "CREATE" }} context={{ responsibleId }}>
                  <ActionIcon
                    onClick={onCreateTask}
                    variant="default"
                    title={getLanguageByKey("New Task")}
                  >
                    <FaTasks size={20} />
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

      {showEmojiPicker &&
        createPortal(
          <div
            className="emoji-picker-popup"
            style={{
              position: "absolute",
              top: emojiPickerPosition.top,
              left: emojiPickerPosition.left,
              zIndex: 1000,
            }}
            onMouseEnter={() => setShowEmojiPicker(true)}
            onMouseLeave={() => setShowEmojiPicker(false)}
          >
            <EmojiPicker
              onEmojiClick={(emoji) => setMessage((prev) => prev + emoji.emoji)}
            />
          </div>,
          document.body
        )}
    </>
  );
};
