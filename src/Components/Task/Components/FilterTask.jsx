import { useContext, useState, useEffect, useMemo, useRef } from "react";
import { Group, Button, Flex, MultiSelect, Select, Modal, Text } from "@mantine/core";
import { translations, showServerError } from "../../utils";
import { DateRangePicker } from "../../DateRangePicker/DateRangePicker";
import { TypeTask } from "../OptionsTaskType";
import { useGetTechniciansList, useUser } from "../../../hooks";
import dayjs from "dayjs";
import { api } from "../../../api";
import { useSnackbar } from "notistack";
import { WorkflowMultiSelect } from "../../Workflow/components/WorkflowMultiSelect";
import { groupTitleOptions } from "../../../FormOptions";
import { convertRolesToMatrix, safeParseJson } from "../../UsersComponent/rolesUtils";
import { UserContext } from "../../../contexts/UserContext";
import { formatMultiSelectData } from "../../utils/multiSelectUtils";
import { UserGroupMultiSelect } from "../../ChatComponent/components/UserGroupMultiSelect/UserGroupMultiSelect";

const language = localStorage.getItem("language") || "RO";

const taskTypeOptions = TypeTask.map((task) => ({
  value: task.name,
  label: task.name,
}));

const TaskFilterModal = ({ opened, onClose, filters, onApply }) => {
  const [localFilters, setLocalFilters] = useState({});
  const { technicians, loading: loadingTechnicians } = useGetTechniciansList();
  const { userId, user, teamUserIds } = useUser();
  const [groupOptions, setGroupOptions] = useState([]);
  const { enqueueSnackbar } = useSnackbar();
  const rolesMatrix = convertRolesToMatrix(safeParseJson(user?.roles || "[]"));
  const taskViewLevel = rolesMatrix["TASK_VIEW"];
  const isIfResponsible = taskViewLevel === "IfResponsible";
  const isTeam = taskViewLevel === "Team";
  const isAllowed = taskViewLevel === "Allowed";
  const teamTechnicians = technicians.filter((tech) =>
    teamUserIds.has(String(tech.value)) || tech.value === String(userId)
  );

  // Ref для отслеживания предыдущих значений, чтобы избежать бесконечных циклов
  const prevCreatedForRef = useRef(null);

  const { workflowOptions, accessibleGroupTitles } = useContext(UserContext);

  const allowedGroupTitleOptions = groupTitleOptions.filter((g) =>
    accessibleGroupTitles.includes(g.value)
  );

  useEffect(() => {
    if (opened) {
      const defaultFilters = {
        ...filters,
        created_for:
          isAllowed || filters.created_for?.length
            ? filters.created_for
            : [String(userId)],
        status: filters.status === undefined ? false : filters.status,
        group_titles: filters.group_titles || [],
      };
      setLocalFilters(defaultFilters);
      // Убираем onApply отсюда - он будет вызываться только при Apply/Clear
    }
  }, [opened, filters, isAllowed, userId]);

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const data = await api.user.getGroupsList();
        const options = data.map((group) => ({
          value: group.name,
          label: group.name,
        }));
        setGroupOptions(options);
      } catch (error) {
        enqueueSnackbar(showServerError(error), { variant: "error" });
      }
    };
    fetchGroups();
  }, [enqueueSnackbar]);

  const handleChange = (field, value) => {
    setLocalFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleClear = () => {
    const defaultFilters = {
      created_for: [String(userId)],
      status: false,
      group_titles: [],
    };
    setLocalFilters(defaultFilters);
    onApply(defaultFilters);
  };

  const cleanFilters = (filters) => {
    return Object.fromEntries(
      Object.entries(filters).filter(
        ([_, value]) =>
          !(Array.isArray(value) && value.length === 0) &&
          value !== null &&
          value !== "",
      ),
    );
  };

  const handleApply = () => {
    const cleaned = cleanFilters(localFilters);
    onApply(cleaned);
    onClose();
  };

  // Мемоизируем значение дат для DateRangePicker
  const dateRangeValue = useMemo(() => {
    const dateFrom = localFilters.date_from;
    const dateTo = localFilters.date_to;

    if (dateFrom && dateTo) {
      const parsedFrom = dayjs(dateFrom, "DD-MM-YYYY", true);
      const parsedTo = dayjs(dateTo, "DD-MM-YYYY", true);

      // Проверяем, что даты валидны
      if (parsedFrom.isValid() && parsedTo.isValid()) {
        return [parsedFrom.toDate(), parsedTo.toDate()];
      }
    }
    // Если есть только первая дата, возвращаем её с null для второй
    if (dateFrom) {
      const parsedFrom = dayjs(dateFrom, "DD-MM-YYYY", true);
      if (parsedFrom.isValid()) {
        return [parsedFrom.toDate(), null];
      }
    }
    return [];
  }, [localFilters.date_from, localFilters.date_to]);

  const handleDateRangeChange = (range) => {
    // DateRangePicker передает массив дат или null/undefined
    if (!range || (Array.isArray(range) && range.length === 0)) {
      // Если диапазон очищен
      setLocalFilters((prev) => ({
        ...prev,
        date_from: null,
        date_to: null,
      }));
      return;
    }

    if (Array.isArray(range)) {
      const [startDate, endDate] = range;

      // Обновляем оба значения за один раз, чтобы избежать лишних ре-рендеров
      setLocalFilters((prev) => {
        if (startDate && endDate) {
          // Если выбраны обе даты
          return {
            ...prev,
            date_from: dayjs(startDate).format("DD-MM-YYYY"),
            date_to: dayjs(endDate).format("DD-MM-YYYY"),
          };
        } else if (startDate && !endDate) {
          // Выбрана только первая дата - сохраняем её, date_to оставляем как есть
          // Это позволяет DateRangePicker правильно отобразить выбранную первую дату
          return {
            ...prev,
            date_from: dayjs(startDate).format("DD-MM-YYYY"),
            // Не трогаем date_to, чтобы не сбрасывать выбор
          };
        } else {
          // Массив пустой или обе даты null
          return {
            ...prev,
            date_from: null,
            date_to: null,
          };
        }
      });
    } else {
      // Если передан не массив (не должно быть, но на всякий случай)
      setLocalFilters((prev) => ({
        ...prev,
        date_from: null,
        date_to: null,
      }));
    }
  };

  useEffect(() => {
    if (isTeam) {
      const validIds = new Set(teamTechnicians.map(t => t.value));
      const selected = localFilters.created_for || [];
      const currentCreatedFor = JSON.stringify(selected);

      // Проверяем, изменились ли значения с последнего раза
      if (prevCreatedForRef.current === currentCreatedFor) {
        return; // Ничего не изменилось, выходим
      }

      const filtered = selected.filter((id) => validIds.has(id));

      // Предотвращаем бесконечный цикл: проверяем, нужно ли обновление
      if (filtered.length === 0 && selected.length > 0) {
        // Если нет валидных ID, но есть выбранные - сбрасываем на userId
        const newValue = [String(userId)];
        setLocalFilters(prev => ({ ...prev, created_for: newValue }));
        prevCreatedForRef.current = JSON.stringify(newValue);
      } else if (filtered.length !== selected.length && filtered.length > 0) {
        // Если количество изменилось - обновляем на отфильтрованные
        setLocalFilters(prev => ({ ...prev, created_for: filtered }));
        prevCreatedForRef.current = JSON.stringify(filtered);
      } else {
        // Обновляем ref даже если не меняем значение
        prevCreatedForRef.current = currentCreatedFor;
      }
    }
  }, [isTeam, localFilters.created_for, teamTechnicians, userId]);

  const formattedTechnicians = useMemo(() => formatMultiSelectData(technicians), [technicians]);

  const handleCreatedForChange = (val) => {
    // UserGroupMultiSelect уже обрабатывает логику групп внутри себя
    // Просто передаем выбранные значения, но проверяем изменения для оптимизации
    const current = localFilters.created_for || [];

    // Обновляем только если значения действительно изменились
    if (val.length !== current.length || !val.every(id => current.includes(id))) {
      handleChange("created_for", val);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={translations["Filtru"][language]}
      withCloseButton
      centered
      size="lg"
      closeOnClickOutside={false}
      styles={{
        content: {
          height: "700px",
          display: "flex",
          flexDirection: "column",
          zIndex: 200,
        },
        body: {
          flex: 1,
          overflowY: "auto",
          padding: "1rem"
        },
        title: {
          color: "var(--crm-ui-kit-palette-text-primary)"
        }
      }}
    >
      <Flex direction="column" style={{ height: "100%" }}>
        <Flex gap="sm" direction="column" style={{ flex: 1, overflowY: "auto" }}>
          <div>
            <Text size="sm" fw={500} mb={4}>
              {translations["intervalDate"][language]}
            </Text>
            <DateRangePicker
              value={dateRangeValue}
              onChange={handleDateRangeChange}
              isClearable={true}
              dateFormat="dd-MM-yyyy"
              placeholder={translations["intervalDate"][language]}
            />
          </div>
          
          <MultiSelect
            label={translations["groupTitle"][language]}
            placeholder={translations["groupTitle"][language]}
            data={allowedGroupTitleOptions}
            value={localFilters.group_titles?.length ? localFilters.group_titles : accessibleGroupTitles}
            onChange={(val) =>
              handleChange(
                "group_titles",
                val.length > 0 ? val : accessibleGroupTitles
              )
            }
            clearable={false}
            searchable
            disabled={accessibleGroupTitles.length === 1}
          />

          <WorkflowMultiSelect
            label={translations["Workflow"]?.[language] || "Workflow"}
            placeholder={translations["Alege workflow pentru afisare in sistem"]?.[language] || "Alege workflow pentru afisare in sistem"}
            workflowOptions={workflowOptions || []}
            value={localFilters.workflows || []}
            onChange={(val) => handleChange("workflows", val)}
            selectAllLabel={translations["selectAll"]?.[language] || "Selectează tot"}
            clearable
          />

          <MultiSelect
            label={translations["Autor"][language]}
            data={technicians}
            value={localFilters.created_by || []}
            onChange={(val) => handleChange("created_by", val)}
            placeholder={translations["Autor"][language]}
            clearable
            searchable
            nothingFoundMessage={translations["noResult"][language]}
            disabled={loadingTechnicians}
          />

          <UserGroupMultiSelect
            label={translations["Responsabil"][language]}
            techniciansData={formattedTechnicians}
            value={
              isIfResponsible
                ? [String(userId)]
                : localFilters.created_for || []
            }
            onChange={handleCreatedForChange}
            placeholder={translations["Responsabil"][language]}
            mode="multi"
            // Добавляем фильтрацию по ролям
            allowedUserIds={
              isTeam
                ? new Set([...teamUserIds, String(userId)])
                : isIfResponsible
                  ? new Set([String(userId)])
                  : null
            }
            disabled={loadingTechnicians || isIfResponsible}
          />

          <MultiSelect
            label={translations["Tipul Taskului"][language]}
            data={taskTypeOptions}
            value={localFilters.task_type || []}
            onChange={(val) => handleChange("task_type", val)}
            placeholder={translations["Tipul Taskului"][language]}
            clearable
            searchable
          />

          <MultiSelect
            label={translations["Alege grupul"][language]}
            placeholder={translations["Alege grupul"][language]}
            data={groupOptions}
            value={localFilters.user_group_names || []}
            onChange={(val) => handleChange("user_group_names", val)}
            clearable
            searchable
            nothingFoundMessage={translations["noResult"][language]}
          />

          <Select
            label={translations["Status"][language]}
            placeholder={translations["ChoiseStatus"][language]}
            data={[
              { value: "true", label: translations["done"][language] },
              { value: "false", label: translations["toDo"][language] },
            ]}
            value={
              typeof localFilters.status === "boolean"
                ? String(localFilters.status)
                : localFilters.status || null
            }
            onChange={(val) =>
              handleChange(
                "status",
                val === "true" ? true : val === "false" ? false : null,
              )
            }
            clearable
          />
        </Flex>

        <Group pt={16} pb={8} justify="flex-end" style={{ borderTop: "1px solid var(--mantine-color-gray-3)" }}>
          <Button variant="outline" onClick={handleClear}>
            {translations["Reset filtru"][language]}
          </Button>
          <Button onClick={handleApply}>
            {translations["Aplică"][language]}
          </Button>
        </Group>
      </Flex>
    </Modal>
  );
};

export default TaskFilterModal;
