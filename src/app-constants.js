export const ISO_DATE = "yyyy-MM-dd";
export const YYYY_MM_DD = "YYYY.MM.DD";
export const YYYY_MM_DD_DASH = "YYYY-MM-DD";
export const HH_mm = "HH:mm";
export const YYYY_MM_DD_HH_mm_ss = "YYYY-MM-DD HH:mm:ss";

export const DEFAULT_PHOTO = "/user.png";

export const FALLBACK_IMAGE =
  "https://www.okm.md/_ipx/f_webp&q_75/fallback.webp";

export const MEDIA_TYPE = {
  TEXT: "text",
  IMAGE: "image",
  VIDEO: "video",
  AUDIO: "audio",
  FILE: "file",
  URL: "url",
  CALL: "call",
  IG_REEL: "ig_reel",
  SHARE: "share",
  EMAIL: "email",
};

export const MESSAGES_TYPE_OPTIONS = [
  { value: "text", label: "Text" },
  { value: "image", label: "Image" },
  { value: "audio", label: "Audio" },
  { value: "file", label: "File" },
  { value: "email", label: "Email" },
  { value: "url", label: "URL" },
  { value: "call", label: "Call" },
  { value: "video", label: "Video" },
  { value: "ig_reel", label: "Instagram Reel ID" },
  { value: "share", label: "Shared Content" },
];

export const PLATFORMS = {
  VIBER: "viber",
  TELEGRAM: "telegram",
  FACEBOOK: "facebook",
};

export const TYPE_SOCKET_EVENTS = {
  SEEN: "seen",
  MESSAGE: "message",
  TICKET: "ticket",
  CONNECT: "connect",
  TICKET_UPDATE: "ticket_update",
  TICKET_JOIN: "ticket_join",
  TICKET_LEAVE: "ticket_leave",
  PING: "ping",
  TICKET_LOGS: "ticket_logs",
  TICKET_NOTE: "ticket_note",
  DELETE: "delete",
};

export const TYPE_TICKET = {
  HARD: "hard",
  LIGHT: "light",
};

export const CALL_STATUS = {
  IN_PROCESS: "IN_PROCESS",     // Звонок в процессе (как приходит с сервера)
  ANSWER: "ANSWER",             // Звонок отвечен
  NOANSWER: "NOANSWER",         // Нет ответа
};
