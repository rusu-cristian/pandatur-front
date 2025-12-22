import { memo } from "react";
import { Flex, Box, Badge, CloseButton, Text } from "@mantine/core";
import { FaPaperclip } from "react-icons/fa";

/**
 * Форматирование размера файла
 */
const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

/**
 * Универсальный компонент для отображения превью вложений
 * Используется в ChatInput, InlineNoteComposer, EmailForm
 * 
 * @param {Array} attachments - массив вложений { media_url, media_type, name, size }
 * @param {Function} onRemove - callback для удаления вложения (получает media_url)
 * @param {number} size - размер превью (по умолчанию 72)
 * @param {number} gap - отступ между элементами (по умолчанию 8)
 * @param {string} mb - margin-bottom (по умолчанию "xs")
 * @param {boolean} showFileSize - показывать ли размер файла (по умолчанию false)
 * @param {boolean} showFileIcon - показывать иконку файла вместо badge (по умолчанию false)
 */
export const AttachmentsPreview = memo(({ 
  attachments = [], 
  onRemove,
  size = 72,
  gap = 8,
  mb = "xs",
  showFileSize = false,
  showFileIcon = false,
}) => {
  if (!attachments.length) return null;

  const isImageType = (mediaType) => {
    return mediaType === "image" || mediaType === "photo" || mediaType === "image_url";
  };

  return (
    <Flex gap={gap} wrap="wrap" mb={mb}>
      {attachments.map((att) => (
        <Box
          key={att.media_url}
          style={{
            position: "relative",
            width: size,
            height: size,
            borderRadius: 8,
            overflow: "hidden",
            border: "1px solid var(--mantine-color-gray-3)",
            background: "var(--crm-ui-kit-palette-background-default)",
          }}
          title={att.name}
        >
          {isImageType(att.media_type) ? (
            <img
              src={att.media_url}
              alt={att.name || "attachment"}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : showFileIcon ? (
            <Flex w="100%" h="100%" align="center" justify="center" direction="column" gap={4}>
              <FaPaperclip size={16} color="#666" />
              <Text size="xs" c="dimmed" ta="center" style={{ fontSize: 10 }}>
                {att.media_type}
              </Text>
            </Flex>
          ) : (
            <Flex w="100%" h="100%" align="center" justify="center">
              <Badge size="xs">{att.media_type}</Badge>
            </Flex>
          )}
          
          {onRemove && (
            <CloseButton
              size="sm"
              onClick={() => onRemove(att.media_url)}
              style={{ 
                position: "absolute", 
                top: 2, 
                right: 2, 
                background: "var(--crm-ui-kit-palette-background-primary)",
                borderRadius: showFileSize ? "50%" : undefined,
              }}
            />
          )}
          
          {showFileSize && att.size && (
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
                textAlign: "center",
              }}
            >
              {formatFileSize(att.size)}
            </Box>
          )}
        </Box>
      ))}
    </Flex>
  );
});

AttachmentsPreview.displayName = "AttachmentsPreview";
