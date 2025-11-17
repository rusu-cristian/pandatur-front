import React from "react";
import { Card, Text, Group, Stack, Box, Badge } from "@mantine/core";
import { FaShare, FaTicketAlt } from "react-icons/fa";
import { getLanguageByKey } from "@utils";

const fmt = (n) => (Number(n) || 0).toLocaleString();

export const TicketDistributionCard = ({ 
  title, 
  subtitle, 
  distributedTickets = 0, 
  bg,
  icons = {},
  widgetType,
}) => {
  const colors = {
    distributed: "#8B5CF6", // purple-500
    tickets: "#A78BFA",     // purple-400
  };

  const DistributedIconNode = icons.distributed ?? <FaShare size={14} />;
  const TicketsIconNode = icons.tickets ?? <FaTicketAlt size={14} />;

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
                {getLanguageByKey("Ticket Distribution") || widgetType || "Ticket Distribution"}
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
              {fmt(distributedTickets)}
            </Text>
            <Text size="xs" c="dimmed" fw={500}>
              {getLanguageByKey("Distributed tickets")}
            </Text>
          </Box>
          
          <Stack gap="xs" align="flex-end">
            <Group gap="xs" align="center">
              {DistributedIconNode}
              <Text size="sm" c={colors.distributed}>
                {getLanguageByKey("Distributed")}
              </Text>
            </Group>
            <Text size="xs" c="dimmed">
              {getLanguageByKey("tickets")}
            </Text>
          </Stack>
        </Group>

        <Group justify="space-between" align="center">
          <Group gap="xs" align="center">
            {TicketsIconNode}
            <Text size="sm" c={colors.tickets}>
              {getLanguageByKey("Tickets")}
            </Text>
          </Group>
          
          <Text size="sm" c={colors.distributed}>
            {getLanguageByKey("system")}
          </Text>
        </Group>
      </Stack>
    </Card>
  );
};
