import React from "react";
import { Card, Text, Group, Stack, Badge, Box, Progress } from "@mantine/core";
import { FaClock } from "react-icons/fa";
import { getLanguageByKey } from "../utils";

// Функция для форматирования времени в минутах
const formatDuration = (minutes) => {
  if (!minutes || minutes === 0) return "0m";
  
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  
  if (hours > 0) {
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }
  return `${mins}m`;
};

export const WorkflowDurationCard = ({
  totalDurationMinutes = 0,
  averageDurationMinutes = 0,
  ticketsProcessed = 0,
  title,
  subtitle,
  bg,
  width,
  height,
  widgetType,
}) => {
  // Адаптивные размеры в зависимости от размера виджета
  const isCompact = width < 40 || height < 15;
  const isVeryCompact = width < 30 || height < 12;

  const cardPadding = isVeryCompact ? "xs" : isCompact ? "sm" : "lg";
  const titleSize = isVeryCompact ? "xs" : isCompact ? "sm" : "sm";
  const subtitleSize = isVeryCompact ? "xs" : isCompact ? "sm" : "lg";
  const badgeSize = isVeryCompact ? "xs" : isCompact ? "sm" : "lg";
  const statGap = isVeryCompact ? "xs" : isCompact ? "sm" : "sm";

  // Форматируем значения
  const totalTime = formatDuration(totalDurationMinutes);
  const avgTime = formatDuration(averageDurationMinutes);

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
      <Stack gap={statGap} style={{ flex: 1, height: "100%" }}>
        {/* Заголовок */}
        <Group justify="space-between" align="flex-start">
          <Box>
            <Text fw={600} size={titleSize} c="dimmed">
              {title}
            </Text>
            <Group gap={6} wrap="wrap" mt={4}>
              {widgetType && (
                <Badge variant="light" color="blue" size="sm">
                  {getLanguageByKey("Workflow Duration") || widgetType}
                </Badge>
              )}
              {subtitle && (
                <Text fw={700} size={subtitleSize} c="dark">
                  {subtitle}
                </Text>
              )}
            </Group>
          </Box>
          <Badge size={badgeSize} variant="light" color="blue">
            {ticketsProcessed} {getLanguageByKey("Tickets processed")}
          </Badge>
        </Group>

        {/* Основная статистика */}
        <Stack gap={isVeryCompact ? "xs" : "sm"} style={{ flex: 1 }}>
          {/* Общее время обработки */}
          <Box>
            <Group justify="space-between" align="center" mb={4}>
              <Group gap="xs" align="center">
                <FaClock size={isVeryCompact ? 10 : 12} color="#28a745" />
                <Text fw={500} size={isVeryCompact ? "xs" : "sm"} c="dark">
                  {getLanguageByKey("Total processing time")}
                </Text>
              </Group>
              <Text fw={700} size={isVeryCompact ? "xs" : "sm"} c="#28a745">
                {totalTime}
              </Text>
            </Group>
            <Progress 
              value={100} 
              size={isVeryCompact ? "xs" : "sm"} 
              color="green" 
              radius="xl"
            />
          </Box>

          {/* Среднее время обработки */}
          <Box>
            <Group justify="space-between" align="center" mb={4}>
              <Group gap="xs" align="center">
                <FaClock size={isVeryCompact ? 10 : 12} color="#007bff" />
                <Text fw={500} size={isVeryCompact ? "xs" : "sm"} c="dark">
                  {getLanguageByKey("Average processing time")}
                </Text>
              </Group>
              <Text fw={700} size={isVeryCompact ? "xs" : "sm"} c="#007bff">
                {avgTime}
              </Text>
            </Group>
            <Progress 
              value={100} 
              size={isVeryCompact ? "xs" : "sm"} 
              color="blue" 
              radius="xl"
            />
          </Box>

          {/* Дополнительная информация для компактного режима */}
          {!isVeryCompact && (
            <Box mt="auto">
              <Text fw={500} size="xs" c="dimmed" ta="center">
                {getLanguageByKey("De prelucrat")} {getLanguageByKey("in processing state")}
              </Text>
            </Box>
          )}
        </Stack>

        {/* Общая информация */}
        <Group justify="center" mt="auto">
          <Text fw={600} size="sm" c="dimmed">
            {getLanguageByKey("Processing time")}
          </Text>
        </Group>
      </Stack>
    </Card>
  );
};
