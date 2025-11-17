import React from "react";
import { Card, Text, Group, Stack, Badge, Box, Progress } from "@mantine/core";
import { FaPlay } from "react-icons/fa";
import { getLanguageByKey } from "../utils";

export const WorkflowFromDePrelucratCard = ({
  workflowChanges = [],
  totalChanges = 0,
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

  // Сортируем изменения по количеству (по убыванию)
  const sortedChanges = [...workflowChanges].sort((a, b) => b.change_count - a.change_count);
  
  // Ограничиваем количество отображаемых элементов для компактного режима
  const maxItems = isVeryCompact ? 3 : isCompact ? 4 : 5;
  const displayChanges = sortedChanges.slice(0, maxItems);

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
              <Badge variant="light" color="blue" size="sm">
                {getLanguageByKey("Workflow From De Prelucrat") || widgetType || "Workflow From De Prelucrat"}
              </Badge>
              {subtitle && (
                <Text fw={700} size={subtitleSize} c="dark">
                  {subtitle}
                </Text>
              )}
            </Group>
          </Box>
          <Badge size={badgeSize} variant="light" color="blue">
            {totalChanges} {getLanguageByKey("workflow transitions")}
          </Badge>
        </Group>

        {/* Статистика переходов */}
        <Stack gap={isVeryCompact ? "xs" : "sm"} style={{ flex: 1 }}>
          {displayChanges.map((change, index) => {
            const percentage = totalChanges > 0 ? Math.round((change.change_count / totalChanges) * 100) : 0;
            
            return (
              <Box key={index}>
                <Group justify="space-between" align="center" mb={4}>
                  <Group gap="xs" align="center">
                    <FaPlay size={isVeryCompact ? 10 : 12} color="#007bff" />
                    <Text fw={500} size={isVeryCompact ? "xs" : "sm"} c="dark" lineClamp={1}>
                      {change.destination_workflow}
                    </Text>
                  </Group>
                  <Text fw={700} size={isVeryCompact ? "xs" : "sm"} c="#007bff">
                    {change.change_count}
                  </Text>
                </Group>
                <Progress 
                  value={percentage} 
                  size={isVeryCompact ? "xs" : "sm"} 
                  color="blue" 
                  radius="xl"
                />
              </Box>
            );
          })}
        </Stack>

        {/* Общая статистика */}
        <Group justify="center" mt="auto">
          <Text fw={600} size="sm" c="dimmed">
            {getLanguageByKey("De prelucrat")} → {getLanguageByKey("destination workflow")}
          </Text>
        </Group>
      </Stack>
    </Card>
  );
};
