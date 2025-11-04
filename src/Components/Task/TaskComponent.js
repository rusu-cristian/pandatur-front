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
  tasks = [],
  setTasks,
  setFetchTasksRef,
}) => {
  const { userId: currentUserId } = useUser();
  const { accessibleGroupTitles, workflowOptions } = useContext(AppContext);

  const [filters, setFilters] = useState(null);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [viewMode, setViewMode] = useState("columns");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const fetchTasks = async (appliedFilters = filters) => {
    if (!appliedFilters) return;
    try {
      const res = await api.task.filterTasks({
        ...appliedFilters,
        page: currentPage,
        sort_by: "scheduled_time",
        paginated: false
      });

      setTasks?.(Array.isArray(res?.data) ? res.data : []);
      setTotalPages(res?.pagination?.total_pages || 1);
      updateTaskCount();
    } catch (error) {
      console.error("error upload tasks", error);
      setTasks([]);
      enqueueSnackbar(showServerError(error), { variant: "error" });
    }
  };

  useEffect(() => {
    if (setFetchTasksRef) setFetchTasksRef(fetchTasks);
  }, [setFetchTasksRef, fetchTasks]);

  useEffect(() => {
    fetchTasks();
  }, [filters, currentPage]);

  useEffect(() => {
    const defaultFilters = {
      created_for: [String(currentUserId)],
      group_titles: accessibleGroupTitles,
      workflows: workflowOptions,
      status: false,
    };
    setFilters(defaultFilters);
  }, [currentUserId, accessibleGroupTitles, workflowOptions]);

  const openEditTask = (task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const hasActiveFilters = filters
    ? Object.entries(filters).some(([key, value]) => {
      if (key === "created_for") {
        return JSON.stringify(value) !== JSON.stringify([String(currentUserId)]);
      }
      return value && value.length > 0;
    })
    : false;

  return (
    <Box h="100%" p="20px" style={{ display: 'flex', flexDirection: 'column' }}>
      <PageHeader
        title={translations["Tasks"][language]}
        count={tasks.length}
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
                // {
                //   value: "list",
                //   label: (
                //     <Tooltip label={translations["listView"][language]}>
                //       <span>
                //         <FaList size={16} />
                //       </span>
                //     </Tooltip>
                //   ),
                // }
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
            tasks={tasks}
            searchQuery={searchQuery}
            openEditTask={openEditTask}
            fetchTasks={fetchTasks}
          />
        ) : (
          <TaskColumnsView tasks={tasks} onEdit={openEditTask} searchQuery={searchQuery} />
        )}
      </Box>

      {viewMode === "list" && totalPages > 1 && (
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
            total={totalPages}
            value={currentPage}
            onChange={setCurrentPage}
          />
        </Flex>
      )}

      <TaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        fetchTasks={fetchTasks}
        selectedTask={selectedTask}
        defaultCreatedBy={userId}
      />

      <TaskFilterModal
        opened={filterModalOpen}
        onClose={() => setFilterModalOpen(false)}
        filters={filters || {}}
        onApply={(newFilters) => {
          setFilters(newFilters);
          setCurrentPage(1);
        }}
      />
    </Box>
  );
};

export default TaskComponent;
