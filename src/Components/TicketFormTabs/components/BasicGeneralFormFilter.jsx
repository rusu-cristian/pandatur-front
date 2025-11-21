import {
  TextInput,
  MultiSelect,
  TagsInput,
  Select,
} from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { useForm } from "@mantine/form";
import {
  useEffect,
  useMemo,
  useContext,
  forwardRef,
  useImperativeHandle,
} from "react";
import { priorityOptions, groupTitleOptions } from "../../../FormOptions";
import { getLanguageByKey } from "../../utils";
import { useGetTechniciansList } from "../../../hooks";
import { AppContext } from "../../../contexts/AppContext";
import {
  formatMultiSelectData,
} from "../../utils/multiSelectUtils";
import {
  formatDateOrUndefinedFilter,
  convertDateToArrayFilter,
} from "../../LeadsComponent/utils";
import { YYYY_MM_DD_DASH } from "../../../app-constants";
import { UserGroupMultiSelect } from "../../ChatComponent/components/UserGroupMultiSelect/UserGroupMultiSelect";
import {
  workflowOptionsByGroupTitle,
  workflowOptionsLimitedByGroupTitle,
  TikTokworkflowOptionsByGroupTitle
} from "../../utils/workflowUtils";

const GENERAL_FORM_FILTER_ID = "GENERAL_FORM_FILTER_ID";

