import { getLanguageByKey } from "./utils";

export const Audio = ({ src }) => {
  return (
    <audio controls>
      <source src={src} type="audio/ogg" />
      {getLanguageByKey("Acest browser nu suporta audio")}
    </audio>
  );
};
