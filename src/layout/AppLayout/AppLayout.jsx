import { SideBar } from "@components";
import { useUI } from "../../contexts/UIContext";
import "./AppLayout.css";

export const AppLayout = ({ children }) => {
  const { isCollapsed } = useUI();

  return (
    <div className="app-container">
      <SideBar />
      <div
        style={{ "--side-bar-width": isCollapsed ? "79px" : "249px" }}
        className="page-content"
      >
        {children}
      </div>
    </div>
  );
};
