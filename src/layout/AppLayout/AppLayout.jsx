import { SideBar } from "@components";
import { useUI } from "../../contexts/UIContext";
import "./AppLayout.css";

export const AppLayout = ({ children }) => {
  const { isCollapsed } = useUI();

  return (
    <div className="app-container">
      <SideBar />
      <div
        style={{
          "--side-bar-width": isCollapsed
            ? "var(--sidebar-width-collapsed)"
            : "var(--sidebar-width-expanded)",
        }}
        className="page-content"
      >
        {children}
      </div>
    </div>
  );
};
