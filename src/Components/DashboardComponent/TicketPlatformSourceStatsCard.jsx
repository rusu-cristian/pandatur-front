import React, { useMemo } from "react";
import { Card, Group, Stack, Text, Badge, Progress, ThemeIcon, Box } from "@mantine/core";
import { FaShareAlt } from "react-icons/fa";
import { Link } from "react-router-dom";
import { getLanguageByKey } from "@utils";

const fmt = (n) => (typeof n === "number" ? n.toLocaleString() : "-");

const clampPercentage = (value) => {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, value));
};

const mapItems = (items = [], limit = 100) => {
  const normalized = (items || []).map((item) => {
    const count = Number.isFinite(item?.count) ? item.count : 0;
    const rawPercentage = Number.isFinite(item?.percentage) ? item.percentage : undefined;

    return {
      channel: item?.channel || "-",
      count,
      ...(rawPercentage !== undefined ? { percentage: clampPercentage(rawPercentage) } : {}),
      href: typeof item?.href === "string" && item.href ? item.href : undefined,
    };
  });
  normalized.sort((a, b) => b.count - a.count);
  return normalized.slice(0, limit);
};

export const TicketPlatformSourceStatsCard = ({
  platformSourceStats = [],
  totalPlatformSources = 0,
  title,
  subtitle,
  bg,
  limit = 100,
  widgetType,
}) => {
  const normalizedStats = useMemo(() => mapItems(platformSourceStats, limit), [platformSourceStats, limit]);

  const totalValue = useMemo(() => {
    if (Number.isFinite(totalPlatformSources) && totalPlatformSources > 0) {
      return totalPlatformSources;
    }
    return normalizedStats.reduce((sum, item) => sum + (item.count || 0), 0);
  }, [normalizedStats, totalPlatformSources]);

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
          <ThemeIcon size="xl" radius="xl" variant="light" color="grape">
            <FaShareAlt size={18} />
          </ThemeIcon>
          <Stack gap={4}>
            <Text size="xs" c="dimmed" fw={700} tt="uppercase" style={{ letterSpacing: 0.8 }}>
              {title || getLanguageByKey("Ticket Platform Source Stats")}
            </Text>
            <Group gap={6} wrap="wrap">
              <Badge variant="light" color="blue" size="sm">
                {getLanguageByKey("Platformă lead") || widgetType || "Platformă lead"}
              </Badge>
              {subtitle ? (
                <Badge variant="light" size="sm">
                  {subtitle}
                </Badge>
              ) : null}
            </Group>
          </Stack>
        </Group>
        <Box style={{ textAlign: "right" }}>
          <Text fz={36} fw={900} style={{ lineHeight: 1 }}>
            {fmt(totalValue)}
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
            const share = totalValue > 0 ? Math.round((count / totalValue) * 100) : 0;
            const channelLabel = item.channel || getLanguageByKey("No source");
            const linkPath = item.href || null;

            return (
              <Box key={`${item.channel}-${index}`}>
                <Group justify="space-between" align="center" mb={6}>
                  <Group gap="xs" align="center">
                    <Badge variant="light" radius="sm">
                      {index + 1}
                    </Badge>
                    <Text fw={600} size="sm">
                      {channelLabel}
                    </Text>
                  </Group>
                  <Box style={{ textAlign: "right" }}>
                    {linkPath ? (
                      <Link
                        to={linkPath}
                        target="_blank"
                        className="dashboard-link"
                        style={{
                          color: "var(--crm-ui-kit-palette-link-primary)",
                          textDecoration: "underline",
                          fontSize: 14,
                          fontWeight: 700,
                          display: "inline-block",
                        }}
                      >
                        {fmt(count)}
                      </Link>
                    ) : (
                      <Text size="sm" fw={700}>
                        {fmt(count)}
                      </Text>
                    )}
                    <Text size="xs" c="dimmed">
                      {share}%
                    </Text>
                  </Box>
                </Group>
                <Progress value={percent} size="md" radius="xl" color="grape" />
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

