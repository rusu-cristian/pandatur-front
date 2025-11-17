import React from "react";
import { Card, Stack, Group, Text, Badge, Progress, ThemeIcon } from "@mantine/core";
import { FaTimes, FaCheckCircle, FaChartPie, FaExclamationTriangle } from "react-icons/fa";
import { getLanguageByKey } from "@utils";

const t = (key) => String(getLanguageByKey?.(key) ?? key);

export const TicketRateCard = ({ 
  totalTransitions = 0, 
  directlyClosedCount = 0,
  directlyClosedPercentage = 0,
  workedOnCount = 0,
  workedOnPercentage = 0,
  title,
  subtitle,
  bg,
  widgetType,
}) => {
  const getQualityColor = (directlyClosedPct) => {
    if (directlyClosedPct <= 10) return "green"; // Хорошо - мало прямых закрытий
    if (directlyClosedPct <= 25) return "yellow"; // Нормально
    if (directlyClosedPct <= 40) return "orange"; // Плохо
    return "red"; // Очень плохо - много прямых закрытий
  };

  const getQualityLabel = (directlyClosedPct) => {
    if (directlyClosedPct <= 10) return t("Excellent");
    if (directlyClosedPct <= 25) return t("Good");
    if (directlyClosedPct <= 40) return t("Fair");
    return t("Poor");
  };

  const getQualityIcon = (directlyClosedPct) => {
    if (directlyClosedPct <= 10) return <FaCheckCircle size={12} color="green" />;
    if (directlyClosedPct <= 25) return <FaChartPie size={12} color="orange" />;
    return <FaExclamationTriangle size={12} color="red" />;
  };

  return (
    <Card
      shadow="sm"
      padding="lg"
      radius="md"
      withBorder
      style={{ backgroundColor: bg, height: "100%" }}
    >
      <Stack gap="sm">
        <Group justify="space-between" align="flex-start">
          <Stack gap={4}>
            <Text fw={600} size="sm" c="dimmed">
              {title}
            </Text>
            <Group gap={6} wrap="wrap">
              {widgetType && (
                <Badge variant="light" color="blue" size="sm">
                  {getLanguageByKey("Ticket Rate") || widgetType}
                </Badge>
              )}
              {subtitle && (
                <Text fw={700} size="lg">
                  {subtitle}
                </Text>
              )}
            </Group>
          </Stack>
          <Badge color="blue" variant="light" size="lg">
            {totalTransitions}
          </Badge>
        </Group>


        <Stack gap="md">
          {/* Обработано тикетов */}
          <Group justify="space-between" align="center">
            <Group gap="xs">
              <ThemeIcon color="green" variant="light" size="sm">
                <FaCheckCircle size={12} />
              </ThemeIcon>
              <Text size="sm" fw={500}>
                {t("Worked on tickets")}
              </Text>
            </Group>
            <Group gap="xs">
              <Text fw={600} size="sm">
                {workedOnCount}
              </Text>
              <Text size="xs" c="dimmed">
                ({workedOnPercentage.toFixed(1)}%)
              </Text>
            </Group>
          </Group>
          <Progress
            value={workedOnPercentage}
            color="green"
            size="sm"
            radius="xl"
          />

          {/* Прямо закрытые тикеты */}
          <Group justify="space-between" align="center">
            <Group gap="xs">
              <ThemeIcon color="red" variant="light" size="sm">
                <FaTimes size={12} />
              </ThemeIcon>
              <Text size="sm" fw={500}>
                {t("Directly closed tickets")}
              </Text>
            </Group>
            <Group gap="xs">
              <Text fw={600} size="sm">
                {directlyClosedCount}
              </Text>
              <Text size="xs" c="dimmed">
                ({directlyClosedPercentage.toFixed(1)}%)
              </Text>
            </Group>
          </Group>
          <Progress
            value={directlyClosedPercentage}
            color="red"
            size="sm"
            radius="xl"
          />

          {/* Качество обработки */}
          <Group justify="space-between" align="center">
            <Group gap="xs">
              {getQualityIcon(directlyClosedPercentage)}
              <Text size="sm" fw={500}>
                {t("Processing quality")}
              </Text>
            </Group>
            <Text fw={600} size="sm" c={getQualityColor(directlyClosedPercentage)}>
              {getQualityLabel(directlyClosedPercentage)}
            </Text>
          </Group>
        </Stack>

        <Group justify="space-between" align="center" mt="sm">
          <Text size="xs" c="dimmed">
            {t("Total transitions")}
          </Text>
          <Text fw={700} size="md">
            {totalTransitions}
          </Text>
        </Group>
      </Stack>
    </Card>
  );
};
