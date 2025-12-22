import {
  Select,
  TextInput,
  Textarea,
  TagsInput,
  Box,
} from "@mantine/core";
import { useEffect, useContext, useRef, useMemo, useCallback } from "react";
import {
  priorityOptions,
  groupTitleOptions,
} from "../../FormOptions";
import { getLanguageByKey } from "../utils";
import { useGetTechniciansList } from "../../hooks";
import { parseTags } from "../../stringUtils";
import { UserContext } from "../../contexts/UserContext";
import { UserGroupMultiSelect } from "../ChatComponent/components/UserGroupMultiSelect/UserGroupMultiSelect";
import { formatMultiSelectData } from "../utils/multiSelectUtils";
import {
  workflowOptionsByGroupTitle,
  workflowOptionsLimitedByGroupTitle,
  TikTokworkflowOptionsByGroupTitle,
} from "../utils/workflowUtils";
import { WorkflowSelect } from "../Workflow/components/WorkflowSelect";

const FINAL_WORKFLOWS = ["Realizat cu succes", "Închis și nerealizat"];

// Стили вынесены за пределы компонента
const boxStyle = { borderRadius: 8 };
const errorStyle = { color: "red", fontSize: "12px", marginTop: "4px" };

export const GeneralForm = ({ data, formInstance }) => {
  const { technicians } = useGetTechniciansList();
  const { accessibleGroupTitles, isAdmin, userGroups } = useContext(UserContext);

  // Флаг, чтобы один раз инициализировать форму из data
  const isInitializedRef = useRef(false);

  // Реактивные значения формы
  const { group_title, workflow, technician_id } = formInstance.values;

  // --- ИНИЦИАЛИЗАЦИЯ ИЗ data ---
  useEffect(() => {
    if (data && !isInitializedRef.current) {
      formInstance.setValues({
        technician_id: data.technician_id ? `${data.technician_id}` : undefined,
        tags: parseTags(data.tags),
        workflow: data.workflow,
        priority: data.priority,
        contact: data.contact,
        group_title: data.group_title,
        description: data.description,
      });

      isInitializedRef.current = true;
    }
  }, [data, formInstance]);

  // --- MEMO ДЛЯ ТЕХНИКОВ И ГРУПП ---
  const formattedTechnicians = useMemo(
    () => formatMultiSelectData(technicians),
    [technicians]
  );

  const filteredGroupTitleOptions = useMemo(
    () => groupTitleOptions.filter((g) => accessibleGroupTitles.includes(g.value)),
    [accessibleGroupTitles]
  );

  // Определяем, находится ли пользователь в группе TikTok Manager
  const isTikTokManager = useMemo(
    () => userGroups?.some((group) => group.name === "TikTok Manager"),
    [userGroups]
  );

  // Получаем правильный workflowMap
  const workflowMap = useMemo(() => {
    if (isAdmin) return workflowOptionsByGroupTitle;
    if (isTikTokManager) return TikTokworkflowOptionsByGroupTitle;
    return workflowOptionsLimitedByGroupTitle;
  }, [isAdmin, isTikTokManager]);

  // Опции workflow по текущему group_title
  const filteredWorkflowOptions = useMemo(() => {
    if (!group_title) return [];
    return workflowMap[group_title] || workflowMap.Default || [];
  }, [group_title, workflowMap]);

  // Блокируем workflow, если он финальный и пользователь не админ
  const isWorkflowDisabled = useMemo(() => {
    return !isAdmin && FINAL_WORKFLOWS.includes(workflow);
  }, [workflow, isAdmin]);

  // Значение для UserGroupMultiSelect
  const technicianValue = useMemo(
    () => (technician_id ? [technician_id] : []),
    [technician_id]
  );

  // --- ОБРАБОТЧИКИ ---

  // Здесь и делаем нужный сброс workflow ТОЛЬКО при реальном изменении group_title
  const handleGroupTitleChange = useCallback(
    (value) => {
      const prev = formInstance.values.group_title;

      formInstance.setFieldValue("group_title", value);

      // Сбрасываем workflow, только если был старый group_title и он реально изменился
      if (prev && prev !== value) {
        formInstance.setFieldValue("workflow", undefined);
        formInstance.clearFieldError("workflow");
      }
    },
    [formInstance]
  );

  const handleWorkflowChange = useCallback(
    (value) => {
      formInstance.setFieldValue("workflow", value);
      formInstance.clearFieldError("workflow");
    },
    [formInstance]
  );

  const handleTechnicianChange = useCallback(
    (value) => {
      formInstance.setFieldValue("technician_id", value[0] || undefined);
      formInstance.clearFieldError("technician_id");
    },
    [formInstance]
  );

  return (
    <Box
      bg="var(--crm-ui-kit-palette-background-primary-disabled)"
      p="md"
      style={boxStyle}
    >
      <Select
        label={getLanguageByKey("Grup")}
        placeholder={getLanguageByKey("selectGroup")}
        data={filteredGroupTitleOptions}
        searchable
        required
        clearable
        key={formInstance.key("group_title")}
        value={group_title}
        onChange={handleGroupTitleChange}
        error={formInstance.errors.group_title}
        mb="md"
      />

      <Box mt="md">
        <WorkflowSelect
          label={getLanguageByKey("Workflow")}
          placeholder={getLanguageByKey("Selectează flux de lucru")}
          workflowOptions={filteredWorkflowOptions}
          value={workflow}
          onChange={handleWorkflowChange}
          disabled={isWorkflowDisabled}
        />
        {formInstance.errors.workflow && (
          <div style={errorStyle}>{formInstance.errors.workflow}</div>
        )}
      </Box>

      <Box mt="md">
        <UserGroupMultiSelect
          label={`${getLanguageByKey("Responsabil")} *`}
          placeholder={getLanguageByKey("Selectează responsabil")}
          value={technicianValue}
          onChange={handleTechnicianChange}
          techniciansData={formattedTechnicians}
          mode="single"
        />
        {formInstance.errors.technician_id && (
          <div style={errorStyle}>{formInstance.errors.technician_id}</div>
        )}
      </Box>

      <Select
        disabled
        mt="md"
        label={getLanguageByKey("Prioritate")}
        placeholder={getLanguageByKey("Selectează prioritate")}
        data={priorityOptions}
        clearable
        searchable
        key={formInstance.key("priority")}
        {...formInstance.getInputProps("priority")}
      />

      <TextInput
        mt="md"
        label={getLanguageByKey("Contact")}
        placeholder={getLanguageByKey("Selectează contact")}
        key={formInstance.key("contact")}
        {...formInstance.getInputProps("contact")}
      />

      <TagsInput
        mt="md"
        label={getLanguageByKey("Tag-uri")}
        placeholder={getLanguageByKey("Introdu tag-uri separate prin virgule")}
        key={formInstance.key("tags")}
        {...formInstance.getInputProps("tags")}
      />

      <Textarea
        mt="md"
        label={getLanguageByKey("Descriere")}
        placeholder={getLanguageByKey("Descriere")}
        minRows={4}
        autosize
        key={formInstance.key("description")}
        {...formInstance.getInputProps("description")}
      />
    </Box>
  );
};
