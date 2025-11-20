import React, { useMemo } from "react";
import { Card, Text, Group, Stack, Badge, Box, Progress } from "@mantine/core";
import { FaClock } from "react-icons/fa";
import { getLanguageByKey } from "../utils";

export const WorkflowDurationCard = ({
  durationBuckets = [],
  totalTickets = 0,
  totalDurationMinutes = 0,
  averageDurationMinutes = 0,
  ticketsProcessed = 0,
  title,
  subtitle,
  bg,
  width,
  height,
  widgetType,
  userGroups = [], // Вложенные группы пользователей для by_group_title
  userTechnicians = [], // Вложенные пользователи для by_user_group
}) => {
  // Адаптивные размеры в зависимости от размера виджета
  const isCompact = width < 40 || height < 15;
  const isVeryCompact = width < 30 || height < 12;

  const cardPadding = isVeryCompact ? "md" : isCompact ? "sm" : "lg";
  const titleSize = isVeryCompact ? "md" : isCompact ? "sm" : "sm";
  const subtitleSize = isVeryCompact ? "md" : isCompact ? "sm" : "lg";
  const badgeSize = isVeryCompact ? "md" : isCompact ? "sm" : "lg";
  const statGap = isVeryCompact ? "md" : isCompact ? "sm" : "sm";

  // Используем totalTickets или ticketsProcessed
  const totalValue = totalTickets || ticketsProcessed || 0;

  // Ограничиваем количество отображаемых элементов для компактного режима
  const maxItems = isVeryCompact ? 3 : isCompact ? 4 : 5;
  const displayBuckets = useMemo(() => {
    if (!Array.isArray(durationBuckets) || durationBuckets.length === 0) return [];
    return durationBuckets.slice(0, maxItems);
  }, [durationBuckets, maxItems]);

  const maxCount = useMemo(
    () => Math.max(1, ...displayBuckets.map((item) => (Number.isFinite(item.count) ? item.count : 0))),
    [displayBuckets]
  );

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
        overflow: "hidden",
      }}
    >
      <Stack gap={statGap} style={{ flex: 1, height: "100%", minHeight: 0 }}>
        {/* Заголовок */}
        <Group justify="space-between" align="flex-start" style={{ flemdhrink: 0 }}>
          <Box>
            <Text fw={600} size={titleSize} c="dimmed">
              {title}
            </Text>
            <Group gap={6} wrap="wrap" mt={4}>
              <Badge variant="light" color="blue" size="sm">
                {getLanguageByKey("Workflow Duration") || widgetType || "Workflow Duration"}
              </Badge>
              {subtitle && (
                <Text fw={700} size={subtitleSize} c="dark">
                  {subtitle}
                </Text>
              )}
            </Group>
          </Box>
          <Badge size={badgeSize} variant="light" color="blue">
            {totalValue} {getLanguageByKey("Tickets processed")}
          </Badge>
        </Group>

        {/* Прокручиваемая область с контентом */}
        <Box style={{ flex: 1, overflowY: "auto", overflowX: "hidden", minHeight: 0 }}>
          <Stack gap={isVeryCompact ? "md" : "sm"}>
            {/* Статистика по buckets */}
            {displayBuckets.length > 0 ? (
              displayBuckets.map((bucket, index) => {
                const count = Number.isFinite(bucket.count) ? bucket.count : 0;
                const percent = maxCount > 0 ? Math.round((count / maxCount) * 100) : 0;

                return (
                  <Box key={index}>
                    <Group justify="space-between" align="center" mb={4}>
                      <Group gap="md" align="center">
                        <FaClock size={isVeryCompact ? 10 : 12} color="#007bff" />
                        <Text fw={500} size={isVeryCompact ? "md" : "sm"} c="dark" lineClamp={1}>
                          {bucket.duration_bucket || "-"}
                        </Text>
                      </Group>
                      <Text fw={700} size={isVeryCompact ? "md" : "sm"} c="#007bff">
                        {count}
                      </Text>
                    </Group>
                    <Progress
                      value={percent}
                      size={isVeryCompact ? "md" : "sm"}
                      color="blue"
                      radius="xl"
                    />
                  </Box>
                );
              })
            ) : (
              <Text c="dimmed" size="sm">
                {getLanguageByKey("No data")}
              </Text>
            )}

            {/* Вложенные группы пользователей (для by_group_title) */}
            {userGroups && userGroups.length > 0 && (
              <Box mt="md" pt="md" style={{ borderTop: "1px solid var(--crm-ui-kit-palette-border-default)" }}>
                <Text size="md" fw={700} c="dimmed" mb="sm" tt="uppercase">
                  {getLanguageByKey("User Groups") || "User Groups"}
                </Text>
                <Stack gap="md">
                  {userGroups.map((ug, ugIndex) => {
                    const groupBuckets = (() => {
                      if (!ug.stats || typeof ug.stats !== "object") return [];
                      if (Array.isArray(ug.stats)) return ug.stats;
                      return Object.values(ug.stats)
                        .filter(item => item && typeof item === "object")
                        .map(item => ({
                          duration_bucket: item.duration_bucket || item.bucket || "-",
                          count: Number.isFinite(item.count) ? item.count : 0,
                        }))
                        .sort((a, b) => {
                          const order = {
                            "0-1 hour": 1,
                            "1-4 hours": 2,
                            "4-8 hours": 3,
                            "8-24 hours": 4,
                            "1-2 days": 5,
                            "2-7 days": 6,
                            "7+ days": 7,
                            "Not processed": 8,
                          };
                          const aOrder = order[a.duration_bucket] || 99;
                          const bOrder = order[b.duration_bucket] || 99;
                          return aOrder - bOrder;
                        });
                    })();

                    const displayGroupBuckets = groupBuckets.slice(0, isVeryCompact ? 2 : isCompact ? 3 : 4);
                    const groupMaxCount = Math.max(1, ...displayGroupBuckets.map((item) => (Number.isFinite(item.count) ? item.count : 0)));

                    if (displayGroupBuckets.length === 0) return null;

                    return (
                      <Box key={`ug-${ugIndex}`}>
                        <Text fw={600} size="sm" mb="md" c="dark">
                          {ug.userGroupName || "-"}
                        </Text>
                        <Stack gap="md">
                          {displayGroupBuckets.map((bucket, bucketIndex) => {
                            const count = Number.isFinite(bucket.count) ? bucket.count : 0;
                            const percent = groupMaxCount > 0 ? Math.round((count / groupMaxCount) * 100) : 0;
                            return (
                              <Box key={`${bucketIndex}`} pl="md">
                                <Group justify="space-between" align="center" mb={4}>
                                  <Group gap="md" align="center">
                                    <FaClock size={isVeryCompact ? 8 : 10} color="#007bff" />
                                    <Text fw={500} size={isVeryCompact ? "md" : "md"} c="dark" lineClamp={1}>
                                      {bucket.duration_bucket || "-"}
                                    </Text>
                                  </Group>
                                  <Text fw={700} size={isVeryCompact ? "md" : "md"} c="#007bff">
                                    {count}
                                  </Text>
                                </Group>
                                <Progress
                                  value={percent}
                                  size="md"
                                  color="blue"
                                  radius="xl"
                                />
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

            {/* Вложенные пользователи (для by_user_group) */}
            {userTechnicians && userTechnicians.length > 0 && (
              <Box mt="md" pt="md" style={{ borderTop: "1px solid var(--crm-ui-kit-palette-border-default)" }}>
                <Text size="md" fw={700} c="dimmed" mb="sm" tt="uppercase">
                  {getLanguageByKey("Users") || "Users"}
                </Text>
                <Stack gap="md">
                  {userTechnicians.map((ut, utIndex) => {
                    const userBuckets = (() => {
                      if (!ut.stats || typeof ut.stats !== "object") return [];
                      if (Array.isArray(ut.stats)) return ut.stats;
                      return Object.values(ut.stats)
                        .filter(item => item && typeof item === "object")
                        .map(item => ({
                          duration_bucket: item.duration_bucket || item.bucket || "-",
                          count: Number.isFinite(item.count) ? item.count : 0,
                        }))
                        .sort((a, b) => {
                          const order = {
                            "0-1 hour": 1,
                            "1-4 hours": 2,
                            "4-8 hours": 3,
                            "8-24 hours": 4,
                            "1-2 days": 5,
                            "2-7 days": 6,
                            "7+ days": 7,
                            "Not processed": 8,
                          };
                          const aOrder = order[a.duration_bucket] || 99;
                          const bOrder = order[b.duration_bucket] || 99;
                          return aOrder - bOrder;
                        });
                    })();

                    const displayUserBuckets = userBuckets.slice(0, isVeryCompact ? 2 : isCompact ? 3 : 4);
                    const userMaxCount = Math.max(1, ...displayUserBuckets.map((item) => (Number.isFinite(item.count) ? item.count : 0)));

                    if (displayUserBuckets.length === 0) return null;

                    return (
                      <Box key={`ut-${utIndex}`}>
                        <Text fw={600} size="sm" mb="md" c="dark">
                          {ut.userName || `ID ${ut.userId}`}
                        </Text>
                        <Stack gap="md">
                          {displayUserBuckets.map((bucket, bucketIndex) => {
                            const count = Number.isFinite(bucket.count) ? bucket.count : 0;
                            const percent = userMaxCount > 0 ? Math.round((count / userMaxCount) * 100) : 0;
                            return (
                              <Box key={`${bucketIndex}`} pl="md">
                                <Group justify="space-between" align="center" mb={4}>
                                  <Group gap="md" align="center">
                                    <FaClock size={isVeryCompact ? 8 : 10} color="#007bff" />
                                    <Text fw={500} size={isVeryCompact ? "md" : "md"} c="dark" lineClamp={1}>
                                      {bucket.duration_bucket || "-"}
                                    </Text>
                                  </Group>
                                  <Text fw={700} size={isVeryCompact ? "md" : "md"} c="#007bff">
                                    {count}
                                  </Text>
                                </Group>
                                <Progress
                                  value={percent}
                                  size="md"
                                  color="blue"
                                  radius="xl"
                                />
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

            {/* Общая информация */}
            <Group justify="center" mt="md" pt="md" style={{ borderTop: "1px solid var(--crm-ui-kit-palette-border-default)" }}>
              <Text fw={600} size="sm" c="dimmed">
                {getLanguageByKey("Processing time")}
              </Text>
            </Group>
          </Stack>
        </Box>
      </Stack>
    </Card>
  );
};
