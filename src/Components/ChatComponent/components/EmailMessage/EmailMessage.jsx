import React, { useState, useMemo } from "react";
import {
  Box,
  Card,
  Text,
  Group,
  Badge,
  Stack,
  Button,
  Modal,
  Anchor,
  Divider,
} from "@mantine/core";
import { FaEnvelope, FaCode, FaPaperclip, FaDownload } from "react-icons/fa";
import { getLanguageByKey } from "../../../utils";

export const EmailMessage = React.memo(({ message, platform_id, page_id }) => {
  const [modalOpened, setModalOpened] = useState(false);

  // ОПТИМИЗАЦИЯ: Парсим только легкие поля для превью (не парсим тяжелый HTML)
  const emailPreview = useMemo(() => {
    try {
      const data = JSON.parse(message);
      return {
        from: data.from || "",
        to: data.to || "",
        subject: data.subject || "",
        attachmentsCount: data.attachments?.length || 0,
        hasHtml: !!data.html,
      };
    } catch (error) {
      return null;
    }
  }, [message]);

  // ЛЕНИВАЯ ЗАГРУЗКА: Парсим полный JSON (с HTML) только при открытии модалки
  const fullEmailData = useMemo(() => {
    if (!modalOpened) return null;
    try {
      return JSON.parse(message);
    } catch (error) {
      return null;
    }
  }, [message, modalOpened]);

  // Компонент для отображения attachment
  const AttachmentItem = ({ attachment }) => {
    return (
      <Card shadow="xs" padding="sm" radius="md" withBorder>
        <Group gap="md" align="flex-start">
          <Box
            w={40}
            h={40}
            style={{
              backgroundColor: "#f8f9fa",
              border: "1px solid #e9ecef",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <FaPaperclip size={16} color="#6c757d" />
          </Box>
          
          <Stack gap="xs" style={{ flex: 1 }}>
            <Text size="sm" fw={500} c="dark">
              {attachment.filename}
            </Text>
            <Text size="xs" c="dimmed">
              {attachment.extension?.toUpperCase()}
            </Text>
            <Anchor
              href={attachment.url}
              target="_blank"
              size="sm"
              style={{ alignSelf: "flex-start" }}
            >
              <Group gap="xs">
                <FaDownload size={12} />
                {getLanguageByKey("Download")}
              </Group>
            </Anchor>
          </Stack>
        </Group>
      </Card>
    );
  };

  const formatEmailList = (emailList) => {
    if (!emailList) return "";
    if (typeof emailList === "string") return emailList;
    if (Array.isArray(emailList)) return emailList.join(", ");
    return String(emailList);
  };

  // Если парсинг превью не удался - показываем ошибку
  if (!emailPreview) {
    return (
      <Card
        shadow="sm"
        padding="md"
        radius="md"
        withBorder
        style={{
          maxWidth: "500px",
          backgroundColor: "#f8f9fa",
          border: "1px solid #e9ecef",
        }}
      >
        <Group gap="xs" mb="xs">
          <FaEnvelope size={16} color="#6c757d" />
          <Text fw={600} size="sm" c="dark">
            {getLanguageByKey("Email")}
          </Text>
          <Badge size="sm" variant="light" color="red">
            {getLanguageByKey("Invalid format")}
          </Badge>
        </Group>
        <Text size="sm" c="dimmed" style={{ fontFamily: "monospace" }}>
          {message?.slice(0, 100)}...
        </Text>
      </Card>
    );
  }

  return (
    <>
      {/* ПРЕВЬЮ - показываем только легкие данные */}
      <Card
        shadow="sm"
        padding="md"
        radius="md"
        withBorder
        style={{
          minWidth: "400px",
          backgroundColor: " var(--crm-ui-kit-palette-background-primary)",
          border: "1px solid #e9ecef",
        }}
      >
        <Stack gap="sm">
          {/* Header */}
          <Group justify="space-between" align="flex-start">
            <Group gap="xs">
              <FaEnvelope size={16} color="#6c757d" />
              <Text fw={600} size="sm" c="dark">
                {getLanguageByKey("Email")}
              </Text>
            </Group>
            {emailPreview.hasHtml && (
              <Button
                size="xs"
                variant="light"
                leftSection={<FaCode size={10} />}
                onClick={() => setModalOpened(true)}
              >
                {getLanguageByKey("View HTML")}
              </Button>
            )}
          </Group>

          {/* Email Details - используем только данные из превью */}
          <Stack gap="xs">
            <Box>
              <Text size="lg" c="dimmed" fw={700} mb="2px" >
                {getLanguageByKey("emailFrom")}:
              </Text>
              <Text size="md" c="dark">
                {formatEmailList(emailPreview.from)}
              </Text>
            </Box>

            <Box>
              <Text size="lg" c="dimmed" fw={700} mb="2px">
                {getLanguageByKey("emailTo")}:
              </Text>
              <Text size="md" c="dark">
                {formatEmailList(emailPreview.to)}
              </Text>
            </Box>

            <Box>
              <Text size="lg" c="dimmed" fw={700} mb="2px">
                {getLanguageByKey("emailSubject")}:
              </Text>
              <Text size="md" c="dark" fw={500}>
                {emailPreview.subject || getLanguageByKey("No subject")}
              </Text>
            </Box>

            {/* Attachments indicator */}
            {emailPreview.attachmentsCount > 0 && (
              <Group gap="xs">
                <FaPaperclip size={12} color="#6c757d" />
                <Text size="md" c="dimmed">
                  {emailPreview.attachmentsCount} {emailPreview.attachmentsCount === 1 ? getLanguageByKey("attachment") : getLanguageByKey("Attachments").toLowerCase()}
                </Text>
              </Group>
            )}
          </Stack>
        </Stack>
      </Card>

      {/* МОДАЛКА - ЛЕНИВАЯ ЗАГРУЗКА: парсим полный JSON только при открытии */}
      {modalOpened && fullEmailData && (
        <Modal
          opened={modalOpened}
          onClose={() => setModalOpened(false)}
          title={
            <Group gap="xs">
              <FaEnvelope size={16} color="#6c757d" />
              <Text fw={600}>{getLanguageByKey("Email")}</Text>
            </Group>
          }
          size="95%"
          centered
          styles={{
            content: {
              height: "95vh",
              maxHeight: "95vh",
            },
            body: {
              height: "calc(95vh - 60px)",
              padding: "20px",
            }
          }}
        >
          <Stack gap="md">
            {/* Email Info */}
            <Box>
              <Text size="sm" c="dimmed" mb="xs">
                <strong>{getLanguageByKey("emailFrom")}:</strong> {formatEmailList(fullEmailData.from)}
              </Text>
              <Text size="sm" c="dimmed" mb="xs">
                <strong>{getLanguageByKey("emailTo")}:</strong> {formatEmailList(fullEmailData.to)}
              </Text>
              <Text size="sm" c="dimmed" mb="md">
                <strong>{getLanguageByKey("emailSubject")}:</strong> {fullEmailData.subject || getLanguageByKey("No subject")}
              </Text>
            </Box>

            {/* HTML Content */}
            {fullEmailData.html && (
              <Box>
                <Text size="sm" fw={600} c="dark" mb="md">
                  {getLanguageByKey("Email content")}
                </Text>
                <Box
                  p="md"
                  style={{
                    border: "1px solid #e9ecef",
                    borderRadius: "4px",
                  }}
                  dangerouslySetInnerHTML={{ __html: fullEmailData.html }}
                />
              </Box>
            )}

            {/* Attachments */}
            {fullEmailData.attachments && fullEmailData.attachments.length > 0 && (
              <>
                <Divider />
                <Box>
                  <Text size="sm" fw={600} c="dark" mb="md">
                    {getLanguageByKey("Attachments")} ({fullEmailData.attachments.length})
                  </Text>
                  <Stack gap="sm">
                    {fullEmailData.attachments.map((attachment, index) => (
                      <AttachmentItem key={index} attachment={attachment} />
                    ))}
                  </Stack>
                </Box>
              </>
            )}
          </Stack>
        </Modal>
      )}
    </>
  );
});

EmailMessage.displayName = 'EmailMessage';
