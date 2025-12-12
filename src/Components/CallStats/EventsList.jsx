import { useEffect, useState } from "react";
import { Box, Flex, ActionIcon, Pagination, Tooltip, Text } from "@mantine/core";
import { activity } from "../../api/activity";
import { RcTable } from "../RcTable";
import { getLanguageByKey } from "../utils";
import { LuFilter } from "react-icons/lu";
import { PageHeader } from "../PageHeader";
import { EventsFilterModal } from "./EventsFilterModal";
import { getChangedFields } from "../utils/logsUtils";

const COLORS = {
    total: "var(--crm-ui-kit-palette-link-primary)",
    bgMain: "var(--crm-ui-kit-palette-background-default)",
};

const PAGE_SIZE = 20;
const DEFAULT_EVENTS = ["Lead", "Task", "Client"];

export const EventsList = () => {
    const [data, setData] = useState([]);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: PAGE_SIZE,
        total: 0,
        total_pages: 1,
    });
    const [loading, setLoading] = useState(false);

    const [filters, setFilters] = useState({ event: DEFAULT_EVENTS });
    const [filterModalOpen, setFilterModalOpen] = useState(false);

    const fetchData = async (page = 1, customFilters = filters) => {
        setLoading(true);
        try {
            const res = await activity.filterLogs({
                page,
                limit: PAGE_SIZE,
                attributes: { ...customFilters, event: customFilters.event?.length ? customFilters.event : DEFAULT_EVENTS }
            });
            setData(res.data || []);
            setPagination({
                page: res.pagination.page,
                limit: res.pagination.limit,
                total: res.pagination.total,
                total_pages: res.pagination.total_pages
            });
        } catch (e) {
            setData([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData(1, filters);
        // eslint-disable-next-line
    }, []);

    useEffect(() => {
        fetchData(1, filters);
        setPagination((prev) => ({ ...prev, page: 1 }));
        // eslint-disable-next-line
    }, [filters]);

    const columns = [
        {
            title: getLanguageByKey("ID"),
            dataIndex: "id",
            width: 70,
            align: "center",
        },
        {
            title: getLanguageByKey("User"),
            dataIndex: "user_identifier",
            width: 180,
        },
        {
            title: getLanguageByKey("IP Address"),
            dataIndex: "ip_address",
            width: 150,
        },
        {
            title: getLanguageByKey("DateTime"),
            dataIndex: "timestamp",
            width: 170,
        },
        {
            title: getLanguageByKey("Event"),
            dataIndex: "event",
            width: 100,
            align: "center"
        },
        {
            title: getLanguageByKey("Object Type"),
            dataIndex: ["object", "type"],
            render: (_, row) => row.object?.type || "-",
            width: 180,
        },
        {
            title: getLanguageByKey("Object ID"),
            dataIndex: ["object", "id"],
            render: (_, row) => row.object?.id || "-",
            width: 100,
            align: "center",
        },
        {
            width: 500,
            key: "changes",
            title: getLanguageByKey("Detalii"),
            dataIndex: "data",
            align: "left",
            render: (data, record) => {
                const obj = record.object || {};
                const hasObjInfo = obj?.id || obj?.type;
                const objectIdLabel = obj.id || "-";

                if (!data) {
                    return (
                        <Box>
                            {hasObjInfo && (
                                <Text size="md" mb={4}>
                                    <b>{getLanguageByKey("Tip:")}</b> {obj.type ? obj.type : "-"}{" "}
                                    <b>{getLanguageByKey("ID obiect:")}</b> {objectIdLabel}{" "}
                                </Text>
                            )}
                            <Text size="md">{getLanguageByKey("Fără modificări")}</Text>
                        </Box>
                    );
                }
                const changes = getChangedFields(data.before, data.after);
                if (changes.length === 0) {
                    return (
                        <Box>
                            {hasObjInfo && (
                                <Text size="md" mb={4}>
                                    <b>{getLanguageByKey("Tip:")}</b> {obj.type ? obj.type : "-"}{" "}
                                    <b>{getLanguageByKey("ID obiect:")}</b> {objectIdLabel}{" "}
                                </Text>
                            )}
                            <Text size="md">{getLanguageByKey("Fără modificări")}</Text>
                        </Box>
                    );
                }
                return (
                    <Box>
                        {hasObjInfo && (
                            <Text size="md" mb={4}>
                                <b>{getLanguageByKey("Tip:")}</b> {obj.type ? obj.type : "-"}{" "}
                                <b>{getLanguageByKey("ID obiect:")}</b> {objectIdLabel}{" "}
                            </Text>
                        )}
                        {changes.map((ch, i) =>
                            <Text size="md" key={i}>
                                <b>{ch.field}:</b>{" "}
                                <span style={{ color: "#ef4444" }}>{String(ch.from)}</span>
                                <span style={{
                                    fontWeight: 700,
                                    color: "var(--crm-ui-kit-palette-text-secondary-light)",
                                    margin: "0 6px"
                                }}>→</span>
                                <span style={{ color: "#22c55e" }}>{String(ch.to)}</span>
                            </Text>
                        )}
                    </Box>
                );
            },
        },
    ];

    const handleApplyFilters = (newFilters) => {
        setFilters({ ...newFilters, event: newFilters.event?.length ? newFilters.event : DEFAULT_EVENTS });
    };

    return (
        <Box
            h="120vh"
            style={{
                background: COLORS.bgMain,
                display: "flex",
                flexDirection: "column",
            }}
        >
            <Box px={32} py={24} style={{ flexShrink: 0 }}>
                <PageHeader
                    title={getLanguageByKey("Events")}
                    count={pagination.total}
                    badgeColor={COLORS.total}
                    withDivider={false}
                    extraInfo={
                        <ActionIcon
                            variant={filters.event?.length > 0 ? "filled" : "default"}
                            size="36"
                            onClick={() => setFilterModalOpen(true)}
                            title={getLanguageByKey("Filter")}
                        >
                            <LuFilter size={16} />
                        </ActionIcon>
                    }
                />
            </Box>

            <Box style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
                <div style={{ flex: 1, overflow: "hidden" }}>
                    <RcTable
                        columns={columns}
                        data={data}
                        loading={loading}
                        rowKey="id"
                        style={{ minWidth: 920, height: "100%" }}
                        scroll={{ y: "100%" }}
                    />
                </div>

                <Flex
                    pt={24}
                    pb={24}
                    justify="center"
                    style={{
                        flexShrink: 0,
                        borderTop: "1px solid var(--crm-ui-kit-palette-border-primary)",
                        backgroundColor: "var(--crm-ui-kit-palette-background-primary)"
                    }}
                >
                    <Pagination
                        total={pagination.total_pages}
                        value={pagination.page}
                        onChange={page => {
                            setPagination(prev => ({ ...prev, page }));
                            fetchData(page, filters);
                        }}
                        size="md"
                    />
                </Flex>
            </Box>
            <EventsFilterModal
                opened={filterModalOpen}
                onClose={() => setFilterModalOpen(false)}
                onApply={handleApplyFilters}
                initialFilters={filters}
            />
        </Box>
    );
};
