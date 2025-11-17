import React from "react";
import { Card, Stack, Group, Text, Badge, Progress } from "@mantine/core";
import { FaCalendarAlt, FaClock, FaCheckCircle } from "react-icons/fa";
import { getLanguageByKey } from "@utils";

const t = (key) => String(getLanguageByKey?.(key) ?? key);

export const TicketsByDepartCountCard = ({ 
  lessThan14Days = 0, 
  between14And30Days = 0, 
  moreThan30Days = 0, 
  totalTickets = 0,
  title,
  subtitle,
  bg,
  widgetType,
}) => {
  const total = lessThan14Days + between14And30Days + moreThan30Days;
  
  const getProgressColor = (value) => {
    if (value === 0) return "gray";
    if (value === lessThan14Days) return "green";
    if (value === between14And30Days) return "yellow";
    return "red";
  };

  const getIcon = (value) => {
    if (value === lessThan14Days) return <FaCheckCircle size={16} color="green" />;
    if (value === between14And30Days) return <FaClock size={16} color="orange" />;
    return <FaCalendarAlt size={16} color="red" />;
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
                {getLanguageByKey("Tickets By Depart Count") || widgetType || "Tickets By Depart Count"}
              </Badge>
              {subtitle && (
                <Text fw={700} size="lg">
                  {subtitle}
                </Text>
              )}
            </Group>
          </Stack>
          <Badge color="blue" variant="light" size="lg">
            {totalTickets || total}
          </Badge>
        </Group>

        <Stack gap="xs">
          {/* Less than 14 days */}
          <Group justify="space-between" align="center">
            <Group gap="xs">
              {getIcon(lessThan14Days)}
              <Text size="sm" fw={500}>
                {t("Less than 14 days")}
              </Text>
            </Group>
            <Text fw={600} size="sm">
              {lessThan14Days}
            </Text>
          </Group>
          <Progress
            value={total > 0 ? (lessThan14Days / total) * 100 : 0}
            color={getProgressColor(lessThan14Days)}
            size="sm"
            radius="xl"
          />

          {/* Between 14-30 days */}
          <Group justify="space-between" align="center">
            <Group gap="xs">
              {getIcon(between14And30Days)}
              <Text size="sm" fw={500}>
                {t("Between 14-30 days")}
              </Text>
            </Group>
            <Text fw={600} size="sm">
              {between14And30Days}
            </Text>
          </Group>
          <Progress
            value={total > 0 ? (between14And30Days / total) * 100 : 0}
            color={getProgressColor(between14And30Days)}
            size="sm"
            radius="xl"
          />

          {/* More than 30 days */}
          <Group justify="space-between" align="center">
            <Group gap="xs">
              {getIcon(moreThan30Days)}
              <Text size="sm" fw={500}>
                {t("More than 30 days")}
              </Text>
            </Group>
            <Text fw={600} size="sm">
              {moreThan30Days}
            </Text>
          </Group>
          <Progress
            value={total > 0 ? (moreThan30Days / total) * 100 : 0}
            color={getProgressColor(moreThan30Days)}
            size="sm"
            radius="xl"
          />
        </Stack>

        <Group justify="space-between" align="center" mt="sm">
          <Text size="xs" c="dimmed">
            {t("Total tickets")}
          </Text>
          <Text fw={700} size="md">
            {totalTickets || total}
          </Text>
        </Group>
      </Stack>
    </Card>
  );
};
