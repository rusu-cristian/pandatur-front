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
const DEFAULT_TASK_CARD_HEIGHT = 180;
// Отступ между карточками
const CARD_GAP = 8;

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

// Компонент элемента списка с виртуализацией
const CardItem = memo(({ index, style, task, deadline, now, onEdit, setRowHeight }) => {
    const rowRef = useRef(null);

    useEffect(() => {
        if (rowRef.current && task?.id) {
            // clientHeight автоматически включает все дочерние элементы с их margin'ами
            const height = rowRef.current.clientHeight;
            if (height > 0) {
                setRowHeight(task.id, index, height);
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

const TaskColumn = ({ titleKey, tasksList, now, onEdit, columnType }) => {
    const columnRef = useRef(null);
    const listRef = useRef(null);
    // Храним высоты по ID задачи, а не по индексу для более стабильной работы
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

    // Мемоизируем отфильтрованные задачи с валидными датами
    const validTasks = useMemo(() => {
        return tasksList.filter(task => {
            const deadline = parseTaskDate(task.scheduled_time);
            return deadline && deadline.isValid();
        });
    }, [tasksList]);

    // Функция для установки высоты строки (по ID задачи)
    const setRowHeight = useCallback((taskId, index, size) => {
        // Обновляем только если высота изменилась
        if (rowHeights.current[taskId] !== size) {
            rowHeights.current[taskId] = size;
            // Сбрасываем кеш только с текущего индекса
            if (listRef.current) {
                listRef.current.resetAfterIndex(index, false);
            }
        }
    }, []);

    // Очищаем кеш высот для удаленных задач
    useEffect(() => {
        const validTaskIds = new Set(validTasks.map(t => t.id));
        // Удаляем высоты для задач, которых больше нет в списке
        Object.keys(rowHeights.current).forEach(taskId => {
            if (!validTaskIds.has(parseInt(taskId))) {
                delete rowHeights.current[taskId];
            }
        });
        if (listRef.current) {
            listRef.current.resetAfterIndex(0);
        }
    }, [validTasks]);

    // Получаем высоту строки или возвращаем дефолтную
    const getItemSize = useCallback((index) => {
        const task = validTasks[index];
        const baseHeight = task?.id && rowHeights.current[task.id] 
            ? rowHeights.current[task.id] 
            : DEFAULT_TASK_CARD_HEIGHT;
        
        // Добавляем gap после каждой карточки, кроме последней
        const isLast = index === validTasks.length - 1;
        return baseHeight + (isLast ? 0 : CARD_GAP);
    }, [validTasks]);

    // Рендер-функция для элементов списка
    const renderCardItem = useCallback(({ index, style }) => {
        const task = validTasks[index];
        const deadline = parseTaskDate(task?.scheduled_time);
        
        return (
            <CardItem
                index={index}
                style={style}
                task={task}
                deadline={deadline}
                now={now}
                onEdit={onEdit}
                setRowHeight={setRowHeight}
            />
        );
    }, [validTasks, now, onEdit, setRowHeight]);

    return (
        <div className={`task-column ${columnType}`} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Заголовок колонки */}
            <div className="task-column-header">
                <h3 className="task-column-title">
                    {translations[titleKey][language]}
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
                        {renderCardItem}
                    </VariableSizeList>
                )}
            </div>
        </div>
    );
};

export default memo(TaskColumn);