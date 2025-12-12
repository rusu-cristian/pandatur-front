/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect, useContext } from "react";
import {
  TextInput,
  SegmentedControl,
  Box,
  Group,
  Tooltip,
  Flex,
  ActionIcon,
  Pagination
} from "@mantine/core";
import { IoMdClose } from "react-icons/io";
import { TbLayoutKanbanFilled } from "react-icons/tb";
import { FaList } from "react-icons/fa6";
import { LuFilter } from "react-icons/lu";
import { api } from "../../api";
import { translations } from "../utils/translations";
import TaskModal from "./TaskModal";
import TaskList from "./TaskList/TaskList";
import TaskColumnsView from "./Kanban/TaskColumnsView";
import TaskFilterModal from "./Components/FilterTask";
import { PageHeader } from "../PageHeader";
import { useUser } from "../../hooks";
import { useSnackbar } from "notistack";
import { showServerError } from "../utils";
import { AppContext } from "../../contexts/AppContext";

const language = localStorage.getItem("language") || "RO";

const TaskComponent = ({
  updateTaskCount = () => { },
  userId,
  tasks = [], // Используется для обратной совместимости, но не напрямую
  setTasks, // Используется для обратной совместимости, но не напрямую
  setFetchTasksRef,
}) => {
  const { userId: currentUserId } = useUser();
  const { accessibleGroupTitles, workflowOptions } = useContext(AppContext);

  // Отдельные фильтры для kanban и list
  const [kanbanFilters, setKanbanFilters] = useState(null);
  const [listFilters, setListFilters] = useState(null);
  
  // Отдельные массивы задач
  const [kanbanTasks, setKanbanTasks] = useState([]);
  const [listTasks, setListTasks] = useState([]);
  
  // Пагинация только для list
  const [listCurrentPage, setListCurrentPage] = useState(1);
  const [listTotalPages, setListTotalPages] = useState(1);
  
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("columns");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  // Получаем текущие фильтры и задачи в зависимости от viewMode
  const currentFilters = viewMode === "columns" ? kanbanFilters : listFilters;
  const currentTasks = viewMode === "columns" ? kanbanTasks : listTasks;

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
      if (viewMode === "list") {
        setListCurrentPage(1);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput, viewMode]);

  // Загрузка задач для kanban (paginated: false)
  const fetchKanbanTasks = async (appliedFilters = kanbanFilters) => {
    if (!appliedFilters) return;
    try {
      const res = await api.task.filterTasks({
        ...appliedFilters,
        page: 1,
        sort_by: "scheduled_time",
        paginated: false
      });

      setKanbanTasks(Array.isArray(res?.data) ? res.data : []);
      updateTaskCount();
    } catch (error) {
      console.error("error upload kanban tasks", error);
      setKanbanTasks([]);
      enqueueSnackbar(showServerError(error), { variant: "error" });
    }
  };

  // Загрузка задач для list (paginated: true)
  const fetchListTasks = async (appliedFilters = listFilters) => {
    if (!appliedFilters) return;
    try {
      const res = await api.task.filterTasks({
        ...appliedFilters,
        page: listCurrentPage,
        sort_by: "scheduled_time",
        paginated: true
      });

      setListTasks(Array.isArray(res?.data) ? res.data : []);
      setListTotalPages(res?.pagination?.total_pages || 1);
      updateTaskCount();
    } catch (error) {
      console.error("error upload list tasks", error);
      setListTasks([]);
      enqueueSnackbar(showServerError(error), { variant: "error" });
    }
  };

  // Обновляем setFetchTasksRef при изменении viewMode
  useEffect(() => {
    if (setFetchTasksRef) {
      const fetchFunction = viewMode === "columns" ? fetchKanbanTasks : fetchListTasks;
      setFetchTasksRef(fetchFunction);
    }
  }, [setFetchTasksRef, viewMode, kanbanFilters, listFilters, listCurrentPage]);

  // Инициализация фильтров по умолчанию
  useEffect(() => {
    const defaultFilters = {
      created_for: [String(currentUserId)],
      group_titles: accessibleGroupTitles,
      workflows: workflowOptions,
      status: false,
    };
    
    if (!kanbanFilters) {
      setKanbanFilters(defaultFilters);
    }
    if (!listFilters) {
      setListFilters(defaultFilters);
    }
  }, [currentUserId, accessibleGroupTitles, workflowOptions]);

  // Загрузка данных при изменении фильтров или страницы
  useEffect(() => {
    if (viewMode === "columns" && kanbanFilters) {
      fetchKanbanTasks();
    } else if (viewMode === "list" && listFilters) {
      fetchListTasks();
    }
  }, [kanbanFilters, listFilters, listCurrentPage, viewMode]);

  const openEditTask = (task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  // Общая функция для обновления задач после создания/редактирования
  const handleTaskUpdate = () => {
    if (viewMode === "columns") {
      fetchKanbanTasks();
    } else {
      fetchListTasks();
    }
  };

  const hasActiveFilters = currentFilters
    ? Object.entries(currentFilters).some(([key, value]) => {
      if (key === "created_for") {
        const defaultCreatedFor = [String(currentUserId)];
        const filterCreatedFor = Array.isArray(value) ? value : [];
        return JSON.stringify(filterCreatedFor.sort()) !== JSON.stringify(defaultCreatedFor.sort());
      }
      
      // Проверка для массивов
      if (Array.isArray(value)) {
        return value.length > 0;
      }
      
      // Проверка для булевых значений (status)
      if (typeof value === "boolean") {
        // status: false - это значение по умолчанию, не считается активным фильтром
        // status: true - это активный фильтр
        return value === true;
      }
      
      // Проверка для других значений
      return value !== null && value !== undefined && value !== "";
    })
    : false;

  return (
    <Box h="100%" p="20px" style={{ display: 'flex', flexDirection: 'column' }}>
      <PageHeader
        title={translations["Tasks"][language]}
        count={currentTasks.length}
        extraInfo={
          <Group gap="sm">
            <ActionIcon
              size="36"
              variant={hasActiveFilters ? "filled" : "default"}
              onClick={() => setFilterModalOpen(true)}
            >
              <LuFilter size={16} />
            </ActionIcon>

            <SegmentedControl
              value={viewMode}
              onChange={setViewMode}
              data={[
                {
                  value: "columns",
                  label: (
                    <Tooltip label={translations["columnView"][language]}>
                      <span>
                        <TbLayoutKanbanFilled size={16} />
                      </span>
                    </Tooltip>
                  ),
                },
                {
                  value: "list",
                  label: (
                    <Tooltip label={translations["listView"][language]}>
                      <span>
                        <FaList size={16} />
                      </span>
                    </Tooltip>
                  ),
                },
              ]}
            />
            <TextInput
              placeholder={translations["searchTasksPlaceholder"][language]}
              value={searchInput}
              onChange={(e) => setSearchInput(e.currentTarget.value)}
              w={350}
              rightSection={
                searchInput ? (
                  <IoMdClose
                    size={16}
                    className="pointer"
                    onClick={() => setSearchInput("")}
                  />
                ) : null
              }
            />
          </Group>
        }
      />

      <Box style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        {viewMode === "list" ? (
          <TaskList
            tasks={listTasks}
            searchQuery={searchQuery}
            openEditTask={openEditTask}
            fetchTasks={fetchListTasks}
          />
        ) : (
          <TaskColumnsView tasks={kanbanTasks} onEdit={openEditTask} searchQuery={searchQuery} />
        )}
      </Box>

      {viewMode === "list" && listTotalPages > 1 && (
        <Flex
          pt={24}
          pb={24}
          justify="center"
          className="leads-table-pagination"
          style={{
            borderTop: "1px solid var(--crm-ui-kit-palette-border-primary)",
            backgroundColor: "var(--crm-ui-kit-palette-background-primary)"
          }}
        >
          <Pagination
            total={listTotalPages}
            value={listCurrentPage}
            onChange={setListCurrentPage}
          />
        </Flex>
      )}

      <TaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        fetchTasks={handleTaskUpdate}
        selectedTask={selectedTask}
        defaultCreatedBy={userId}
      />

      <TaskFilterModal
        opened={filterModalOpen}
        onClose={() => setFilterModalOpen(false)}
        filters={currentFilters || {}}
        onApply={(newFilters) => {
          if (viewMode === "columns") {
            setKanbanFilters(newFilters);
          } else {
            setListFilters(newFilters);
            setListCurrentPage(1);
          }
        }}
      />
    </Box>
  );
};

export default TaskComponent;
