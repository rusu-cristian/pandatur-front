import { getLanguageByKey } from "../Components/utils/getLanguageByKey";
import { sortOptionsWithLastItems } from "./sortOptions";

const serviceTypeOptionKeys = [
  "Angajare",
  "Bilete de avion",
  "Bilet de fotbal",
  "CityBreak",
  "Contact specialist",
  "Croaziera",
  "Doar transport",
  "Excursii",
  "Festival",
  "Green Card",
  "Munte",
  "Pelerinaj",
  "Recenzie",
  "Sejur la Mare",
  "Tabara la munte cu Panda tur si Iuliana Beregoi",
  "Tratament",
  "Viza",
  "Altele"
];

export const serviceTypeOptions = sortOptionsWithLastItems(
  serviceTypeOptionKeys.map((key) => ({
    value: key,
    label: getLanguageByKey(key) || key,
  }))
);
