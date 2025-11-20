import React from "react";
import { Card, Text, Group, Stack, Box, Badge } from "@mantine/core";
import { FaCheckCircle, FaClock, FaCalendarAlt } from "react-icons/fa";
import { getLanguageByKey } from "@utils";

const fmt = (n) => (Number(n) || 0).toLocaleString();

export const ClosedTicketsCountCard = ({ 
  title, 
  subtitle, 
  olderThan11Days = 0, 
  newerThan11Days = 0,
  totalClosedTickets = 0,
  bg,
  width,
  height,
  icons = {},
  widgetType,
  userGroups = [], // Вложенные группы пользователей для by_group_title
  userTechnicians = [], // Вложенные пользователи для by_user_group
}) => {
  // Адаптивные размеры в зависимости от размера виджета
  const isCompact = width < 40 || height < 15;
  const isVeryCompact = width < 30 || height < 12;

  const cardPadding = isVeryCompact ? "md" : isCompact ? "sm" : "lg";
  const titleSize = isVeryCompact ? "md" : isCompact ? "sm" : "sm";
  const subtitleSize = "md";
  const totalSize = isVeryCompact ? 24 : isCompact ? 32 : 38;
  const colors = {
    older: "#F59E0B",    // amber-500
    newer: "#10B981",    // emerald-500
    total: "#8B5CF6",    // purple-500
  };

  const OlderIconNode = icons.older ?? <FaClock size={14} />;
  const NewerIconNode = icons.newer ?? <FaCalendarAlt size={14} />;
  const TotalIconNode = icons.total ?? <FaCheckCircle size={14} />;

  return (
    <Card
      shadow="sm"
      padding={cardPadding}
      radius="md"
      withBorder
      style={{ 
        backgroundColor: "var(--crm-ui-kit-palette-background-primary)",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden"
      }}
    >
      <Stack gap={isVeryCompact ? "md" : "sm"} style={{ flex: 1, height: "100%", minHeight: 0 }}>
        <Group justify="space-between" align="flex-start" style={{ flemdhrink: 0 }}>
          <Box>
            <Text size={titleSize} fw={500} c="dimmed">
              {title}
            </Text>
            <Group gap={6} wrap="wrap" mt={4}>
              <Badge variant="light" color="blue" size="sm">
                {getLanguageByKey("Closed Tickets Count") || widgetType || "Closed Tickets Count"}
              </Badge>
              {subtitle && (
                <Text size={subtitleSize} c="dimmed">
                  {subtitle}
                </Text>
              )}
            </Group>
          </Box>
        </Group>

        {/* Прокручиваемая область с контентом */}
        <Box style={{ flex: 1, overflowY: "auto", overflowX: "hidden", minHeight: 0 }}>
          <Stack gap={isVeryCompact ? "md" : "sm"}>
            <Group justify="space-between" align="center">
              <Box>
                <Text fz={totalSize} fw={900} style={{ lineHeight: 1 }}>
                  {fmt(totalClosedTickets)}
                </Text>
                <Text size="md" c="dimmed" fw={500}>
                  {getLanguageByKey("Total closed tickets")}
                </Text>
              </Box>
              
              <Stack gap="md" align="flex-end">
                <Group gap="md" align="center">
                  {TotalIconNode}
                  <Text size={isVeryCompact ? "md" : "sm"} c={colors.total}>
                    {getLanguageByKey("Total")}
                  </Text>
                </Group>
                <Text size="md" c="dimmed">
                  {getLanguageByKey("tickets")}
                </Text>
              </Stack>
            </Group>

            <Group justify="space-between" align="center">
              <Group gap="md" align="center">
                {OlderIconNode}
                <Text size={isVeryCompact ? "md" : "sm"} c={colors.older}>
                  {getLanguageByKey("Older than 11 days")}
                </Text>
              </Group>
              
              <Text size={isVeryCompact ? "md" : "sm"} c={colors.older}>
                {fmt(olderThan11Days)}
              </Text>
            </Group>

            <Group justify="space-between" align="center">
              <Group gap="md" align="center">
                {NewerIconNode}
                <Text size={isVeryCompact ? "md" : "sm"} c={colors.newer}>
                  {getLanguageByKey("Newer than 11 days")}
                </Text>
              </Group>
              
              <Text size={isVeryCompact ? "md" : "sm"} c={colors.newer}>
                {fmt(newerThan11Days)}
              </Text>
            </Group>

            {/* Вложенные группы пользователей (для by_group_title) */}
            {userGroups && userGroups.length > 0 && (
              <Box mt="md" pt="md" style={{ borderTop: "1px solid var(--crm-ui-kit-palette-border-default)" }}>
                <Text size="md" fw={700} c="dimmed" mb="sm" tt="uppercase">
                  {getLanguageByKey("User Groups") || "User Groups"}
                </Text>
                <Stack gap="md">
                  {userGroups.map((ug, ugIndex) => {
                    // Обрабатываем статистику группы
                    const groupStats = (() => {
                      if (!ug.stats || typeof ug.stats !== "object") return { olderThan11Days: 0, newerThan11Days: 0, totalClosedTickets: 0 };
                      if (Array.isArray(ug.stats)) return { olderThan11Days: 0, newerThan11Days: 0, totalClosedTickets: 0 };
                      const olderThan11DaysObj = ug.stats.older_than_11_days;
                      const newerThan11DaysObj = ug.stats.newer_than_11_days;
                      return {
                        olderThan11Days: olderThan11DaysObj && typeof olderThan11DaysObj === "object" ? (Number.isFinite(olderThan11DaysObj.count) ? olderThan11DaysObj.count : 0) : 0,
                        newerThan11Days: newerThan11DaysObj && typeof newerThan11DaysObj === "object" ? (Number.isFinite(newerThan11DaysObj.count) ? newerThan11DaysObj.count : 0) : 0,
                        totalClosedTickets: Number.isFinite(ug.total_closed_tickets_count) ? ug.total_closed_tickets_count : 0,
                      };
                    })();

                    if (groupStats.totalClosedTickets === 0) return null;

                    return (
                      <Box key={`ug-${ugIndex}`}>
                        <Text fw={600} size="sm" mb="md" c="dark">
                          {ug.userGroupName || "-"}
                        </Text>
                        <Stack gap="md">
                          <Group justify="space-between" align="center">
                            <Text size="md" c="dimmed" fw={500}>
                              {getLanguageByKey("Total closed tickets")}
                            </Text>
                            <Text fw={700} size="sm" c={colors.total}>
                              {fmt(groupStats.totalClosedTickets)}
                            </Text>
                          </Group>
                          <Group justify="space-between" align="center">
                            <Group gap="md" align="center">
                              {OlderIconNode}
                              <Text size="md" c={colors.older}>
                                {getLanguageByKey("Older than 11 days")}
                              </Text>
                            </Group>
                            <Text size="md" c={colors.older}>
                              {fmt(groupStats.olderThan11Days)}
                            </Text>
                          </Group>
                          <Group justify="space-between" align="center">
                            <Group gap="md" align="center">
                              {NewerIconNode}
                              <Text size="md" c={colors.newer}>
                                {getLanguageByKey("Newer than 11 days")}
                              </Text>
                            </Group>
                            <Text size="md" c={colors.newer}>
                              {fmt(groupStats.newerThan11Days)}
                            </Text>
                          </Group>
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
                    const userStats = (() => {
                      if (!ut.stats || typeof ut.stats !== "object") return { olderThan11Days: 0, newerThan11Days: 0, totalClosedTickets: 0 };
                      if (Array.isArray(ut.stats)) return { olderThan11Days: 0, newerThan11Days: 0, totalClosedTickets: 0 };
                      const olderThan11DaysObj = ut.stats.older_than_11_days;
                      const newerThan11DaysObj = ut.stats.newer_than_11_days;
                      return {
                        olderThan11Days: olderThan11DaysObj && typeof olderThan11DaysObj === "object" ? (Number.isFinite(olderThan11DaysObj.count) ? olderThan11DaysObj.count : 0) : 0,
                        newerThan11Days: newerThan11DaysObj && typeof newerThan11DaysObj === "object" ? (Number.isFinite(newerThan11DaysObj.count) ? newerThan11DaysObj.count : 0) : 0,
                        totalClosedTickets: Number.isFinite(ut.total_closed_tickets_count) ? ut.total_closed_tickets_count : 0,
                      };
                    })();

                    if (userStats.totalClosedTickets === 0) return null;

                    return (
                      <Box key={`ut-${utIndex}`}>
                        <Text fw={600} size="sm" mb="md" c="dark">
                          {ut.userName || `ID ${ut.userId}`}
                        </Text>
                        <Stack gap="md">
                          <Group justify="space-between" align="center">
                            <Text size="md" c="dimmed" fw={500}>
                              {getLanguageByKey("Total closed tickets")}
                            </Text>
                            <Text fw={700} size="sm" c={colors.total}>
                              {fmt(userStats.totalClosedTickets)}
                            </Text>
                          </Group>
                          <Group justify="space-between" align="center">
                            <Group gap="md" align="center">
                              {OlderIconNode}
                              <Text size="md" c={colors.older}>
                                {getLanguageByKey("Older than 11 days")}
                              </Text>
                            </Group>
                            <Text size="md" c={colors.older}>
                              {fmt(userStats.olderThan11Days)}
                            </Text>
                          </Group>
                          <Group justify="space-between" align="center">
                            <Group gap="md" align="center">
                              {NewerIconNode}
                              <Text size="md" c={colors.newer}>
                                {getLanguageByKey("Newer than 11 days")}
                              </Text>
                            </Group>
                            <Text size="md" c={colors.newer}>
                              {fmt(userStats.newerThan11Days)}
                            </Text>
                          </Group>
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
