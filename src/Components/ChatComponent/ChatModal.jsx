import { useEffect } from "react";
import { useUI } from "../../contexts/UIContext";
import "./ChatModal.css";

export const ChatModal = ({ opened, onClose, children }) => {
  const { isCollapsed } = useUI();
  const sidebarWidth = isCollapsed
    ? "var(--sidebar-width-collapsed)"
    : "var(--sidebar-width-expanded)";

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
        left: sidebarWidth,
        width: `calc(100vw - ${sidebarWidth})`,
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
