import { Tag } from "../../Tag";
import { getLanguageByKey } from "../../utils";

export const colorsWorkflow = {
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
  "Factură trimisă": {
    color: "#e6f3ff",
    bright: "#b3d9ff",
  },
  Contactate: {
    color: "#e1d5f7",
    bright: "#c4a8ef",
  },
  "In procesare": {
    color: "#fff4e6",
    bright: "#ffe0b3",
  },
  Contract: {
    color: "#d4f1f4",
    bright: "#a8e3e9",
  },
  "Creat Cont In sistem": {
    color: "#f0e6ff",
    bright: "#e0ccff",
  },
  Rezervari: {
    color: "#ffe6f2",
    bright: "#ffb3d9",
  },
  "În lucru GC": {
    color: "#e6f7ff",
    bright: "#b3e6ff",
  },
  "Colectare date": {
    color: "#fff9e6",
    bright: "#fff3b3",
  },
  "Cumpărat (ani anteriori)": {
    color: "#e6ffe6",
    bright: "#b3ffb3",
  },
  "Cumpărat (anul curent)": {
    color: "#d4fcd4",
    bright: "#8bf58b",
  },
  "В работе GC": {
    color: "#e6f7ff",
    bright: "#b3e6ff",
  },
  "Сбор данных": {
    color: "#fff9e6",
    bright: "#fff3b3",
  },
  "КУПИЛИ (предыдущие года)": {
    color: "#e6ffe6",
    bright: "#b3ffb3",
  },
  "Купил (текущий год)": {
    color: "#d4fcd4",
    bright: "#8bf58b",
  },
  Primit: {
    color: "#e6f2ff",
    bright: "#b3d9ff",
  },
  Nou: {
    color: "#fff4e6",
    bright: "#ffe0b3",
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
        color: "#000000",
        fontSize: "10px",
      }}
    >
      {translatedType}
    </Tag>
  );
};
