import { Text, Box, Anchor } from "@mantine/core";
import { getLanguageByKey, isStoreFile } from "../utils";
import { Audio } from "../Audio";
import { File } from "../File";
import { MEDIA_TYPE } from "../../app-constants";
import { Image as CheckedImage } from "../Image";
import { EmailMessage } from "./components/EmailMessage/EmailMessage";

const spliceMessage = (message) => {
  return `${message.slice(0, 15)}...`;
};

const textMessageStyle = {
  wordWrap: "break-word",
  overflowWrap: "break-word",
  wordBreak: "break-word",
};

// Функция для обработки текста с URL (только HTTPS делаются кликабельными)
const renderTextWithLinks = (text) => {
  if (!text) return text;

  // Регулярное выражение для поиска URL
  const urlRegex = /(https?:\/\/[^\s]+)/gi;
  const parts = text.split(urlRegex);

  return parts.map((part, index) => {
    // Проверяем, является ли часть URL
    if (part.match(urlRegex)) {
      // Проверяем, начинается ли с HTTPS (безопасная ссылка)
      if (part.toLowerCase().startsWith('https://')) {
        return (
          <Anchor
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            style={{ 
              color: "var(--crm-ui-kit-palette-link-primary)",
              textDecoration: "underline",
              wordBreak: "break-all"
            }}
          >
            {part}
          </Anchor>
        );
      }
      // HTTP ссылки остаются как обычный текст (небезопасно)
      return <span key={index} style={{ color: "var(--mantine-color-orange-6)" }}>{part}</span>;
    }
    // Обычный текст
    return part;
  });
};

export const getMediaType = (mimeType) => {
  if (mimeType.startsWith("image/")) return MEDIA_TYPE.IMAGE;
  if (mimeType.startsWith("video/")) return MEDIA_TYPE.VIDEO;
  if (mimeType.startsWith("audio/")) return MEDIA_TYPE.AUDIO;
  return "file";
};

export const renderContent = (msg) => {
  // Определяем URL для медиа контента
  const mediaUrl = msg.media_url || msg.message;
  
  if (!mediaUrl?.trim() && !msg.message?.trim()) {
    return (
      <div style={textMessageStyle}>
        {getLanguageByKey("Mesajul lipseste")}
      </div>
    );
  }

  const type = msg.mtype || msg.media_type || msg.last_message_type;

  switch (type) {
    case MEDIA_TYPE.IMAGE:
      return (
        <CheckedImage
          url={mediaUrl}
          style={{ maxWidth: 500, maxHeight: 500 }}
          renderFallbackImage={() => (
            <Text c="red" size="xs">
              {getLanguageByKey("failToLoadImage")}
            </Text>
          )}
        />
      );

    case MEDIA_TYPE.VIDEO:
      return (
        <video
          controls
          style={{ borderRadius: 8, maxWidth: 500, maxHeight: 500 }}
        >
          <source src={mediaUrl} type="video/mp4" />
          {getLanguageByKey("Acest browser nu suporta video")}
        </video>
      );

    case MEDIA_TYPE.AUDIO:
      return <Audio src={mediaUrl} />;

    case MEDIA_TYPE.FILE:
      return (
        <File
          style={{ backgroundColor: "var(--crm-ui-kit-palette-background-primary-disabled)" }}
          label={spliceMessage(mediaUrl)}
          src={mediaUrl}
        />
      );

    case MEDIA_TYPE.IG_REEL:
      return (
        <video
          controls
          style={{ borderRadius: "8", maxWidth: 500, maxHeight: 500 }}
        >
          <source src={mediaUrl} type="video/mp4" />
          {getLanguageByKey("Acest browser nu suporta video")}
        </video>
      );

    case MEDIA_TYPE.SHARE: {
      const isImage = mediaUrl.match(/\.(jpeg|jpg|png|webp|gif|photo)$/i);

      return isImage ? (
        <CheckedImage
          url={mediaUrl}
          style={{ maxWidth: 500, maxHeight: 500 }}
          renderFallbackImage={() => (
            <Text c="red" size="xs">
              {getLanguageByKey("failToLoadImage")}
            </Text>
          )}
        />
      ) : (
        <Text style={{ whiteSpace: "pre-line", wordWrap: "break-word" }}>
          {renderTextWithLinks(mediaUrl)}
        </Text>
      );
    }

    case MEDIA_TYPE.EMAIL:
      return <EmailMessage 
        message={msg.message} 
        platform_id={msg.platform_id} 
        page_id={msg.page_id} 
      />;

    default:
      // Для текстовых сообщений используем message, для медиа - mediaUrl
      const displayText = msg.message || mediaUrl;

      return isStoreFile(displayText) ? (
        <File
          style={{ backgroundColor: "var(--crm-ui-kit-palette-background-primary-disabled)" }}
          label={spliceMessage(displayText)}
          src={displayText}
        />
      ) : (
        <Box maw="600px" w="100%">
          <Text
            style={{ whiteSpace: "pre-line", wordWrap: "break-word", fontSize: "14px" }}
          >
            {renderTextWithLinks(displayText)}
          </Text>
        </Box>
      );
  }
};