import { auth } from "./auth";
import { tickets } from "./tickets";
import { messages } from "./messages";
import { users } from "./users";
import { schedules } from "./schedules";
import { admin } from "./admin";
import { user } from "./user";
import { dashboard } from "./dashboard";
import { task } from "./task";
import { notification } from "./notification";
import { activity } from "./activity";
import { groupSchedules } from "./groupSchedules";
import { permissions } from "./permissions";
import { documents } from "./documents";
import { sales } from "./sales";
export * from "./baseAxios";

export const api = {
  auth,
  tickets,
  messages,
  users,
  schedules,
  admin,
  user,
  dashboard,
  task,
  notification,
  activity,
  groupSchedules,
  permissions,
  documents,
  sales,
};
