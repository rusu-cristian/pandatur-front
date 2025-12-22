import { workflowOptionsSalesMD } from "../../Components/utils/workflowUtils";
import dayjs from "dayjs";
import { YYYY_MM_DD_HH_mm_ss, YYYY_MM_DD } from "../../app-constants";
import { YYYY_MM_DD_DASH } from "../../app-constants";
import { VIEW_MODE, EXCLUDED_WORKFLOWS } from "./constants";

// Реэкспорт VIEW_MODE для обратной совместимости
export { VIEW_MODE };

export const platformOptions = [
  "telegram",
  "viber",
  "whatsapp",
  "facebook",
  "instagram",
  "sipuni",
];

// Используем константы из constants.js
export const filteredWorkflows = workflowOptionsSalesMD.filter(
  (wf) => !EXCLUDED_WORKFLOWS.includes(wf)
);

export const filterDefaults = {
  workflow: filteredWorkflows,
  tags: [],
};

export const formatDateOrUndefined = (date) => {
  const minDate = date?.[0];
  const maxDate = date?.[1];

  return minDate && maxDate
    ? {
      from: dayjs(minDate).format(YYYY_MM_DD_DASH),
      to: dayjs(maxDate).format(YYYY_MM_DD_DASH),
    }
    : undefined;
};

export const formatDateOrUndefinedFilter = (date) => {
  const minDate = date?.[0];
  const maxDate = date?.[1];

  return minDate && maxDate
    ? {
      from: dayjs(minDate).format(YYYY_MM_DD_DASH),
      to: dayjs(maxDate).format(YYYY_MM_DD_DASH),
    }
    : undefined;
};

export const formatNumericValue = (value) => {
  const rangeValue = value ? { from: value, to: value } : value;
  return rangeValue;
};

export const convertDateToArray = (rangeDate = {}) => {
  const { from, to } = rangeDate;

  return [
    from ? dayjs(from, YYYY_MM_DD_DASH) : undefined,
    to ? dayjs(to, YYYY_MM_DD_DASH) : undefined,
  ];
};

export const convertDateToArrayFilter = (rangeDate = {}) => {
  const { from, to } = rangeDate;

  return [
    from ? dayjs(from, YYYY_MM_DD) : undefined,
    to ? dayjs(to, YYYY_MM_DD) : undefined,
  ];
};

export const convertNumberRangeToSingleValue = (range = {}) => {
  const { from, to } = range;
  // NOTE: `from` and `to` have the same value

  return from && to ? from : undefined;
};
