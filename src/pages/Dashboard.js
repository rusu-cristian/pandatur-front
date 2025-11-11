import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { format } from "date-fns";
import { useSnackbar } from "notistack";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import { Flex, Text, Box, Stack, ActionIcon, MultiSelect } from "@mantine/core";
import { LuFilter } from "react-icons/lu";
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
};

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

      <Box style={{ width: 240 }}>
        <MultiSelect
          size="sm"
          value={widgetTypes}
          onChange={(values) => setWidgetTypes(Array.isArray(values) ? values : [])}
          data={WIDGET_TYPE_OPTIONS}
          placeholder={getLanguageByKey("Widget type")}
          aria-label="widget-type"
          searchable
          clearable
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
