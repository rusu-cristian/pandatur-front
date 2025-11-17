import React from "react";
import { Card, Text, Group, Stack, Badge, Box } from "@mantine/core";
import { FaHandPaper, FaFileContract } from "react-icons/fa";
import { getLanguageByKey } from "../utils";

export const WorkflowFromChangeCard = ({
  luatInLucruChangedCount = 0,
  ofertaTrimisaChangedCount = 0,
  totalChanges = 0,
  title,
  subtitle,
  bg,
  width,
  height,
  widgetType,
}) => {
  const luatPercentage = totalChanges > 0 ? Math.round((luatInLucruChangedCount / totalChanges) * 100) : 0;
  const ofertaPercentage = totalChanges > 0 ? Math.round((ofertaTrimisaChangedCount / totalChanges) * 100) : 0;

  const getEfficiencyRating = (percentage) => {
    if (percentage >= 80) return { label: getLanguageByKey("Excellent"), color: "green" };
    if (percentage >= 60) return { label: getLanguageByKey("Good"), color: "blue" };
    if (percentage >= 40) return { label: getLanguageByKey("Fair"), color: "yellow" };
    return { label: getLanguageByKey("Poor"), color: "red" };
  };

  const luatRating = getEfficiencyRating(luatPercentage);
  const ofertaRating = getEfficiencyRating(ofertaPercentage);

  // Адаптивные размеры в зависимости от размера виджета
  const isCompact = width < 40 || height < 15;
  const isVeryCompact = width < 30 || height < 12;
  
  const cardPadding = isVeryCompact ? "xs" : isCompact ? "sm" : "lg";
  const titleSize = isVeryCompact ? "xs" : isCompact ? "sm" : "sm";
  const subtitleSize = isVeryCompact ? "xs" : isCompact ? "sm" : "lg";
  const badgeSize = isVeryCompact ? "xs" : isCompact ? "sm" : "lg";
  const statGap = isVeryCompact ? "xs" : isCompact ? "sm" : "sm";

  return (
    <Card
      shadow="sm"
      padding={cardPadding}
      radius="md"
      withBorder
      style={{
        backgroundColor: bg || "#fff",
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
                  {getLanguageByKey("Workflow From Change") || widgetType}
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
            {totalChanges} {getLanguageByKey("changes")}
          </Badge>
        </Group>

        {/* Статистика по "Luat în lucru" */}
        <Group justify="space-between" align="center" p={isVeryCompact ? "xs" : "xs"} style={{ backgroundColor: "var(--crm-ui-kit-palette-background-primary-disabled)", borderRadius: "6px" }}>
          <Group gap="xs">
            <FaHandPaper size={isVeryCompact ? 12 : 14} color="#28a745" />
            <Text fw={500} size={isVeryCompact ? "xs" : "xs"} c="dark">
              {getLanguageByKey("Luat în lucru")}
            </Text>
          </Group>
          <Group gap="xs" align="center">
            <Text fw={700} size={isVeryCompact ? "xs" : "sm"} c="#28a745">
              {luatInLucruChangedCount}
            </Text>
            <Badge size={isVeryCompact ? "xs" : "xs"} color={luatRating.color} variant="light">
              {luatPercentage}%
            </Badge>
          </Group>
        </Group>

        {/* Статистика по "Ofertă trimisă" */}
        <Group justify="space-between" align="center" p={isVeryCompact ? "xs" : "xs"} style={{ backgroundColor: "var(--crm-ui-kit-palette-background-primary-disabled)", borderRadius: "6px" }}>
          <Group gap="xs">
            <FaFileContract size={isVeryCompact ? 12 : 14} color="#007bff" />
            <Text fw={500} size={isVeryCompact ? "xs" : "xs"} c="dark">
              {getLanguageByKey("Ofertă trimisă")}
            </Text>
          </Group>
          <Group gap="xs" align="center">
            <Text fw={700} size={isVeryCompact ? "xs" : "sm"} c="#007bff">
              {ofertaTrimisaChangedCount}
            </Text>
            <Badge size={isVeryCompact ? "xs" : "xs"} color={ofertaRating.color} variant="light">
              {ofertaPercentage}%
            </Badge>
          </Group>
        </Group>

        {/* Общая статистика */}
        <Group justify="center" mt="auto">
          <Text fw={600} size="sm" c="dimmed">
            {getLanguageByKey("Total workflow changes")}
          </Text>
        </Group>
      </Stack>
    </Card>
  );
};
