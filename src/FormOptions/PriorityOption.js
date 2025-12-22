import { getLanguageByKey } from "../Components/utils/getLanguageByKey";

const priorityOptionKeys = [
  "joasă",
  "medie",
  "înaltă",
  "critică"
];

export const priorityOptions = priorityOptionKeys.map((key) => ({
  value: key,
  label: getLanguageByKey(key) || key,
}));
