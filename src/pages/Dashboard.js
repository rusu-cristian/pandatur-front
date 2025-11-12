import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { format } from "date-fns";
import { useSnackbar } from "notistack";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import "./dashboard-select.css";
import { Flex, Text, Box, Stack, ActionIcon } from "@mantine/core";
import { LuFilter, LuCheck } from "react-icons/lu";
import Select, { components as selectComponents } from "react-select";
import { api } from "../api";
import DashboardGrid from "../Components/DashboardComponent/DashboardGrid";
import { showServerError, getLanguageByKey } from "@utils";
import { Spin, PageHeader } from "@components";
import { useGetTechniciansList, useDashboardData, useUserPermissions } from "../hooks";
import { Filter } from "../Components/DashboardComponent/Filter/Filter";
import { safeArray, pickIds } from "../utils/dashboardHelpers";

const t = (key) => String(getLanguageByKey?.(key) ?? key);

const WIDGET_TYPE_OPTIONS = [
  { value: "calls", label: t("Calls") },
  { value: "messages", label: t("Messages") },
  { value: "ticket_state", label: t("Ticket State") },
  { value: "tickets_into_work", label: t("Tickets Into Work") },
  { value: "system_usage", label: t("System usage") },
  { value: "ticket_distribution", label: t("Ticket Distribution") },
  { value: "closed_tickets_count", label: t("Closed Tickets Count") },
  { value: "tickets_by_depart_count", label: t("Tickets By Depart Count") },
  { value: "ticket_lifetime_stats", label: t("Ticket Lifetime Stats") },
  { value: "ticket_rate", label: t("Ticket Rate") },
  { value: "workflow_from_change", label: t("Workflow From Change") },
  { value: "workflow_to_change", label: t("Workflow Change To") },
  { value: "ticket_creation", label: t("Ticket Creation") },
  { value: "workflow_from_de_prelucrat", label: t("Workflow From De Prelucrat") },
  { value: "workflow_duration", label: t("Workflow Duration") },
  { value: "ticket_destination", label: t("Ticket Destination") },
  { value: "ticket_marketing", label: t("Statistica Marketing") },
  { value: "ticket_source", label: t("Sursă Lead") },
  { value: "ticket_platform_source", label: t("Platformă lead") },
];

const WIDGET_API_MAP = {
  calls: api.dashboard.getWidgetCalls,
  messages: api.dashboard.getWidgetMessages,
  ticket_state: api.dashboard.getTicketStateWidget,
  tickets_into_work: api.dashboard.getTicketsIntoWorkWidget,
  system_usage: api.dashboard.getSystemUsageWidget,
  ticket_distribution: api.dashboard.getTicketDistributionWidget,
  closed_tickets_count: api.dashboard.getClosedTicketsCountWidget,
  tickets_by_depart_count: api.dashboard.getTicketsByDepartCountWidget,
  ticket_lifetime_stats: api.dashboard.getTicketLifetimeStatsWidget,
  ticket_rate: api.dashboard.getTicketRateWidget,
  workflow_from_change: api.dashboard.getWorkflowFromChangeWidget,
  workflow_to_change: api.dashboard.getWorkflowToChangeWidget,
  ticket_creation: api.dashboard.getTicketCreationWidget,
  workflow_from_de_prelucrat: api.dashboard.getWorkflowFromDePrelucratWidget,
  workflow_duration: api.dashboard.getWorkflowDurationWidget,
  ticket_destination: api.dashboard.getTicketDestinationWidget,
  ticket_marketing: api.dashboard.getTicketMarketingWidget,
  ticket_source: api.dashboard.getTicketSourceWidget,
  ticket_platform_source: api.dashboard.getTicketPlatformSourceWidget,
};

const MAX_VISIBLE_WIDGET_TAGS = 2;

