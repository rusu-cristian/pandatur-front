import { lazy } from "react";
import { hasStrictPermission, hasRouteAccess } from "./Components/utils/permissions";
import { convertRolesToMatrix, safeParseJson } from "./Components/UsersComponent/rolesUtils";

// Lazy loading для страниц — уменьшает начальный bundle
// Используем .then() для named exports
const Logs = lazy(() => import("./pages/Logs").then(m => ({ default: m.Logs })));
const Leads = lazy(() => import("./pages/Leads").then(m => ({ default: m.Leads })));
const TaskPage = lazy(() => import("./pages/TaskPage").then(m => ({ default: m.TaskPage })));
const Schedules = lazy(() => import("./pages/Schedules").then(m => ({ default: m.Schedules })));
const Users = lazy(() => import("./pages/Users").then(m => ({ default: m.Users })));
const Login = lazy(() => import("./pages/Login").then(m => ({ default: m.Login })));
const Chat = lazy(() => import("./pages/Chat").then(m => ({ default: m.Chat })));
const Dashboard = lazy(() => import("./pages/Dashboard").then(m => ({ default: m.Dashboard })));
const TermsAndConditions = lazy(() => import("./pages/TermsAndConditions").then(m => ({ default: m.TermsAndConditions })));
const Sales = lazy(() => import("./pages/Sales").then(m => ({ default: m.Sales })));
const Analytics = lazy(() => import("./pages/Analytics").then(m => ({ default: m.Analytics })));

export const privatePaths = [
  "dashboard",
  "leads",
  "chat",
  "users",
  "tasks",
  "schedules",
  "logs",
  "terms-and-conditions",
  "analytics",
  "sales",
];

export const publicRoutes = [
  {
    path: "/auth",
    component: Login,
  },
  {
    path: "/terms-and-conditions",
    component: TermsAndConditions,
  },
];

export const privateRoutes = (userRoles) => {
  const routes = [];

  const matrix = convertRolesToMatrix(safeParseJson(userRoles || []));

  if (hasStrictPermission(userRoles, "DASHBOARD", "VIEW")) {
    routes.push({ path: "/dashboard", component: Dashboard });
  }

  if (hasRouteAccess(matrix, "LEADS", "VIEW")) {
    routes.push({ path: "/leads/:ticketId?", component: Leads });
  }

  if (hasRouteAccess(matrix, "CHAT", "VIEW")) {
    routes.push({ path: "/chat/:ticketId?", component: Chat });
  }

  if (hasStrictPermission(userRoles, "USERS", "VIEW")) {
    routes.push({ path: "/users", component: Users });
  }

  if (hasRouteAccess(matrix, "TASK", "VIEW")) {
    routes.push({ path: "/tasks/:ticketId?", component: TaskPage });
  }

  if (hasStrictPermission(userRoles, "SCHEDULES", "VIEW")) {
    routes.push({ path: "/schedules", component: Schedules });
  }

  if (hasStrictPermission(userRoles, "LOGS", "VIEW")) {
    routes.push({ path: "/logs", component: Logs });
  }

  if (hasStrictPermission(userRoles, "ANALYTICS", "VIEW")) {
    routes.push({ path: "/analytics", component: Analytics });
    routes.push({ path: "/analytics/calls/:ticketId?", component: Analytics });
    routes.push({path: "/analytics/events", component: Analytics});
    routes.push({path: "/analytics/events/:ticketId?", component: Analytics});
  }

  if (hasStrictPermission(userRoles, "SALES", "VIEW")) {
    routes.push({ path: "/sales", component: Sales });
  }

  routes.push({ path: "/terms-and-conditions", component: TermsAndConditions });

  return routes;
};
