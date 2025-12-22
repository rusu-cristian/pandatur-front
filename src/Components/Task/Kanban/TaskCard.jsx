import React from "react";
import { TypeTask } from "../OptionsTaskType";
import { Link } from "react-router-dom";
import { FaFingerprint, FaClock, FaUser } from "react-icons/fa6";
import { FaCheckCircle } from "react-icons/fa";
import dayjs from "dayjs";
import { translations } from "../../utils/translations";
import "./TaskKanban.css";

const TaskCard = ({ task, deadline, now, onClick }) => {
    const language = localStorage.getItem("language") || "RO";
    const taskTypeObj = TypeTask.find((t) => t.name === task.task_type);
    const isOverdue = deadline.isBefore(now, "day");
    const isToday = deadline.isSame(now, "day");
    const isTomorrow = deadline.isSame(now.add(1, "day"), "day");
    const isCompleted = task.status === 1 || task.status === true;

    const getCardClass = () => {
        if (isCompleted) return "task-card task-card-completed";
        if (isOverdue) return "task-card task-card-overdue";
        if (isToday) return "task-card task-card-today";
        if (isTomorrow) return "task-card task-card-tomorrow";
        return "task-card";
    };

    return (
        <div className={getCardClass()} onClick={() => onClick(task)}>
            {/* ID */}
            <div className="task-field">
                <div className="field-label">
                    <FaFingerprint size={16} />
                    {translations["id"][language]}:
                </div>
                <div className="field-value">
                    <Link
                        to={`/tasks/${task.ticket_id}`}
                        className="task-id-link"
                        onClick={(e) => e.stopPropagation()}
                    >
                        #{task.ticket_id}
                    </Link>
                </div>
            </div>

            {/* Тип задачи */}
            <div className="task-field">
                <div className="field-label">
                    {taskTypeObj?.icon && (
                        <span className="field-icon">
                            {taskTypeObj.icon}
                        </span>
                    )}
                    {translations["type"][language]}:
                </div>
                <div className="field-value">
                    {task.task_type}
                </div>
            </div>

            {/* Статус */}
            <div className="task-field">
                <div className="field-label">
                    <FaCheckCircle size={10} />
                    {translations["status"][language]}:
                </div>
                <div className="field-value">
                    <span className={`status-badge ${isCompleted ? 'completed' : 'not-completed'}`}>
                        {isCompleted ? translations["completed"][language] : translations["notCompleted"][language]}
                    </span>
                </div>
            </div>

            {/* Дедлайн */}
            <div className="task-field">
                <div className="field-label">
                    <FaClock size={10} />
                    {translations["deadline"][language]}:
                </div>
                <div className="field-value">
                    {deadline.format("DD.MM.YYYY HH:mm")}
                </div>
            </div>


            {/* Описание */}
            {task.description && (
                <div className="task-field task-field-description">
                    <div className="field-label">
                        {translations["description"][language]}:
                    </div>
                    <div className="field-value">
                        <div className="task-description">
                            {task.description}
                        </div>
                    </div>
                </div>
            )}

            {/* Автор */}
            <div className="task-field">
                <div className="field-label">
                    <FaUser size={10} />
                    {translations["author"][language]}:
                </div>
                <div className="field-value">
                    {task.creator_by_full_name}
                </div>
            </div>

            {/* Ответственный */}
            <div className="task-field">
                <div className="field-label">
                    <FaUser size={10} />
                    {translations["responsible"][language]}:
                </div>
                <div className="field-value">
                    {task.created_for_full_name}
                </div>
            </div>
        </div>
    );
};

export default TaskCard;