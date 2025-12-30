import { SideBar } from "@components";
import { useUI } from "../../contexts/UIContext";
import "./AppLayout.css";

export const AppLayout = ({ children }) => {
  const { isCollapsed } = useUI();

  return (
    <div className="app-container">
      <SideBar />
      <div className={`page-content ${isCollapsed ? "sidebar-collapsed" : ""}`}>
        {children}
      </div>
    </div>
  );
};
