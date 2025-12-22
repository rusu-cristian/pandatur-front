import { getLanguageByKey } from "../Components/utils/getLanguageByKey";

const serviceTypeOptionKeys = [
  "Altele",
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
];

export const serviceTypeOptions = serviceTypeOptionKeys.map((key) => ({
  value: key,
  label: getLanguageByKey(key) || key,
}));
