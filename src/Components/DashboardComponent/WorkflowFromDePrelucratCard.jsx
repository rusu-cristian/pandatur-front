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
      <Stack gap={statGap} style={{ flex: 1, height: "100%", minHeight: 0 }}>
        {/* Заголовок */}
        <Group justify="space-between" align="flex-start" style={{ flexShrink: 0 }}>
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

        {/* Прокручиваемая область с контентом */}
        <Box style={{ flex: 1, overflowY: "auto", overflowX: "hidden", minHeight: 0 }}>
          <Stack gap={isVeryCompact ? "xs" : "sm"}>
            {/* Статистика переходов */}
            {displayChanges.map((change, index) => {
              const percentage = totalChanges > 0 ? Math.round((change.change_count / totalChanges) * 100) : 0;

              return (
                <Box key={index}>
                  <Group justify="space-between" align="center" mb={4}>
                    <Group gap="xs" align="center">
                      <FaPlay size={isVeryCompact ? 10 : 12} color="#007bff" />
                      <Text fw={500} size={isVeryCompact ? "xs" : "sm"} c="dark" lineClamp={1}>
                        {change.destination_workflow || "-"}
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

            {/* Вложенные группы пользователей (для by_group_title) */}
            {userGroups && userGroups.length > 0 && (
              <Box mt="md" pt="md" style={{ borderTop: "1px solid var(--crm-ui-kit-palette-border-default)" }}>
                <Text size="xs" fw={700} c="dimmed" mb="sm" tt="uppercase">
                  {getLanguageByKey("User Groups") || "User Groups"}
                </Text>
                <Stack gap="md">
                  {userGroups.map((ug, ugIndex) => {
                    const groupChanges = Array.isArray(ug.workflowChanges) ? ug.workflowChanges : [];
                    const groupTotal = ug.totalChanges || 0;
                    const sortedGroupChanges = [...groupChanges].sort((a, b) => b.change_count - a.change_count);
                    const displayGroupChanges = sortedGroupChanges.slice(0, isVeryCompact ? 2 : isCompact ? 3 : 4);

                    if (displayGroupChanges.length === 0) return null;

                    return (
                      <Box key={`ug-${ugIndex}`}>
                        <Text fw={600} size="sm" mb="xs" c="dark">
                          {ug.userGroupName || "-"}
                        </Text>
                        <Stack gap="xs">
                          {displayGroupChanges.map((change, changeIndex) => {
                            const percentage = groupTotal > 0 ? Math.round((change.change_count / groupTotal) * 100) : 0;
                            return (
                              <Box key={`${changeIndex}`} pl="md">
                                <Group justify="space-between" align="center" mb={4}>
                                  <Group gap="xs" align="center">
                                    <FaPlay size={isVeryCompact ? 8 : 10} color="#007bff" />
                                    <Text fw={500} size={isVeryCompact ? "xs" : "xs"} c="dark" lineClamp={1}>
                                      {change.destination_workflow || "-"}
                                    </Text>
                                  </Group>
                                  <Text fw={700} size={isVeryCompact ? "xs" : "xs"} c="#007bff">
                                    {change.change_count}
                                  </Text>
                                </Group>
                                <Progress
                                  value={percentage}
                                  size="xs"
                                  color="blue"
                                  radius="xl"
                                />
                              </Box>
                            );
                          })}
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
                    const userChanges = Array.isArray(ut.workflowChanges) ? ut.workflowChanges : [];
                    const userTotal = ut.totalChanges || 0;
                    const sortedUserChanges = [...userChanges].sort((a, b) => b.change_count - a.change_count);
                    const displayUserChanges = sortedUserChanges.slice(0, isVeryCompact ? 2 : isCompact ? 3 : 4);

                    if (displayUserChanges.length === 0) return null;

                    return (
                      <Box key={`ut-${utIndex}`}>
                        <Text fw={600} size="sm" mb="xs" c="dark">
                          {ut.userName || `ID ${ut.userId}`}
                        </Text>
                        <Stack gap="xs">
                          {displayUserChanges.map((change, changeIndex) => {
                            const percentage = userTotal > 0 ? Math.round((change.change_count / userTotal) * 100) : 0;
                            return (
                              <Box key={`${changeIndex}`} pl="md">
                                <Group justify="space-between" align="center" mb={4}>
                                  <Group gap="xs" align="center">
                                    <FaPlay size={isVeryCompact ? 8 : 10} color="#007bff" />
                                    <Text fw={500} size={isVeryCompact ? "xs" : "xs"} c="dark" lineClamp={1}>
                                      {change.destination_workflow || "-"}
                                    </Text>
                                  </Group>
                                  <Text fw={700} size={isVeryCompact ? "xs" : "xs"} c="#007bff">
                                    {change.change_count}
                                  </Text>
                                </Group>
                                <Progress
                                  value={percentage}
                                  size="xs"
                                  color="blue"
                                  radius="xl"
                                />
                              </Box>
                            );
                          })}
                        </Stack>
                      </Box>
                    );
                  })}
                </Stack>
              </Box>
            )}

            {/* Общая статистика */}
            <Group justify="center" mt="md" pt="md" style={{ borderTop: "1px solid var(--crm-ui-kit-palette-border-default)" }}>
              <Text fw={600} size="sm" c="dimmed">
                {getLanguageByKey("De prelucrat")} → {getLanguageByKey("destination workflow")}
              </Text>
            </Group>
          </Stack>
        </Box>
      </Stack>
    </Card>
  );
};