const WidgetTypeMultiValue = (props) => {
  const values = Array.isArray(props.selectProps?.value) ? props.selectProps.value : [];
  const remaining = values.length - MAX_VISIBLE_WIDGET_TAGS;

  if (props.index < MAX_VISIBLE_WIDGET_TAGS || remaining <= 0) {
    return <selectComponents.MultiValue {...props} />;
  }

  if (props.index === MAX_VISIBLE_WIDGET_TAGS) {
    return <div className="dashboard-widget-select__aggregate">+{remaining}</div>;
  }

  return null;
};

const WidgetTypeOption = (props) => (
  <selectComponents.Option {...props}>
    <div className="dashboard-widget-select__option">
      {props.isSelected ? <LuCheck size={16} /> : <span className="dashboard-widget-select__option-placeholder" />}
      <span>{props.label}</span>
    </div>
  </selectComponents.Option>
);

export const Dashboard = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [scrollHeight, setScrollHeight] = useState(400);

  // типы виджетов
  const [widgetTypes, setWidgetTypes] = useState(["calls"]);

  // состояние фильтра
  const [selectedTechnicians, setSelectedTechnicians] = useState([]);
  const [selectedUserGroups, setSelectedUserGroups] = useState([]);
  const [selectedGroupTitles, setSelectedGroupTitles] = useState([]);
  const [dateRange, setDateRange] = useState([]);

  const [filterOpened, setFilterOpened] = useState(false);

  const { enqueueSnackbar } = useSnackbar();
  const headerRowRef = useRef(null);
  const scrollRef = useRef(null);
  const requestIdRef = useRef(0);

  const [rawData, setRawData] = useState({});
  const [dataError, setDataError] = useState(null);

  // имена по user_id
  const { technicians } = useGetTechniciansList();
  const { accessibleGroupTitles } = useUserPermissions();
  const userNameById = useMemo(() => {
    const map = new Map();
    safeArray(technicians).forEach((t) => {
      const id = Number(t?.value);
      const name = String(t?.label ?? "").trim();
      if (Number.isFinite(id) && name) map.set(id, name);
    });
    return map;
  }, [technicians]);

  // общий payload
  const buildPayloadCommon = useCallback(() => {
    const [start, end] = dateRange || [];
    const payload = {
      user_ids: pickIds(selectedTechnicians),
      user_groups: selectedUserGroups?.length ? selectedUserGroups : undefined,
      group_titles: selectedGroupTitles?.length ? selectedGroupTitles : undefined,
      attributes:
        start || end
          ? { timestamp: { from: start ? format(start, "yyyy-MM-dd") : undefined, to: end ? format(end, "yyyy-MM-dd") : undefined } }
          : undefined,
    };
    if (!payload.user_ids?.length) delete payload.user_ids;
    if (!payload.user_groups?.length) delete payload.user_groups;
    if (!payload.group_titles?.length) delete payload.group_titles;
    if (!payload.attributes?.timestamp?.from && !payload.attributes?.timestamp?.to) delete payload.attributes;
    return payload;
  }, [selectedTechnicians, selectedUserGroups, selectedGroupTitles, dateRange]);


  // запросы по выбранным типам
  const fetchByTypes = useCallback(
    async (types, payload) => {
      if (!types.length) {
        setRawData({});
        setDataError(null);
        setIsLoading(false);
        return;
      }

      const uniqueTypes = Array.from(new Set(types.filter(Boolean)));
      if (!uniqueTypes.length) {
        setRawData({});
        setDataError(null);
        setIsLoading(false);
        return;
      }

      const thisReqId = ++requestIdRef.current;
      setIsLoading(true);
      setDataError(null);
      try {
        const responses = await Promise.all(
          uniqueTypes.map(async (type) => {
            const request = WIDGET_API_MAP[type];
            if (!request) return [type, null];
            const result = await request(payload);
            return [type, result];
          })
        );

        if (requestIdRef.current !== thisReqId) return;

        const dataMap = responses.reduce((acc, entry) => {
          if (!entry) return acc;
          const [type, data] = entry;
          if (type) acc[type] = data || null;
          return acc;
        }, {});

        setRawData(dataMap);
      } catch (e) {
        if (requestIdRef.current !== thisReqId) return;
        setRawData({});
        setDataError(e?.message || String(e));
        enqueueSnackbar(showServerError(e), { variant: "error" });
      } finally {
        if (requestIdRef.current === thisReqId) setIsLoading(false);
      }
    },
    [enqueueSnackbar]
  );

  // автозагрузка при изменении диапазона/типа
  useEffect(() => {
    const [start, end] = dateRange || [];
    if (!!start !== !!end) return; // нужен полноценный диапазон
    const types = Array.isArray(widgetTypes) ? widgetTypes : widgetTypes ? [widgetTypes] : [];
    if (!types.length) {
      requestIdRef.current += 1;
      setIsLoading(false);
      setRawData({});
      setDataError(null);
      return;
    }
    fetchByTypes(types, buildPayloadCommon());
  }, [buildPayloadCommon, fetchByTypes, widgetTypes, dateRange]);

  // размеры
  const recalcSizes = useCallback(() => {
    const headerH = headerRowRef.current?.offsetHeight || 0;
    const margins = 24;
    // Учитываем zoom: 0.75 и компенсацию 133.33vh
    const viewportH = (window.innerHeight || 800) * 1.3333; // Компенсируем zoom
    setScrollHeight(Math.max(240, viewportH - headerH - margins));
  }, []);

  useEffect(() => {
    recalcSizes();
    window.addEventListener("resize", recalcSizes);
    const ro = new ResizeObserver(recalcSizes);
    if (scrollRef.current) ro.observe(scrollRef.current);
    return () => {
      window.removeEventListener("resize", recalcSizes);
      ro.disconnect();
    };
  }, [recalcSizes]);


  // построение списка виджетов
  const widgets = useDashboardData(rawData, userNameById, widgetTypes, getLanguageByKey);

  const handleApplyFilter = useCallback((meta) => {
    setSelectedTechnicians(meta?.selectedTechnicians || []);
    setSelectedUserGroups(meta?.selectedUserGroups || []);
    setSelectedGroupTitles(meta?.selectedGroupTitles || []);
    setDateRange(meta?.dateRange || []);
  }, []);

  // Проверяем, активен ли фильтр
  const isFilterActive = useMemo(() => {
    const hasTechnicians = selectedTechnicians?.length > 0;
    const hasUserGroups = selectedUserGroups?.length > 0;
    const hasGroupTitles = selectedGroupTitles?.length > 0;
    const hasDateRange = dateRange?.length === 2 && dateRange[0] && dateRange[1];

    return hasTechnicians || hasUserGroups || hasGroupTitles || hasDateRange;
  }, [selectedTechnicians, selectedUserGroups, selectedGroupTitles, dateRange]);

  // Кастомные стили для react-select, чтобы переопределить inline styles
  const customSelectStyles = useMemo(() => ({
    control: (base) => ({
      ...base,
      backgroundColor: 'var(--crm-ui-kit-palette-background-primary)',
      borderColor: 'var(--crm-ui-kit-palette-border-default)',
      minHeight: 36,
      boxShadow: 'none',
      '&:hover': {
        borderColor: 'var(--crm-ui-kit-palette-border-primary)',
      },
    }),
    menu: (base) => ({
      ...base,
      backgroundColor: 'var(--crm-ui-kit-palette-background-primary)',
      border: '1px solid var(--crm-ui-kit-palette-border-default)',
      boxShadow: '0 8px 24px rgba(9, 17, 27, 0.28)',
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected
        ? 'var(--crm-ui-kit-palette-link-primary)'
        : state.isFocused
          ? 'var(--crm-ui-kit-palette-surface-hover-background-color)'
          : 'transparent',
      color: state.isSelected
        ? 'var(--crm-ui-kit-palette-background-primary)'
        : 'var(--crm-ui-kit-palette-text-primary)',
      '&:active': {
        backgroundColor: 'var(--crm-ui-kit-palette-link-hover-primary)',
      },
    }),
    multiValue: (base) => ({
      ...base,
      backgroundColor: 'var(--crm-ui-kit-palette-surface-hover-background-color)',
      border: '1px solid var(--crm-ui-kit-palette-border-default)',
    }),
    multiValueLabel: (base) => ({
      ...base,
      color: 'var(--crm-ui-kit-palette-text-primary)',
    }),
    multiValueRemove: (base) => ({
      ...base,
      color: 'var(--crm-ui-kit-palette-text-primary)',
      '&:hover': {
        backgroundColor: 'var(--crm-ui-kit-palette-link-primary)',
        color: 'var(--crm-ui-kit-palette-background-primary)',
      },
    }),
    input: (base) => ({
      ...base,
      color: 'var(--crm-ui-kit-palette-text-primary)',
    }),
    placeholder: (base) => ({
      ...base,
      color: 'var(--crm-ui-kit-palette-placeholder-default)',
    }),
    singleValue: (base) => ({
      ...base,
      color: 'var(--crm-ui-kit-palette-text-primary)',
    }),
    dropdownIndicator: (base) => ({
      ...base,
      color: 'var(--crm-ui-kit-palette-text-secondary-light)',
    }),
    clearIndicator: (base) => ({
      ...base,
      color: 'var(--crm-ui-kit-palette-text-secondary-light)',
    }),
    indicatorSeparator: (base) => ({
      ...base,
      display: 'none',
    }),
  }), []);

  const extraInfo = (
    <Flex gap="sm" align="center">
      <ActionIcon
        variant={isFilterActive ? "filled" : "default"}
        size="lg"
        onClick={() => setFilterOpened(true)}
        aria-label="open-filter"
        color={isFilterActive ? "green" : undefined}
      >
        <LuFilter size={18} />
      </ActionIcon>

      <Box style={{ width: 360 }}>
        <Select
          isMulti
          options={WIDGET_TYPE_OPTIONS}
          value={WIDGET_TYPE_OPTIONS.filter((option) => widgetTypes.includes(option.value))}
          onChange={(selected) =>
            setWidgetTypes(Array.isArray(selected) ? selected.map((option) => option.value) : [])
          }
          placeholder={getLanguageByKey("Widget type")}
          isClearable
          isSearchable
          hideSelectedOptions={false}
          closeMenuOnSelect={false}
          classNamePrefix="dashboard-widget-select"
          styles={customSelectStyles}
          components={{ Option: WidgetTypeOption, MultiValue: WidgetTypeMultiValue }}
        />
      </Box>
    </Flex>
  );

  return (
    <Stack gap={12} p="12">
      <div ref={headerRowRef}>
        <PageHeader
          title={getLanguageByKey("Dashboard")}
          extraInfo={extraInfo}
          badgeColor="green"
          withDivider={true}
        />
      </div>

      {isLoading ? (
        <Flex align="center" justify="center" style={{ flex: 1, minHeight: 240 }}>
          <Spin />
        </Flex>
      ) : dataError ? (
        <Flex align="center" justify="center" style={{ flex: 1, minHeight: 240 }}>
          <Text c="red">{String(dataError)}</Text>
        </Flex>
      ) : (
        <Box
          ref={scrollRef}
          style={{ width: "100%", height: scrollHeight, overflowY: "auto", overflowX: "hidden", scrollbarGutter: "stable" }}
          pb="200px" pl="50px" pr="50px"
        >
          <DashboardGrid widgets={widgets} dateRange={dateRange} widgetType={widgetTypes?.[0] || "calls"} />
        </Box>
      )}

      <Filter
        opened={filterOpened}
        onClose={() => setFilterOpened(false)}
        onApply={handleApplyFilter}
        initialTechnicians={selectedTechnicians}
        initialUserGroups={selectedUserGroups}
        initialGroupTitles={selectedGroupTitles}
        initialDateRange={dateRange}
        widgetTypes={widgetTypes}
        accessibleGroupTitles={accessibleGroupTitles}
      />
    </Stack>
  );
};
