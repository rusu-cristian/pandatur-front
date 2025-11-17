import { getLanguageByKey } from "../Components/utils/getLanguageByKey";

const purchaseProcessingOptionKeys = [
  "Online",
  "La birou"
];

export const purchaseProcessingOptions = purchaseProcessingOptionKeys.map((key) => ({
  value: key,
  label: getLanguageByKey(key) || key,
}));
