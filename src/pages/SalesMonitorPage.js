import { useEffect, useState } from "react";
import { Box, Paper, Text, Button, Group, Flex } from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { activity } from "../api/activity";
import { PageHeader } from "../Components/PageHeader";
import { SalesMonitorTable } from "../Components/CallStats/SalesMonitorTable";
import { getLanguageByKey } from "../Components/utils";
import { Spin } from "@components";

const COLORS = {
    total: "var(--crm-ui-kit-palette-link-primary)",
    bgMain: "var(--crm-ui-kit-palette-background-default)",
};

export const SalesMonitorPage = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [dateAfter, setDateAfter] = useState(null);
    const [dateBefore, setDateBefore] = useState(null);
    const [groupTitles, setGroupTitles] = useState(["MD"]);
    const [types, setTypes] = useState([0, 1]);

    // Устанавливаем дефолтные даты (последний месяц)
    useEffect(() => {
        const today = new Date();
        const lastMonth = new Date();
        lastMonth.setMonth(today.getMonth() - 1);
        
        setDateAfter(lastMonth);
        setDateBefore(today);
    }, []);

    const fetchData = async () => {
        if (!dateAfter || !dateBefore) return;

        setLoading(true);
        try {
            const res = await activity.salesMonitor({
                group_titles: groupTitles,
                attributes: {
                    timestamp_after: dateAfter.toISOString().split("T")[0],
                    timestamp_before: dateBefore.toISOString().split("T")[0],
                },
                types: types,
            });
            setData(res || []);
        } catch (err) {
            console.error("Error fetching sales monitor data:", err);
            setData([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (dateAfter && dateBefore) {
            fetchData();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dateAfter, dateBefore, groupTitles, types]);

    const handleApplyFilters = () => {
        fetchData();
    };

    return (
        <Box
            h="100vh"
            style={{
                background: COLORS.bgMain,
                display: "flex",
                flexDirection: "column",
            }}
        >
            <Box px={32} py={24} style={{ flexShrink: 0 }}>
                <PageHeader
                    title={getLanguageByKey("Sales Monitor") || "Sales Monitor"}
                    count={data.length}
                    badgeColor={COLORS.total}
                    withDivider={false}
                />
            </Box>

            <Box px={32} pb={24} style={{ flexShrink: 0 }}>
                <Paper p="md" radius="md" withBorder>
                    <Group gap="md" align="flex-end">
                        <DatePickerInput
                            label={getLanguageByKey("Date From") || "Date From"}
                            value={dateAfter}
                            onChange={setDateAfter}
                            placeholder="Select date"
                            style={{ flex: 1 }}
                        />
                        <DatePickerInput
                            label={getLanguageByKey("Date To") || "Date To"}
                            value={dateBefore}
                            onChange={setDateBefore}
                            placeholder="Select date"
                            style={{ flex: 1 }}
                        />
                        <Button onClick={handleApplyFilters} loading={loading}>
                            {getLanguageByKey("Apply") || "Apply"}
                        </Button>
                    </Group>
                </Paper>
            </Box>

            <Box style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, px: 32, pb: 32 }}>
                <Paper
                    p="md"
                    radius="md"
                    withBorder
                    style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}
                >
                    {loading ? (
                        <Flex justify="center" align="center" style={{ flex: 1 }}>
                            <Spin />
                        </Flex>
                    ) : (
                        <Box style={{ flex: 1, overflow: "auto" }}>
                            <SalesMonitorTable data={data} />
                        </Box>
                    )}
                </Paper>
            </Box>
        </Box>
    );
};