export const BasicGeneralFormFilter = forwardRef(({ loading, data, formId }, ref) => {
  const idForm = formId || GENERAL_FORM_FILTER_ID;
  const { technicians } = useGetTechniciansList();
  const {
    accessibleGroupTitles,
    customGroupTitle,
    groupTitleForApi,
    setCustomGroupTitle,
    isAdmin,
    userGroups,
  } = useContext(AppContext);

  const form = useForm({
    mode: "controlled",
    initialValues: {
      workflow: [],
      priority: [],
      has_tasks: null,
      contact: "",
      tags: [],
      technician_id: [],
      creation_date: [],
      last_interaction_date: [],
    },
    transformValues: ({
      workflow,
      priority,
      has_tasks,
      contact,
      tags,
      technician_id,
      creation_date,
      last_interaction_date,
    }) => ({
      workflow: workflow?.length ? workflow : undefined,
      priority: priority?.length ? priority : undefined,
      has_tasks: has_tasks || undefined,
      contact: contact?.trim() ? contact : undefined,
      tags: tags?.length ? tags : undefined,
      technician_id: technician_id?.length ? technician_id : undefined,
      creation_date: formatDateOrUndefinedFilter(creation_date),
      last_interaction_date: formatDateOrUndefinedFilter(last_interaction_date),
    }),
  });

  const formattedTechnicians = useMemo(
    () => formatMultiSelectData(technicians),
    [technicians]
  );

  const groupTitleSelectData = useMemo(() => {
    if (!accessibleGroupTitles?.length) {
      return groupTitleOptions;
    }

    return groupTitleOptions.filter((option) =>
      accessibleGroupTitles.includes(option.value)
    );
  }, [accessibleGroupTitles]);

  const selectedGroupTitle = customGroupTitle ?? groupTitleForApi ?? null;

  // Определяем, находится ли пользователь в группе TikTok Manager
  const isTikTokManager = useMemo(() => {
    return userGroups?.some((group) => group.name === "TikTok Manager");
  }, [userGroups]);

  // Функция для получения правильного workflowMap на основе прав пользователя
  const getWorkflowMap = useMemo(() => {
    if (isAdmin) {
      return workflowOptionsByGroupTitle;
    }
    if (isTikTokManager) {
      return TikTokworkflowOptionsByGroupTitle;
    }
    return workflowOptionsLimitedByGroupTitle;
  }, [isAdmin, isTikTokManager]);

  // Получаем workflow опции на основе выбранного group_title
  const filteredWorkflowOptions = useMemo(() => {
    if (!selectedGroupTitle) {
      return [];
    }

    // Получаем workflow опции для выбранного group_title
    const workflowsForGroup = getWorkflowMap[selectedGroupTitle] || getWorkflowMap.Default || [];

    return workflowsForGroup;
  }, [selectedGroupTitle, getWorkflowMap]);

  const handleGroupTitleChange = (val) => {
    let valueToSet = null;

    if (val) {
      valueToSet = accessibleGroupTitles.includes(val)
        ? val
        : accessibleGroupTitles[0] || null;
    }

    if (valueToSet && accessibleGroupTitles.includes(valueToSet)) {
      setCustomGroupTitle(valueToSet);
      localStorage.setItem("leads_last_group_title", valueToSet);
    } else {
      setCustomGroupTitle(null);
      localStorage.removeItem("leads_last_group_title");
    }
  };

  useEffect(() => {
    if (data) {
      form.setValues({
        workflow: data.workflow || [],
        priority: data.priority || [],
        has_tasks: data.has_tasks !== undefined ? String(data.has_tasks) : null,
        contact: data.contact || "",
        tags: data.tags || [],
        technician_id: data.technician_id || [],
        creation_date: convertDateToArrayFilter(data.creation_date),
        last_interaction_date: convertDateToArrayFilter(data.last_interaction_date),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  useImperativeHandle(ref, () => ({
    getValues: () => form.getTransformedValues(),
  }));

  return (
    <form id={idForm}>
      <Select
        name="group_title"
        label={getLanguageByKey("Filter by group")}
        placeholder={getLanguageByKey("Filter by group")}
        data={groupTitleSelectData}
        value={selectedGroupTitle}
        nothingFoundMessage={getLanguageByKey("Nimic găsit")}
        searchable
        onChange={handleGroupTitleChange}
      />

      <MultiSelect
        name="workflow"
        mt="md"
        label={getLanguageByKey("Workflow")}
        placeholder={getLanguageByKey("Selectează flux de lucru")}
        data={[getLanguageByKey("selectAll"), ...filteredWorkflowOptions]}
        clearable
        key={form.key("workflow")}
        {...form.getInputProps("workflow")}
        searchable
      />

      <MultiSelect
        name="priority"
        mt="md"
        label={getLanguageByKey("Prioritate")}
        placeholder={getLanguageByKey("Selectează prioritate")}
        data={priorityOptions}
        clearable
        key={form.key("priority")}
        {...form.getInputProps("priority")}
        searchable
      />

      <TextInput
        name="contact"
        mt="md"
        label={getLanguageByKey("Contact")}
        placeholder={getLanguageByKey("Selectează contact")}
        key={form.key("contact")}
        {...form.getInputProps("contact")}
      />

      <TagsInput
        name="tags"
        mt="md"
        label={getLanguageByKey("Tag-uri")}
        placeholder={getLanguageByKey("Introdu tag-uri separate prin virgule")}
        key={form.key("tags")}
        {...form.getInputProps("tags")}
      />

      <UserGroupMultiSelect
        mt="md"
        label={getLanguageByKey("Responsabil")}
        placeholder={getLanguageByKey("Selectează responsabil")}
        value={form.values.technician_id}
        onChange={(value) => form.setFieldValue("technician_id", value)}
        techniciansData={formattedTechnicians}
        mode="multi"
      />

      <DatePickerInput
        type="range"
        valueFormat={YYYY_MM_DD_DASH}
        clearable
        mt="md"
        label={getLanguageByKey("Data creării")}
        placeholder={getLanguageByKey("Data creării")}
        {...form.getInputProps("creation_date")}
      />

      <DatePickerInput
        type="range"
        valueFormat={YYYY_MM_DD_DASH}
        clearable
        mt="md"
        label={getLanguageByKey("Ultima modificare")}
        placeholder={getLanguageByKey("Ultima modificare")}
        {...form.getInputProps("last_interaction_date")}
      />

      <Select
        name="has_tasks"
        mt="md"
        label={getLanguageByKey("Are sarcini")}
        placeholder={getLanguageByKey("Alege")}
        data={[
          { value: "true", label: getLanguageByKey("Da") },
          { value: "false", label: getLanguageByKey("Nu") }
        ]}
        clearable
        key={form.key("has_tasks")}
        {...form.getInputProps("has_tasks")}
      />
    </form>
  );
});
