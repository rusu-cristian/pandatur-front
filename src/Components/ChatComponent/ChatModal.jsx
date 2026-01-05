import { useEffect } from "react";
import { useUI } from "../../contexts/UIContext";
import "./ChatModal.css";

export const ChatModal = ({ opened, onClose, children }) => {
  const { isCollapsed } = useUI();
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
        width: `calc(100vw - ${sidebarWidth}px)`,
        height: "var(--app-vh, 100vh)",
        top: 0,
        backgroundColor: "var(--crm-ui-kit-palette-background-primary)",
        zIndex: 100,
      }}
    >
      {children}
    </div>
  );
};
