import { useEffect, useState, useMemo } from "react";
import {
  Box,
  Flex,
  ActionIcon,
  TextInput,
  SegmentedControl,
  Text,
  Paper,
  Group,
} from "@mantine/core";
import { useParams, useNavigate } from "react-router-dom";
import { dashboard } from "../api/dashboard";
import { useGetTechniciansList } from "../hooks";
import { PageHeader } from "../Components/PageHeader";
import { LuFilter } from "react-icons/lu";
import { CallListTable } from "../Components/CallStats/CallListTable";
import { CallStatsChartCard } from "../Components/CallStats/CallStatsChartCards";
import { Spin } from "@components";
import SingleChat from "@components/ChatComponent/SingleChat";
import { ChatModal } from "../Components/ChatComponent/ChatModal";
import { getLanguageByKey } from "../Components/utils";
import { CallStatsFilterModal } from "../Components/CallStats/CallStatsFilterModal";

const COLORS = {
  total: "var(--crm-ui-kit-palette-link-primary)",
  bgMain: "var(--crm-ui-kit-palette-background-default)",
  to: "#81c784",
  from: "#4fc3f7",
  textMain: "var(--crm-ui-kit-palette-text-primary)",
};

const formatDuration = (totalSeconds = 0) => {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s
    .toString()
    .padStart(2, "0")}`;
};

const isFilterActive = (filters) => {
  if (!filters) return false;
  return Object.entries(filters).some(([_, value]) => {
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === "object" && value !== null)
      return Object.keys(value).length > 0;
    return value !== undefined && value !== null && value !== "";
  });
};

export const CallStatsPage = () => {
  const [mode, setMode] = useState("stats");
  const [statsData, setStatsData] = useState([]);
  const [statsSummary, setStatsSummary] = useState({
    total_all_users: 0,
    total_calls_from: 0,
    total_calls_to: 0,
    total_duration: 0,
    total_duration_from: 0,
    total_duration_to: 0,
  });
  const [callList, setCallList] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    total_pages: 1,
    total: 0,
  });
  const [loading, setLoading] = useState(false);

  const { technicians } = useGetTechniciansList();
  const [filters, setFilters] = useState({});
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [searchValue, setSearchValue] = useState("");

  const { ticketId } = useParams();
  const navigate = useNavigate();
  const closeChat = () => navigate("/analytics/calls");

  useEffect(() => {
    if (mode === "stats") {
      const timeout = setTimeout(() => setSearchValue(search), 400);
      return () => clearTimeout(timeout);
    }
  }, [search, mode]);

  const techniciansMap = useMemo(() => {
    const map = new Map();
    (technicians || []).forEach((tech) => {
      if (!tech.value || !tech.label || tech.value.startsWith("__group__"))
        return;
      map.set(String(tech.value), tech.label);
    });
    return map;
  }, [technicians]);

  useEffect(() => {
    setLoading(true);

    if (mode === "stats") {
      dashboard
        .getCallStats({
          mode: "stats",
          sort_by: "total_duration",
          order: "DESC",
          attributes: {
            ...filters,
          },
        })
        .then((res) => {
          setStatsData(res.data || []);
          setStatsSummary({
            total_all_users: res.total_all_users || 0,
            total_calls_from: res.total_calls_from || 0,
            total_calls_to: res.total_calls_to || 0,
            total_duration: res.total_duration || 0,
            total_duration_from: res.total_duration_from || 0,
            total_duration_to: res.total_duration_to || 0,
          });
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }

    if (mode === "calls") {
      dashboard
        .getCallStats({
          mode: "calls",
          page: pagination.page,
          limit: 100,
          sort_by: "timestamp",
          order: "DESC",
          attributes: { ...filters },
        })
        .then((res) => {
          setCallList(res.data || []);
          setPagination({
            page: res.pagination?.page || 1,
            total_pages: res.pagination?.total_pages || 1,
            total: res.pagination?.total || 0,
          });
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
    // eslint-disable-next-line
  }, [mode, filters, pagination.page]);

  const filteredStats = useMemo(() => {
    if (!searchValue) return statsData || [];
    const searchLC = searchValue.toLowerCase();
    return (statsData || []).filter((user) => {
      const name = techniciansMap.get(String(user.user_id)) || "";
      return name.toLowerCase().includes(searchLC);
    });
  }, [searchValue, statsData, techniciansMap]);

  const filteredCalls = useMemo(() => callList || [], [callList]);

  const handlePageChange = (p) =>
    setPagination((prev) => ({ ...prev, page: p }));

  return (
    <Box
      h="calc(100vh - 24px)"
      style={{
        overflowY: "auto",
        background: COLORS.bgMain,
        minHeight: "120vh",
      }}
    >
      <Box px={32} mb={32}>
        <PageHeader
          title={
            mode === "stats"
              ? getLanguageByKey("CallStats")
              : getLanguageByKey("AllCalls")
          }
          count={mode === "stats" ? filteredStats.length : pagination.total}
          badgeColor={COLORS.total}
          withDivider={false}
          extraInfo={
            <>
              <ActionIcon
                variant={isFilterActive(filters) ? "filled" : "default"}
                size="36"
                onClick={() => setFilterModalOpen(true)}
                title={getLanguageByKey("Filter")}
              >
                <LuFilter size={16} />
              </ActionIcon>

              {mode === "stats" && (
                <TextInput
                  w={320}
                  placeholder={getLanguageByKey("SearchTechnician")}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ minWidth: 220 }}
                  className="min-w-300"
                />
              )}

              <SegmentedControl
                value={mode}
                onChange={(value) => {
                  setMode(value);
                  setPagination({ page: 1, total_pages: 1, total: 0 });
                }}
                data={[
                  { label: getLanguageByKey("Stats"), value: "stats" },
                  { label: getLanguageByKey("Calls"), value: "calls" },
                ]}
              />
            </>
          }
        />
      </Box>

      {mode === "stats" && (
        <Box px={32} mb={32}>
          <Paper
            withBorder
            radius="lg"
            p="xl"
            mb="xl"
            style={{
              background: "var(--crm-ui-kit-palette-background-primary)",
              boxShadow: "var(--crm-ui-kit-palette-content-block-box-shadow)",
            }}
          >
            <Flex align="center" gap={40} wrap="wrap">
              <Group>
                <Text fw={700} c={COLORS.textMain} size="xl">
                  {getLanguageByKey("TotalCalls")}
                </Text>
                <Text fw={700} c={COLORS.total} size="xl">
                  {statsSummary.total_all_users}
                </Text>
              </Group>
              <Group>
                <Text c={COLORS.to} fw={600} size="lg">
                  {getLanguageByKey("Incoming")}
                </Text>
                <Text fw={700} c={COLORS.to} size="xl">
                  {statsSummary.total_calls_from}
                </Text>
                <Text c={COLORS.from} fw={600} ml="xl" size="lg">
                  {getLanguageByKey("Outgoing")}
                </Text>
                <Text fw={700} c={COLORS.from} size="xl">
                  {statsSummary.total_calls_to}
                </Text>
              </Group>
              <Group>
                <Text c={COLORS.textMain} fw={600} size="lg">
                  {getLanguageByKey("TotalDuration")}
                </Text>
                <Text fw={700} c={COLORS.total} size="xl">
                  {formatDuration(statsSummary.total_duration)}
                </Text>
              </Group>
              <Group>
                <Text c={COLORS.to} fw={600} size="lg">
                  {getLanguageByKey("IncomingDuration")}
                </Text>
                <Text fw={700} c={COLORS.to} size="xl">
                  {formatDuration(statsSummary.total_duration_from)}
                </Text>
                <Text c={COLORS.from} fw={600} ml="xl" size="lg">
                  {getLanguageByKey("OutgoingDuration")}
                </Text>
                <Text fw={700} c={COLORS.from} size="xl">
                  {formatDuration(statsSummary.total_duration_to)}
                </Text>
              </Group>
            </Flex>
          </Paper>
        </Box>
      )}

      <Box px={32}>
        {mode === "stats" &&
          (loading ? (
            <Flex align="center" justify="center" mt={48}>
              <Spin />
            </Flex>
          ) : filteredStats.length === 0 ? (
            <Text c="dimmed" ta="center" mt={48}>
              {getLanguageByKey("NoData")}
            </Text>
          ) : (
            filteredStats.map((user) => (
              <CallStatsChartCard
                key={user.user_id}
                user={user}
                fullName={techniciansMap.get(String(user.user_id))}
              />
            ))
          ))}

        {mode === "calls" && (
          <CallListTable
            data={filteredCalls}
            pagination={pagination}
            onPageChange={handlePageChange}
            loading={loading}
            techniciansMap={techniciansMap}
          />
        )}
      </Box>

      <CallStatsFilterModal
        opened={filterModalOpen}
        onClose={() => setFilterModalOpen(false)}
        onApply={(newFilters) => {
          setFilters(newFilters);
          setPagination((prev) => ({ ...prev, page: 1 }));
        }}
        initialFilters={filters}
        technicians={technicians}
        mode={mode}
      />

      <ChatModal opened={!!ticketId} onClose={closeChat}>
        {ticketId && (
          <SingleChat
            ticketId={ticketId}
            onClose={closeChat}
            technicians={technicians}
          />
        )}
      </ChatModal>
    </Box>
  );
};
