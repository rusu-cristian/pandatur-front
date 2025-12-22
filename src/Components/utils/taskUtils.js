import dayjs from "dayjs";
import { parseDate } from "../utils/date";

const toDate = (val) => {
    if (!val) return null;
    if (val instanceof Date) return isNaN(val.getTime()) ? null : val;
    if (typeof val === "number") {
        const d = new Date(val);
        return isNaN(d.getTime()) ? null : d;
    }
    const s = String(val).trim().replace(" ", "T").replace(/Z$/, "");
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
};

export const getDeadlineColor = (date) => {
    const d = toDate(date);
    if (!d) return "var(--crm-ui-kit-palette-text-primary)";

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (d < today) return "var(--mantine-color-red-6)";
    if (d.toDateString() === today.toDateString()) return "var(--crm-ui-kit-palette-link-primary)";
    return "var(--crm-ui-kit-palette-text-primary)";
};

export const getBadgeColor = (tasks = []) => {
    const today = dayjs().startOf("day");

    const hasOverdue = tasks.some((task) => {
        const d = toDate(task?.scheduled_time);
        return d && dayjs(d).isBefore(today, "day");
    });
    if (hasOverdue) return "red"; // Mantine color

    const hasToday = tasks.some((task) => {
        const d = toDate(task?.scheduled_time);
        return d && dayjs(d).isSame(today, "day");
    });
    if (hasToday) return "var(--crm-ui-kit-palette-link-primary)"; // Mantine color

    return "gray"; // Mantine color
};

export const formatTasksToEdits = (tasks) => {
    const edits = {};
    tasks.forEach((task) => {
        edits[task.id] = {
            task_type: task.task_type,
            scheduled_time: parseDate(task.scheduled_time),
            created_for: String(task.created_for),
            created_by: String(task.created_by),
            description: task.description || "",
        };
    });
    return edits;
};

export const sortTasksByDate = (tasks = []) => {
    return [...tasks].sort((a, b) => {
        const da = toDate(a.scheduled_time);
        const db = toDate(b.scheduled_time);
        return (da ? da.getTime() : 0) - (db ? db.getTime() : 0);
    });
};
