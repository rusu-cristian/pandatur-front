import { useMemo, useContext } from "react";
import { useLocation } from "react-router-dom";
import { useUser, useMobile } from "../../../hooks";
import { useUI } from "../../../contexts/UIContext";
import { useTickets } from "../../../contexts/TicketsContext";
import { UserContext } from "../../../contexts/UserContext";
import { SocketContext } from "../../../contexts/SocketContext";
import { hasStrictPermission, hasRouteAccess } from "../../utils/permissions";
import { safeParseJson, convertRolesToMatrix } from "../../UsersComponent/rolesUtils";
import { groupTitleOptions } from "../../../FormOptions/GroupTitleOptions";
import { createMenuItems } from "../constants/menuConfig";

/**
 * Custom hook for sidebar menu logic
 * Encapsulates all menu-related state and logic
 */
export const useSidebarMenu = () => {
  const location = useLocation();
  const { isCollapsed, setIsCollapsed } = useUI();
  const { unreadCount } = useTickets();
  const { userRoles } = useUser();
  const isMobile = useMobile();
  const { customGroupTitle, groupTitleForApi } = useContext(UserContext);
  const { isConnected } = useContext(SocketContext);

  // Calculate current group title label
  const currentGroupTitle = customGroupTitle || groupTitleForApi;
  const currentGroupTitleLabel = useMemo(() => {
    if (!currentGroupTitle) return null;
    const option = groupTitleOptions.find((opt) => opt.value === currentGroupTitle);
    return option?.label || currentGroupTitle;
  }, [currentGroupTitle]);

  // Check if menu item is active
  const isActive = (page) => {
    if (page === "chat") return location.pathname.startsWith("/chat");
    if (page === "analytics") return location.pathname.startsWith("/analytics");
    return location.pathname === `/${page}`;
  };

  // Create menu items with current state
  const menuItems = useMemo(
    () =>
      createMenuItems({
        userRoles,
        hasStrictPermission,
        hasRouteAccess,
        convertRolesToMatrix,
        safeParseJson,
        currentGroupTitleLabel,
        unreadCount,
      }),
    [userRoles, currentGroupTitleLabel, unreadCount]
  );

  return {
    isCollapsed,
    setIsCollapsed,
    isMobile,
    isConnected,
    menuItems,
    isActive,
  };
};
