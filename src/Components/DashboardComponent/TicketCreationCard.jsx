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
  userGroups = [], // Вложенные группы пользователей для by_group_title
  userTechnicians = [], // Вложенные пользователи для by_user_group
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
      <Stack gap={statGap} style={{ flex: 1, height: "100%", minHeight: 0 }}>
        {/* Заголовок */}
        <Group justify="space-between" align="flex-start" style={{ flexShrink: 0 }}>
          <Box>
            <Text fw={600} size={titleSize} c="dimmed">
              {title}
            </Text>
            <Group gap={6} wrap="wrap" mt={4}>
              <Badge variant="light" color="blue" size="sm">
                {getLanguageByKey("Ticket Creation") || widgetType || "Ticket Creation"}
              </Badge>
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

        {/* Прокручиваемая область с контентом */}
        <Box style={{ flex: 1, overflowY: "auto", overflowX: "hidden", minHeight: 0 }}>
          <Stack gap={isVeryCompact ? "xs" : "sm"}>
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

            {/* Вложенные группы пользователей (для by_group_title) */}
            {userGroups && userGroups.length > 0 && (
              <Box mt="md" pt="md" style={{ borderTop: "1px solid var(--crm-ui-kit-palette-border-default)" }}>
                <Text size="xs" fw={700} c="dimmed" mb="sm" tt="uppercase">
                  {getLanguageByKey("User Groups") || "User Groups"}
                </Text>
                <Stack gap="md">
                  {userGroups.map((ug, ugIndex) => {
                    // Обрабатываем статистику группы
                    const groupCount = (() => {
                      if (!ug.stats || typeof ug.stats !== "object") return 0;
                      if (Array.isArray(ug.stats)) return 0;
                      const ticketsCreatedObj = ug.stats.tickets_created;
                      if (ticketsCreatedObj && typeof ticketsCreatedObj === "object") {
                        return Number.isFinite(ticketsCreatedObj.count) ? ticketsCreatedObj.count : 0;
                      }
                      return 0;
                    })();

                    if (groupCount === 0) return null;

                    return (
                      <Box key={`ug-${ugIndex}`}>
                        <Group justify="space-between" align="center" p={isVeryCompact ? "xs" : "xs"} style={{ backgroundColor: "var(--crm-ui-kit-palette-background-primary-disabled)", borderRadius: "6px" }}>
                          <Group gap="xs">
                            <FaPlus size={isVeryCompact ? 10 : 12} color="#007bff" />
                            <Text fw={600} size={isVeryCompact ? "xs" : "sm"} c="dark">
                              {ug.userGroupName || "-"}
                            </Text>
                          </Group>
                          <Text fw={700} size={isVeryCompact ? "xs" : "sm"} c="#007bff">
                            {groupCount}
                          </Text>
                        </Group>
                      </Box>
                    );
                  })}
                </Stack>
              </Box>
            )}

            {/* Вложенные пользователи (для by_user_group) */}
            {userTechnicians && userTechnicians.length > 0 && (
              <Box mt="md" pt="md" style={{ borderTop: "1px solid var(--crm-ui-kit-palette-border-default)" }}>
                <Text size="xs" fw={700} c="dimmed" mb="sm" tt="uppercase">
                  {getLanguageByKey("Users") || "Users"}
                </Text>
                <Stack gap="md">
                  {userTechnicians.map((ut, utIndex) => {
                    // Обрабатываем статистику пользователя
                    const userCount = (() => {
                      if (!ut.stats || typeof ut.stats !== "object") return 0;
                      if (Array.isArray(ut.stats)) return 0;
                      const ticketsCreatedObj = ut.stats.tickets_created;
                      if (ticketsCreatedObj && typeof ticketsCreatedObj === "object") {
                        return Number.isFinite(ticketsCreatedObj.count) ? ticketsCreatedObj.count : 0;
                      }
                      return 0;
                    })();

                    if (userCount === 0) return null;

                    return (
                      <Box key={`ut-${utIndex}`}>
                        <Group justify="space-between" align="center" p={isVeryCompact ? "xs" : "xs"} style={{ backgroundColor: "var(--crm-ui-kit-palette-background-primary-disabled)", borderRadius: "6px" }}>
                          <Group gap="xs">
                            <FaPlus size={isVeryCompact ? 10 : 12} color="#007bff" />
                            <Text fw={600} size={isVeryCompact ? "xs" : "sm"} c="dark">
                              {ut.userName || `ID ${ut.userId}`}
                            </Text>
                          </Group>
                          <Text fw={700} size={isVeryCompact ? "xs" : "sm"} c="#007bff">
                            {userCount}
                          </Text>
                        </Group>
                      </Box>
                    );
                  })}
                </Stack>
              </Box>
            )}

            {/* Общая статистика */}
            <Group justify="center" mt="md" pt="md" style={{ borderTop: "1px solid var(--crm-ui-kit-palette-border-default)" }}>
              <Text fw={600} size="sm" c="dimmed">
                {getLanguageByKey("Total tickets created")}
              </Text>
            </Group>
          </Stack>
        </Box>
      </Stack>
    </Card>
  );
};
