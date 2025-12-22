import { useState, useEffect, useContext, useCallback, useRef, startTransition } from "react";
import {
  Paper, Text, Box, Group, Stack, Card, Divider, Collapse,
  TextInput, Button, ActionIcon, Loader, Center, Badge
} from "@mantine/core";
import { FaChevronDown, FaChevronUp, FaTrash, FaCheck, FaPencil } from "react-icons/fa6";
import { formatTasksToEdits, sortTasksByDate } from "../utils/taskUtils";
import { translations } from "../utils/translations";
import { api } from "../../api";
import { TypeTask } from "./OptionsTaskType";
import { formatDate } from "../utils/date";
import DateQuickInput from "./Components/DateQuickPicker";
import { useGetTechniciansList, useUser, useConfirmPopup } from "../../hooks";
import IconSelect from "../IconSelect/IconSelect";
import { useSnackbar } from "notistack";
import dayjs from "dayjs";
import Can from "../CanComponent/Can";
import { SocketContext } from "../../contexts/SocketContext";
import { UserGroupMultiSelect } from "../ChatComponent/components/UserGroupMultiSelect/UserGroupMultiSelect";
import { hasPermission } from "../utils/permissions";
import { convertRolesToMatrix, safeParseJson } from "../UsersComponent/rolesUtils";

// Цвета для статусов задач (те же, что в TicketCard.jsx)
const TASK_STATUS_COLORS = {
  none: '#FF9800',      // оранжевый
  overdue: '#F44336',   // красный
  today: '#388E3C',    // зеленый
  upcoming: '#0288D1', // синий
};

// Функция для определения цвета задачи на основе даты
const getTaskDateColor = (date) => {
  if (!date) return TASK_STATUS_COLORS.none;

  const taskDate = toDate(date);
  if (!taskDate) return TASK_STATUS_COLORS.none;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const taskDay = new Date(taskDate);
  taskDay.setHours(0, 0, 0, 0);

  if (taskDay < today) {
    return TASK_STATUS_COLORS.overdue; // Просроченные - красный
  }
  if (taskDay.getTime() === today.getTime()) {
    return TASK_STATUS_COLORS.today; // Сегодня - зеленый
  }
  return TASK_STATUS_COLORS.upcoming; // Предстоящие - синий
};

// Функция для определения цвета badge в зависимости от задач
const getTasksBadgeColor = (tasks = []) => {
  if (!tasks || tasks.length === 0) return TASK_STATUS_COLORS.none;

  const today = dayjs().startOf("day");

  // Проверяем на просроченные задачи
  const hasOverdue = tasks.some((task) => {
    const d = toDate(task?.scheduled_time);
    return d && dayjs(d).isBefore(today, "day");
  });
  if (hasOverdue) return TASK_STATUS_COLORS.overdue;

  // Проверяем на задачи на сегодня
  const hasToday = tasks.some((task) => {
    const d = toDate(task?.scheduled_time);
    return d && dayjs(d).isSame(today, "day");
  });
  if (hasToday) return TASK_STATUS_COLORS.today;

  // Проверяем на предстоящие задачи
  const hasUpcoming = tasks.some((task) => {
    const d = toDate(task?.scheduled_time);
    return d && dayjs(d).isAfter(today, "day");
  });
  if (hasUpcoming) return TASK_STATUS_COLORS.upcoming;

  return TASK_STATUS_COLORS.none;
};

const language = localStorage.getItem("language") || "RO";

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

