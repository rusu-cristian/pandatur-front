import React from "react";
import { Card, Text, Group, Stack, Box, Badge, Divider } from "@mantine/core";
import { FaShare, FaTicketAlt } from "react-icons/fa";
import { getLanguageByKey } from "@utils";

const fmt = (n) => (Number(n) || 0).toLocaleString();

export const TicketDistributionCard = ({ 
  title, 
  subtitle, 
  distributedTickets = 0, 
  bg,
  width,
  height,
  icons = {},
  widgetType,
  userGroups = [], // Вложенные группы пользователей для by_group_title
  userTechnicians = [], // Вложенные пользователи для by_user_group
}) => {
  // Адаптивные размеры в зависимости от размера виджета
  const isCompact = width < 40 || height < 15;
  const isVeryCompact = width < 30 || height < 12;

  const cardPadding = isVeryCompact ? "xs" : isCompact ? "sm" : "lg";
  const titleSize = isVeryCompact ? "xs" : isCompact ? "sm" : "sm";
  const subtitleSize = isVeryCompact ? "xs" : isCompact ? "sm" : "xs";
  const totalSize = isVeryCompact ? 24 : isCompact ? 32 : 38;
  const colors = {
    distributed: "#8B5CF6", // purple-500
    tickets: "#A78BFA",     // purple-400
  };

  const DistributedIconNode = icons.distributed ?? <FaShare size={14} />;
  const TicketsIconNode = icons.tickets ?? <FaTicketAlt size={14} />;

  return (
    <Card
      shadow="sm"
      padding={cardPadding}
      radius="md"
      withBorder
      style={{ 
        backgroundColor: "var(--crm-ui-kit-palette-background-primary)",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden"
      }}
    >
      <Stack gap={isVeryCompact ? "xs" : "sm"} style={{ flex: 1, height: "100%", minHeight: 0 }}>
        <Group justify="space-between" align="flex-start" style={{ flexShrink: 0 }}>
          <Box>
            <Text size={titleSize} fw={500} c="dimmed">
              {title}
            </Text>
            <Group gap={6} wrap="wrap" mt={4}>
              <Badge variant="light" color="blue" size="sm">
                {getLanguageByKey("Ticket Distribution") || widgetType || "Ticket Distribution"}
              </Badge>
              {subtitle && (
                <Text size={subtitleSize} c="dimmed">
                  {subtitle}
                </Text>
              )}
            </Group>
          </Box>
        </Group>

        {/* Прокручиваемая область с контентом */}
        <Box style={{ flex: 1, overflowY: "auto", overflowX: "hidden", minHeight: 0 }}>
          <Stack gap={isVeryCompact ? "xs" : "sm"}>
            <Group justify="space-between" align="center">
              <Box>
                <Text fz={totalSize} fw={900} style={{ lineHeight: 1 }}>
                  {fmt(distributedTickets)}
                </Text>
                <Text size="xs" c="dimmed" fw={500}>
                  {getLanguageByKey("Distributed tickets")}
                </Text>
              </Box>
              
              <Stack gap="xs" align="flex-end">
                <Group gap="xs" align="center">
                  {DistributedIconNode}
                  <Text size={isVeryCompact ? "xs" : "sm"} c={colors.distributed}>
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
                <Text size={isVeryCompact ? "xs" : "sm"} c={colors.tickets}>
                  {getLanguageByKey("Tickets")}
                </Text>
              </Group>
              
              <Text size={isVeryCompact ? "xs" : "sm"} c={colors.distributed}>
                {getLanguageByKey("system")}
              </Text>
            </Group>

            {/* Вложенные группы пользователей (для by_group_title) */}
            {userGroups && userGroups.length > 0 && (
              <Box mt="md" pt="md" style={{ borderTop: "1px solid var(--crm-ui-kit-palette-border-default)" }}>
                <Text size="xs" fw={700} c="dimmed" mb="sm" tt="uppercase">
                  {getLanguageByKey("User Groups") || "User Groups"}
                </Text>
                <Stack gap="md">
                  {userGroups.map((ug, ugIndex) => {
                    const groupCount = Number.isFinite(ug.distributed_tickets_count) ? ug.distributed_tickets_count : 0;
                    if (groupCount === 0) return null;

                    return (
                      <Box key={`ug-${ugIndex}`}>
                        <Text fw={600} size="sm" mb="xs" c="dark">
                          {ug.userGroupName || "-"}
                        </Text>
                        <Stack gap="xs">
                          <Group justify="space-between" align="center">
                            <Text size="xs" c="dimmed" fw={500}>
                              {getLanguageByKey("Distributed tickets")}
                            </Text>
                            <Text fw={700} size="sm" c={colors.distributed}>
                              {fmt(groupCount)}
                            </Text>
                          </Group>
                        </Stack>
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
                    const userCount = Number.isFinite(ut.distributed_tickets_count) ? ut.distributed_tickets_count : 0;
                    if (userCount === 0) return null;

                    return (
                      <Box key={`ut-${utIndex}`}>
                        <Text fw={600} size="sm" mb="xs" c="dark">
                          {ut.userName || `ID ${ut.userId}`}
                        </Text>
                        <Stack gap="xs">
                          <Group justify="space-between" align="center">
                            <Text size="xs" c="dimmed" fw={500}>
                              {getLanguageByKey("Distributed tickets")}
                            </Text>
                            <Text fw={700} size="sm" c={colors.distributed}>
                              {fmt(userCount)}
                            </Text>
                          </Group>
                        </Stack>
                        <Divider my="xs" />
                      </Box>
                    );
                  })}
                </Stack>
              </Box>
            )}
          </Stack>
        </Box>
      </Stack>
    </Card>
  );
};
