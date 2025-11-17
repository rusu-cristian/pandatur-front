import React from "react";
import {
    Card, Group, Stack, Text, Progress, Divider, Badge, ThemeIcon, Tooltip, Box, Flex
} from "@mantine/core";
import { format } from "date-fns";
import { getLanguageByKey } from "@utils";
import { MdCall, MdCallReceived, MdCallMade, MdTrendingUp, MdTrendingDown } from "react-icons/md";

const fmt = (n) => (typeof n === "number" ? n.toLocaleString() : "-");
const percent = (part, total) => {
    const p = total > 0 ? (part / total) * 100 : 0;
    return Math.max(0, Math.min(100, Number.isFinite(p) ? p : 0));
};

// Функция для определения тренда (можно расширить в будущем)
const getTrendIcon = (value, previousValue) => {
    if (value > previousValue) return <MdTrendingUp size={12} />;
    if (value < previousValue) return <MdTrendingDown size={12} />;
    return null;
};

// Цветовая схема для виджетов звонков
const CALLS_COLORS = {
    in: "green",
    out: "blue",
    totalAccent: "indigo",
    bg: "linear-gradient(135deg, rgba(99,102,241,0.06), rgba(45,212,191,0.06))"
};

export const CallsCard = ({
    totalAll,
    totalIncoming,
    totalOutgoing,
    dateRange,
    title,
    subtitle,
    sizeInfo,
    sizePx,
    bg,
    previousData, // Для трендов в будущем
}) => {
    const inPct = percent(totalIncoming, totalAll);
    const outPct = percent(totalOutgoing, totalAll);

    const pxLabel =
        sizePx && Number.isFinite(sizePx.width) && Number.isFinite(sizePx.height)
            ? `${Math.round(sizePx.width)}×${Math.round(sizePx.height)}px`
            : null;

    return (
        <Card
            withBorder
            radius="xl"
            p="lg"
            style={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                borderColor: "var(--crm-ui-kit-palette-border-default)",
                transition: "all 0.2s ease",
            }}
        >
            {/* Header */}
            <Flex justify="space-between" align="flex-start" mb="md">
                <Flex direction="column" gap="xs" style={{ flex: 1 }}>
                    <Group gap="sm" align="center">
                        <ThemeIcon
                            size="xl"
                            radius="xl"
                            variant="gradient"
                            gradient={{ from: CALLS_COLORS.totalAccent, to: CALLS_COLORS.totalAccent, deg: 45 }}
                        >
                            <MdCall size={20} />
                        </ThemeIcon>
                        <Box>
                            <Text size="xs" c="dimmed" fw={700} tt="uppercase" style={{ letterSpacing: 0.8 }}>
                                {title || getLanguageByKey("Total calls for the period")}
                            </Text>
                            {subtitle && (
                                <Text size="sm" fw={600} c="dark" mt={2}>
                                    {subtitle}
                                </Text>
                            )}
                        </Box>
                    </Group>

                    <Group gap={6} wrap="wrap" mt="xs">
                        <Badge variant="light" color="gray" size="sm">
                            {dateRange?.[0] ? format(dateRange[0], "dd.MM.yyyy") : "—"} →{" "}
                            {dateRange?.[1] ? format(dateRange[1], "dd.MM.yyyy") : "—"}
                        </Badge>
                        {sizeInfo && (
                            <Badge variant="outline" color="gray" size="sm">{sizeInfo}</Badge>
                        )}
                        {pxLabel && (
                            <Tooltip label="Текущий размер в пикселях">
                                <Badge variant="outline" color="gray" size="sm">{pxLabel}</Badge>
                            </Tooltip>
                        )}
                    </Group>
                </Flex>

                <Box style={{ textAlign: "right" }}>
                    <Group gap="xs" align="center" justify="flex-end">
                        <Text fz={42} fw={900} style={{ lineHeight: 1, color: `var(--mantine-color-${CALLS_COLORS.totalAccent}-6)` }}>
                            {fmt(totalAll)}
                        </Text>
                        {getTrendIcon(totalAll, previousData?.totalAll)}
                    </Group>
                    <Text size="xs" c="dimmed" fw={600} mt={-4}>
                        {getLanguageByKey("Total")}
                    </Text>
                </Box>
            </Flex>

            <Divider my="md" />

            {/* Body */}
            <Stack gap="lg" style={{ flex: 1 }}>
                {/* Incoming */}
                <Box>
                    <Flex justify="space-between" align="center" mb="xs">
                        <Group gap="xs" align="center">
                            <ThemeIcon
                                size="md"
                                radius="lg"
                                variant="light"
                                color={CALLS_COLORS.in}
                                style={{ border: `1px solid var(--mantine-color-${CALLS_COLORS.in}-3)` }}
                            >
                                <MdCallReceived size={16} />
                            </ThemeIcon>
                            <Text size="sm" fw={600} c={`${CALLS_COLORS.in}.7`}>
                                {getLanguageByKey("Incoming")}
                            </Text>
                        </Group>
                        <Box style={{ textAlign: "right" }}>
                            <Text size="lg" fw={800} c={`${CALLS_COLORS.in}.6`}>
                                {fmt(totalIncoming)}
                            </Text>
                            <Text size="xs" c="dimmed">
                                {getLanguageByKey("calls")}
                            </Text>
                        </Box>
                    </Flex>
                    <Progress
                        value={inPct}
                        size="lg"
                        radius="xl"
                        color={CALLS_COLORS.in}
                        style={{
                            backgroundColor: `var(--mantine-color-${CALLS_COLORS.in}-1)`
                        }}
                    />
                </Box>

                {/* Outgoing */}
                <Box>
                    <Flex justify="space-between" align="center" mb="xs">
                        <Group gap="xs" align="center">
                            <ThemeIcon
                                size="md"
                                radius="lg"
                                variant="light"
                                color={CALLS_COLORS.out}
                                style={{ border: `1px solid var(--mantine-color-${CALLS_COLORS.out}-3)` }}
                            >
                                <MdCallMade size={16} />
                            </ThemeIcon>
                            <Text size="sm" fw={600} c={`${CALLS_COLORS.out}.7`}>
                                {getLanguageByKey("Outgoing")}
                            </Text>
                        </Group>
                        <Box style={{ textAlign: "right" }}>
                            <Text size="lg" fw={800} c={`${CALLS_COLORS.out}.6`}>
                                {fmt(totalOutgoing)}
                            </Text>
                            <Text size="xs" c="dimmed">
                                {getLanguageByKey("calls")}
                            </Text>
                        </Box>
                    </Flex>
                    <Progress
                        value={outPct}
                        size="lg"
                        radius="xl"
                        color={CALLS_COLORS.out}
                        style={{
                            backgroundColor: `var(--mantine-color-${CALLS_COLORS.out}-1)`
                        }}
                    />
                </Box>
            </Stack>
        </Card>
    );
};

