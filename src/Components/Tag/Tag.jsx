import "./Tag.css";
import { getLanguageByKey } from "../utils";

const variants = {
  success: "success",
  processing: "processing",
  warning: "warning",
  danger: "danger",
};

export const Tag = ({ children, type, fontSize, ...props }) => {
  // Переводим содержимое тега, если это строка и есть перевод
  const translatedChildren = typeof children === "string" 
    ? (getLanguageByKey(children) || children)
    : children;

  return (
    <span
      className={`tag tag-${variants[type] || "default"}`}
      style={fontSize ? { fontSize } : undefined}
      title={translatedChildren}
      {...props}
    >
      {translatedChildren}
    </span>
  );
};
