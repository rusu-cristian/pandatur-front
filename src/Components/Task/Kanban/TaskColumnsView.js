import React, { useMemo } from "react";
import { Box } from "@mantine/core";
import dayjs from "dayjs";
import TaskColumn from "./TaskColumn";
import "./TaskKanban.css";

// Простая функция парсинга даты (формат: YYYY-MM-DD HH:mm:ss)
const parseTaskDate = (dateString) => {
  if (!dateString) return null;
  
  const parsed = dayjs(dateString, "YYYY-MM-DD HH:mm:ss");
  return parsed.isValid() ? parsed : null;
};

const TASK_GROUPS = ["overdue", "today", "tomorrow"];

const groupTasksByDate = (tasks) => {
    const now = dayjs();
    const grouped = {
        overdue: [],
        today: [],
        tomorrow: [],
    };

    tasks.forEach((task) => {
        const deadline = parseTaskDate(task.scheduled_time);
        if (!deadline || !deadline.isValid()) {
            return;
        }

        if (deadline.isBefore(now, "day")) {
            grouped.overdue.push(task);
        } else if (deadline.isSame(now, "day")) {
            grouped.today.push(task);
        } else {
            grouped.tomorrow.push(task);
        }
    });

    return { grouped, now };
};

const TaskColumnsView = ({ tasks = [], onEdit, searchQuery = "" }) => {
    // Фильтрация задач по поисковому запросу
    const filteredTasks = useMemo(() => {
        if (!searchQuery.trim()) return tasks;
        
        const query = searchQuery.toLowerCase().trim();
        
        return tasks.filter(task => {
            // Поиск по ID тикета
            const ticketId = task.ticket_id?.toString() || "";
            if (ticketId.includes(query)) return true;
            
            // Поиск по имени ответственного
            const responsibleName = task.created_for_full_name?.toLowerCase() || "";
            if (responsibleName.includes(query)) return true;
            
            // Поиск по имени автора
            const authorName = task.creator_by_full_name?.toLowerCase() || "";
            if (authorName.includes(query)) return true;
            
            return false;
        });
    }, [tasks, searchQuery]);

    const { grouped, now } = groupTasksByDate(filteredTasks);

    return (
        <Box className="task-columns-container">
            {TASK_GROUPS.map((key) => (
                <TaskColumn
                    key={key}
                    titleKey={`${key}Tasks`}
                    tasksList={grouped[key]}
                    now={now}
                    onEdit={onEdit}
                    columnType={key}
                />
            ))}
        </Box>
    );
};

export default TaskColumnsView;
