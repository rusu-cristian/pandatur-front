import {
  FaChartBar,
  FaTasks,
  FaComments,
  FaClipboardList,
  FaCalendar,
  FaHistory,
  FaChartPie,
  FaMoneyBillWave,
} from "react-icons/fa";
import { FaUsers } from "react-icons/fa6";
import { getLanguageByKey } from "@utils";

/**
 * Menu items configuration
 * Centralized configuration for sidebar menu items
 */
export const createMenuItems = ({ userRoles, hasStrictPermission, hasRouteAccess, convertRolesToMatrix, safeParseJson, currentGroupTitleLabel, unreadCount }) => [
  {
    id: "users",
    path: "/users",
    icon: FaUsers,
    iconSize: 14,
    labelKey: "Users",
    permission: () => hasStrictPermission(userRoles, "USERS", "VIEW"),
  },
  {
    id: "dashboard",
    path: "/dashboard",
    icon: FaChartPie,
    iconSize: 14,
    labelKey: "Dashboard",
    permission: () => hasStrictPermission(userRoles, "DASHBOARD", "VIEW"),
  },
  {
    id: "leads",
    path: "/leads",
    icon: FaClipboardList,
    iconSize: 14,
    labelKey: "Leads",
    suffix: currentGroupTitleLabel ? ` (${currentGroupTitleLabel})` : "",
    permission: () => true, // Wrapped in Can component
    canModule: "leads",
    canAction: "view",
  },
  {
    id: "chat",
    path: "/chat",
    icon: FaComments,
    iconSize: 14,
    labelKey: "Chat",
    badge: unreadCount > 0 ? unreadCount : null,
    permission: () => true, // Wrapped in Can component
    canModule: "chat",
    canAction: "view",
  },
  {
    id: "tasks",
    path: "/tasks",
    icon: FaTasks,
    iconSize: 14,
    labelKey: "Taskuri",
    permission: () => hasRouteAccess(convertRolesToMatrix(safeParseJson(userRoles)), "TASK", "VIEW"),
  },
  {
    id: "schedules",
    path: "/schedules",
    icon: FaCalendar,
    iconSize: 14,
    labelKey: "schedules",
    permission: () => hasStrictPermission(userRoles, "SCHEDULES", "VIEW"),
  },
  {
    id: "analytics",
    path: "/analytics",
    icon: FaChartBar,
    iconSize: 14,
    labelKey: "Analytics",
    permission: () => hasStrictPermission(userRoles, "ANALYTICS", "VIEW"),
  },
  {
    id: "sales",
    path: "/sales",
    icon: FaMoneyBillWave,
    iconSize: 14,
    labelKey: "Sales",
    permission: () => hasStrictPermission(userRoles, "SALES", "VIEW"),
  },
  {
    id: "logs",
    path: "/logs",
    icon: FaHistory,
    iconSize: 14,
    labelKey: "logs",
    permission: () => hasStrictPermission(userRoles, "LOGS", "VIEW"),
  },
];

export const LOGO_PATH = "/logo.svg";
