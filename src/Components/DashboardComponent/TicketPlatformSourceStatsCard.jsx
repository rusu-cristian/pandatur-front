import React, { useMemo } from "react";
import { Card, Group, Stack, Text, Badge, Progress, ThemeIcon, Box } from "@mantine/core";
import { FaShareAlt } from "react-icons/fa";
import { Link } from "react-router-dom";
import { getLanguageByKey } from "@utils";
import { normalizeCategoricalStats } from "../../utils/dashboardHelpers";

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
  userGroups = [], // Вложенные группы пользователей для by_group_title
  userTechnicians = [], // Вложенные пользователи для by_user_group
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
            <Text size="md" c="dimmed" fw={700} tt="uppercase" style={{ letterSpacing: 0.8 }}>
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
          <Text size="md" c="dimmed" fw={600}>
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
                  <Group gap="md" align="center">
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
                    <Text size="md" c="dimmed">
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

        {/* Вложенные группы пользователей (user_groups) для by_group_title */}
        {userGroups && userGroups.length > 0 && (
          <Box mt="md" pt="md" style={{ borderTop: "1px solid var(--crm-ui-kit-palette-border-default)" }}>
            <Text size="md" fw={700} c="dimmed" mb="sm" tt="uppercase">
              {getLanguageByKey("User Groups") || "User Groups"}
            </Text>
            <Stack gap="md">
              {userGroups.map((ug, ugIndex) => {
                // Обрабатываем статистику группы через normalizeCategoricalStats
                const groupStats = normalizeCategoricalStats(ug.stats);

                const normalizedGroupStats = mapItems(groupStats, limit);
                const groupTotal = normalizedGroupStats.reduce((sum, item) => sum + (item.count || 0), 0);
                const groupMaxCount = Math.max(1, ...normalizedGroupStats.map((item) => (Number.isFinite(item.count) ? item.count : 0)));

                if (normalizedGroupStats.length === 0) return null;

                return (
                  <Box key={`ug-${ugIndex}`}>
                    <Text fw={600} size="sm" mb="md" c="dark">
                      {ug.userGroupName}
                    </Text>
                    <Stack gap="md">
                      {normalizedGroupStats.map((item, itemIndex) => {
                        const count = Number.isFinite(item.count) ? item.count : 0;
                        const percent = clampPercentage((count / groupMaxCount) * 100);
                        const share = groupTotal > 0 ? Math.round((count / groupTotal) * 100) : 0;
                        const channelLabel = item.channel || getLanguageByKey("No source");
                        const linkPath = item.href || null;

                        return (
                          <Box key={`${item.channel}-${itemIndex}`} pl="md">
                            <Group justify="space-between" align="center" mb={4}>
                              <Text size="md" fw={500}>
                                {channelLabel}
                              </Text>
                              <Box style={{ textAlign: "right" }}>
                                {linkPath ? (
                                  <Link
                                    to={linkPath}
                                    target="_blank"
                                    className="dashboard-link"
                                    style={{
                                      color: "var(--crm-ui-kit-palette-link-primary)",
                                      textDecoration: "underline",
                                      fontSize: 12,
                                      fontWeight: 600,
                                      display: "inline-block",
                                    }}
                                  >
                                    {fmt(count)}
                                  </Link>
                                ) : (
                                  <Text size="md" fw={600}>
                                    {fmt(count)}
                                  </Text>
                                )}
                                <Text size="md" c="dimmed">
                                  {share}%
                                </Text>
                              </Box>
                            </Group>
                            <Progress value={percent} size="sm" radius="xl" color="grape" />
                          </Box>
                        );
                      })}
                    </Stack>
                  </Box>
                );
              })}
            </Stack>
          </Box>
        )}

        {/* Вложенные пользователи (user_technicians) для by_user_group */}
        {userTechnicians && userTechnicians.length > 0 && (
          <Box mt="md" pt="md" style={{ borderTop: "1px solid var(--crm-ui-kit-palette-border-default)" }}>
            <Text size="md" fw={700} c="dimmed" mb="sm" tt="uppercase">
              {getLanguageByKey("Users") || "Users"}
            </Text>
            <Stack gap="md">
              {userTechnicians.map((ut, utIndex) => {
                // Обрабатываем статистику пользователя через normalizeCategoricalStats
                const userStats = normalizeCategoricalStats(ut.stats);

                const normalizedUserStats = mapItems(userStats, limit);
                const userTotal = normalizedUserStats.reduce((sum, item) => sum + (item.count || 0), 0);
                const userMaxCount = Math.max(1, ...normalizedUserStats.map((item) => (Number.isFinite(item.count) ? item.count : 0)));

                if (normalizedUserStats.length === 0) return null;

                return (
                  <Box key={`ut-${utIndex}`}>
                    <Text fw={600} size="sm" mb="md" c="dark">
                      {ut.userName || `ID ${ut.userId}`}
                    </Text>
                    <Stack gap="md">
                      {normalizedUserStats.map((item, itemIndex) => {
                        const count = Number.isFinite(item.count) ? item.count : 0;
                        const percent = clampPercentage((count / userMaxCount) * 100);
                        const share = userTotal > 0 ? Math.round((count / userTotal) * 100) : 0;
                        const channelLabel = item.channel || getLanguageByKey("No source");
                        const linkPath = item.href || null;

                        return (
                          <Box key={`${item.channel}-${itemIndex}`} pl="md">
                            <Group justify="space-between" align="center" mb={4}>
                              <Text size="md" fw={500}>
                                {channelLabel}
                              </Text>
                              <Box style={{ textAlign: "right" }}>
                                {linkPath ? (
                                  <Link
                                    to={linkPath}
                                    target="_blank"
                                    className="dashboard-link"
                                    style={{
                                      color: "var(--crm-ui-kit-palette-link-primary)",
                                      textDecoration: "underline",
                                      fontSize: 12,
                                      fontWeight: 600,
                                      display: "inline-block",
                                    }}
                                  >
                                    {fmt(count)}
                                  </Link>
                                ) : (
                                  <Text size="md" fw={600}>
                                    {fmt(count)}
                                  </Text>
                                )}
                                <Text size="md" c="dimmed">
                                  {share}%
                                </Text>
                              </Box>
                            </Group>
                            <Progress value={percent} size="sm" radius="xl" color="grape" />
                          </Box>
                        );
                      })}
                    </Stack>
                  </Box>
                );
              })}
            </Stack>
          </Box>
        )}
      </Stack>
    </Card>
  );
};

