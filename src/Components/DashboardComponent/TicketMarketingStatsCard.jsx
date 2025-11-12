import React, { useMemo } from "react";
import { Card, Group, Stack, Text, Badge, Progress, ThemeIcon, Box } from "@mantine/core";
import { FaBullhorn, FaShareAlt } from "react-icons/fa";
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

const TicketCategoricalStatsCard = ({
  title,
  subtitle,
  items = [],
  total = 0,
  bg,
  limit = 100,
  iconNode,
  color = "indigo",
  defaultTitleKey,
  emptyLabelKey = "No data",
  itemFallbackKey = "-",
}) => {
  const normalizedStats = useMemo(() => mapItems(items, limit), [items, limit]);

  const totalValue = useMemo(() => {
    if (Number.isFinite(total) && total > 0) {
      return total;
    }
    return normalizedStats.reduce((sum, item) => sum + (item.count || 0), 0);
  }, [normalizedStats, total]);

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
          <ThemeIcon size="xl" radius="xl" variant="light" color={color}>
            {iconNode}
          </ThemeIcon>
          <Stack gap={4}>
            <Text size="xs" c="dimmed" fw={700} tt="uppercase" style={{ letterSpacing: 0.8 }}>
              {title || getLanguageByKey(defaultTitleKey || "Statistics")}
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
            const channelLabel = item.channel || getLanguageByKey(itemFallbackKey);
            const linkProps = item.href
              ? {
                component: "a",
                href: item.href,
                target: "_blank",
                rel: "noopener noreferrer",
                style: { color: "inherit", textDecoration: "none" },
              }
              : {};

            return (
              <Box key={`${item.channel}-${index}`}>
                <Group justify="space-between" align="center" mb={6}>
                  <Group gap="xs" align="center">
                    <Badge variant="light" radius="sm">
                      {index + 1}
                    </Badge>
                    <Text fw={600} size="sm" {...linkProps}>
                      {channelLabel}
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
                <Progress value={percent} size="md" radius="xl" color={color} />
              </Box>
            );
          })
        ) : (
          <Text c="dimmed" size="sm">
            {getLanguageByKey(emptyLabelKey)}
          </Text>
        )}
      </Stack>
    </Card>
  );
};

export const TicketMarketingStatsCard = ({
  marketingStats = [],
  totalMarketing = 0,
  ...rest
}) => (
  <TicketCategoricalStatsCard
    {...rest}
    items={marketingStats}
    total={totalMarketing}
    iconNode={<FaBullhorn size={18} />}
    color="blue"
    defaultTitleKey="Ticket Marketing Stats"
    emptyLabelKey="No data"
    itemFallbackKey="No source"
  />
);

export const TicketSourceStatsCard = ({
  sourceStats = [],
  totalSources = 0,
  ...rest
}) => (
  <TicketCategoricalStatsCard
    {...rest}
    items={sourceStats}
    total={totalSources}
    iconNode={<FaShareAlt size={18} />}
    color="teal"
    defaultTitleKey="Ticket Source Stats"
    emptyLabelKey="No data"
    itemFallbackKey="No source"
  />
);

export const TicketPlatformSourceStatsCard = ({
  platformSourceStats = [],
  totalPlatformSources = 0,
  ...rest
}) => (
  <TicketCategoricalStatsCard
    {...rest}
    items={platformSourceStats}
    total={totalPlatformSources}
    iconNode={<FaShareAlt size={18} />}
    color="grape"
    defaultTitleKey="Ticket Platform Source Stats"
    emptyLabelKey="No data"
    itemFallbackKey="No source"
  />
);

