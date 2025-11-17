import { getLanguageByKey } from "../Components/utils/getLanguageByKey";

const serviceTypeOptionKeys = [
  "Sejur la Mare",
  "Excursii",
  "Pelerinaj",
  "Munte",
  "Croaziera",
  "Tratament",
  "CityBreak",
  "Angajare",
  "Bilete de avion",
  "Doar transport",
  "Green Card",
  "Viza",
  "Bilet de fotbal",
  "Tabara la munte cu Panda tur si Iuliana Beregoi",
  "Festival",
  "Recenzie",
  "Contact specialist",
  "Altele"
];

export const serviceTypeOptions = serviceTypeOptionKeys.map((key) => ({
  value: key,
  label: getLanguageByKey(key) || key,
}));
