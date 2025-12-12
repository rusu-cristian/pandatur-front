import { useEffect, useState, useMemo } from "react";
import { Box, Text, Flex, Paper, Group, ActionIcon, TextInput } from "@mantine/core";
import { dashboard } from "../../api/dashboard";
import { useGetTechniciansList } from "../../hooks";
import { PageHeader } from "../PageHeader";
import { LuFilter } from "react-icons/lu";
import { CallStatsChartCard } from "./CallStatsChartCards";
import { Spin } from "@components";
import { getLanguageByKey } from "../utils";

const COLORS = {
    total: "#0f824c",
    bgMain: "#fff",
    to: "#81c784",
    from: "#4fc3f7",
    textMain: "#232b3a",
};

const formatDuration = (totalSeconds = 0) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = Math.floor(totalSeconds % 60);
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
};

const isFilterActive = (filters) => {
    if (!filters) return false;
    return Object.entries(filters).some(([_, value]) => {
        if (Array.isArray(value)) return value.length > 0;
        if (typeof value === "object" && value !== null) return Object.keys(value).length > 0;
        return value !== undefined && value !== null && value !== "";
    });
};

export const CallStatsChart = () => {
    const [stats, setStats] = useState({
        data: [],
        total_all_users: 0,
        total_calls_from: 0,
        total_calls_to: 0,
        total_duration: 0,
        total_duration_from: 0,
        total_duration_to: 0,
    });

    const { technicians } = useGetTechniciansList();
    const [filterModalOpen, setFilterModalOpen] = useState(false);
    const [filters, setFilters] = useState({});
    const [search, setSearch] = useState("");
    const [searchValue, setSearchValue] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const timeout = setTimeout(() => setSearchValue(search), 400);
        return () => clearTimeout(timeout);
    }, [search]);

    const techniciansMap = useMemo(() => {
        const map = new Map();
        (technicians || []).forEach((tech) => {
            if (!tech.value || !tech.label || tech.value.startsWith("__group__")) return;
            map.set(String(tech.value), tech.label);
        });
        return map;
    }, [technicians]);

    useEffect(() => {
        setLoading(true);
        dashboard.getCallStats({
            mode: "stats",
            sort_by: "total_duration",
            order: "DESC",
            attributes: {
                ...filters,
                timestamp: {
                    from: "01-07-2025",
                    until: "30-07-2025",
                },
            },
        }).then((res) => {
            setStats({
                data: res.data || [],
                total_all_users: res.total_all_users,
                total_calls_from: res.total_calls_from,
                total_calls_to: res.total_calls_to,
                total_duration: res.total_duration,
                total_duration_from: res.total_duration_from,
                total_duration_to: res.total_duration_to,
            });
            setLoading(false);
        }).catch((err) => {
            setLoading(false);
            console.error("Ошибка загрузки статистики:", err);
        });
    }, [filters]);

    const filteredData = useMemo(() => {
        if (!searchValue) return stats.data || [];
        const searchLC = searchValue.toLowerCase();
        return (stats.data || []).filter((user) => {
            const name = techniciansMap.get(String(user.user_id)) || "";
            return name.toLowerCase().includes(searchLC);
        });
    }, [searchValue, stats.data, techniciansMap]);

    return (
        <Box
            h="calc(100vh - 24px)"
            style={{
                overflowY: "auto",
                padding: "32px 0",
                background: COLORS.bgMain,
                minHeight: "100vh",
            }}
        >
            <Box px={32} mb={32}>
                <Flex align="center" justify="space-between" mb={20}>
                    <PageHeader
                        title={getLanguageByKey("CallStatsTitle")}
                        count={filteredData.length}
                        badgeColor={COLORS.total}
                        withDivider={false}
                    />
                    <Flex align="center" gap={12}>
                        <ActionIcon
                            variant={isFilterActive(filters) ? "filled" : "default"}
                            color={isFilterActive(filters) ? COLORS.total : "gray"}
                            size="lg"
                            onClick={() => setFilterModalOpen(true)}
                            title={getLanguageByKey("Filter")}
                            style={{
                                border: isFilterActive(filters)
                                    ? `1.5px solid ${COLORS.total}`
                                    : undefined,
                                background: isFilterActive(filters) ? COLORS.total : undefined,
                                color: isFilterActive(filters) ? "white" : undefined,
                                boxShadow: isFilterActive(filters)
                                    ? "0 2px 12px 0 rgba(15,130,76,0.12)"
                                    : undefined,
                            }}
                        >
                            <LuFilter size={22} />
                        </ActionIcon>
                        <TextInput
                            w={320}
                            placeholder={getLanguageByKey("SearchByTechnicianName")}
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            style={{ minWidth: 220 }}
                        />
                    </Flex>
                </Flex>
            </Box>
            <Box px={32} mb={32}>
                <Paper
                    withBorder
                    radius="lg"
                    p="xl"
                    mb="xl"
                    style={{
                        background: "#fff",
                        boxShadow: "0 4px 24px 0 rgba(18,36,64,0.08)",
                    }}
                >
                    <Flex align="center" gap={40} wrap="wrap">
                        <Group>
                            <Text fw={700} c={COLORS.textMain} size="xl">{getLanguageByKey("TotalCalls")}:</Text>
                            <Text fw={700} c={COLORS.total} size="xl">{stats.total_all_users}</Text>
                        </Group>
                        <Group>
                            <Text c={COLORS.to} fw={600} size="lg">{getLanguageByKey("Incoming")}:</Text>
                            <Text fw={700} c={COLORS.to} size="xl">{stats.total_calls_from}</Text>
                            <Text c={COLORS.from} fw={600} ml="xl" size="lg">{getLanguageByKey("Outgoing")}:</Text>
                            <Text fw={700} c={COLORS.from} size="xl">{stats.total_calls_to}</Text>
                        </Group>
                        <Group>
                            <Text c={COLORS.textMain} fw={600} size="lg">{getLanguageByKey("TotalDuration")}:</Text>
                            <Text fw={700} c={COLORS.total} size="xl">
                                {formatDuration(stats.total_duration)}
                            </Text>
                        </Group>
                        <Group>
                            <Text c={COLORS.to} fw={600} size="lg">{getLanguageByKey("IncomingDuration")}:</Text>
                            <Text fw={700} c={COLORS.to} size="xl">{formatDuration(stats.total_duration_from)}</Text>
                            <Text c={COLORS.from} fw={600} ml="xl" size="lg">{getLanguageByKey("OutgoingDuration")}:</Text>
                            <Text fw={700} c={COLORS.from} size="xl">{formatDuration(stats.total_duration_to)}</Text>
                        </Group>
                    </Flex>
                </Paper>
            </Box>
            <Box px={32}>
                {loading ? (
                    <Spin />
                ) : (
                    filteredData.length === 0
                        ? <Text c="dimmed" ta="center" mt={48}>{getLanguageByKey("NoDataForPeriod")}</Text>
                        : filteredData.map((user) => (
                            <CallStatsChartCard
                                key={user.user_id}
                                user={user}
                                fullName={techniciansMap.get(String(user.user_id))}
                            />
                        ))
                )}
            </Box>
        </Box>
    );
};
