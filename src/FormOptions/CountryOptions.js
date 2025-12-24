import { getLanguageByKey } from "../Components/utils/getLanguageByKey";
import { sortOptionsWithLastItems } from "./sortOptions";

const countryOptionKeys = [
  "Albania",
  "Bulgaria",
  "Canada",
  "Cipru",
  "Cuba",
  "Dubai (Emiratele arabe unite)",
  "Egipt",
  "Europa",
  "Franta",
  "Grecia",
  "Grecia,Creta",
  "India",
  "Indonesia,Balti",
  "Israel",
  "Italia",
  "Laponia",
  "Maldive",
  "Moldova",
  "Muntenegru",
  "Republica Dominicana",
  "Romania",
  "Spania",
  "Sri Lanka",
  "Tanzania",
  "Thailand",
  "Tunisia",
  "Turcia",
  "Ucraina",
  "Ungaria",
  "USA",
  "Zanzibar",
  "Altele",
  "Nu este specificat",
];

export const countryOptions = sortOptionsWithLastItems(
  countryOptionKeys.map((key) => ({
    value: key,
    label: getLanguageByKey(key) || key,
  }))
);
