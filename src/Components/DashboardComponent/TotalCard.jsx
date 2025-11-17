import React from "react";
import {
    Card, Group, Stack, Text, Progress, Divider, Badge, ThemeIcon, Tooltip, Box, Flex
} from "@mantine/core";
import { format } from "date-fns";
import { getLanguageByKey } from "@utils";
import { MdCall, MdCallReceived, MdCallMade, MdMessage, MdSend, MdTrendingUp, MdTrendingDown } from "react-icons/md";

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

// Функция для получения цветовой схемы на основе типа виджета
const getWidgetColors = (widgetType) => {
    switch (widgetType) {
        case "messages":
            return {
                in: "green",
                out: "blue",
                totalAccent: "teal",
                bg: "linear-gradient(135deg, rgba(34,197,94,0.08), rgba(59,130,246,0.08))"
            };
        case "calls":
            return {
                in: "green",        // изменен с emerald на green для лучшей видимости
                out: "blue",        // изменен с cyan на blue для лучшей видимости
                totalAccent: "indigo",
                bg: "linear-gradient(135deg, rgba(99,102,241,0.06), rgba(45,212,191,0.06))"
            };
        default:
            return {
                in: "teal",
                out: "blue",
                totalAccent: "indigo",
                bg: "linear-gradient(135deg, rgba(99,102,241,0.06), rgba(45,212,191,0.06))"
            };
    }
};

export const TotalCard = ({
    totalAll,
    totalIncoming,
    totalOutgoing,
    dateRange,
    title,
    subtitle,
    colors,
    icons = {},
    sizeInfo,
    sizePx,
    bg,
    widgetType = "calls",
    previousData, // Для трендов в будущем
}) => {
    const inPct = percent(totalIncoming, totalAll);
    const outPct = percent(totalOutgoing, totalAll);

    // Используем динамические цвета или переданные
    const widgetColors = colors || getWidgetColors(widgetType);

    // Выбираем иконки в зависимости от типа виджета
    const getDefaultIcons = (type) => {
        if (type === "messages") {
            return {
                total: <MdMessage size={20} />,
                incoming: <MdMessage size={16} />,
                outgoing: <MdSend size={16} />
            };
        }
        // По умолчанию для calls
        return {
            total: <MdCall size={20} />,
            incoming: <MdCallReceived size={16} />,
            outgoing: <MdCallMade size={16} />
        };
    };

    const defaultIcons = getDefaultIcons(widgetType);
    const TotalIconNode = icons.total ?? defaultIcons.total;
    const IncomingIconNode = icons.incoming ?? defaultIcons.incoming;
    const OutgoingIconNode = icons.outgoing ?? defaultIcons.outgoing;

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
                            gradient={{ from: widgetColors.totalAccent, to: widgetColors.totalAccent, deg: 45 }}
                        >
                            {TotalIconNode}
                        </ThemeIcon>
                        <Box>
                            <Text size="xs" c="dimmed" fw={700} tt="uppercase" style={{ letterSpacing: 0.8 }}>
                                {title || (widgetType === "messages" ? getLanguageByKey("Total messages for the period") : getLanguageByKey("Total calls for the period"))}
                            </Text>
                            {subtitle && (
                                <Text size="sm" fw={600} c="dark" mt={2}>
                                    {subtitle}
                                </Text>
                            )}
                        </Box>
                    </Group>

                    <Group gap={6} wrap="wrap" mt="xs">
                        <Badge variant="light" color="blue" size="sm">
                            {widgetType === "messages" 
                                ? getLanguageByKey("Messages") 
                                : widgetType === "calls" 
                                    ? getLanguageByKey("Calls") 
                                    : getLanguageByKey(widgetType) || widgetType}
                        </Badge>
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
                        <Text fz={42} fw={900} style={{ lineHeight: 1, color: `var(--mantine-color-${widgetColors.totalAccent}-6)` }}>
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
                                color={widgetColors.in}
                                style={{ border: `1px solid var(--mantine-color-${widgetColors.in}-3)` }}
                            >
                                {IncomingIconNode}
                            </ThemeIcon>
                            <Text size="sm" fw={600} c={`${widgetColors.in}.7`}>
                                {getLanguageByKey("Incoming")}
                            </Text>
                        </Group>
                        <Box style={{ textAlign: "right" }}>
                            <Text size="lg" fw={800} c={`${widgetColors.in}.6`}>
                                {fmt(totalIncoming)}
                            </Text>
                            <Text size="xs" c="dimmed">
                                {widgetType === "messages" ? getLanguageByKey("messages") : getLanguageByKey("calls")}
                            </Text>
                        </Box>
                    </Flex>
                    <Progress
                        value={inPct}
                        size="lg"
                        radius="xl"
                        color={widgetColors.in}
                        style={{
                            backgroundColor: `var(--mantine-color-${widgetColors.in}-1)`
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
                                color={widgetColors.out}
                                style={{ border: `1px solid var(--mantine-color-${widgetColors.out}-3)` }}
                            >
                                {OutgoingIconNode}
                            </ThemeIcon>
                            <Text size="sm" fw={600} c={`${widgetColors.out}.7`}>
                                {getLanguageByKey("Outgoing")}
                            </Text>
                        </Group>
                        <Box style={{ textAlign: "right" }}>
                            <Text size="lg" fw={800} c={`${widgetColors.out}.6`}>
                                {fmt(totalOutgoing)}
                            </Text>
                            <Text size="xs" c="dimmed">
                                {widgetType === "messages" ? getLanguageByKey("messages") : getLanguageByKey("calls")}
                            </Text>
                        </Box>
                    </Flex>
                    <Progress
                        value={outPct}
                        size="lg"
                        radius="xl"
                        color={widgetColors.out}
                        style={{
                            backgroundColor: `var(--mantine-color-${widgetColors.out}-1)`
                        }}
                    />
                </Box>
            </Stack>
        </Card>
    );
};
