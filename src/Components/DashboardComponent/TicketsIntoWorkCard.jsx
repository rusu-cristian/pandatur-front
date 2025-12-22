import React from "react";
import {
    Card, Group, Stack, Text, Progress, Divider, Badge, ThemeIcon, Box
} from "@mantine/core";
import { getLanguageByKey } from "@utils";
import { FaBriefcase, FaTasks } from "react-icons/fa";

const fmt = (n) => (typeof n === "number" ? n.toLocaleString() : "-");

export const TicketsIntoWorkCard = ({
    takenIntoWorkTickets,
    dateRange,
    title,
    subtitle,
    width,
    height,
    colors = { totalAccent: "blue" },
    icons = {},
    sizeInfo,
    sizePx,
    bg,
    widgetType,
    userGroups = [], // Вложенные группы пользователей для by_group_title
    userTechnicians = [], // Вложенные пользователи для by_user_group
}) => {
    // Адаптивные размеры в зависимости от размера виджета
    const isCompact = width < 40 || height < 15;
    const isVeryCompact = width < 30 || height < 12;

    const cardPadding = isVeryCompact ? "md" : isCompact ? "sm" : "lg";
    const titleSize = isVeryCompact ? "md" : isCompact ? "md" : "md";
    const totalSize = isVeryCompact ? 24 : isCompact ? 32 : 38;
    const TotalIconNode = icons.total ?? <FaBriefcase size={18} />;

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
                background:
                "var(--crm-ui-kit-palette-background-primary)" ||
                    "linear-gradient(135deg, rgba(99,102,241,0.06), rgba(45,212,191,0.06))",
                borderColor: "var(--crm-ui-kit-palette-border-default)",
            }}
        >
            <Stack gap={isVeryCompact ? "md" : "sm"} style={{ flex: 1, height: "100%", minHeight: 0 }}>
                {/* Header */}
                <Group justify="space-between" align="center" style={{ flemdhrink: 0 }}>
                    <Group gap="sm" align="center">
                        <ThemeIcon size={isVeryCompact ? "md" : "lg"} radius="xl" variant="light" color={colors.totalAccent}>
                            {TotalIconNode}
                        </ThemeIcon>
                        <div>
                            <Text size={titleSize} c="dimmed" fw={700} tt="uppercase" style={{ letterSpacing: 0.6 }}>
                                {title || getLanguageByKey("Tickets Into Work")}
                            </Text>

                            <Group gap={6} wrap="wrap">
                                <Badge variant="light" color="blue" size="sm">
                                    {getLanguageByKey("Tickets Into Work") || widgetType || "Tickets Into Work"}
                                </Badge>
                                {subtitle ? <Badge variant="light" size={isVeryCompact ? "md" : "sm"}>{subtitle}</Badge> : null}
                            </Group>
                        </div>
                    </Group>

                    <div style={{ textAlign: "right" }}>
                        <Text fz={totalSize} fw={900} style={{ lineHeight: 1 }}>
                            {fmt(takenIntoWorkTickets)}
                        </Text>
                        <Text size="md" c="dimmed" fw={500}>
                            {getLanguageByKey("Tickets taken")}
                        </Text>
                    </div>
                </Group>

                <Divider my={isVeryCompact ? "md" : "sm"} />

                {/* Прокручиваемая область с контентом */}
                <Box
  className={isVeryCompact ? "crm-scroll compact" : "crm-scroll"}
  style={{ flex: 1, minHeight: 0 }}
