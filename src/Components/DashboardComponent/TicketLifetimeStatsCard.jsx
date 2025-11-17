import React from "react";
import { Card, Stack, Group, Text, Badge, Progress, ThemeIcon } from "@mantine/core";
import { FaClock, FaChartLine, FaCheckCircle, FaHourglassHalf } from "react-icons/fa";
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
  widgetType,
}) => {
  const getEfficiencyColor = (avgHours) => {
    if (avgHours <= 1) return "green"; // Очень быстро
    if (avgHours <= 4) return "yellow"; // Нормально
    if (avgHours <= 8) return "orange"; // Медленно
    return "red"; // Очень медленно
  };

  const getEfficiencyLabel = (avgHours) => {
    if (avgHours <= 1) return t("Very fast");
    if (avgHours <= 4) return t("Normal");
    if (avgHours <= 8) return t("Slow");
    return t("Very slow");
  };

  return (
    <Card
      shadow="sm"
      padding="lg"
      radius="md"
      withBorder
      style={{ backgroundColor: "var(--crm-ui-kit-palette-background-primary)", height: "100%" }}
    >
      <Stack gap="sm">
        <Group justify="space-between" align="flex-start">
          <Stack gap={4}>
            <Text fw={600} size="sm" c="dimmed">
              {title}
            </Text>
            <Group gap={6} wrap="wrap">
              <Badge variant="light" color="blue" size="sm">
                {getLanguageByKey("Ticket Lifetime Stats") || widgetType || "Ticket Lifetime Stats"}
              </Badge>
              {subtitle && (
                <Text fw={700} size="lg">
                  {subtitle}
                </Text>
              )}
            </Group>
          </Stack>
          <Badge color="blue" variant="light" size="lg">
            {ticketsProcessed}
          </Badge>
        </Group>

        <Stack gap="md">
          {/* Общее время обработки */}
          <Group justify="space-between" align="center">
            <Group gap="xs">
              <ThemeIcon color="blue" variant="light" size="sm">
                <FaClock size={12} />
              </ThemeIcon>
              <Text size="sm" fw={500}>
                {t("Total processing time")}
              </Text>
            </Group>
            <Text fw={600} size="sm">
              {fmtTime(totalLifetimeHours)}
            </Text>
          </Group>
          <Progress
            value={Math.min(100, (totalLifetimeHours / Math.max(totalLifetimeHours, 1)) * 100)}
            color="blue"
            size="sm"
            radius="xl"
          />

          {/* Среднее время обработки */}
          <Group justify="space-between" align="center">
            <Group gap="xs">
              <ThemeIcon color="green" variant="light" size="sm">
                <FaChartLine size={12} />
              </ThemeIcon>
              <Text size="sm" fw={500}>
                {t("Average processing time")}
              </Text>
            </Group>
            <Text fw={600} size="sm">
              {fmtTime(averageLifetimeHours)}
            </Text>
          </Group>
          <Progress
            value={Math.min(100, (averageLifetimeHours / Math.max(averageLifetimeHours, 1)) * 100)}
            color={getEfficiencyColor(averageLifetimeHours)}
            size="sm"
            radius="xl"
          />

          {/* Эффективность */}
          <Group justify="space-between" align="center">
            <Group gap="xs">
              <ThemeIcon color={getEfficiencyColor(averageLifetimeHours)} variant="light" size="sm">
                <FaHourglassHalf size={12} />
              </ThemeIcon>
              <Text size="sm" fw={500}>
                {t("Efficiency")}
              </Text>
            </Group>
            <Text fw={600} size="sm" c={getEfficiencyColor(averageLifetimeHours)}>
              {getEfficiencyLabel(averageLifetimeHours)}
            </Text>
          </Group>
        </Stack>

        <Group justify="space-between" align="center" mt="sm">
          <Text size="xs" c="dimmed">
            {t("Tickets processed")}
          </Text>
          <Text fw={700} size="md">
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
    </Card>
  );
};
