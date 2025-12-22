import dayjs from "dayjs";
import { YYYY_MM_DD_HH_mm_ss, YYYY_MM_DD, HH_mm } from "../../app-constants";
import { translations } from "./translations";

const language = localStorage.getItem("language") || "RO";

/**
 * Надёжный парсинг даты из разных форматов
 * Поддерживает: Date, timestamp, ISO string, DD-MM-YYYY HH:mm:ss, YYYY-MM-DD HH:mm:ss
 */
export const toDate = (val) => {
  if (!val) return null;
  if (val instanceof Date) return isNaN(val.getTime()) ? null : val;
  if (typeof val === "number") {
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  }

  let s = String(val).trim();

  // Проверяем формат DD-MM-YYYY HH:mm:ss (приходит из WebSocket)
  const ddMmMatch = s.match(/^(\d{2})-(\d{2})-(\d{4})[ T](.+)$/);
  if (ddMmMatch) {
    const [, dd, MM, yyyy, time] = ddMmMatch;
    s = `${yyyy}-${MM}-${dd}T${time}`;
  } else {
    // Стандартный формат YYYY-MM-DD HH:mm:ss
    s = s.replace(" ", "T").replace(/Z$/, "");
  }

  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
};

export const formatDate = (date) => {
  return date ? dayjs(date).format(YYYY_MM_DD_HH_mm_ss) : null;
};

export const parseServerDate = (date) => {
  if (date === "Invalid Date") {
    return null;
  }
  return date ? dayjs(date, YYYY_MM_DD_HH_mm_ss) : null;
};

export const parseServerDatePicker = (date) => {
  if (date === "Invalid Date" || !date) return null;
  const parsed = dayjs(date, YYYY_MM_DD_HH_mm_ss);
  return parsed.isValid() ? parsed.toDate() : null;
};

export const parseDate = (dateString) => {
  if (!dateString) return null;
  const [date, time] = dateString.split(" ");
  if (!date || !time) return null;
  const [day, month, year] = date.split("-");
  return new Date(`${year}-${month}-${day}T${time}`);
};

export const applyOffset = (base, offset = {}) => {
  let updated = base;
  if (offset.minutes) updated = updated.add(offset.minutes, "minute");
  if (offset.hours) updated = updated.add(offset.hours, "hour");
  if (offset.days) updated = updated.add(offset.days, "day");
  if (offset.years) updated = updated.add(offset.years, "year");
  return updated;
};

export const quickOptions = [
  { label: translations["in15Min"][language], offset: { minutes: 15 } },
  { label: translations["in30Min"][language], offset: { minutes: 30 } },
  { label: translations["in1Hour"][language], offset: { hours: 1 } },
  { label: translations["today"][language], custom: () => dayjs() },
  {
    label: translations["tomorrow"][language],
    custom: () => dayjs().add(1, "day"),
  },
  {
    label: translations["thisWeek"][language],
    custom: () => dayjs().endOf("week"),
  },
  { label: translations["inAWeek"][language], offset: { days: 7 } },
  { label: translations["in30Days"][language], offset: { days: 30 } },
  { label: translations["in1Year"][language], offset: { years: 1 } },
];

export const formattedDate = (date) => {
  const parsedDate = dayjs(date, YYYY_MM_DD_HH_mm_ss);

  return {
    formateDate: parsedDate.format(YYYY_MM_DD),
    formateTime: parsedDate.format(HH_mm),
  };
};
