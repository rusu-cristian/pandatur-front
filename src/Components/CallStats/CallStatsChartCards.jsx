import { Paper, Flex, Box, Text, Group, Badge } from "@mantine/core";
import { HiArrowDownLeft, HiArrowUpRight } from "react-icons/hi2";
import { getLanguageByKey } from "../utils";

const COLORS = {
    from: "#4fc3f7",
    to: "#81c784",
    total: "#0f824c",
    bgCard: "#fff",
    textDark: "#222",
};

const formatDuration = (totalSeconds = 0) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = Math.floor(totalSeconds % 60);
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
};

export const CallStatsChartCard = ({ user, fullName }) => {
    if (!user) return null;
    const totalCalls = (user.calls_from || 0) + (user.calls_to || 0);
    const totalDuration = user.total_duration || 0;

    return (
        <Paper
            withBorder
            radius="md"
            p="sm"
            mb="xs"
            style={{
                background: "--crm-ui-kit-palette-background-default",
                minWidth: 280,
            }}
        >
            <Flex justify="space-between" align="flex-start" gap={16} wrap="wrap">
                <Box>
                    <Text fw={700} size="sm" c={COLORS.textDark} mb={2}>
                        {fullName || `${getLanguageByKey("User")} ${user.user_id}`}
                    </Text>
                    <Text size="xs" c="#8793a7">
                        {getLanguageByKey("ID")}: {user.user_id}
                    </Text>
                </Box>
                <Badge
                    color="yellow"
                    size="sm"
                    variant="light"
                    radius="sm"
                    style={{
                        background: COLORS.total,
                        color: "#fff",
                        fontWeight: 600,
                        fontSize: 11,
                        minWidth: 120,
                        textAlign: "center",
                    }}
                >
                    {getLanguageByKey("TotalCalls")}: {totalCalls}
                </Badge>
            </Flex>
            <Group mt="sm" gap="md" align="center">
                <Group gap={6}>
                    <Box
                        w={24}
                        h={24}
                        style={{
                            background: COLORS.to,
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            boxShadow: "0 2px 8px 0 rgba(80,180,120,0.13)",
                        }}
                    >
                        <HiArrowDownLeft color="white" size={12} />
                    </Box>
                    <Text fw={500} c={COLORS.textDark} size="xs">{getLanguageByKey("Incoming")}</Text>
                    <Text fw={700} c={COLORS.to} size="sm">{user.calls_from || 0}</Text>
                    <Text size="xs" c="#757575" ml="xs">
                        {formatDuration(user.duration_from || 0)}
                    </Text>
                </Group>
                <Group gap={6}>
                    <Box
                        w={24}
                        h={24}
                        style={{
                            background: COLORS.from,
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            boxShadow: "0 2px 8px 0 rgba(44,159,199,0.13)",
                        }}
                    >
                        <HiArrowUpRight color="white" size={12} />
                    </Box>
                    <Text fw={500} c={COLORS.textDark} size="xs">{getLanguageByKey("Outgoing")}</Text>
                    <Text fw={700} c={COLORS.from} size="sm">{user.calls_to || 0}</Text>
                    <Text size="xs" c="#757575" ml="xs">
                        {formatDuration(user.duration_to || 0)}
                    </Text>
                </Group>
                <Group gap={6}>
                    <Badge
                        color="blue"
                        size="sm"
                        variant="light"
                        radius="sm"
                        style={{
                            background: "#f2f2f2",
                            color: COLORS.textDark,
                            fontWeight: 700,
                            fontSize: 11,
                            minWidth: 140,
                            textAlign: "center",
                            marginLeft: 6,
                        }}
                    >
                        {getLanguageByKey("TotalDuration")}: {formatDuration(totalDuration)}
                    </Badge>
                </Group>
            </Group>
        </Paper>
    );
};
