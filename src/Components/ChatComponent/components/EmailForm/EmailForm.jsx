import React, { useState, useEffect } from "react";
import {
  Box,
  TextInput,
  Textarea,
  Button,
  Flex,
  Stack,
  CloseButton,
  ActionIcon,
  FileButton,
  Group,
  Text,
  Select,
  Loader,
} from "@mantine/core";
import { FaEnvelope, FaPaperclip, FaTimes } from "react-icons/fa";
import { getLanguageByKey } from "../../../utils";
import { getFirstEmailForGroup } from "../../../utils/emailUtils";
import { useUploadMediaFile } from "../../../../hooks";
import { getMediaType } from "../../renderContent";
import { useUser } from "@hooks";
import { api } from "../../../../api";
import { useSnackbar } from "notistack";

// Функция для проверки и добавления email без дублирования
const addEmailIfNotExists = (currentEmails, newEmail) => {
  if (!newEmail || !newEmail.trim()) return currentEmails;

  const trimmedNewEmail = newEmail.trim().toLowerCase();
  const currentEmailsList = currentEmails
    .split(',')
    .map(email => email.trim().toLowerCase())
    .filter(email => email);

  // Проверяем, есть ли уже такой email
  if (currentEmailsList.includes(trimmedNewEmail)) {
    return currentEmails; // Возвращаем без изменений, если email уже есть
  }

  // Добавляем новый email
  return currentEmails ? `${currentEmails}, ${newEmail}` : newEmail;
};

