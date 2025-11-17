import React from "react";
import { Card, Text, Group, Stack, Badge, Box } from "@mantine/core";
import { FaPlus } from "react-icons/fa";
import { getLanguageByKey } from "../utils";

export const TicketCreationCard = ({
  ticketsCreatedCount = 0,
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
                  {getLanguageByKey("Ticket Creation") || widgetType}
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
            {ticketsCreatedCount} {getLanguageByKey("tickets created")}
          </Badge>
        </Group>

        {/* Статистика по созданным тикетам */}
        <Group justify="space-between" align="center" p={isVeryCompact ? "xs" : "xs"} style={{ backgroundColor: "var(--crm-ui-kit-palette-background-primary-disabled)", borderRadius: "6px" }}>
          <Group gap="xs">
            <FaPlus size={isVeryCompact ? 12 : 14} color="#007bff" />
            <Text fw={500} size={isVeryCompact ? "xs" : "xs"} c="dark">
              {getLanguageByKey("Ticket Creation")}
            </Text>
          </Group>
          <Group gap="xs" align="center">
            <Text fw={700} size={isVeryCompact ? "xs" : "sm"} c="#007bff">
              {ticketsCreatedCount}
            </Text>
          </Group>
        </Group>

        {/* Общая статистика */}
        <Group justify="center" mt="auto">
          <Text fw={600} size="sm" c="dimmed">
            {getLanguageByKey("Total tickets created")}
          </Text>
        </Group>
      </Stack>
    </Card>
  );
};
