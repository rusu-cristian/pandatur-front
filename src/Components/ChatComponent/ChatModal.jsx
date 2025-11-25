import { useEffect } from "react";
import { useApp } from "@hooks";
import "./ChatModal.css";

export const ChatModal = ({ opened, onClose, children }) => {
  const { isCollapsed } = useApp();
  const sidebarWidth = isCollapsed ? 79 : 249;

  // Блокируем скролл body при открытии модалки
  useEffect(() => {
    if (opened) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [opened]);

  if (!opened) return null;

  return (
    <div
      className="chat-modal"
      style={{
        position: "fixed",
        left: `${sidebarWidth}px`,
        width: `calc(133.33vw - ${sidebarWidth}px)`,
        height: "133vh",
        top: 0,
        backgroundColor: "var(--crm-ui-kit-palette-background-primary)",
        zIndex: 100,
      }}
    >
      {children}
    </div>
  );
};

