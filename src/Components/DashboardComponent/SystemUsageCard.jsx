import React from "react";
import { Card, Text, Group, Stack, Box, Badge } from "@mantine/core";
import { FaClock, FaStopwatch } from "react-icons/fa";
import { getLanguageByKey } from "@utils";

const fmt = (n) => (Number(n) || 0).toLocaleString();

// Форматирование времени для system_usage
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

export const SystemUsageCard = ({ 
  title, 
  subtitle, 
  activityMinutes = 0, 
  activityHours = 0, 
  bg,
  icons = {},
  widgetType,
}) => {
  const colors = {
    minutes: "#3B82F6", // blue-500
    hours: "#10B981",    // emerald-500
  };

  const MinutesIconNode = icons.minutes ?? <FaStopwatch size={14} />;
  const HoursIconNode = icons.hours ?? <FaClock size={14} />;

  return (
    <Card
      shadow="sm"
      padding="lg"
      radius="md"
      withBorder
      style={{ 
        backgroundColor: "var(--crm-ui-kit-palette-background-primary)",
        height: "100%",
        display: "flex",
        flexDirection: "column"
      }}
    >
      <Stack gap="xs" style={{ flex: 1 }}>
        <Group justify="space-between" align="flex-start">
          <Box>
            <Text size="sm" fw={500} c="dimmed">
              {title}
            </Text>
            <Group gap={6} wrap="wrap" mt={4}>
              <Badge variant="light" color="blue" size="sm">
                {getLanguageByKey("System usage") || widgetType || "System usage"}
              </Badge>
              {subtitle && (
                <Text size="xs" c="dimmed">
                  {subtitle}
                </Text>
              )}
            </Group>
          </Box>
        </Group>

        <Group justify="space-between" align="center" style={{ flex: 1 }}>
          <Box>
            <Text fz={38} fw={900} style={{ lineHeight: 1 }}>
              {fmtTime(activityHours)}
            </Text>
            <Text size="xs" c="dimmed" fw={500}>
              {getLanguageByKey("Activity hours")}
            </Text>
          </Box>
          
          <Stack gap="xs" align="flex-end">
            <Group gap="xs" align="center">
              {MinutesIconNode}
              <Text size="sm" c={colors.minutes}>
                {getLanguageByKey("Minutes")}
              </Text>
            </Group>
            <Text size="xs" c="dimmed">
              {getLanguageByKey("activity")}
            </Text>
          </Stack>
        </Group>

        <Group justify="space-between" align="center">
          <Group gap="xs" align="center">
            {HoursIconNode}
            <Text size="sm" c={colors.hours}>
              {getLanguageByKey("Hours")}
            </Text>
          </Group>
          
          <Text size="sm" c={colors.minutes}>
            {fmt(activityMinutes)} {getLanguageByKey("min")}
          </Text>
        </Group>
      </Stack>
    </Card>
  );
};