const TaskListOverlay = ({ ticketId, creatingTask, setCreatingTask }) => {
  const [tasks, setTasks] = useState([]);
  const [expandedCard, setExpandedCard] = useState(null);
  const [listCollapsed, setListCollapsed] = useState(true);
  const [taskEdits, setTaskEdits] = useState({});
  const [editMode, setEditMode] = useState({});
  const { technicians: users } = useGetTechniciansList();
  const { userId, user, teamUserIds } = useUser();
  const { enqueueSnackbar } = useSnackbar();
  const [originalTaskValues, setOriginalTaskValues] = useState({});
  const { onEvent } = useContext(SocketContext);

  // Проверяем права на создание задач и определяем, нужно ли фильтровать по команде
  const rawRoles = safeParseJson(user?.roles || "[]");
  const matrix = convertRolesToMatrix(rawRoles);
  const taskCreateLevel = matrix["TASK_CREATE"];
  const isTeamLevel = taskCreateLevel === "Team";

  // Если у пользователя права уровня "Team", ограничиваем выбор только участниками команды
  const allowedUserIdsForCreate = isTeamLevel && teamUserIds
    ? new Set([...teamUserIds, String(userId)])
    : null;

  const [listLoading, setListLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const skipNextSocketRef = useRef(false);

  const confirmDelete = useConfirmPopup({
    subTitle: translations["Confirmare ștergere"][language],
  });

  const fetchTasks = useCallback(
    async ({ idOverride, silent } = {}) => {
      const qId = Number(idOverride ?? ticketId);
      if (!qId) { setTasks([]); return; }

      if (!silent) setListLoading(true);
      try {
        const res = await api.task.getTaskByTicket(qId);
        const list = Array.isArray(res?.data) ? res.data : res;
        const taskArray = sortTasksByDate(list.filter(t => Number(t.ticket_id) === qId && !t.status));

        startTransition(() => {
          setTasks(taskArray);
          const edits = formatTasksToEdits(taskArray);
          setTaskEdits((prev) => ({ ...edits, ...(prev.new ? { new: prev.new } : {}) }));
        });
      } catch (error) {
        console.error("Error loading tasks", error);
        setTasks([]);
      } finally {
        if (!silent) setListLoading(false);
      }
    },
    [ticketId]
  );

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  useEffect(() => {
    if (!onEvent) return;
    const handler = (evt) => {
      const fromSocket = Number(evt?.data?.ticket_id ?? evt?.data?.ticketId);
      if (!fromSocket || Number(fromSocket) !== Number(ticketId)) return;
      if (skipNextSocketRef.current) {
        skipNextSocketRef.current = false;
        return;
      }
      fetchTasks({ idOverride: fromSocket, silent: true });
    };
    const unsub = onEvent("task", handler);
    return () => { typeof unsub === "function" && unsub(); };
  }, [onEvent, ticketId, fetchTasks]);

  useEffect(() => {
    if (creatingTask) {
      setListCollapsed(false);
      setTaskEdits((prev) => ({
        ...prev,
        new: {
          task_type: "",
          scheduled_time: dayjs().add(1, "day").toDate(),
          created_for: userId?.toString() || "",
          created_by: userId?.toString() || "",
          description: "",
        },
      }));
    }
  }, [creatingTask, userId]);

  useEffect(() => {
    setTaskEdits((prev) => {
      const preservedNew = prev.new;
      const updated = {};
      tasks.forEach((t) => {
        updated[t.id] = {
          task_type: t.task_type,
          scheduled_time: toDate(t.scheduled_time),
          created_for: String(t.created_for),
          created_by: String(t.created_by),
          description: t.description || "",
        };
      });
      return { ...updated, ...(preservedNew ? { new: preservedNew } : {}) };
    });
  }, [tasks]);

  const updateTaskField = (id, field, value) => {
    setTaskEdits((prev) => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  };

  const handleUpdateTask = async (taskId) => {
    const changes = taskEdits[taskId];
    if (!changes) return;
    setActionLoading(true);
    try {
      skipNextSocketRef.current = true;
      await api.task.update({ id: taskId, ...changes, scheduled_time: formatDate(changes.scheduled_time) });
      enqueueSnackbar(translations["taskUpdated"][language], { variant: "success" });
      setEditMode((prev) => ({ ...prev, [taskId]: false }));
      await fetchTasks({ silent: true });
    } catch {
      enqueueSnackbar(translations["errorUpdatingTask"][language], { variant: "error" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateTask = async () => {
    const newTask = taskEdits["new"];
    if (!newTask?.task_type || !newTask?.created_for || !newTask?.scheduled_time || !newTask?.created_by) {
      enqueueSnackbar(translations["completeAllFields"][language], { variant: "warning" });
      return;
    }
    setActionLoading(true);
    try {
      skipNextSocketRef.current = true;
      await api.task.create({
        ...newTask,
        description: newTask.description || "",
        scheduled_time: formatDate(newTask.scheduled_time),
        ticket_id: ticketId,
        priority: "",
        status_task: "",
        status: "false",
      });
      enqueueSnackbar(translations["taskAdded"][language], { variant: "success" });
      setCreatingTask(false);
      await fetchTasks({ silent: true });
    } catch {
      enqueueSnackbar(translations["errorAddingTask"][language], { variant: "error" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteTask = (id) => {
    confirmDelete(async () => {
      setActionLoading(true);
      try {
        skipNextSocketRef.current = true;

        setTasks((prev) => prev.filter((t) => t.id !== id));
        setTaskEdits((prev) => {
          const { [id]: _drop, ...rest } = prev;
          return rest;
        });

        await api.task.delete({ id });
        enqueueSnackbar(translations["taskDeleted"][language], { variant: "success" });

        await fetchTasks({ silent: true });
      } catch {
        enqueueSnackbar(translations["errorDeletingTask"][language], { variant: "error" });
        await fetchTasks({ silent: false });
      } finally {
        setActionLoading(false);
      }
    });
  };

  const handleMarkDone = async (id) => {
    setActionLoading(true);
    try {
      skipNextSocketRef.current = true;

      setTasks((prev) => prev.filter((t) => t.id !== id));

      await api.task.update({ id, status: true });
      enqueueSnackbar(translations["taskCompleted"][language], { variant: "success" });
      await fetchTasks({ silent: true });
    } catch {
      enqueueSnackbar(translations["errorCompletingTask"][language], { variant: "error" });
      await fetchTasks({ silent: false });
    } finally {
      setActionLoading(false);
    }
  };

  const getTaskIcon = (type) => TypeTask.find((t) => t.name === type)?.icon || null;

  const handleCancelEdit = (id) => {
    if (originalTaskValues[id]) {
      setTaskEdits((prev) => ({ ...prev, [id]: { ...originalTaskValues[id] } }));
    }
    setEditMode((prev) => ({ ...prev, [id]: false }));
  };

  const toggleList = useCallback(() => setListCollapsed((p) => !p), []);

  const renderTaskForm = (id, isNew = false, currentUserId, userGroups) => {
    const isEditing = isNew || editMode[id];
    const responsibleId = String(taskEdits[id]?.created_for);
    const isSameTeam = Array.isArray(userGroups) && userGroups.some(group =>
      Array.isArray(group.users) && group.users.map(String).includes(responsibleId)
    );

    return (
      <Card withBorder radius="md" p="sm" key={id}>
        {!isNew && (
          <Box onClick={() => setExpandedCard(expandedCard === id ? null : id)} style={{ cursor: "pointer" }}>
            <Group justify="space-between" align="center">
              <Group gap="xs">
                {getTaskIcon(taskEdits[id]?.task_type)}
                <Text fw={500}>
                  {taskEdits[id]?.task_type}
                  {!isNew && id && (
                    <Text span size="sm" ml={6} style={{ fontWeight: 400, color: "var(--crm-ui-kit-palette-text-secondary-light)" }}>
                      #{id}
                    </Text>
                  )}
                </Text>
              </Group>
              <Group gap="xs">
                <text size="sm" style={{ color: getTaskDateColor(taskEdits[id]?.scheduled_time) }}>
                  {taskEdits[id]?.scheduled_time ? formatDate(taskEdits[id].scheduled_time) : ""}{" "}
                  {tasks.find((t) => t.id === id)?.created_for_full_name}
                </text>
                {expandedCard === id ? <FaChevronUp size={14} /> : <FaChevronDown size={14} />}
              </Group>
            </Group>
          </Box>
        )}

        <Collapse in={isNew ? creatingTask : expandedCard === id}>
          {!isNew && <Divider my="sm" />}

          <Group gap="xs" align="end">
            <IconSelect
              options={TypeTask}
              value={taskEdits[id]?.task_type}
              onChange={(value) => updateTaskField(id, "task_type", value)}
              label={translations["Alege tip task"][language]}
              disabled={!isEditing || actionLoading}
              required
            />
            <DateQuickInput
              value={taskEdits[id]?.scheduled_time}
              onChange={(value) => updateTaskField(id, "scheduled_time", value)}
              disabled={!isEditing || actionLoading}
            />
            <UserGroupMultiSelect
              techniciansData={users}
              value={taskEdits[id]?.created_by ? [String(taskEdits[id].created_by)] : []}
              onChange={(values) => updateTaskField(id, "created_by", values[0] || "")}
              mode="single"
              label={translations["Autor"][language]}
              // placeholder={translations["Autor"][language]}
              disabled={!isEditing || actionLoading}
              allowedUserIds={isNew && allowedUserIdsForCreate ? allowedUserIdsForCreate : null}
            />
            <UserGroupMultiSelect
              techniciansData={users}
              value={taskEdits[id]?.created_for ? [String(taskEdits[id].created_for)] : []}
              onChange={(values) => updateTaskField(id, "created_for", values[0] || "")}
              mode="single"
              label={translations["Responsabil"][language]}
              // placeholder={translations["Responsabil"][language]}
              disabled={!isEditing || actionLoading}
              allowedUserIds={isNew && allowedUserIdsForCreate ? allowedUserIdsForCreate : null}
            />
            <TextInput
              label={translations["Comentariu"][language]}
              placeholder={translations["Comentariu"][language]}
              value={taskEdits[id]?.description || ""}
              onChange={(e) => updateTaskField(id, "description", e.currentTarget.value)}
              w="100%"
              disabled={actionLoading}
            />
          </Group>

          <Group gap="xs" mt="md">
            {isNew ? (
              <>
                <Button size="xs" onClick={handleCreateTask} loading={actionLoading}>
                  {translations["Adaugă task"][language]}
                </Button>
                <Button size="xs" variant="outline" onClick={() => setCreatingTask(false)} disabled={actionLoading}>
                  {translations["Anulare"][language]}
                </Button>
              </>
            ) : isEditing ? (
              <>
                <Button size="xs" onClick={() => handleUpdateTask(id)} variant="filled" loading={actionLoading}>
                  {translations["Save"][language]}
                </Button>
                <Button size="xs" variant="outline" onClick={() => handleCancelEdit(id)} disabled={actionLoading}>
                  {translations["Anulare"][language]}
                </Button>
              </>
            ) : (
              <>
                <Can permission={{ module: "TASK", action: "EDIT" }} context={{ responsibleId, currentUserId: userId, isSameTeam }}>
                  <Button
                    size="xs"
                    variant="filled"
                    color="green"
                    onClick={() => handleMarkDone(id)}
                    leftSection={<FaCheck />}
                    loading={actionLoading}
                  >
                    {translations["Done"][language]}
                  </Button>
                  <Button
                    size="xs"
                    variant="light"
                    bg="var(--mantine-color-orange-6) !important"
                    onClick={() => {
                      const original = tasks.find((t) => t.id === id);
                      if (original) {
                        setOriginalTaskValues((prev) => ({
                          ...prev,
                          [id]: {
                            task_type: original.task_type,
                            scheduled_time: toDate(original.scheduled_time),
                            created_for: String(original.created_for),
                            created_by: String(original.created_by),
                            description: original.description || "",
                          },
                        }));
                      }
                      setEditMode((prev) => ({ ...prev, [id]: true }));
                    }}
                    leftSection={<FaPencil />}
                    disabled={actionLoading}
                  >
                    {translations["Editare Task"][language]}
                  </Button>
                </Can>

                <Can permission={{ module: "TASK", action: "DELETE" }} context={{ responsibleId, currentUserId: userId, isSameTeam }}>
                  <Button
                    size="xs"
                    variant="subtle"
                    bg="var(--mantine-color-red-6) !important"
                    onClick={() => handleDeleteTask(id)}
                    leftSection={<FaTrash />}
                    loading={actionLoading}
                  >
                    {translations["Șterge"][language]}
                  </Button>
                </Can>
              </>
            )}
          </Group>
        </Collapse>
      </Card>
    );
  };

  const isVisible = creatingTask || tasks.length > 0;
  if (!isVisible) return null;

  return (
    <Box pos="relative" p="xs" w="100%" style={{ border: "1px solid var(--crm-ui-kit-palette-border-primary)" }}>
      <Paper radius="md">
        <Box
          onClick={toggleList}
          role="button"
          aria-expanded={!listCollapsed}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleList(); }
          }}
          style={{ cursor: "pointer" }}
          p="xs"
        >
          <Group justify="space-between" align="center">
            <Group gap="sm">
              <Text fw={600} size="md" style={{ color: "var(--crm-ui-kit-palette-text-primary)" }}>
                {translations["Tasks"][language]}
              </Text>
              {tasks.length > 0 && (
                <Badge
                  size="lg"
                  style={{
                    backgroundColor: getTasksBadgeColor(tasks),
                    color: "#ffffff"
                  }}
                >
                  {tasks.length}
                </Badge>
              )}
            </Group>
            <Group gap="xs" onClick={(e) => e.stopPropagation()}>
              <ActionIcon
                variant="light"
                onClick={(e) => { e.stopPropagation(); toggleList(); }}
              >
                {listCollapsed ? <FaChevronDown size={16} /> : <FaChevronUp size={16} />}
              </ActionIcon>
              {listLoading && <Loader size="sm" />}
            </Group>
          </Group>
        </Box>

        <Collapse in={!listCollapsed}>
          <Box p="md" pt={0}>
            {listLoading && tasks.length === 0 && (
              <Center my="md"><Loader /></Center>
            )}

            {!listLoading && tasks.length > 0 && (
              <Stack spacing="xs" mt="xs">
                {tasks.map((task) => renderTaskForm(task.id))}
              </Stack>
            )}

            {creatingTask && (
              <Stack spacing="xs" mt="xs">
                {renderTaskForm("new", true)}
              </Stack>
            )}
          </Box>
        </Collapse>
      </Paper>
    </Box>
  );
};

export default TaskListOverlay;
