import React from "react";
import { Card, Text, Group, Stack, Badge, Box } from "@mantine/core";
import { FaFileContract } from "react-icons/fa";
import { getLanguageByKey } from "../utils";

export const WorkflowToChangeCard = ({
  contractIncheiatChangedCount = 0,
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
                  {getLanguageByKey("Workflow Change To") || widgetType}
                </Badge>
              )}
              {subtitle && (
                <Text fw={700} size={subtitleSize} c="dark">
                  {subtitle}
                </Text>
              )}
            </Group>
          </Box>
          <Badge size={badgeSize} variant="light" color="green">
            {contractIncheiatChangedCount} {getLanguageByKey("completed contracts")}
          </Badge>
        </Group>

        {/* Статистика по "Contract încheiat" */}
        <Group justify="space-between" align="center" p={isVeryCompact ? "xs" : "xs"} style={{ backgroundColor: "var(--crm-ui-kit-palette-background-primary-disabled)", borderRadius: "6px" }}>
          <Group gap="xs">
            <FaFileContract size={isVeryCompact ? 12 : 14} color="#28a745" />
            <Text fw={500} size={isVeryCompact ? "xs" : "xs"} c="dark">
              {getLanguageByKey("Contract încheiat")}
            </Text>
          </Group>
          <Group gap="xs" align="center">
            <Text fw={700} size={isVeryCompact ? "xs" : "sm"} c="#28a745">
              {contractIncheiatChangedCount}
            </Text>
          </Group>
        </Group>

        {/* Общая статистика */}
        <Group justify="center" mt="auto">
          <Text fw={600} size="sm" c="dimmed">
            {getLanguageByKey("Total completed contracts")}
          </Text>
        </Group>
      </Stack>
    </Card>
  );
};
