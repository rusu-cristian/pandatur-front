import { getLanguageByKey } from "../Components/utils/getLanguageByKey";

const promoOptionKeys = [
  "Black Fryday",
  "Black and White Friday",
  "Flash Sale",
  "Turist recomandat",
  "White Friday",
  "Nu e specificat"
];

export const promoOptions = promoOptionKeys.map((key) => ({
  value: key,
  label: getLanguageByKey(key) || key,
}));
