import React from "react";
import { Card, Stack, Group, Text, Badge, Progress, ThemeIcon, Box } from "@mantine/core";
import { FaClock, FaChartLine } from "react-icons/fa";
import { getLanguageByKey } from "@utils";

const t = (key) => String(getLanguageByKey?.(key) ?? key);

// Форматирование времени
const fmtTime = (hours) => {
  if (typeof hours !== "number" || hours === 0) return `0${getLanguageByKey("hours")}`;

  const wholeHours = Math.floor(hours);
  const minutes = Math.round((hours - wholeHours) * 60);

  if (minutes === 0) {
    return `${wholeHours}${getLanguageByKey("hours")}`;
  } else {
    return `${wholeHours}${getLanguageByKey("hours")} ${minutes}${getLanguageByKey("minutes")}`;
  }
};

// Форматирование минут в часы и минуты
const fmtMinutes = (minutes) => {
  if (typeof minutes !== "number" || minutes === 0) return `0${getLanguageByKey("minutes")}`;

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours === 0) {
    return `${remainingMinutes}${getLanguageByKey("minutes")}`;
  } else if (remainingMinutes === 0) {
    return `${hours}${getLanguageByKey("hours")}`;
  } else {
    return `${hours}${getLanguageByKey("hours")} ${remainingMinutes}${getLanguageByKey("minutes")}`;
  }
};

