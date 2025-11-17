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
  icons = {},
  widgetType,
}) => {
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
                {getLanguageByKey("Closed Tickets Count") || widgetType || "Closed Tickets Count"}
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
              {fmt(totalClosedTickets)}
            </Text>
            <Text size="xs" c="dimmed" fw={500}>
              {getLanguageByKey("Total closed tickets")}
            </Text>
          </Box>
          
          <Stack gap="xs" align="flex-end">
            <Group gap="xs" align="center">
              {TotalIconNode}
              <Text size="sm" c={colors.total}>
                {getLanguageByKey("Total")}
              </Text>
            </Group>
            <Text size="xs" c="dimmed">
              {getLanguageByKey("tickets")}
            </Text>
          </Stack>
        </Group>

        <Group justify="space-between" align="center">
          <Group gap="xs" align="center">
            {OlderIconNode}
            <Text size="sm" c={colors.older}>
              {getLanguageByKey("Older than 11 days")}
            </Text>
          </Group>
          
          <Text size="sm" c={colors.older}>
            {fmt(olderThan11Days)}
          </Text>
        </Group>

        <Group justify="space-between" align="center">
          <Group gap="xs" align="center">
            {NewerIconNode}
            <Text size="sm" c={colors.newer}>
              {getLanguageByKey("Newer than 11 days")}
            </Text>
          </Group>
          
          <Text size="sm" c={colors.newer}>
            {fmt(newerThan11Days)}
          </Text>
        </Group>
      </Stack>
    </Card>
  );
};
