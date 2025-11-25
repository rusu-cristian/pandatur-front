import {
  Select,
  TextInput,
  Textarea,
  TagsInput,
  Box,
} from "@mantine/core";
import { useEffect, useRef, useMemo, useState } from "react";
import {
  priorityOptions,
  groupTitleOptions,
} from "../../FormOptions";
import { getLanguageByKey } from "../utils";
import { useGetTechniciansList, useUser } from "../../hooks";
import { parseTags } from "../../stringUtils";
import { UserGroupMultiSelect } from "../ChatComponent/components/UserGroupMultiSelect/UserGroupMultiSelect";
import { formatMultiSelectData } from "../utils/multiSelectUtils";
import {
  workflowOptionsByGroupTitle,
  workflowOptionsLimitedByGroupTitle,
  TikTokworkflowOptionsByGroupTitle
} from "../utils/workflowUtils";

const FINAL_WORKFLOWS = ["Realizat cu succes", "Închis și nerealizat"];

export const GeneralForm = ({ data, formInstance }) => {
  const { technicians } = useGetTechniciansList();
  const { accessibleGroupTitles, isAdmin, userGroups } = useUser();
  const isInitialized = useRef(false);

  // Используем состояние для отслеживания изменений group_title
  const [currentGroupTitle, setCurrentGroupTitle] = useState(formInstance.getValues().group_title);

  const formattedTechnicians = formatMultiSelectData(technicians);

  useEffect(() => {
    if (data && !isInitialized.current) {
      // Инициализируем форму только один раз при первой загрузке данных
      formInstance.setValues({
        technician_id: data.technician_id ? `${data.technician_id}` : undefined,
        tags: parseTags(data.tags),
        workflow: data.workflow,
        priority: data.priority,
        contact: data.contact,
        group_title: data.group_title,
        description: data.description,
      });
      setCurrentGroupTitle(data.group_title);
      isInitialized.current = true;
    }
  }, [data, formInstance]);

  const filteredGroupTitleOptions = groupTitleOptions.filter((g) =>
    accessibleGroupTitles.includes(g.value)
  );

  // Определяем, находится ли пользователь в группе TikTok Manager
  const isTikTokManager = useMemo(() => {
    return userGroups?.some((group) => group.name === "TikTok Manager");
  }, [userGroups]);

  // Функция для получения правильного workflowMap
  const getWorkflowMap = useMemo(() => {
    if (isAdmin) {
      return workflowOptionsByGroupTitle;
    }
    if (isTikTokManager) {
      return TikTokworkflowOptionsByGroupTitle;
    }
    return workflowOptionsLimitedByGroupTitle;
  }, [isAdmin, isTikTokManager]);

  // Сбрасываем workflow при изменении group_title, если текущий workflow не подходит
  useEffect(() => {
    if (!isInitialized.current) return;

    const currentWorkflow = formInstance.getValues().workflow;

    if (currentWorkflow && currentGroupTitle) {
      const workflowsForGroup = getWorkflowMap[currentGroupTitle] || getWorkflowMap.Default || [];

      // Если текущий workflow не входит в список для нового group_title, сбрасываем его
      if (!workflowsForGroup.includes(currentWorkflow)) {
        formInstance.setFieldValue("workflow", undefined);
      }
    }
  }, [currentGroupTitle, getWorkflowMap, formInstance]);

  // Получаем workflow опции на основе выбранного group_title
  const filteredWorkflowOptions = useMemo(() => {
    if (!currentGroupTitle) {
      return [];
    }

    // Получаем workflow опции для выбранного group_title
    const workflowsForGroup = getWorkflowMap[currentGroupTitle] || getWorkflowMap.Default || [];

    return workflowsForGroup.map((w) => ({ value: w, label: w }));
  }, [currentGroupTitle, getWorkflowMap]);

  const currentWorkflow = formInstance.getValues().workflow;
  const isFinalWorkflow = FINAL_WORKFLOWS.includes(currentWorkflow);
  const isWorkflowDisabled = !isAdmin && isFinalWorkflow;

  return (
    <Box bg="var(--crm-ui-kit-palette-background-primary-disabled)" p="md" style={{ borderRadius: 8 }}>
      <Select
        label={getLanguageByKey("Grup")}
        placeholder={getLanguageByKey("selectGroup")}
        data={filteredGroupTitleOptions}
        searchable
        required
        clearable
        key={formInstance.key("group_title")}
        value={formInstance.getValues().group_title}
        onChange={(value) => {
          formInstance.setFieldValue("group_title", value);
          setCurrentGroupTitle(value);
        }}
        error={formInstance.errors.group_title}
        mb="md"
      />

      <Select
        label={getLanguageByKey("Workflow")}
        placeholder={getLanguageByKey("Selectează flux de lucru")}
        data={filteredWorkflowOptions}
        clearable
        searchable
        required
        disabled={isWorkflowDisabled}
        key={formInstance.key("workflow")}
        {...formInstance.getInputProps("workflow", { type: "select" })}
      />

      <UserGroupMultiSelect
        mt="md"
        label={getLanguageByKey("Responsabil")}
        placeholder={getLanguageByKey("Selectează responsabil")}
        value={formInstance.getValues().technician_id ? [formInstance.getValues().technician_id] : []}
        onChange={(value) => formInstance.setFieldValue("technician_id", value[0] || undefined)}
        techniciansData={formattedTechnicians}
        mode="single"
      />

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
