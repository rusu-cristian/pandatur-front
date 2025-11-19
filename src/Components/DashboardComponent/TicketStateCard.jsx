import React from "react";
import {
    Card, Group, Stack, Text, Progress, Divider, Badge, ThemeIcon, Box, Flex
} from "@mantine/core";
import { getLanguageByKey } from "@utils";
import { FaUsers, FaUser, FaUserPlus } from "react-icons/fa6";

const fmt = (n) => (typeof n === "number" ? n.toLocaleString() : "-");
const percent = (part, total) => {
    const p = total > 0 ? (part / total) * 100 : 0;
    return Math.max(0, Math.min(100, Number.isFinite(p) ? p : 0));
};

export const TicketStateCard = ({
    oldClientTickets,
    newClientTickets,
    totalTickets,
    title,
    subtitle,
    width,
    height,
    colors = { old: "orange", new: "teal", totalAccent: "indigo" },
    icons = {},
    bg,
    widgetType,
    userGroups = [], // Вложенные группы пользователей для by_group_title
    userTechnicians = [], // Вложенные пользователи для by_user_group
}) => {
    // Адаптивные размеры в зависимости от размера виджета
    const isCompact = width < 40 || height < 15;
    const isVeryCompact = width < 30 || height < 12;

    const cardPadding = isVeryCompact ? "xs" : isCompact ? "sm" : "lg";
    const titleSize = isVeryCompact ? "xs" : isCompact ? "xs" : "xs";
    const subtitleSize = "md"
    const totalSize = isVeryCompact ? 24 : isCompact ? 32 : 38;
    const iconSize = isVeryCompact ? "md" : isCompact ? "lg" : "lg";
    const totalIconSize = isVeryCompact ? 14 : isCompact ? 16 : 18;
    const oldPct = percent(oldClientTickets, totalTickets);
    const newPct = percent(newClientTickets, totalTickets);

    const TotalIconNode = icons.total ?? <FaUsers size={totalIconSize} />;
    const OldClientIconNode = icons.old ?? <FaUser size={isVeryCompact ? 10 : 14} />;
    const NewClientIconNode = icons.new ?? <FaUserPlus size={isVeryCompact ? 10 : 14} />;

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
                backgroundColor: "var(--crm-ui-kit-palette-background-primary)",
                borderColor: "var(--crm-ui-kit-palette-border-default)",
            }}
        >
            <Stack gap={isVeryCompact ? "xs" : "sm"} style={{ flex: 1, height: "100%", minHeight: 0 }}>
                {/* Header */}
                <Flex justify="space-between" align="flex-start" style={{ flexShrink: 0 }}>
                    <Flex direction="column" gap="xs" style={{ flex: 1 }}>
                        <Group gap="sm" align="center">
                            <ThemeIcon size={iconSize} radius="xl" variant="light" color={colors.totalAccent}>
                                {TotalIconNode}
                            </ThemeIcon>
                            <Box>
                                <Text size={titleSize} c="dimmed" fw={700} tt="uppercase" style={{ letterSpacing: 0.6 }}>
                                    {title || getLanguageByKey("Ticket State")}
                                </Text>
                                <Group gap={6} wrap="wrap" mt={4}>
                                    <Badge variant="light" color="blue" size="sm">
                                        {getLanguageByKey("Ticket State") || widgetType || "Ticket State"}
                                    </Badge>
                                    {subtitle && (
                                        <Text size={subtitleSize} c="dimmed">
                                            {subtitle}
                                        </Text>
                                    )}
                                </Group>
                            </Box>
                        </Group>
                    </Flex>

                    <Box style={{ textAlign: "right" }}>
                        <Text fz={totalSize} fw={900} style={{ lineHeight: 1 }}>
                            {fmt(totalTickets)}
                        </Text>
                        <Text size="md" c="dimmed" fw={500}>
                            {getLanguageByKey("Total tickets")}
                        </Text>
                    </Box>
                </Flex>

                <Divider my={isVeryCompact ? "xs" : "sm"} />

                {/* Прокручиваемая область с контентом */}
                <Box style={{ flex: 1, overflowY: "auto", overflowX: "hidden", minHeight: 0 }}>
                    <Stack gap={isVeryCompact ? "xs" : "sm"}>
                        {/* Old Clients */}
                        <Box>
                            <Flex justify="space-between" align="center" mb="xs">
                                <Group gap={isVeryCompact ? "xs" : 8} align="center">
                                    <ThemeIcon size={isVeryCompact ? "xs" : "sm"} radius="xl" variant="light" color={colors.old}>
                                        {OldClientIconNode}
                                    </ThemeIcon>
                                    <Text size={isVeryCompact ? "xs" : "sm"} c={colors.old}>
                                        {getLanguageByKey("Old Clients")} ({getLanguageByKey("Multiple tickets")})
                                    </Text>
                                </Group>
                                <Box style={{ textAlign: "right" }}>
                                    <Text size={isVeryCompact ? "xs" : "sm"} fw={700}>{fmt(oldClientTickets)}</Text>
                                    <Text size="md" c="dimmed">{getLanguageByKey("tickets")}</Text>
                                </Box>
                            </Flex>
                            <Progress
                                value={oldPct}
                                size={isVeryCompact ? "xs" : "md"}
                                radius="xl"
                                color={colors.old}
                            />
                        </Box>

                        {/* New Clients */}
                        <Box>
                            <Flex justify="space-between" align="center" mb="xs">
                                <Group gap={isVeryCompact ? "xs" : 8} align="center">
                                    <ThemeIcon size={isVeryCompact ? "xs" : "sm"} radius="xl" variant="light" color={colors.new}>
                                        {NewClientIconNode}
                                    </ThemeIcon>
                                    <Text size={isVeryCompact ? "xs" : "sm"} c={colors.new}>
                                        {getLanguageByKey("New Clients")} ({getLanguageByKey("Single ticket")})
                                    </Text>
                                </Group>
                                <Box style={{ textAlign: "right" }}>
                                    <Text size={isVeryCompact ? "xs" : "sm"} fw={700}>{fmt(newClientTickets)}</Text>
                                    <Text size="md" c="dimmed">{getLanguageByKey("tickets")}</Text>
                                </Box>
                            </Flex>
                            <Progress
                                value={newPct}
                                size={isVeryCompact ? "xs" : "md"}
                                radius="xl"
                                color={colors.new}
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
                                        const groupOld = Number.isFinite(ug.old_client_tickets_count) ? ug.old_client_tickets_count : 0;
                                        const groupNew = Number.isFinite(ug.new_client_tickets_count) ? ug.new_client_tickets_count : 0;
                                        const groupTotal = Number.isFinite(ug.total_tickets_count) ? ug.total_tickets_count : 0;
                                        if (groupTotal === 0) return null;

                                        const groupOldPct = percent(groupOld, groupTotal);
                                        const groupNewPct = percent(groupNew, groupTotal);

                                        return (
                                            <Box key={`ug-${ugIndex}`}>
                                                <Text fw={600} size="md" mb="xs" c="dark">
                                                    {ug.userGroupName || "-"}
                                                </Text>
                                                <Stack gap="xs">
                                                    {/* Old Clients для группы */}
                                                    <Flex justify="space-between" align="center">
                                                        <Group gap="xs" align="center">
                                                            <ThemeIcon
                                                                size="xs"
                                                                radius="lg"
                                                                variant="light"
                                                                color={colors.old}
                                                            >
                                                                <FaUser size={10} />
                                                            </ThemeIcon>
                                                            <Text size="md" fw={600} c={`${colors.old}.7`}>
                                                                {getLanguageByKey("Old Clients")}
                                                            </Text>
                                                        </Group>
                                                        <Text size="md" fw={700} c={`${colors.old}.6`}>
                                                            {fmt(groupOld)}
                                                        </Text>
                                                    </Flex>
                                                    <Progress
                                                        value={groupOldPct}
                                                        size="xs"
                                                        radius="xl"
                                                        color={colors.old}
                                                    />
                                                    {/* New Clients для группы */}
                                                    <Flex justify="space-between" align="center">
                                                        <Group gap="xs" align="center">
                                                            <ThemeIcon
                                                                size="xs"
                                                                radius="lg"
                                                                variant="light"
                                                                color={colors.new}
                                                            >
                                                                <FaUserPlus size={10} />
                                                            </ThemeIcon>
                                                            <Text size="md" fw={600} c={`${colors.new}.7`}>
                                                                {getLanguageByKey("New Clients")}
                                                            </Text>
                                                        </Group>
                                                        <Text size="md" fw={700} c={`${colors.new}.6`}>
                                                            {fmt(groupNew)}
                                                        </Text>
                                                    </Flex>
                                                    <Progress
                                                        value={groupNewPct}
                                                        size="xs"
                                                        radius="xl"
                                                        color={colors.new}
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
                                        const userOld = Number.isFinite(ut.old_client_tickets_count) ? ut.old_client_tickets_count : 0;
                                        const userNew = Number.isFinite(ut.new_client_tickets_count) ? ut.new_client_tickets_count : 0;
                                        const userTotal = Number.isFinite(ut.total_tickets_count) ? ut.total_tickets_count : 0;
                                        if (userTotal === 0) return null;

                                        const userOldPct = percent(userOld, userTotal);
                                        const userNewPct = percent(userNew, userTotal);

                                        return (
                                            <Box key={`ut-${utIndex}`}>
                                                <Text fw={600} size="md" mb="xs" c="dark">
                                                    {ut.userName || `ID ${ut.userId}`}
                                                    {ut.sipuniId && (
                                                        <Text component="span" size="md" c="dimmed" ml="xs">
                                                            ({ut.sipuniId})
                                                        </Text>
                                                    )}
                                                </Text>
                                                <Stack gap="xs">
                                                    {/* Old Clients для пользователя */}
                                                    <Flex justify="space-between" align="center">
                                                        <Group gap="xs" align="center">
                                                            <ThemeIcon
                                                                size="xs"
                                                                radius="lg"
                                                                variant="light"
                                                                color={colors.old}
                                                            >
                                                                <FaUser size={10} />
                                                            </ThemeIcon>
                                                            <Text size="md" fw={600} c={`${colors.old}.7`}>
                                                                {getLanguageByKey("Old Clients")}
                                                            </Text>
                                                        </Group>
                                                        <Text size="md" fw={700} c={`${colors.old}.6`}>
                                                            {fmt(userOld)}
                                                        </Text>
                                                    </Flex>
                                                    <Progress
                                                        value={userOldPct}
                                                        size="xs"
                                                        radius="xl"
                                                        color={colors.old}
                                                    />
                                                    {/* New Clients для пользователя */}
                                                    <Flex justify="space-between" align="center">
                                                        <Group gap="xs" align="center">
                                                            <ThemeIcon
                                                                size="xs"
                                                                radius="lg"
                                                                variant="light"
                                                                color={colors.new}
                                                            >
                                                                <FaUserPlus size={10} />
                                                            </ThemeIcon>
                                                            <Text size="md" fw={600} c={`${colors.new}.7`}>
                                                                {getLanguageByKey("New Clients")}
                                                            </Text>
                                                        </Group>
                                                        <Text size="md" fw={700} c={`${colors.new}.6`}>
                                                            {fmt(userNew)}
                                                        </Text>
                                                    </Flex>
                                                    <Progress
                                                        value={userNewPct}
                                                        size="xs"
                                                        radius="xl"
                                                        color={colors.new}
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
