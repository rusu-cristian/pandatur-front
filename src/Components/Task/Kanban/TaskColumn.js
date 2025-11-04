import React, { useRef, useEffect, useMemo, useCallback, memo, forwardRef, useState } from "react";
import { VariableSizeList } from "react-window";
import { Box } from "@mantine/core";
import dayjs from "dayjs";
import TaskCard from "./TaskCard";
import { translations } from "../../utils/translations";
import "./TaskKanban.css";

// Простая функция парсинга даты (формат: YYYY-MM-DD HH:mm:ss)
const parseTaskDate = (dateString) => {
  if (!dateString) return null;
  
  const parsed = dayjs(dateString, "YYYY-MM-DD HH:mm:ss");
  return parsed.isValid() ? parsed : null;
};

const language = localStorage.getItem("language") || "RO";

// Дефолтная высота карточки задачи (включая margin)
const DEFAULT_TASK_CARD_HEIGHT = 250;

// Wrapper для внутреннего элемента списка
const wrapperColumn = forwardRef(({ style, ...rest }, ref) => (
  <Box
    ref={ref}
    pos="relative"
    style={style}
    {...rest}
  />
));

wrapperColumn.displayName = 'TaskColumnWrapper';

const TaskColumn = ({ titleKey, tasksList, now, onEdit, columnType }) => {
    const columnRef = useRef(null);
    const listRef = useRef(null);
    const rowHeights = useRef({});
    const [columnHeight, setColumnHeight] = useState(500);
    
    // Отслеживание высоты контейнера
    useEffect(() => {
        const updateHeight = () => {
            if (columnRef.current) {
                const height = columnRef.current.clientHeight;
                if (height > 0) {
                    setColumnHeight(height);
                }
            }
        };

        updateHeight();
        
        const resizeObserver = new ResizeObserver(updateHeight);
        if (columnRef.current) {
            resizeObserver.observe(columnRef.current);
        }

        window.addEventListener('resize', updateHeight);

        return () => {
            resizeObserver.disconnect();
            window.removeEventListener('resize', updateHeight);
        };
    }, []);

    const getColumnConfig = (key) => {
        const configs = {
            overdue: { icon: "⚠️", title: "Просроченные" },
            today: { icon: "📅", title: "Сегодня" },
            tomorrow: { icon: "⏰", title: "Завтра" }
        };
        return configs[key] || { icon: "📋", title: "Задачи" };
    };

    const config = getColumnConfig(columnType);

    // Мемоизируем отфильтрованные задачи с валидными датами
    const validTasks = useMemo(() => {
        return tasksList.filter(task => {
            const deadline = parseTaskDate(task.scheduled_time);
            return deadline && deadline.isValid();
        });
    }, [tasksList]);

    // Функция для установки высоты строки
    const setRowHeight = useCallback((index, size) => {
        // Обновляем только если высота изменилась
        if (rowHeights.current[index] !== size) {
            rowHeights.current[index] = size;
            // Сбрасываем кеш только с текущего индекса
            if (listRef.current) {
                listRef.current.resetAfterIndex(index, false);
            }
        }
    }, []);

    // Компонент элемента списка с виртуализацией
    const CardItem = memo(({ index, style }) => {
        const rowRef = useRef(null);
        const task = validTasks[index];
        const deadline = parseTaskDate(task?.scheduled_time);

        useEffect(() => {
            if (rowRef.current && task) {
                // clientHeight автоматически включает все дочерние элементы с их margin'ами
                const height = rowRef.current.clientHeight;
                if (height > 0) {
                    setRowHeight(index, height);
                }
            }
        }, [index, task?.id, setRowHeight]);

        if (!task || !deadline || !deadline.isValid()) {
            return null;
        }

        return (
            <div style={style}>
                <div ref={rowRef}>
                    <TaskCard
                        task={task}
                        deadline={deadline}
                        now={now}
                        onClick={onEdit}
                    />
                </div>
            </div>
        );
    });

    CardItem.displayName = 'TaskCardItem';

    // Получаем высоту строки или возвращаем дефолтную
    const getItemSize = useCallback((index) => {
        return rowHeights.current[index] || DEFAULT_TASK_CARD_HEIGHT;
    }, []);

    return (
        <div className={`task-column ${columnType}`} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Заголовок колонки */}
            <div className="task-column-header">
                <h3 className="task-column-title">
                    {config.icon} {translations[titleKey][language]}
                    <span className="task-count">
                        {validTasks.length}
                    </span>
                </h3>
            </div>

            {/* Виртуализированный список задач */}
            <div 
                ref={columnRef}
                className="task-list-scroll-area"
                style={{ 
                    flex: 1, 
                    minHeight: 0,
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column'
                }}
            >
                {validTasks.length === 0 ? (
                    <div className="task-empty">
                        {translations["noTasks"][language]}
                    </div>
                ) : (
                    <VariableSizeList
                        ref={listRef}
                        height={columnHeight || 500}
                        itemCount={validTasks.length}
                        itemSize={getItemSize}
                        width="100%"
                        innerElementType={wrapperColumn}
                        overscanCount={2}
                    >
                        {CardItem}
                    </VariableSizeList>
                )}
            </div>
        </div>
    );
};

export default memo(TaskColumn);