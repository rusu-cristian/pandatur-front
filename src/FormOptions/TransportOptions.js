import { getLanguageByKey } from "../Components/utils/getLanguageByKey";

const transportOptionKeys = [
  "Avion",
  "Autocar",
  "Transport personal",
  "Fara transport"
];

export const transportOptions = transportOptionKeys.map((key) => ({
  value: key,
  label: getLanguageByKey(key) || key,
}));
