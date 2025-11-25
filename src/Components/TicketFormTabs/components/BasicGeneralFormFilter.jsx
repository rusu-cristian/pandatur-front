import {
  TextInput,
  MultiSelect,
  TagsInput,
  Select,
  Text,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { DateRangePicker } from "../../DateRangePicker/DateRangePicker";
import dayjs from "dayjs";
import {
  useEffect,
  useMemo,
  useContext,
  forwardRef,
  useImperativeHandle,
} from "react";
import { useSearchParams } from "react-router-dom";
import { priorityOptions, groupTitleOptions } from "../../../FormOptions";
import { getLanguageByKey } from "../../utils";
import { useGetTechniciansList } from "../../../hooks";
import { AppContext } from "../../../contexts/AppContext";
import { formatMultiSelectData } from "../../utils/multiSelectUtils";
import {
  formatDateOrUndefinedFilter,
  convertDateToArrayFilter,
} from "../../LeadsComponent/utils";
import { UserGroupMultiSelect } from "../../ChatComponent/components/UserGroupMultiSelect/UserGroupMultiSelect";
import {
  workflowOptionsByGroupTitle,
  workflowOptionsLimitedByGroupTitle,
  TikTokworkflowOptionsByGroupTitle,
} from "../../utils/workflowUtils";

const GENERAL_FORM_FILTER_ID = "GENERAL_FORM_FILTER_ID";

export const BasicGeneralFormFilter = forwardRef(
  ({ loading, data, formId }, ref) => {
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
    const [, setSearchParams] = useSearchParams();

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
      const workflowsForGroup =
        getWorkflowMap[selectedGroupTitle] || getWorkflowMap.Default || [];

      return workflowsForGroup;
    }, [selectedGroupTitle, getWorkflowMap]);

    const handleGroupTitleChange = (val) => {
      let valueToSet = null;

      if (val) {
        valueToSet = accessibleGroupTitles.includes(val)
          ? val
          : accessibleGroupTitles[0] || null;
      }

      // Обновляем URL вместе со стейтом, чтобы избежать конфликтов с синхронизацией
      setSearchParams(
        (prev) => {
          const newParams = new URLSearchParams(prev);

          if (valueToSet && accessibleGroupTitles.includes(valueToSet)) {
            newParams.set("group_title", valueToSet);
            // Полностью очищаем workflow при смене группы
            newParams.delete("workflow");
          } else {
            newParams.delete("group_title");
            newParams.delete("workflow");
          }

          return newParams;
        },
        { replace: true }
      );

      // Очищаем workflow в форме при смене группы
      form.setFieldValue("workflow", []);

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
          has_tasks:
            data.has_tasks !== undefined ? String(data.has_tasks) : null,
          contact: data.contact || "",
          tags: data.tags || [],
          technician_id: data.technician_id || [],
          creation_date: convertDateToArrayFilter(data.creation_date),
          last_interaction_date: convertDateToArrayFilter(
            data.last_interaction_date
          ),
        });
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data]);

    useImperativeHandle(ref, () => ({
      getValues: () => form.getTransformedValues(),
    }));

    // ======== helpers для DateRangePicker ========
    const getDateRangeValue = (dateArray) => {
      if (!dateArray || !Array.isArray(dateArray) || dateArray.length === 0) {
        return [];
      }
      const [startDate, endDate] = dateArray;

      let start = null;
      if (startDate) {
        if (startDate instanceof Date) {
          start = startDate;
        } else if (dayjs.isDayjs(startDate)) {
          start = startDate.toDate();
        } else {
          start = dayjs(startDate).toDate();
        }
      }

      let end = null;
      if (endDate) {
        if (endDate instanceof Date) {
          end = endDate;
        } else if (dayjs.isDayjs(endDate)) {
          end = endDate.toDate();
        } else {
          end = dayjs(endDate).toDate();
        }
      }

      if (start && end) {
        return [start, end];
      } else if (start) {
        return [start, null];
      }
      return [];
    };

    const handleDateRangeChange = (fieldName) => (range) => {
      if (!range || (Array.isArray(range) && range.length === 0)) {
        form.setFieldValue(fieldName, []);
        return;
      }

      if (Array.isArray(range)) {
        const [startDate, endDate] = range;
        if (startDate && endDate) {
          form.setFieldValue(fieldName, [startDate, endDate]);
        } else if (startDate && !endDate) {
          form.setFieldValue(fieldName, [startDate, null]);
        } else {
          form.setFieldValue(fieldName, []);
        }
      }
    };

    // ========== Логика SELECT ALL для workflow ==========
    const selectAllLabel = getLanguageByKey("selectAll");

    form.watch("workflow", ({ value }) => {
      if (Array.isArray(value) && value.includes(selectAllLabel)) {
        // убираем selectAll и добавляем все доступные workflow для выбранного group_title
        const filteredValue = value.filter((v) => v !== selectAllLabel);
        const uniqueValue = Array.from(
          new Set([...filteredValue, ...filteredWorkflowOptions])
        );
        form.setFieldValue("workflow", uniqueValue);
      } else {
        form.setFieldValue("workflow", value);
      }
    });
    // =============================================

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
          // добавляем пункт "selectAll" + все воркфлоу для выбранной группы
          data={[selectAllLabel, ...filteredWorkflowOptions]}
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

        <div style={{ marginTop: "1rem" }}>
          <Text size="sm" fw={500} mb={4}>
            {getLanguageByKey("Data creării")}
          </Text>
          <DateRangePicker
            value={getDateRangeValue(form.values.creation_date)}
            onChange={handleDateRangeChange("creation_date")}
            isClearable={true}
            dateFormat="yyyy-MM-dd"
            placeholder={getLanguageByKey("Data creării")}
          />
        </div>

        <div style={{ marginTop: "1rem" }}>
          <Text size="sm" fw={500} mb={4}>
            {getLanguageByKey("Ultima modificare")}
          </Text>
          <DateRangePicker
            value={getDateRangeValue(form.values.last_interaction_date)}
            onChange={handleDateRangeChange("last_interaction_date")}
            isClearable={true}
            dateFormat="yyyy-MM-dd"
            placeholder={getLanguageByKey("Ultima modificare")}
          />
        </div>

        <Select
          name="has_tasks"
          mt="md"
          label={getLanguageByKey("Are sarcini")}
          placeholder={getLanguageByKey("Alege")}
          data={[
            { value: "true", label: getLanguageByKey("Da") },
            { value: "false", label: getLanguageByKey("Nu") },
          ]}
          clearable
          key={form.key("has_tasks")}
          {...form.getInputProps("has_tasks")}
        />
      </form>
    );
  }
);