export const EmailForm = ({
  onSend,
  onCancel,
  ticketId,
  clientEmail = "", // Email клиента для автоматического заполнения
  ticketClients = [], // Все клиенты тикета для селекта
  groupTitle = "", // Текущая воронка (group_title)
  fromEmails = [] // Email адреса для поля "From" по воронке
}) => {
  const { user } = useUser();
  const [emailFields, setEmailFields] = useState({
    from: user?.email || "",
    to: clientEmail || "",
    cc: "",
    subject: "",
    body: ""
  });
  const [attachments, setAttachments] = useState([]);
  const [isToFieldTouched, setIsToFieldTouched] = useState(false);
  const [isFromFieldTouched, setIsFromFieldTouched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const { uploadFile } = useUploadMediaFile();
  const { enqueueSnackbar } = useSnackbar();
  const [uploadingCount, setUploadingCount] = useState(0);
  const isUploading = uploadingCount > 0;


  // Обновляем поле "from" когда загружается email пользователя или fromEmails
  useEffect(() => {
    if (fromEmails.length > 0 && !isFromFieldTouched) {
      // Если есть email адреса для воронки, выбираем первый
      setEmailFields(prev => ({ ...prev, from: fromEmails[0] }));
    } else if (user?.email && !emailFields.from && !isFromFieldTouched) {
      // Fallback на email пользователя
      setEmailFields(prev => ({ ...prev, from: user.email }));
    }
  }, [user?.email, fromEmails, isFromFieldTouched, emailFields.from]);

  // Дополнительная логика для автозаполнения на основе groupTitle
  useEffect(() => {
    if (groupTitle && !isFromFieldTouched && !emailFields.from) {
      const firstEmail = getFirstEmailForGroup(groupTitle);
      if (firstEmail) {
        setEmailFields(prev => ({ ...prev, from: firstEmail }));
      }
    }
  }, [groupTitle, isFromFieldTouched, emailFields.from]);

  // Обновляем поле "to" только при первой загрузке email клиента
  useEffect(() => {
    if (clientEmail && !emailFields.to && !isToFieldTouched) {
      setEmailFields(prev => ({ ...prev, to: clientEmail }));
    }
  }, [clientEmail, emailFields.to, isToFieldTouched]);

  const handleFieldChange = (field, value) => {
    if (field === "to") {
      setIsToFieldTouched(true);
    }
    setEmailFields(prev => ({ ...prev, [field]: value }));
  };

  // Создаем список email'ов всех клиентов тикета (убираем дубликаты)
  const clientEmails = ticketClients
    .map(client => client.payload?.email)
    .filter(email => email && email.trim() !== "")
    .filter((email, index, array) => array.indexOf(email) === index) // Убираем дубликаты
    .map(email => ({ value: email, label: email }));

  const handleAttachmentUpload = async (files) => {
    if (!files?.length) return;

    try {
      setUploadingCount((c) => c + 1);
      for (const file of files) {
        const url = await uploadFile(file);
        if (url) {
          const media_type = getMediaType(file.type);
          setAttachments(prev => [
            ...prev,
            {
              media_url: url,
              media_type,
              name: file.name,
              size: file.size,
              file: file
            },
          ]);
        }
      }
    } catch (e) {
      console.error("Failed to upload attachment:", e);
    } finally {
      setUploadingCount((c) => Math.max(0, c - 1));
    }
  };

  const removeAttachment = (url) => {
    setAttachments(prev => prev.filter(att => att.media_url !== url));
  };

  // Функции для обработки файлов через drag & drop и paste
  const uploadAndAddFiles = async (files) => {
    if (!files?.length) return;
    try {
      setUploadingCount((c) => c + 1);
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
      console.error("Error uploading file:", e);
      enqueueSnackbar("Error uploading file", { variant: "error" });
    } finally {
      setUploadingCount((c) => Math.max(0, c - 1));
    }
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

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleSend = async () => {
    if (!user?.id) {
      enqueueSnackbar(getLanguageByKey("User ID not found"), { variant: "error" });
      return;
    }

    setIsLoading(true);

    try {
      // Форматируем email адреса
      const toEmails = emailFields.to
        .split(',')
        .map(email => email.trim())
        .filter(email => email);

      const ccEmails = emailFields.cc
        .split(',')
        .map(email => email.trim())
        .filter(email => email);

      // Форматируем attachments для API
      const attachmentUrls = attachments.map(({ media_url }) => media_url);

      const payload = {
        sender_id: user.id,
        from_email: emailFields.from,
        to_emails: toEmails,
        text: emailFields.body,
        cc_emails: ccEmails,
        subject: emailFields.subject,
        attachments: attachmentUrls,
      };

      console.log("Sending email with payload:", payload);

      const response = await api.messages.send.email(payload);
      console.log("Email sent successfully:", response);

      // Показываем успешное уведомление
      enqueueSnackbar(getLanguageByKey("Email sent successfully"), { variant: "success" });

      // Вызываем onSend для обновления UI
      onSend({
        ...payload,
        ticket_id: ticketId,
        response
      });

    } catch (error) {
      console.error("Failed to send email:", error);

      // Показываем ошибку пользователю
      const errorMessage = error?.response?.data?.message ||
        error?.message ||
        getLanguageByKey("Failed to send email");

      enqueueSnackbar(errorMessage, { variant: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  const AttachmentPreview = ({ attachment }) => {
    const isImage = attachment.media_type === "image" ||
      attachment.media_type === "photo" ||
      attachment.media_type === "image_url";

    return (
      <Box
        style={{
          position: "relative",
          width: 80,
          height: 80,
          borderRadius: 8,
          overflow: "hidden",
          border: "1px solid var(--mantine-color-gray-3)",
          background: "var(--crm-ui-kit-palette-background-default)",
          marginBottom: 8,
        }}
      >
        {isImage ? (
          <img
            src={attachment.media_url}
            alt={attachment.name || "attachment"}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover"
            }}
          />
        ) : (
          <Flex
            w="100%"
            h="100%"
            align="center"
            justify="center"
            direction="column"
            gap={4}
          >
            <FaPaperclip size={16} color="#666" />
            <Text size="xs" c="dimmed" ta="center" style={{ fontSize: 10 }}>
              {attachment.media_type}
            </Text>
          </Flex>
        )}
        <CloseButton
          size="xs"
          onClick={() => removeAttachment(attachment.media_url)}
          style={{
            position: "absolute",
            top: 2,
            right: 2,
            background: "color-mix(in srgb, var(--crm-ui-kit-palette-background-primary) 90%, transparent)",
            borderRadius: "50%"
          }}
        />
        <Box
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              background: "color-mix(in srgb, var(--crm-ui-kit-palette-background-default) 70%, transparent)",
              color: "var(--crm-ui-kit-palette-text-primary)",
              padding: "2px 4px",
              fontSize: 10,
              textAlign: "center"
            }}
        >
          {formatFileSize(attachment.size)}
        </Box>
      </Box>
    );
  };

  return (
    <Box
      style={{
        background: "var(--crm-ui-kit-palette-background-primary)",
        border: "1px solid var(--crm-ui-kit-palette-border-default)",
        borderRadius: 8,
        boxShadow: "0 1px 3px var(--crm-ui-kit-palette-box-shadow-default)",
        minHeight: 400,
      }}
    >
      {/* Header */}
      <Flex
        justify="space-between"
        align="center"
        p="12px 16px"
        style={{
          borderBottom: "1px solid var(--crm-ui-kit-palette-border-default)",
          background: "var(--crm-ui-kit-palette-background-default)",
          borderRadius: "8px 8px 0 0",
        }}
      >
        <Group gap="xs">
          <FaEnvelope size={16} color="#5f6368" />
          <Text fw={500} size="sm" c="dark">
            {getLanguageByKey("Trimite Email")}
          </Text>
        </Group>
        <ActionIcon
          variant="subtle"
          color="gray"
          size="sm"
          onClick={onCancel}
        >
          <FaTimes size={14} />
        </ActionIcon>
      </Flex>

      {/* Form Content */}
      <Box p="16px">
        <Stack gap="md">
          {/* From Field */}
          <Box>
            <Text size="sm" fw={500} mb="xs" c="dark">
              {getLanguageByKey("emailFrom")}
            </Text>
            <Flex gap="xs" align="flex-end">
              <TextInput
                placeholder={getLanguageByKey("emailFrom")}
                value={emailFields.from}
                onChange={(e) => {
                  handleFieldChange("from", e.target.value);
                  setIsFromFieldTouched(true);
                }}
                style={{ flex: 1 }}
                styles={{
                  input: {
                    border: "1px solid #dadce0",
                    borderRadius: 4,
                    fontSize: 14,
                    "&:focus": {
                      borderColor: "#1a73e8",
                      boxShadow: "0 0 0 2px rgba(26,115,232,.2)"
                    }
                  }
                }}
              />
              {fromEmails.length > 0 && (
                <Select
                  placeholder={getLanguageByKey("Select email")}
                  data={fromEmails.map(email => ({ value: email, label: email }))}
                  onChange={(value) => {
                    if (value) {
                      const newFrom = addEmailIfNotExists(emailFields.from, value);
                      handleFieldChange("from", newFrom);
                      setIsFromFieldTouched(true);
                    }
                  }}
                  styles={{
                    input: {
                      border: "1px solid #dadce0",
                      borderRadius: 4,
                      fontSize: 14,
                      width: "200px",
                      "&:focus": {
                        borderColor: "#1a73e8",
                        boxShadow: "0 0 0 2px rgba(26,115,232,.2)"
                      }
                    }
                  }}
                />
              )}
            </Flex>
          </Box>

          {/* To Field */}
          <Box>
            <Text size="sm" fw={500} mb="xs" c="dark">
              {getLanguageByKey("emailTo")}
            </Text>
            <Flex gap="xs" align="flex-end">
              <TextInput
                placeholder={getLanguageByKey("emailTo")}
                value={emailFields.to}
                onChange={(e) => handleFieldChange("to", e.target.value)}
                style={{ flex: 1 }}
                styles={{
                  input: {
                    border: "1px solid #dadce0",
                    borderRadius: 4,
                    fontSize: 14,
                    "&:focus": {
                      borderColor: "#1a73e8",
                      boxShadow: "0 0 0 2px rgba(26,115,232,.2)"
                    }
                  }
                }}
              />
              {clientEmails.length > 0 && (
                <Select
                  placeholder={getLanguageByKey("Select email")}
                  data={clientEmails}
                  onChange={(value) => {
                    if (value) {
                      const newTo = addEmailIfNotExists(emailFields.to, value);
                      handleFieldChange("to", newTo);
                    }
                  }}
                  styles={{
                    input: {
                      border: "1px solid #dadce0",
                      borderRadius: 4,
                      fontSize: 14,
                      width: "200px",
                      "&:focus": {
                        borderColor: "#1a73e8",
                        boxShadow: "0 0 0 2px rgba(26,115,232,.2)"
                      }
                    }
                  }}
                />
              )}
            </Flex>
          </Box>

          {/* CC Field */}
          <Box>
            <Text size="sm" fw={500} mb="xs" c="dark">
              {getLanguageByKey("emailCc")}
            </Text>
            <Flex gap="xs" align="flex-end">
              <TextInput
                placeholder={getLanguageByKey("emailCc")}
                value={emailFields.cc}
                onChange={(e) => handleFieldChange("cc", e.target.value)}
                style={{ flex: 1 }}
                styles={{
                  input: {
                    border: "1px solid #dadce0",
                    borderRadius: 4,
                    fontSize: 14,
                    "&:focus": {
                      borderColor: "#1a73e8",
                      boxShadow: "0 0 0 2px rgba(26,115,232,.2)"
                    }
                  }
                }}
              />
              {clientEmails.length > 0 && (
                <Select
                  placeholder={getLanguageByKey("Select email")}
                  data={clientEmails}
                  onChange={(value) => {
                    if (value) {
                      const newCc = addEmailIfNotExists(emailFields.cc, value);
                      handleFieldChange("cc", newCc);
                    }
                  }}
                  styles={{
                    input: {
                      border: "1px solid #dadce0",
                      borderRadius: 4,
                      fontSize: 14,
                      width: "200px",
                      "&:focus": {
                        borderColor: "#1a73e8",
                        boxShadow: "0 0 0 2px rgba(26,115,232,.2)"
                      }
                    }
                  }}
                />
              )}
            </Flex>
          </Box>


          {/* Subject Field */}
          <TextInput
            label={getLanguageByKey("emailSubject")}
            placeholder={getLanguageByKey("emailSubject")}
            value={emailFields.subject}
            onChange={(e) => handleFieldChange("subject", e.target.value)}
            styles={{
              label: { fontSize: 13, fontWeight: 500, color: "var(--crm-ui-kit-palette-text-secondary-dark)" },
              input: {
                border: "1px solid var(--crm-ui-kit-palette-border-default)",
                borderRadius: 4,
                fontSize: 14,
                "&:focus": {
                  borderColor: "var(--crm-ui-kit-palette-link-primary)",
                  boxShadow: "0 0 0 2px color-mix(in srgb, var(--crm-ui-kit-palette-link-primary) 20%, transparent)"
                }
              }
            }}
          />

          {/* Attachments */}
          {(attachments.length > 0 || isUploading) && (
            <Box>
              <Text size="sm" fw={500} mb="xs" c="dark">
                {getLanguageByKey("Attachments")} ({attachments.length})
              </Text>
              <Flex wrap="wrap" gap="xs">
                {isUploading && (
                  <Box
                    style={{
                      position: "relative",
                      width: 80,
                      height: 80,
                      borderRadius: 8,
                      overflow: "hidden",
                      border: "1px solid var(--mantine-color-gray-3)",
                      background: "var(--crm-ui-kit-palette-background-default)",
                      marginBottom: 8,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Loader size="sm" />
                  </Box>
                )}
                {attachments.map((attachment) => (
                  <AttachmentPreview
                    key={attachment.media_url}
                    attachment={attachment}
                  />
                ))}
              </Flex>
            </Box>
          )}

          {/* Message Body */}
          <Box style={{ position: "relative" }}>
            <Text size="sm" fw={500} mb="xs" c="dark">
              {getLanguageByKey("emailBody")}
            </Text>
            {isDragOver && (
              <Box
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: "rgba(26, 115, 232, 0.1)",
                  border: "2px dashed #1a73e8",
                  borderRadius: 4,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 10,
                  pointerEvents: "none"
                }}
              >
                <Text size="lg" fw={600} c="#1a73e8">
                  {getLanguageByKey("Drop files here to attach")}
                </Text>
              </Box>
            )}
            <Textarea
              placeholder={getLanguageByKey("emailBody")}
              value={emailFields.body}
              onChange={(e) => handleFieldChange("body", e.target.value)}
              onPaste={handlePaste}
              onDragEnter={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                setIsDragOver(false);
              }}
              onDragOver={(e) => {
                e.preventDefault();
              }}
              onDrop={handleDrop}
              minRows={12}
              maxRows={20}
              styles={{
                input: {
                  border: isDragOver ? "2px dashed #1a73e8" : "1px solid #dadce0",
                  borderRadius: 4,
                  fontSize: 14,
                  resize: "vertical",
                  minHeight: "200px",
                  backgroundColor: isDragOver ? "#f8f9ff" : "transparent",
                  "&:focus": {
                    borderColor: "#1a73e8",
                    boxShadow: "0 0 0 2px rgba(26,115,232,.2)"
                  }
                }
              }}
            />
          </Box>

          {/* Action Buttons */}
          <Flex justify="space-between" align="center" pt="md">
            <FileButton
              onChange={handleAttachmentUpload}
              accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
              multiple
            >
              {(props) => (
                <Button
                  {...props}
                  variant="outline"
                  loading={isUploading}
                  disabled={isUploading}
                  leftSection={<FaPaperclip size={14} />}
                  size="sm"
                  styles={{
                    root: {
                      borderColor: "var(--crm-ui-kit-palette-border-default)",
                      color: "var(--crm-ui-kit-palette-text-secondary-dark)",
                      "&:hover": {
                        backgroundColor: "var(--crm-ui-kit-palette-background-default)",
                        borderColor: "var(--crm-ui-kit-palette-link-primary)",
                        color: "var(--crm-ui-kit-palette-link-primary)"
                      }
                    }
                  }}
                >
                  {getLanguageByKey("Attach Files")}
                </Button>
              )}
            </FileButton>

            <Group gap="xs">
              <Button
                variant="outline"
                onClick={onCancel}
                size="sm"
                styles={{
                  root: {
                    borderColor: "var(--crm-ui-kit-palette-border-default)",
                    color: "var(--crm-ui-kit-palette-text-secondary-dark)",
                    "&:hover": {
                      backgroundColor: "var(--crm-ui-kit-palette-background-default)"
                    }
                  }
                }}
              >
                {getLanguageByKey("Cancel")}
              </Button>
              <Button
                onClick={handleSend}
                size="sm"
                loading={isLoading}
                disabled={!emailFields.to.trim() || !emailFields.subject.trim() || isLoading || isUploading}
                styles={{
                  root: {
                    backgroundColor: "var(--crm-ui-kit-palette-link-primary)",
                    "&:hover": {
                      backgroundColor: "var(--crm-ui-kit-palette-link-hover-primary)"
                    },
                    "&:disabled": {
                      backgroundColor: "var(--crm-ui-kit-palette-border-default)",
                      color: "var(--crm-ui-kit-palette-text-secondary-dark)"
                    }
                  }
                }}
              >
                {isLoading ? getLanguageByKey("Sending...") : getLanguageByKey("Send")}
              </Button>
            </Group>
          </Flex>
        </Stack>
      </Box>
    </Box>
  );
};
