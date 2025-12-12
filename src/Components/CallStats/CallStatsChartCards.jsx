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
            radius="lg"
            p="lg"
            mb="xs"
            style={{
                background: "--crm-ui-kit-palette-background-default",
                minWidth: 340,
            }}
        >
            <Flex justify="space-between" align="flex-start" gap={24} wrap="wrap">
                <Box>
                    <Text fw={700} size="lg" c={COLORS.textDark} mb={2}>
                        {fullName || `${getLanguageByKey("User")} ${user.user_id}`}
                    </Text>
                    <Text size="xs" c="#8793a7">
                        {getLanguageByKey("ID")}: {user.user_id}
                    </Text>
                </Box>
                <Badge
                    color="yellow"
                    size="lg"
                    variant="light"
                    radius="md"
                    style={{
                        background: COLORS.total,
                        color: "#fff",
                        fontWeight: 600,
                        fontSize: 16,
                        minWidth: 150,
                        textAlign: "center",
                    }}
                >
                    {getLanguageByKey("TotalCalls")}: {totalCalls}
                </Badge>
            </Flex>
            <Group mt="xl" gap="xl" align="center">
                <Group gap={8}>
                    <Box
                        w={32}
                        h={32}
                        style={{
                            background: COLORS.to,
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            boxShadow: "0 2px 8px 0 rgba(80,180,120,0.13)",
                        }}
                    >
                        <HiArrowDownLeft color="white" size={18} />
                    </Box>
                    <Text fw={500} c={COLORS.textDark} size="md">{getLanguageByKey("Incoming")}</Text>
                    <Text fw={700} c={COLORS.to} size="lg">{user.calls_from || 0}</Text>
                    <Text size="md" c="#757575" ml="xs">
                        {formatDuration(user.duration_from || 0)}
                    </Text>
                </Group>
                <Group gap={8}>
                    <Box
                        w={32}
                        h={32}
                        style={{
                            background: COLORS.from,
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            boxShadow: "0 2px 8px 0 rgba(44,159,199,0.13)",
                        }}
                    >
                        <HiArrowUpRight color="white" size={18} />
                    </Box>
                    <Text fw={500} c={COLORS.textDark} size="md">{getLanguageByKey("Outgoing")}</Text>
                    <Text fw={700} c={COLORS.from} size="lg">{user.calls_to || 0}</Text>
                    <Text size="md" c="#757575" ml="xs">
                        {formatDuration(user.duration_to || 0)}
                    </Text>
                </Group>
                <Group gap={8}>
                    <Badge
                        color="blue"
                        size="lg"
                        variant="light"
                        radius="md"
                        style={{
                            background: "#f2f2f2",
                            color: COLORS.textDark,
                            fontWeight: 700,
                            fontSize: 16,
                            minWidth: 180,
                            textAlign: "center",
                            marginLeft: 8,
                        }}
                    >
                        {getLanguageByKey("TotalDuration")}: {formatDuration(totalDuration)}
                    </Badge>
                </Group>
            </Group>
        </Paper>
    );
};
