import { memo } from "react";
import { Box, ActionIcon } from "@mantine/core";

// Популярные emoji — покрывают 90% случаев
const POPULAR_EMOJI = [
  '😀', '😂', '😊', '😍', '🥰', '😘', '😎', '🤔',
  '😢', '😭', '😤', '🙄', '😴', '🤗', '🤩', '😇',
  '👍', '👎', '👋', '🙏', '💪', '👏', '🤝', '✌️',
  '❤️', '🔥', '⭐', '✅', '❌', '💯', '🎉', '💬',
  '📌', '✈️', '🗓', '☀️', '🌴', '✨', '🚌', '🚗',
  '🏖', '🏝', '💸', '🔗'
];

/**
 * Простой легковесный emoji picker
 * 0 дополнительных зависимостей — только Mantine
 * 
 * @param {Function} onSelect - callback при выборе emoji, получает emoji строку
 * @param {Function} onClose - callback для закрытия пикера
 */
export const SimpleEmojiPicker = memo(({ onSelect, onClose }) => (
  <Box
    className="simple-emoji-picker"
    style={{
      position: 'absolute',
      bottom: '100%',
      right: 0,
      marginBottom: 8,
      padding: 8,
      backgroundColor: 'var(--mantine-color-body)',
      border: '1px solid var(--mantine-color-default-border)',
      borderRadius: 8,
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      display: 'grid',
      gridTemplateColumns: 'repeat(8, 1fr)',
      gap: 4,
      zIndex: 100,
    }}
    onMouseLeave={onClose}
  >
    {POPULAR_EMOJI.map(emoji => (
      <ActionIcon
        key={emoji}
        variant="subtle"
        size="lg"
        onClick={() => onSelect(emoji)}
        style={{ fontSize: 20 }}
      >
        {emoji}
      </ActionIcon>
    ))}
  </Box>
));

SimpleEmojiPicker.displayName = 'SimpleEmojiPicker';