export const TicketLifetimeStatsCard = ({
  totalLifetimeMinutes = 0,
  averageLifetimeMinutes = 0,
  ticketsProcessed = 0,
  totalLifetimeHours = 0,
  averageLifetimeHours = 0,
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

  const cardPadding = isVeryCompact ? "xs" : isCompact ? "sm" : "lg";
  const titleSize = isVeryCompact ? "xs" : isCompact ? "sm" : "sm";
  const subtitleSize = isVeryCompact ? "xs" : isCompact ? "sm" : "lg";
  const badgeSize = isVeryCompact ? "xs" : isCompact ? "sm" : "lg";
  const statGap = isVeryCompact ? "xs" : isCompact ? "sm" : "sm";

  const getEfficiencyColor = (avgHours) => {
    if (avgHours <= 1) return "green"; // Очень быстро
    if (avgHours <= 4) return "yellow"; // Нормально
    if (avgHours <= 8) return "orange"; // Медленно
    return "red"; // Очень медленно
  };

  return (
    <Card
      shadow="sm"
      padding={cardPadding}
      radius="md"
      withBorder
      style={{ backgroundColor: "var(--crm-ui-kit-palette-background-primary)", height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}
    >
      <Stack gap={statGap} style={{ flex: 1, height: "100%", minHeight: 0 }}>
        <Group justify="space-between" align="flex-start" style={{ flexShrink: 0 }}>
          <Stack gap={4}>
            <Text fw={600} size={titleSize} c="dimmed">
              {title}
            </Text>
            <Group gap={6} wrap="wrap">
              <Badge variant="light" color="blue" size="sm">
                {getLanguageByKey("Ticket Lifetime Stats") || widgetType || "Ticket Lifetime Stats"}
              </Badge>
              {subtitle && (
                <Text fw={700} size={subtitleSize}>
                  {subtitle}
                </Text>
              )}
            </Group>
          </Stack>
          <Badge color="blue" variant="light" size={badgeSize}>
            {ticketsProcessed}
          </Badge>
        </Group>

        {/* Прокручиваемая область с контентом */}
        <Box style={{ flex: 1, overflowY: "auto", overflowX: "hidden", minHeight: 0 }}>
          <Stack gap={isVeryCompact ? "xs" : "sm"}>
            {/* Общее время обработки */}
            <Group justify="space-between" align="center">
              <Group gap="xs">
                <ThemeIcon color="blue" variant="light" size={isVeryCompact ? "xs" : "sm"}>
                  <FaClock size={isVeryCompact ? 10 : 12} />
                </ThemeIcon>
                <Text size={isVeryCompact ? "xs" : "sm"} fw={500}>
                  {t("Total processing time")}
                </Text>
              </Group>
              <Text fw={600} size={isVeryCompact ? "xs" : "sm"}>
                {fmtTime(totalLifetimeHours)}
              </Text>
            </Group>
            <Progress
              value={Math.min(100, (totalLifetimeHours / Math.max(totalLifetimeHours, 1)) * 100)}
              color="blue"
              size={isVeryCompact ? "xs" : "sm"}
              radius="xl"
            />

            {/* Среднее время обработки */}
            <Group justify="space-between" align="center">
              <Group gap="xs">
                <ThemeIcon color="green" variant="light" size={isVeryCompact ? "xs" : "sm"}>
                  <FaChartLine size={isVeryCompact ? 10 : 12} />
                </ThemeIcon>
                <Text size={isVeryCompact ? "xs" : "sm"} fw={500}>
                  {t("Average processing time")}
                </Text>
              </Group>
              <Text fw={600} size={isVeryCompact ? "xs" : "sm"}>
                {fmtTime(averageLifetimeHours)}
              </Text>
            </Group>
            <Progress
              value={Math.min(100, (averageLifetimeHours / Math.max(averageLifetimeHours, 1)) * 100)}
              color={getEfficiencyColor(averageLifetimeHours)}
              size={isVeryCompact ? "xs" : "sm"}
              radius="xl"
            />

            {/* Вложенные группы пользователей (для by_group_title) */}
            {userGroups && userGroups.length > 0 && (
              <Box mt="md" pt="md" style={{ borderTop: "1px solid var(--crm-ui-kit-palette-border-default)" }}>
                <Text size="xs" fw={700} c="dimmed" mb="sm" tt="uppercase">
                  {getLanguageByKey("User Groups") || "User Groups"}
                </Text>
                <Stack gap="md">
                  {userGroups.map((ug, ugIndex) => {
                    // Обрабатываем статистику группы
                    const groupStats = (() => {
                      if (!ug.stats || typeof ug.stats !== "object") return { totalMinutes: 0, averageMinutes: 0, ticketsProcessed: 0 };
                      if (Array.isArray(ug.stats)) return { totalMinutes: 0, averageMinutes: 0, ticketsProcessed: 0 };
                      const lifetimeObj = ug.stats.lifetime;
                      if (lifetimeObj && typeof lifetimeObj === "object") {
                        return {
                          totalMinutes: Number.isFinite(lifetimeObj.total_minutes) ? lifetimeObj.total_minutes : 0,
                          averageMinutes: Number.isFinite(lifetimeObj.average_minutes) ? lifetimeObj.average_minutes : 0,
                          ticketsProcessed: Number.isFinite(lifetimeObj.count) ? lifetimeObj.count : (Number.isFinite(ug.tickets_processed) ? ug.tickets_processed : 0),
                        };
                      }
                      return { totalMinutes: 0, averageMinutes: 0, ticketsProcessed: 0 };
                    })();

                    const groupTotalHours = Math.round((groupStats.totalMinutes / 60) * 10) / 10;
                    const groupAvgHours = Math.round((groupStats.averageMinutes / 60) * 10) / 10;

                    if (groupStats.ticketsProcessed === 0) return null;

                    return (
                      <Box key={`ug-${ugIndex}`}>
                        <Text fw={600} size="sm" mb="xs" c="dark">
                          {ug.userGroupName || "-"}
                        </Text>
                        <Stack gap="xs">
                          {/* Total processing time для группы */}
                          <Group justify="space-between" align="center">
                            <Group gap="xs">
                              <ThemeIcon color="blue" variant="light" size="xs">
                                <FaClock size={10} />
                              </ThemeIcon>
                              <Text size="xs" fw={500}>
                                {t("Total processing time")}
                              </Text>
                            </Group>
                            <Text fw={600} size="xs">
                              {fmtTime(groupTotalHours)}
                            </Text>
                          </Group>
                          <Progress
                            value={Math.min(100, (groupTotalHours / Math.max(groupTotalHours, 1)) * 100)}
                            color="blue"
                            size="xs"
                            radius="xl"
                          />
                          {/* Average processing time для группы */}
                          <Group justify="space-between" align="center">
                            <Group gap="xs">
                              <ThemeIcon color="green" variant="light" size="xs">
                                <FaChartLine size={10} />
                              </ThemeIcon>
                              <Text size="xs" fw={500}>
                                {t("Average processing time")}
                              </Text>
                            </Group>
                            <Text fw={600} size="xs">
                              {fmtTime(groupAvgHours)}
                            </Text>
                          </Group>
                          <Progress
                            value={Math.min(100, (groupAvgHours / Math.max(groupAvgHours, 1)) * 100)}
                            color={getEfficiencyColor(groupAvgHours)}
                            size="xs"
                            radius="xl"
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
                <Text size="xs" fw={700} c="dimmed" mb="sm" tt="uppercase">
                  {getLanguageByKey("Users") || "Users"}
                </Text>
                <Stack gap="md">
                  {userTechnicians.map((ut, utIndex) => {
                    // Обрабатываем статистику пользователя
                    const userStats = (() => {
                      if (!ut.stats || typeof ut.stats !== "object") return { totalMinutes: 0, averageMinutes: 0, ticketsProcessed: 0 };
                      if (Array.isArray(ut.stats)) return { totalMinutes: 0, averageMinutes: 0, ticketsProcessed: 0 };
                      const lifetimeObj = ut.stats.lifetime;
                      if (lifetimeObj && typeof lifetimeObj === "object") {
                        return {
                          totalMinutes: Number.isFinite(lifetimeObj.total_minutes) ? lifetimeObj.total_minutes : 0,
                          averageMinutes: Number.isFinite(lifetimeObj.average_minutes) ? lifetimeObj.average_minutes : 0,
                          ticketsProcessed: Number.isFinite(lifetimeObj.count) ? lifetimeObj.count : (Number.isFinite(ut.tickets_processed) ? ut.tickets_processed : 0),
                        };
                      }
                      return { totalMinutes: 0, averageMinutes: 0, ticketsProcessed: 0 };
                    })();

                    const userTotalHours = Math.round((userStats.totalMinutes / 60) * 10) / 10;
                    const userAvgHours = Math.round((userStats.averageMinutes / 60) * 10) / 10;

                    if (userStats.ticketsProcessed === 0) return null;

                    return (
                      <Box key={`ut-${utIndex}`}>
                        <Text fw={600} size="sm" mb="xs" c="dark">
                          {ut.userName || `ID ${ut.userId}`}
                        </Text>
                        <Stack gap="xs">
                          {/* Total processing time для пользователя */}
                          <Group justify="space-between" align="center">
                            <Group gap="xs">
                              <ThemeIcon color="blue" variant="light" size="xs">
                                <FaClock size={10} />
                              </ThemeIcon>
                              <Text size="xs" fw={500}>
                                {t("Total processing time")}
                              </Text>
                            </Group>
                            <Text fw={600} size="xs">
                              {fmtTime(userTotalHours)}
                            </Text>
                          </Group>
                          <Progress
                            value={Math.min(100, (userTotalHours / Math.max(userTotalHours, 1)) * 100)}
                            color="blue"
                            size="xs"
                            radius="xl"
                          />
                          {/* Average processing time для пользователя */}
                          <Group justify="space-between" align="center">
                            <Group gap="xs">
                              <ThemeIcon color="green" variant="light" size="xs">
                                <FaChartLine size={10} />
                              </ThemeIcon>
                              <Text size="xs" fw={500}>
                                {t("Average processing time")}
                              </Text>
                            </Group>
                            <Text fw={600} size="xs">
                              {fmtTime(userAvgHours)}
                            </Text>
                          </Group>
                          <Progress
                            value={Math.min(100, (userAvgHours / Math.max(userAvgHours, 1)) * 100)}
                            color={getEfficiencyColor(userAvgHours)}
                            size="xs"
                            radius="xl"
                          />
                        </Stack>
                      </Box>
                    );
                  })}
                </Stack>
              </Box>
            )}

            {/* Общая статистика */}
            <Group justify="space-between" align="center" mt="md" pt="md" style={{ borderTop: "1px solid var(--crm-ui-kit-palette-border-default)" }}>
              <Text size="xs" c="dimmed">
                {t("Tickets processed")}
              </Text>
              <Text fw={700} size={isVeryCompact ? "xs" : "sm"}>
                {ticketsProcessed}
              </Text>
            </Group>

            {/* Дополнительная информация */}
            <Group justify="space-between" align="center">
              <Text size="xs" c="dimmed">
                {t("Total time (minutes)")}
              </Text>
              <Text fw={500} size="xs" c="dimmed">
                {fmtMinutes(totalLifetimeMinutes)}
              </Text>
            </Group>
          </Stack>
        </Box>
      </Stack>
    </Card>
  );
};
