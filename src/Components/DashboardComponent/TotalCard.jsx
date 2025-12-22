import React from "react";
import {
    Card, Group, Stack, Text, Progress, Divider, Badge, ThemeIcon, Box, Flex
} from "@mantine/core";
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
    title,
    subtitle,
    width,
    height,
    colors,
    icons = {},
    bg,
    widgetType = "calls",
    previousData, // Для трендов в будущем
    userGroups = [], // Вложенные группы пользователей для by_group_title
    userTechnicians = [], // Вложенные пользователи для by_user_group
}) => {
    // Адаптивные размеры в зависимости от размера виджета
    const isCompact = width < 40 || height < 15;
    const isVeryCompact = width < 30 || height < 12;

    const cardPadding = isVeryCompact ? "md" : isCompact ? "sm" : "lg";
    const titleSize = isVeryCompact ? "md" : isCompact ? "md" : "md";
    const subtitleSize = isVeryCompact ? "md" : isCompact ? "sm" : "sm";
    const totalSize = isVeryCompact ? 24 : isCompact ? 32 : 42;
    const iconSize = isVeryCompact ? "md" : isCompact ? "lg" : "xl";
    const callIconSize = isVeryCompact ? 14 : isCompact ? 16 : 20;
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

    return (
        <Card
            withBorder
            radius="xl"
            p={cardPadding}
            style={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                borderColor: "var(--crm-ui-kit-palette-border-default)",
                transition: "all 0.2s ease",
            }}
        >
            <Stack gap={isVeryCompact ? "md" : "sm"} style={{ flex: 1, height: "100%", minHeight: 0 }}>
                {/* Header */}
                <Flex justify="space-between" align="flex-start" style={{ flemdhrink: 0 }}>
                    <Flex direction="column" gap="md" style={{ flex: 1 }}>
                        <Group gap="sm" align="center">
                            <ThemeIcon
                                size={iconSize}
                                radius="xl"
                                variant="gradient"
                                gradient={{ from: widgetColors.totalAccent, to: widgetColors.totalAccent, deg: 45 }}
                            >
                                {TotalIconNode}
                            </ThemeIcon>
                            <Box>
                                <Text size={titleSize} c="dimmed" fw={700} tt="uppercase" style={{ letterSpacing: 0.8 }}>
                                    {title || (widgetType === "messages" ? getLanguageByKey("Total messages for the period") : getLanguageByKey("Total calls for the period"))}
                                </Text>
                                {subtitle && (
                                    <Text size={subtitleSize} fw={600} c="dark" mt={2}>
                                        {subtitle}
                                    </Text>
                                )}
                            </Box>
                        </Group>

                        <Group gap={6} wrap="wrap" mt="md">
                            <Badge variant="light" color="blue" size="sm">
                                {widgetType === "messages" 
                                    ? getLanguageByKey("Messages") 
                                    : widgetType === "calls" 
                                        ? getLanguageByKey("Calls") 
                                        : getLanguageByKey(widgetType) || widgetType}
                            </Badge>
                        </Group>
                    </Flex>

                    <Box style={{ textAlign: "right" }}>
                        <Group gap="md" align="center" justify="flex-end">
                            <Text fz={totalSize} fw={900} style={{ lineHeight: 1, color: `var(--mantine-color-${widgetColors.totalAccent}-6)` }}>
                                {fmt(totalAll)}
                            </Text>
                            {getTrendIcon(totalAll, previousData?.totalAll)}
                        </Group>
                        <Text size="md" c="dimmed" fw={600} mt={-4}>
                            {getLanguageByKey("Total")}
                        </Text>
                    </Box>
                </Flex>

                <Divider my={isVeryCompact ? "md" : "md"} />

                {/* Прокручиваемая область с контентом */}
                <Box
  className={isVeryCompact ? "crm-scroll compact" : "crm-scroll"}
  style={{ flex: 1, minHeight: 0 }}
>
                    <Stack gap={isVeryCompact ? "md" : "lg"}>
                        {/* Incoming */}
                        <Box>
                            <Flex justify="space-between" align="center" mb="md">
                                <Group gap="md" align="center">
                                    <ThemeIcon
                                        size={isVeryCompact ? "sm" : "md"}
                                        radius="lg"
                                        variant="light"
                                        color={widgetColors.in}
                                        style={{ border: `1px solid var(--mantine-color-${widgetColors.in}-3)` }}
                                    >
                                        {IncomingIconNode}
                                    </ThemeIcon>
                                    <Text size={isVeryCompact ? "md" : "sm"} fw={600} c={`${widgetColors.in}.7`}>
                                        {getLanguageByKey("Incoming")}
                                    </Text>
                                </Group>
                                <Box style={{ textAlign: "right" }}>
                                    <Text size={isVeryCompact ? "sm" : "lg"} fw={800} c={`${widgetColors.in}.6`}>
                                        {fmt(totalIncoming)}
                                    </Text>
                                    <Text size="md" c="dimmed">
                                        {widgetType === "messages" ? getLanguageByKey("messages") : getLanguageByKey("calls")}
                                    </Text>
                                </Box>
                            </Flex>
                            <Progress
                                value={inPct}
                                size={isVeryCompact ? "md" : "lg"}
                                radius="xl"
                                color={widgetColors.in}
                                style={{
                                    backgroundColor: `var(--mantine-color-${widgetColors.in}-1)`
                                }}
                            />
                        </Box>

                        {/* Outgoing */}
                        <Box>
                            <Flex justify="space-between" align="center" mb="md">
                                <Group gap="md" align="center">
                                    <ThemeIcon
                                        size={isVeryCompact ? "sm" : "md"}
                                        radius="lg"
                                        variant="light"
                                        color={widgetColors.out}
                                        style={{ border: `1px solid var(--mantine-color-${widgetColors.out}-3)` }}
                                    >
                                        {OutgoingIconNode}
                                    </ThemeIcon>
                                    <Text size={isVeryCompact ? "md" : "sm"} fw={600} c={`${widgetColors.out}.7`}>
                                        {getLanguageByKey("Outgoing")}
                                    </Text>
                                </Group>
                                <Box style={{ textAlign: "right" }}>
                                    <Text size={isVeryCompact ? "sm" : "lg"} fw={800} c={`${widgetColors.out}.6`}>
                                        {fmt(totalOutgoing)}
                                    </Text>
                                    <Text size="md" c="dimmed">
                                        {widgetType === "messages" ? getLanguageByKey("messages") : getLanguageByKey("calls")}
                                    </Text>
                                </Box>
                            </Flex>
                            <Progress
                                value={outPct}
                                size={isVeryCompact ? "md" : "lg"}
                                radius="xl"
                                color={widgetColors.out}
                                style={{
                                    backgroundColor: `var(--mantine-color-${widgetColors.out}-1)`
                                }}
                            />
                        </Box>

                        {/* Вложенные группы пользователей (для by_group_title) */}
                        {userGroups && userGroups.length > 0 && (
                            <Box mt="md" pt="md" style={{ borderTop: "1px solid var(--crm-ui-kit-palette-border-default)" }}>
                                <Text size="md" fw={700} c="dimmed" mb="sm" tt="uppercase">
                                    {getLanguageByKey("User Groups") || "User Groups"}
                                </Text>
                                <Stack gap="md">
                                    {userGroups.map((ug, ugIndex) => {
                                        const groupIncoming = Number.isFinite(ug.incoming_messages_count) ? ug.incoming_messages_count : (Number.isFinite(ug.incoming_calls_count) ? ug.incoming_calls_count : 0);
                                        const groupOutgoing = Number.isFinite(ug.outgoing_messages_count) ? ug.outgoing_messages_count : (Number.isFinite(ug.outgoing_calls_count) ? ug.outgoing_calls_count : 0);
                                        const groupTotal = Number.isFinite(ug.total_messages_count) ? ug.total_messages_count : (Number.isFinite(ug.total_calls_count) ? ug.total_calls_count : 0);
                                        if (groupTotal === 0) return null;

                                        const groupInPct = percent(groupIncoming, groupTotal);
                                        const groupOutPct = percent(groupOutgoing, groupTotal);

                                        return (
                                            <Box key={`ug-${ugIndex}`}>
                                                <Text fw={600} size="sm" mb="md" c="dark">
                                                    {ug.userGroupName || "-"}
                                                </Text>
                                                <Stack gap="md">
                                                    {/* Incoming для группы */}
                                                    <Flex justify="space-between" align="center">
                                                        <Group gap="md" align="center">
                                                            <ThemeIcon
                                                                size="md"
                                                                radius="lg"
                                                                variant="light"
                                                                color={widgetColors.in}
                                                            >
                                                                {IncomingIconNode}
                                                            </ThemeIcon>
                                                            <Text size="md" fw={600} c={`${widgetColors.in}.7`}>
                                                                {getLanguageByKey("Incoming")}
                                                            </Text>
                                                        </Group>
                                                        <Text size="md" fw={700} c={`${widgetColors.in}.6`}>
                                                            {fmt(groupIncoming)}
                                                        </Text>
                                                    </Flex>
                                                    <Progress
                                                        value={groupInPct}
                                                        size="md"
                                                        radius="xl"
                                                        color={widgetColors.in}
                                                    />
                                                    {/* Outgoing для группы */}
                                                    <Flex justify="space-between" align="center">
                                                        <Group gap="md" align="center">
                                                            <ThemeIcon
                                                                size="md"
                                                                radius="lg"
                                                                variant="light"
                                                                color={widgetColors.out}
                                                            >
                                                                {OutgoingIconNode}
                                                            </ThemeIcon>
                                                            <Text size="md" fw={600} c={`${widgetColors.out}.7`}>
                                                                {getLanguageByKey("Outgoing")}
                                                            </Text>
                                                        </Group>
                                                        <Text size="md" fw={700} c={`${widgetColors.out}.6`}>
                                                            {fmt(groupOutgoing)}
                                                        </Text>
                                                    </Flex>
                                                    <Progress
                                                        value={groupOutPct}
                                                        size="md"
                                                        radius="xl"
                                                        color={widgetColors.out}
                                                    />
                                                </Stack>
                                            </Box>
                                        );
                                    })}
                                </Stack>
                            </Box>
                        )}

                        {/* Вложенные пользователи (для by_user_group) */}
                        {userTechnicians && userTechnicians.length > 0 && (
                            <Box mt="md" pt="md" style={{ borderTop: "1px solid var(--crm-ui-kit-palette-border-default)" }}>
                                <Text size="md" fw={700} c="dimmed" mb="sm" tt="uppercase">
                                    {getLanguageByKey("Users") || "Users"}
                                </Text>
                                <Stack gap="md">
                                    {userTechnicians.map((ut, utIndex) => {
                                        const userIncoming = Number.isFinite(ut.incoming_messages_count) ? ut.incoming_messages_count : (Number.isFinite(ut.incoming_calls_count) ? ut.incoming_calls_count : 0);
                                        const userOutgoing = Number.isFinite(ut.outgoing_messages_count) ? ut.outgoing_messages_count : (Number.isFinite(ut.outgoing_calls_count) ? ut.outgoing_calls_count : 0);
                                        const userTotal = Number.isFinite(ut.total_messages_count) ? ut.total_messages_count : (Number.isFinite(ut.total_calls_count) ? ut.total_calls_count : 0);
                                        if (userTotal === 0) return null;

                                        const userInPct = percent(userIncoming, userTotal);
                                        const userOutPct = percent(userOutgoing, userTotal);

                                        return (
                                            <Box key={`ut-${utIndex}`}>
                                                <Text fw={600} size="sm" mb="md" c="dark">
                                                    {ut.userName || `ID ${ut.userId}`}
                                                    {ut.sipuniId && (
                                                        <Text component="span" size="md" c="dimmed" ml="md">
                                                            ({ut.sipuniId})
                                                        </Text>
                                                    )}
                                                </Text>
                                                <Stack gap="md">
                                                    {/* Incoming для пользователя */}
                                                    <Flex justify="space-between" align="center">
                                                        <Group gap="md" align="center">
                                                            <ThemeIcon
                                                                size="md"
                                                                radius="lg"
                                                                variant="light"
                                                                color={widgetColors.in}
                                                            >
                                                                {IncomingIconNode}
                                                            </ThemeIcon>
                                                            <Text size="md" fw={600} c={`${widgetColors.in}.7`}>
                                                                {getLanguageByKey("Incoming")}
                                                            </Text>
                                                        </Group>
                                                        <Text size="md" fw={700} c={`${widgetColors.in}.6`}>
                                                            {fmt(userIncoming)}
                                                        </Text>
                                                    </Flex>
                                                    <Progress
                                                        value={userInPct}
                                                        size="md"
                                                        radius="xl"
                                                        color={widgetColors.in}
                                                    />
                                                    {/* Outgoing для пользователя */}
                                                    <Flex justify="space-between" align="center">
                                                        <Group gap="md" align="center">
                                                            <ThemeIcon
                                                                size="md"
                                                                radius="lg"
                                                                variant="light"
                                                                color={widgetColors.out}
                                                            >
                                                                {OutgoingIconNode}
                                                            </ThemeIcon>
                                                            <Text size="md" fw={600} c={`${widgetColors.out}.7`}>
                                                                {getLanguageByKey("Outgoing")}
                                                            </Text>
                                                        </Group>
                                                        <Text size="md" fw={700} c={`${widgetColors.out}.6`}>
                                                            {fmt(userOutgoing)}
                                                        </Text>
                                                    </Flex>
                                                    <Progress
                                                        value={userOutPct}
                                                        size="md"
                                                        radius="xl"
                                                        color={widgetColors.out}
                                                    />
                                                </Stack>
                                            </Box>
                                        );
                                    })}
                                </Stack>
                            </Box>
                        )}
                    </Stack>
                </Box>
            </Stack>
        </Card>
    );
};
