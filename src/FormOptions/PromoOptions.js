import { getLanguageByKey } from "../Components/utils/getLanguageByKey";
import { sortOptionsWithLastItems } from "./sortOptions";

const promoOptionKeys = [
  "Black Fryday",
  "Black and White Friday",
  "Port Mall",
  "Flash Sale",
  "Turist recomandat",
  "White Friday",
  "Nu e specificat"
];

export const promoOptions = sortOptionsWithLastItems(
  promoOptionKeys.map((key) => ({
    value: key,
    label: getLanguageByKey(key) || key,
  }))
);
