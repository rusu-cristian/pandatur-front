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
  userGroups = [], // Вложенные группы пользователей для by_group_title
  userTechnicians = [], // Вложенные пользователи для by_user_group
}) => {
  // Адаптивные размеры в зависимости от размера виджета
  const isCompact = width < 40 || height < 15;
  const isVeryCompact = width < 30 || height < 12;

  const cardPadding = isVeryCompact ? "md" : isCompact ? "sm" : "lg";
  const titleSize = isVeryCompact ? "md" : isCompact ? "sm" : "sm";
  const subtitleSize = isVeryCompact ? "md" : isCompact ? "sm" : "lg";
  const badgeSize = isVeryCompact ? "md" : isCompact ? "sm" : "lg";
  const statGap = isVeryCompact ? "md" : isCompact ? "sm" : "sm";

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
        <Group justify="space-between" align="flex-start" style={{ flemdhrink: 0 }}>
          <Box>
            <Text fw={600} size={titleSize} c="dimmed">
              {title}
            </Text>
            <Group gap={6} wrap="wrap" mt={4}>
              <Badge variant="light" color="blue" size="sm">
                {getLanguageByKey("Workflow Change To") || widgetType || "Workflow Change To"}
              </Badge>
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

        {/* Прокручиваемая область с контентом */}
        <Box
  className={isVeryCompact ? "crm-scroll compact" : "crm-scroll"}
  style={{ flex: 1, minHeight: 0 }}
>
          <Stack gap={isVeryCompact ? "md" : "sm"}>
            {/* Статистика по "Contract încheiat" */}
            <Group justify="space-between" align="center" p={isVeryCompact ? "md" : "md"} style={{ backgroundColor: "var(--crm-ui-kit-palette-background-primary-disabled)", borderRadius: "6px" }}>
              <Group gap="md">
                <FaFileContract size={isVeryCompact ? 12 : 14} color="#28a745" />
                <Text fw={500} size={isVeryCompact ? "md" : "md"} c="dark">
                  {getLanguageByKey("Contract încheiat")}
                </Text>
              </Group>
              <Group gap="md" align="center">
                <Text fw={700} size={isVeryCompact ? "md" : "sm"} c="#28a745">
                  {contractIncheiatChangedCount}
                </Text>
              </Group>
            </Group>

            {/* Вложенные группы пользователей (для by_group_title) */}
            {userGroups && userGroups.length > 0 && (
              <Box mt="md" pt="md" style={{ borderTop: "1px solid var(--crm-ui-kit-palette-border-default)" }}>
                <Text size="md" fw={700} c="dimmed" mb="sm" tt="uppercase">
                  {getLanguageByKey("User Groups") || "User Groups"}
                </Text>
                <Stack gap="md">
                  {userGroups.map((ug, ugIndex) => {
                    // Обрабатываем статистику группы
                    const groupCount = (() => {
                      if (!ug.stats || typeof ug.stats !== "object") return 0;
                      if (Array.isArray(ug.stats)) return 0;
                      const contractIncheiatObj = ug.stats.contract_incheiat;
                      if (contractIncheiatObj && typeof contractIncheiatObj === "object") {
                        return Number.isFinite(contractIncheiatObj.count) ? contractIncheiatObj.count : 0;
                      }
                      return 0;
                    })();

                    if (groupCount === 0) return null;

                    return (
                      <Box key={`ug-${ugIndex}`}>
                        <Group justify="space-between" align="center" p={isVeryCompact ? "md" : "md"} style={{ backgroundColor: "var(--crm-ui-kit-palette-background-primary-disabled)", borderRadius: "6px" }}>
                          <Group gap="md">
                            <FaFileContract size={isVeryCompact ? 10 : 12} color="#28a745" />
                            <Text fw={600} size={isVeryCompact ? "md" : "sm"} c="dark">
                              {ug.userGroupName || "-"}
                            </Text>
                          </Group>
                          <Text fw={700} size={isVeryCompact ? "md" : "sm"} c="#28a745">
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
                <Text size="md" fw={700} c="dimmed" mb="sm" tt="uppercase">
                  {getLanguageByKey("Users") || "Users"}
                </Text>
                <Stack gap="md">
                  {userTechnicians.map((ut, utIndex) => {
                    // Обрабатываем статистику пользователя
                    const userCount = (() => {
                      if (!ut.stats || typeof ut.stats !== "object") return 0;
                      if (Array.isArray(ut.stats)) return 0;
                      const contractIncheiatObj = ut.stats.contract_incheiat;
                      if (contractIncheiatObj && typeof contractIncheiatObj === "object") {
                        return Number.isFinite(contractIncheiatObj.count) ? contractIncheiatObj.count : 0;
                      }
                      return 0;
                    })();

                    if (userCount === 0) return null;

                    return (
                      <Box key={`ut-${utIndex}`}>
                        <Group justify="space-between" align="center" p={isVeryCompact ? "md" : "md"} style={{ backgroundColor: "var(--crm-ui-kit-palette-background-primary-disabled)", borderRadius: "6px" }}>
                          <Group gap="md">
                            <FaFileContract size={isVeryCompact ? 10 : 12} color="#28a745" />
                            <Text fw={600} size={isVeryCompact ? "md" : "sm"} c="dark">
                              {ut.userName || `ID ${ut.userId}`}
                            </Text>
                          </Group>
                          <Text fw={700} size={isVeryCompact ? "md" : "sm"} c="#28a745">
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
                {getLanguageByKey("Total completed contracts")}
              </Text>
            </Group>
          </Stack>
        </Box>
      </Stack>
    </Card>
  );
};
