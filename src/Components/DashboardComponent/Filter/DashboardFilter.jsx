import { useMemo, useEffect, useState } from "react";
import dayjs from "dayjs";
import { Button, Group, MultiSelect, Modal, Stack, Box, Flex } from "@mantine/core";
import { DateRangePicker } from "../../DateRangePicker";
import { getLanguageByKey } from "../../utils";
import { useGetTechniciansList } from "../../../hooks";
import { formatMultiSelectData } from "../../utils/multiSelectUtils";
import { user } from "../../../api/user";
import { UserGroupMultiSelect } from "../../ChatComponent/components/UserGroupMultiSelect/UserGroupMultiSelect";
import { groupTitleOptions, sourceOfLeadOptions } from "../../../FormOptions";

const getStartEndDateRange = (date) => {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  return [startOfDay, endOfDay];
};

const getYesterdayDate = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return getStartEndDateRange(d);
};

export const DashboardFilter = ({
  opened,
  onClose,
  onApply, // (payload, meta) => void
  initialTechnicians = [],
  initialUserGroups = [],
  initialGroupTitles = [],
  initialDateRange = [],
  initialSursaLeads = [],
  widgetTypes = ["calls"], // Типы виджетов для определения доступных фильтров
  accessibleGroupTitles = [], // Доступные воронки для текущего пользователя
}) => {
  const { technicians } = useGetTechniciansList();

  // Фильтруем пользователей в зависимости от роли
  const filteredTechnicians = useMemo(() => {
    if (!technicians || technicians.length === 0) return [];
    return technicians;
  }, [technicians]);

  const formattedTechnicians = useMemo(() => {
    return formatMultiSelectData(filteredTechnicians);
  }, [filteredTechnicians]);

  const [userGroupsOptions, setUserGroupsOptions] = useState([]);
  const [loadingUserGroups, setLoadingUserGroups] = useState(false);

  const [selectedTechnicians, setSelectedTechnicians] = useState(initialTechnicians);
  const [selectedUserGroups, setSelectedUserGroups] = useState(initialUserGroups);
  const [selectedGroupTitles, setSelectedGroupTitles] = useState(initialGroupTitles);
  const [dateRange, setDateRange] = useState(initialDateRange);
  const [selectedSursaLeads, setSelectedSursaLeads] = useState(initialSursaLeads);

  useEffect(() => {
    if (opened) {
      setSelectedTechnicians(initialTechnicians);
      setSelectedUserGroups(initialUserGroups);
      setSelectedGroupTitles(initialGroupTitles);
      setDateRange(initialDateRange);
      setSelectedSursaLeads(initialSursaLeads);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoadingUserGroups(true);
        const data = await user.getGroupsList();

        const opts = Array.from(new Set((data || []).map((g) => g?.name).filter(Boolean))).map(
          (name) => ({ value: name, label: name })
        );

        if (mounted) setUserGroupsOptions(opts);
      } catch {
        if (mounted) setUserGroupsOptions([]);
      } finally {
        if (mounted) setLoadingUserGroups(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Фильтруем доступные group titles на основе прав пользователя
  const groupTitleSelectData = useMemo(() => {
    if (accessibleGroupTitles.length === 0) {
      // Если нет доступных воронок, показываем все из статического списка
      return groupTitleOptions;
    }

    // Фильтруем статический список по доступным воронкам
    return groupTitleOptions.filter((option) =>
      accessibleGroupTitles.includes(option.value)
    );
  }, [accessibleGroupTitles]);

  // Определяем доступные фильтры в зависимости от типов виджетов
  const availableFilters = useMemo(() => {
    const filterMap = {
      'calls': ['user_ids', 'group_titles', 'user_groups', 'attributes'],
      'messages': ['user_ids', 'group_titles', 'user_groups', 'attributes'],
      'ticket_state': ['user_ids', 'group_titles', 'user_groups', 'attributes'],
      'system_usage': ['user_ids', 'user_groups', 'attributes'],
      'ticket_distribution': ['user_ids', 'group_titles', 'user_groups', 'attributes'],
      'tickets_into_work': ['user_ids', 'group_titles', 'user_groups', 'attributes'],
      'closed_tickets_count': ['user_ids', 'group_titles', 'user_groups', 'attributes'],
      'tickets_by_depart_count': ['user_ids', 'group_titles', 'user_groups', 'attributes'],
      'ticket_lifetime_stats': ['user_ids', 'group_titles', 'user_groups', 'attributes'],
      'ticket_rate': ['user_ids', 'group_titles', 'user_groups', 'attributes'],
      'workflow_from_change': ['user_ids', 'group_titles', 'user_groups', 'attributes'],
      'workflow_to_change': ['user_ids', 'group_titles', 'user_groups', 'attributes'],
      'ticket_creation': ['user_ids', 'group_titles', 'user_groups', 'attributes'],
      'workflow_from_de_prelucrat': ['user_ids', 'group_titles', 'user_groups', 'attributes'],
      'workflow_duration': ['user_ids', 'group_titles', 'user_groups', 'attributes'],
      'ticket_destination': ['attributes'],
      'lead_conversion': ['attributes','user_groups','user_ids','group_titles',"sursa_leads"],
    };

    const defaultOrder = ['user_ids', 'group_titles', 'user_groups', 'attributes', 'sursa_leads'];
    const typesArray = Array.isArray(widgetTypes)
      ? widgetTypes
      : widgetTypes
      ? [widgetTypes]
      : [];

    if (!typesArray.length) {
      return defaultOrder;
    }

    const activeFilters = new Set();
    typesArray.forEach((type) => {
      const filters = filterMap[type] || defaultOrder;
      filters.forEach((f) => activeFilters.add(f));
    });

    // Возвращаем все активные фильтры в правильном порядке
    const orderedFilters = defaultOrder.filter((key) => activeFilters.has(key));
    // Добавляем любые дополнительные фильтры, которых нет в defaultOrder
    activeFilters.forEach((filter) => {
      if (!defaultOrder.includes(filter)) {
        orderedFilters.push(filter);
      }
    });

    return orderedFilters;
  }, [widgetTypes]);

  const showUserFilter = availableFilters.includes('user_ids');
  const showGroupTitlesFilter = availableFilters.includes('group_titles');
  const showUserGroupsFilter = availableFilters.includes('user_groups');
  const showDateFilter = availableFilters.includes('attributes');
  const showSursaLeadsFilter = availableFilters.includes('sursa_leads');

  const handleUsersChange = (val) => {
    // UserGroupMultiSelect уже обрабатывает группы внутри себя
    // и возвращает только ID пользователей в массиве val
    setSelectedTechnicians(val || []);
  };

  const handleUserGroupsChange = (groups) => {
    setSelectedUserGroups(groups || []);
  };


  const isToday =
    dateRange?.[0] && dateRange?.[1] &&
    dayjs(dateRange[0]).isSame(dayjs(), "day") &&
    dayjs(dateRange[1]).isSame(dayjs(), "day");

  const isYesterday =
    dateRange?.[0] && dateRange?.[1] &&
    dayjs(dateRange[0]).isSame(dayjs().subtract(1, "day"), "day") &&
    dayjs(dateRange[1]).isSame(dayjs().subtract(1, "day"), "day");

  const handleReset = () => {
    if (showUserFilter) setSelectedTechnicians([]);
    if (showUserGroupsFilter) setSelectedUserGroups([]);
    if (showGroupTitlesFilter) setSelectedGroupTitles([]);
    if (showSursaLeadsFilter) setSelectedSursaLeads([]);
    if (showDateFilter) setDateRange([]);
    onApply?.({});
    onClose?.();
  };

  const handleApply = () => {
    onApply?.({
      selectedTechnicians,
      selectedUserGroups,
      selectedGroupTitles,
      dateRange,
      selectedSursaLeads,
    });
    onClose?.();
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={getLanguageByKey("Filtru")}
      size="lg"
      centered
      styles={{
        content: { height: 700, display: "flex", flexDirection: "column" },
        body: { flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" },
      }}
    >
      {/* Весь контент модалки — флекс-колонка на всю высоту:
          Header (скрытый) → Scrollable content → Sticky footer */}
      <Box style={{ display: "flex", flexDirection: "column", height: "100%" }}>
        {/* Прокручиваемая часть с полями — ВЕРТИКАЛЬНО */}
        <Box style={{ flex: 1, overflowY: "auto" }}>
          <Stack gap="md">
            {/* Фильтр по пользователям */}
            {showUserFilter && (
              <UserGroupMultiSelect
                value={selectedTechnicians}
                onChange={handleUsersChange}
                placeholder={getLanguageByKey("User")}
                label={getLanguageByKey("User")}
                techniciansData={formattedTechnicians}
                mode="multi"
              />
            )}

            {/* Фильтр по группам пользователей */}
            {showUserGroupsFilter && (
              <MultiSelect
                data={userGroupsOptions}
                value={selectedUserGroups}
                onChange={handleUserGroupsChange}
                searchable
                clearable
                maxDropdownHeight={260}
                placeholder={getLanguageByKey("User group")}
                nothingFoundMessage={getLanguageByKey("Nimic găsit")}
                disabled={loadingUserGroups}
              />
            )}

            {/* Фильтр по названиям групп */}
            {showGroupTitlesFilter && (
              <MultiSelect
                data={groupTitleSelectData}
                value={selectedGroupTitles}
                onChange={(v) => setSelectedGroupTitles(v || [])}
                searchable
                clearable
                maxDropdownHeight={260}
                nothingFoundMessage={getLanguageByKey("Nimic găsit")}
                placeholder={getLanguageByKey("Group title")}
              />
            )}

            {/* Фильтр по sursa leads */}
            {showSursaLeadsFilter && (
              <MultiSelect
                data={sourceOfLeadOptions}
                value={selectedSursaLeads}
                onChange={(v) => setSelectedSursaLeads(v || [])}
                searchable
                clearable
                maxDropdownHeight={260}
                nothingFoundMessage={getLanguageByKey("Nimic găsit")}
                placeholder={getLanguageByKey("Sursă lead")}
                />
            )}

            {/* Фильтр по датам */}
            {showDateFilter && (
              <Group gap="xs" align="center">
                <Button
                  variant={isToday ? "filled" : "outline"}
                  onClick={() => setDateRange(getStartEndDateRange(new Date()))}
                >
                  {getLanguageByKey("azi")}
                </Button>
                <Button
                  variant={isYesterday ? "filled" : "outline"}
                  onClick={() => setDateRange(getYesterdayDate())}
                >
                  {getLanguageByKey("ieri")}
                </Button>
                <DateRangePicker
                  value={dateRange}
                  onChange={setDateRange}
                  placeholder={getLanguageByKey("Selectează o dată")}
                  dateFormat="yyyy-MM-dd"
                />
              </Group>
            )}
          </Stack>
        </Box>

        {/* Футер ВСЕГДА снизу */}
        <Flex justify="end" gap="md" pt={16} pb={8} pr="md" style={{ borderTop: "1px solid var(--mantine-color-gray-3)" }}>
          <Button variant="outline" onClick={handleReset} size="xs">
            {getLanguageByKey("Reset")}
          </Button>
          <Button variant="outline" onClick={onClose} size="xs">
            {getLanguageByKey("Anulează")}
          </Button>
          <Button onClick={handleApply} size="xs">
            {getLanguageByKey("Aplică")}
          </Button>
        </Flex>
      </Box>
    </Modal>
  );
};
