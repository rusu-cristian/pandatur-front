import { getLanguageByKey } from "../Components/utils/getLanguageByKey";

const valutaOptionKeys = [
  "Mdl",
  "Eur"
];

export const valutaOptions = valutaOptionKeys
  .map((key) => ({
    value: key,
    label: getLanguageByKey(key) || key,
  }))
  .sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: 'base' }));