>
                    <Stack gap={isVeryCompact ? "md" : "sm"}>
                        {/* Основная статистика */}
                        <Group justify="space-between" align="center">
                            <Group gap={8} align="center">
                                <ThemeIcon size={isVeryCompact ? "md" : "sm"} radius="xl" variant="light" color={colors.totalAccent}>
                                    <FaTasks size={isVeryCompact ? 12 : 14} />
                                </ThemeIcon>
                                <Text size={isVeryCompact ? "md" : "sm"} c={colors.totalAccent}>{getLanguageByKey("Taken into work")}</Text>
                            </Group>
                            <div style={{ textAlign: "right" }}>
                                <Text size={isVeryCompact ? "md" : "sm"} fw={700}>{fmt(takenIntoWorkTickets)}</Text>
                                <Text size="md" c="dimmed">{getLanguageByKey("tickets")}</Text>
                            </div>
                        </Group>
                        <Progress value={100} size={isVeryCompact ? "md" : "md"} radius="xl" color={colors.totalAccent} />

                        {/* Вложенные группы пользователей (для by_group_title) */}
                        {userGroups && userGroups.length > 0 && (
                            <Box mt="md" pt="md" style={{ borderTop: "1px solid var(--crm-ui-kit-palette-border-default)" }}>
                                <Text size="md" fw={700} c="dimmed" mb="sm" tt="uppercase">
                                    {getLanguageByKey("User Groups") || "User Groups"}
                                </Text>
                                <Stack gap="md">
                                    {userGroups.map((ug, ugIndex) => {
                                        // Обрабатываем статистику группы
                                        const groupCount = (() => {
                                            if (!ug.stats || typeof ug.stats !== "object") return 0;
                                            if (Array.isArray(ug.stats)) return 0;
                                            const takenIntoWorkObj = ug.stats.taken_into_work;
                                            if (takenIntoWorkObj && typeof takenIntoWorkObj === "object") {
                                                return Number.isFinite(takenIntoWorkObj.count) ? takenIntoWorkObj.count : 0;
                                            }
                                            return 0;
                                        })();

                                        if (groupCount === 0) return null;

                                        return (
                                            <Box key={`ug-${ugIndex}`}>
                                                <Text fw={600} size="sm" mb="md" c="dark">
                                                    {ug.userGroupName || "-"}
                                                </Text>
                                                <Stack gap="md">
                                                    <Group justify="space-between" align="center">
                                                        <Group gap={8} align="center">
                                                            <ThemeIcon size="md" radius="xl" variant="light" color={colors.totalAccent}>
                                                                <FaTasks size={10} />
                                                            </ThemeIcon>
                                                            <Text size="md" c={colors.totalAccent}>{getLanguageByKey("Taken into work")}</Text>
                                                        </Group>
                                                        <div style={{ textAlign: "right" }}>
                                                            <Text size="md" fw={700}>{fmt(groupCount)}</Text>
                                                            <Text size="md" c="dimmed">{getLanguageByKey("tickets")}</Text>
                                                        </div>
                                                    </Group>
                                                    <Progress value={100} size="md" radius="xl" color={colors.totalAccent} />
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
                                        // Обрабатываем статистику пользователя
                                        const userCount = (() => {
                                            if (!ut.stats || typeof ut.stats !== "object") return 0;
                                            if (Array.isArray(ut.stats)) return 0;
                                            const takenIntoWorkObj = ut.stats.taken_into_work;
                                            if (takenIntoWorkObj && typeof takenIntoWorkObj === "object") {
                                                return Number.isFinite(takenIntoWorkObj.count) ? takenIntoWorkObj.count : 0;
                                            }
                                            return 0;
                                        })();

                                        if (userCount === 0) return null;

                                        return (
                                            <Box key={`ut-${utIndex}`}>
                                                <Text fw={600} size="sm" mb="md" c="dark">
                                                    {ut.userName || `ID ${ut.userId}`}
                                                </Text>
                                                <Stack gap="md">
                                                    <Group justify="space-between" align="center">
                                                        <Group gap={8} align="center">
                                                            <ThemeIcon size="md" radius="xl" variant="light" color={colors.totalAccent}>
                                                                <FaTasks size={10} />
                                                            </ThemeIcon>
                                                            <Text size="md" c={colors.totalAccent}>{getLanguageByKey("Taken into work")}</Text>
                                                        </Group>
                                                        <div style={{ textAlign: "right" }}>
                                                            <Text size="md" fw={700}>{fmt(userCount)}</Text>
                                                            <Text size="md" c="dimmed">{getLanguageByKey("tickets")}</Text>
                                                        </div>
                                                    </Group>
                                                    <Progress value={100} size="md" radius="xl" color={colors.totalAccent} />
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
