import React from "react";
import { Box, Text, Group, Badge } from "@mantine/core";
import { getLanguageByKey } from "../utils";

export const WorkflowStatCard = ({ 
  icon: Icon, 
  iconColor, 
  label, 
  count, 
  percentage, 
  rating 
}) => {
  const getEfficiencyRating = (percentage) => {
    if (percentage >= 80) return { label: getLanguageByKey("Excellent"), color: "green" };
    if (percentage >= 60) return { label: getLanguageByKey("Good"), color: "blue" };
    if (percentage >= 40) return { label: getLanguageByKey("Fair"), color: "yellow" };
    return { label: getLanguageByKey("Poor"), color: "red" };
  };

  const efficiencyRating = rating || getEfficiencyRating(percentage);

  return (
    <Box
      style={{
        padding: "12px",
        backgroundColor: "var(--crm-ui-kit-palette-background-primary-disabled)",
        borderRadius: "8px",
        border: "1px solid var(--crm-ui-kit-palette-border-default)",
      }}
    >
      <Group justify="space-between" align="center" mb="md">
        <Group gap="md">
          <Icon size={16} color={iconColor} />
          <Text fw={600} size="sm" c="dark">
            {label}
          </Text>
        </Group>
        <Badge color={efficiencyRating.color} variant="light">
          {efficiencyRating.label}
        </Badge>
      </Group>
      <Group justify="space-between" align="center">
        <Text fw={700} size="xl" c={iconColor}>
          {count}
        </Text>
        <Text fw={600} size="sm" c="dimmed">
          {percentage}%
        </Text>
      </Group>
    </Box>
  );
};
