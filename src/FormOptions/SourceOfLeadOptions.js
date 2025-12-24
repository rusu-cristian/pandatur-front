import { getLanguageByKey } from "../Components/utils/getLanguageByKey";

const sourceOfLeadOptionKeys = [
  "Apel",
  "Mesaj",
  "Birou",
  "Turist recomandat",
  "Formular Facebook",
  "Certificat cadou",
  "Cold call",
  "Site",
  "Comentariu"
];

export const sourceOfLeadOptions = sourceOfLeadOptionKeys
  .map((key) => ({
    value: key,
    label: getLanguageByKey(key) || key,
  }))
  .sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: 'base' }));
