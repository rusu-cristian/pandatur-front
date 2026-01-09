import { getLanguageByKey } from "./utils";

export const Audio = ({ src }) => {
  return (
    <audio
      controls
      style={{
        height: "28px",
        minWidth: "250px",
        display: "block",
        margin: "0 auto",
      }}
    >
      <source src={src} type="audio/ogg" />
      {getLanguageByKey("Acest browser nu suporta audio")}
    </audio>
  );
};
