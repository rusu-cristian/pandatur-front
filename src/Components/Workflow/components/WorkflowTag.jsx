import { Tag } from "../../Tag";
import { getLanguageByKey } from "../../utils";

const colorsWorkflow = {
  Interesat: {
    color: "#ffffcc",
    bright: "#ffff99",
  },
  "Apel de intrare": {
    color: "#cde6fc",
    bright: "#a3d4fc",
  },
  "De prelucrat": {
    color: "#ffd5d6",
    bright: "#ffb3b4",
  },
  "Luat în lucru": {
    color: "#f5ffdc",
    bright: "#eaffb3",
  },
  "Ofertă trimisă": {
    color: "#ffeebb",
    bright: "#ffd480",
  },
  "Aprobat cu client": {
    color: "#ffe5e5",
    bright: "#ffc1c1",
  },
  "Contract semnat": {
    color: "#ffd5d6",
    bright: "#ffb3b4",
  },
  "Plată primită": {
    color: "#fffacc",
    bright: "#ffea80",
  },
  "Contract încheiat": {
    color: "#cdeedd",
    bright: "#a8e6c1",
  },
  "Realizat cu succes": {
    color: "#d4fcd4",
    bright: "#8bf58b",
  },
  "Închis și nerealizat": {
    color: "#ff9999",
    bright: "#ff4d4d",
  },
  default: {
    color: "#ddd",
    bright: "#929292",
  },
};

export const getColorByWorkflowType = (type, fallbackColor) => {
  if (typeof fallbackColor === "string") {
    return colorsWorkflow[type]?.color || fallbackColor;
  }
  return colorsWorkflow[type]?.color || colorsWorkflow["default"].color;
};

export const getBrightByWorkflowType = (type) => {
  return colorsWorkflow[type]?.bright || colorsWorkflow["default"].bright;
};

export const WorkflowTag = ({ type }) => {
  // Получаем переведенное значение workflow, если перевода нет - используем исходное значение
  const translatedType = getLanguageByKey(type) || type;
  
  return (
    <Tag
      style={{
        backgroundColor: getColorByWorkflowType(type),
        borderColor: getBrightByWorkflowType(type),
        color: "#17a2b8",
      }}
    >
      {translatedType}
    </Tag>
  );
};
