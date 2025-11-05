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
import { priorityOptions } from "../../../FormOptions";
import { getLanguageByKey } from "../../utils";
import { useGetTechniciansList } from "../../../hooks";
import { AppContext } from "../../../contexts/AppContext";
import {
  getGroupUserMap,
  formatMultiSelectData,
} from "../../utils/multiSelectUtils";
import {
  formatDateOrUndefinedFilter,
  convertDateToArrayFilter,
} from "../../LeadsComponent/utils";
import { YYYY_MM_DD_DASH } from "../../../app-constants";
import { UserGroupMultiSelect } from "../../ChatComponent/components/UserGroupMultiSelect/UserGroupMultiSelect";

const GENERAL_FORM_FILTER_ID = "GENERAL_FORM_FILTER_ID";

export const BasicGeneralFormFilter = forwardRef(({ loading, data, formId }, ref) => {
  const idForm = formId || GENERAL_FORM_FILTER_ID;
  const { technicians } = useGetTechniciansList();
  const { workflowOptions } = useContext(AppContext);

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

  form.watch("workflow", ({ value }) => {
    if (Array.isArray(value) && value.includes(getLanguageByKey("selectAll"))) {
      // Убираем selectAll из значения и добавляем все workflowOptions
      const filteredValue = value.filter(v => v !== getLanguageByKey("selectAll"));
      const uniqueValue = Array.from(new Set([...filteredValue, ...workflowOptions]));
      form.setFieldValue("workflow", uniqueValue);
    } else {
      form.setFieldValue("workflow", value);
    }
  });

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
  }, [data]);

  useImperativeHandle(ref, () => ({
    getValues: () => form.getTransformedValues(),
  }));

  return (
    <form id={idForm}>
      <MultiSelect
        name="workflow"
        label={getLanguageByKey("Workflow")}
        placeholder={getLanguageByKey("Selectează flux de lucru")}
        data={[getLanguageByKey("selectAll"), ...workflowOptions]}
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
        placeholder={getLanguageByKey("Selectează")}
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
