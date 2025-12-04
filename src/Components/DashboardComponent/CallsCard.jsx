import React from "react";
import {
    Card, Group, Stack, Text, Progress, Divider, Badge, ThemeIcon, Box, Flex
} from "@mantine/core";
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
    title,
    subtitle,
    width,
    height,
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
    const subtitleSize = "md";
    const totalSize = isVeryCompact ? 24 : isCompact ? 32 : 42;
    const iconSize = isVeryCompact ? "md" : isCompact ? "lg" : "xl";
    const callIconSize = isVeryCompact ? 14 : isCompact ? 16 : 20;
    const inPct = percent(totalIncoming, totalAll);
    const outPct = percent(totalOutgoing, totalAll);

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
                                gradient={{ from: CALLS_COLORS.totalAccent, to: CALLS_COLORS.totalAccent, deg: 45 }}
                            >
                                <MdCall size={callIconSize} />
                            </ThemeIcon>
                            <Box>
                                <Text size={titleSize} c="dimmed" fw={700} tt="uppercase" style={{ letterSpacing: 0.8 }}>
                                    {title || getLanguageByKey("Total calls for the period")}
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
                                {getLanguageByKey("Calls") || widgetType}
                            </Badge>
                        </Group>
                    </Flex>

                    <Box style={{ textAlign: "right" }}>
                        <Group gap="md" align="center" justify="flex-end">
                            <Text fz={totalSize} fw={900} style={{ lineHeight: 1, color: `var(--mantine-color-${CALLS_COLORS.totalAccent}-6)` }}>
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
                                        color={CALLS_COLORS.in}
                                        style={{ border: `1px solid var(--mantine-color-${CALLS_COLORS.in}-3)` }}
                                    >
                                        <MdCallReceived size={isVeryCompact ? 12 : 16} />
                                    </ThemeIcon>
                                    <Text size={isVeryCompact ? "md" : "sm"} fw={600} c={`${CALLS_COLORS.in}.7`}>
                                        {getLanguageByKey("Incoming")}
                                    </Text>
                                </Group>
                                <Box style={{ textAlign: "right" }}>
                                    <Text size={isVeryCompact ? "sm" : "lg"} fw={800} c={`${CALLS_COLORS.in}.6`}>
                                        {fmt(totalIncoming)}
                                    </Text>
                                    <Text size="md" c="dimmed">
                                        {getLanguageByKey("calls")}
                                    </Text>
                                </Box>
                            </Flex>
                            <Progress
                                value={inPct}
                                size={isVeryCompact ? "md" : "lg"}
                                radius="xl"
                                color={CALLS_COLORS.in}
                                style={{
                                    backgroundColor: `var(--mantine-color-${CALLS_COLORS.in}-1)`
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
                                        color={CALLS_COLORS.out}
                                        style={{ border: `1px solid var(--mantine-color-${CALLS_COLORS.out}-3)` }}
                                    >
                                        <MdCallMade size={isVeryCompact ? 12 : 16} />
                                    </ThemeIcon>
                                    <Text size={isVeryCompact ? "md" : "sm"} fw={600} c={`${CALLS_COLORS.out}.7`}>
                                        {getLanguageByKey("Outgoing")}
                                    </Text>
                                </Group>
                                <Box style={{ textAlign: "right" }}>
                                    <Text size={isVeryCompact ? "sm" : "lg"} fw={800} c={`${CALLS_COLORS.out}.6`}>
                                        {fmt(totalOutgoing)}
                                    </Text>
                                    <Text size="md" c="dimmed">
                                        {getLanguageByKey("calls")}
                                    </Text>
                                </Box>
                            </Flex>
                            <Progress
                                value={outPct}
                                size={isVeryCompact ? "md" : "lg"}
                                radius="xl"
                                color={CALLS_COLORS.out}
                                style={{
                                    backgroundColor: `var(--mantine-color-${CALLS_COLORS.out}-1)`
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
                                        const groupIncoming = Number.isFinite(ug.incoming_calls_count) ? ug.incoming_calls_count : 0;
                                        const groupOutgoing = Number.isFinite(ug.outgoing_calls_count) ? ug.outgoing_calls_count : 0;
                                        const groupTotal = Number.isFinite(ug.total_calls_count) ? ug.total_calls_count : 0;
                                        if (groupTotal === 0) return null;

                                        const groupInPct = percent(groupIncoming, groupTotal);
                                        const groupOutPct = percent(groupOutgoing, groupTotal);

                                        return (
                                            <Box key={`ug-${ugIndex}`}>
                                                <Text fw={600} size="md" mb="md" c="dark">
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
                                                                color={CALLS_COLORS.in}
                                                            >
                                                                <MdCallReceived size={10} />
                                                            </ThemeIcon>
                                                            <Text size="md" fw={600} c={`${CALLS_COLORS.in}.7`}>
                                                                {getLanguageByKey("Incoming")}
                                                            </Text>
                                                        </Group>
                                                        <Text size="md" fw={700} c={`${CALLS_COLORS.in}.6`}>
                                                            {fmt(groupIncoming)}
                                                        </Text>
                                                    </Flex>
                                                    <Progress
                                                        value={groupInPct}
                                                        size="md"
                                                        radius="xl"
                                                        color={CALLS_COLORS.in}
                                                    />
                                                    {/* Outgoing для группы */}
                                                    <Flex justify="space-between" align="center">
                                                        <Group gap="md" align="center">
                                                            <ThemeIcon
                                                                size="md"
                                                                radius="lg"
                                                                variant="light"
                                                                color={CALLS_COLORS.out}
                                                            >
                                                                <MdCallMade size={10} />
                                                            </ThemeIcon>
                                                            <Text size="md" fw={600} c={`${CALLS_COLORS.out}.7`}>
                                                                {getLanguageByKey("Outgoing")}
                                                            </Text>
                                                        </Group>
                                                        <Text size="md" fw={700} c={`${CALLS_COLORS.out}.6`}>
                                                            {fmt(groupOutgoing)}
                                                        </Text>
                                                    </Flex>
                                                    <Progress
                                                        value={groupOutPct}
                                                        size="md"
                                                        radius="xl"
                                                        color={CALLS_COLORS.out}
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
                                        const userIncoming = Number.isFinite(ut.incoming_calls_count) ? ut.incoming_calls_count : 0;
                                        const userOutgoing = Number.isFinite(ut.outgoing_calls_count) ? ut.outgoing_calls_count : 0;
                                        const userTotal = Number.isFinite(ut.total_calls_count) ? ut.total_calls_count : 0;
                                        if (userTotal === 0) return null;

                                        const userInPct = percent(userIncoming, userTotal);
                                        const userOutPct = percent(userOutgoing, userTotal);

                                        return (
                                            <Box key={`ut-${utIndex}`}>
                                                <Text fw={600} size="md" mb="md" c="dark">
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
                                                                color={CALLS_COLORS.in}
                                                            >
                                                                <MdCallReceived size={10} />
                                                            </ThemeIcon>
                                                            <Text size="md" fw={600} c={`${CALLS_COLORS.in}.7`}>
                                                                {getLanguageByKey("Incoming")}
                                                            </Text>
                                                        </Group>
                                                        <Text size="md" fw={700} c={`${CALLS_COLORS.in}.6`}>
                                                            {fmt(userIncoming)}
                                                        </Text>
                                                    </Flex>
                                                    <Progress
                                                        value={userInPct}
                                                        size="md"
                                                        radius="xl"
                                                        color={CALLS_COLORS.in}
                                                    />
                                                    {/* Outgoing для пользователя */}
                                                    <Flex justify="space-between" align="center">
                                                        <Group gap="md" align="center">
                                                            <ThemeIcon
                                                                size="md"
                                                                radius="lg"
                                                                variant="light"
                                                                color={CALLS_COLORS.out}
                                                            >
                                                                <MdCallMade size={10} />
                                                            </ThemeIcon>
                                                            <Text size="md" fw={600} c={`${CALLS_COLORS.out}.7`}>
                                                                {getLanguageByKey("Outgoing")}
                                                            </Text>
                                                        </Group>
                                                        <Text size="md" fw={700} c={`${CALLS_COLORS.out}.6`}>
                                                            {fmt(userOutgoing)}
                                                        </Text>
                                                    </Flex>
                                                    <Progress
                                                        value={userOutPct}
                                                        size="md"
                                                        radius="xl"
                                                        color={CALLS_COLORS.out}
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

