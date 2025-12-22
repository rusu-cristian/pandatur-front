import { getLanguageByKey } from "../Components/utils/getLanguageByKey";

const paymentStatusOptionKeys = [
  "Part pay",
  "Full pay"
];

export const paymentStatusOptions = paymentStatusOptionKeys.map((key) => ({
  value: key,
  label: getLanguageByKey(key) || key,
}));
