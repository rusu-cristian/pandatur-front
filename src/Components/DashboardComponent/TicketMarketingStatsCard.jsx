import React, { useMemo } from "react";
import { Card, Group, Stack, Text, Badge, Progress, ThemeIcon, Box } from "@mantine/core";
import { FaBullhorn } from "react-icons/fa";
import { getLanguageByKey } from "@utils";

const fmt = (n) => (typeof n === "number" ? n.toLocaleString() : "-");

const clampPercentage = (value) => {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, value));
};

export const TicketMarketingStatsCard = ({
  title,
  subtitle,
  marketingStats = [],
  totalMarketing = 0,
  bg,
  limit = 100,
}) => {
  const normalizedStats = useMemo(() => {
    const items = (marketingStats || []).map((item) => ({
      channel: item.channel || "-",
      count: Number.isFinite(item.count) ? item.count : 0,
      percentage: clampPercentage(item.percentage ?? 0),
    }));

    items.sort((a, b) => b.count - a.count);
    return items.slice(0, limit);
  }, [marketingStats, limit]);

  const total = useMemo(() => {
    if (Number.isFinite(totalMarketing) && totalMarketing > 0) {
      return totalMarketing;
    }
    return normalizedStats.reduce((sum, item) => sum + (item.count || 0), 0);
  }, [normalizedStats, totalMarketing]);

  const maxCount = useMemo(
    () => Math.max(1, ...normalizedStats.map((item) => (Number.isFinite(item.count) ? item.count : 0))),
    [normalizedStats]
  );

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
        background: bg || "var(--crm-ui-kit-palette-background-primary)",
        overflow: "hidden",
      }}
    >
      <Group justify="space-between" align="flex-start" mb="md">
        <Group gap="sm" align="center">
          <ThemeIcon size="xl" radius="xl" variant="light" color="blue">
            <FaBullhorn size={18} />
          </ThemeIcon>
          <Stack gap={4}>
            <Text size="xs" c="dimmed" fw={700} tt="uppercase" style={{ letterSpacing: 0.8 }}>
              {title || getLanguageByKey("Ticket Marketing Stats")}
            </Text>
            {subtitle ? (
              <Badge variant="light" size="sm">
                {subtitle}
              </Badge>
            ) : null}
          </Stack>
        </Group>
        <Box style={{ textAlign: "right" }}>
          <Text fz={36} fw={900} style={{ lineHeight: 1 }}>
            {fmt(total)}
          </Text>
          <Text size="xs" c="dimmed" fw={600}>
            {getLanguageByKey("Total")}
          </Text>
        </Box>
      </Group>

      <Stack gap="sm" style={{ overflowY: "auto", flex: 1 }}>
        {normalizedStats.length ? (
          normalizedStats.map((item, index) => {
            const count = Number.isFinite(item.count) ? item.count : 0;
            const percent = clampPercentage(item.percentage ?? (count / maxCount) * 100);
            const share = total > 0 ? Math.round((count / total) * 100) : 0;

            return (
              <Box key={`${item.channel}-${index}`}>
                <Group justify="space-between" align="center" mb={6}>
                  <Group gap="xs" align="center">
                    <Badge variant="light" radius="sm">
                      {index + 1}
                    </Badge>
                    <Text fw={600} size="sm">
                      {item.channel || getLanguageByKey("No source")}
                    </Text>
                  </Group>
                  <Box style={{ textAlign: "right" }}>
                    <Text size="sm" fw={700}>
                      {fmt(count)}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {share}%
                    </Text>
                  </Box>
                </Group>
                <Progress value={percent} size="md" radius="xl" color="indigo" />
              </Box>
            );
          })
        ) : (
          <Text c="dimmed" size="sm">
            {getLanguageByKey("No data")}
          </Text>
        )}
      </Stack>
    </Card>
  );
};

