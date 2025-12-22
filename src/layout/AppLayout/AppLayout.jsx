import { SideBar } from "@components";
import { useApp } from "@hooks";
import "./AppLayout.css";

export const AppLayout = ({ children }) => {
  const { isCollapsed } = useApp();

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
