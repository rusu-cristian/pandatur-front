import React from "react";
import { Card, Text, Group, Stack, Box, Badge } from "@mantine/core";
import { FaClock, FaStopwatch } from "react-icons/fa";
import { getLanguageByKey } from "@utils";

const fmt = (n) => (Number(n) || 0).toLocaleString();

// Форматирование времени для system_usage
const fmtTime = (hours) => {
  if (typeof hours !== "number" || hours === 0) return `0${getLanguageByKey("hours")}`;

  const wholeHours = Math.floor(hours);
  const minutes = Math.round((hours - wholeHours) * 60);

  if (minutes === 0) {
    return `${wholeHours}${getLanguageByKey("hours")}`;
  } else {
    return `${wholeHours}${getLanguageByKey("hours")} ${minutes}${getLanguageByKey("minutes")}`;
  }
};

export const SystemUsageCard = ({
  title,
  subtitle,
  activityMinutes = 0,
  activityHours = 0,
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
    minutes: "#3B82F6", // blue-500
    hours: "#10B981",    // emerald-500
  };

  const MinutesIconNode = icons.minutes ?? <FaStopwatch size={14} />;
  const HoursIconNode = icons.hours ?? <FaClock size={14} />;

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
                {getLanguageByKey("System usage") || widgetType || "System usage"}
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
                  {fmtTime(activityHours)}
                </Text>
                <Text size="xs" c="dimmed" fw={500}>
                  {getLanguageByKey("Activity hours")}
                </Text>
              </Box>

              <Stack gap="xs" align="flex-end">
                <Group gap="xs" align="center">
                  {MinutesIconNode}
                  <Text size={isVeryCompact ? "xs" : "sm"} c={colors.minutes}>
                    {getLanguageByKey("Minutes")}
                  </Text>
                </Group>
                <Text size="xs" c="dimmed">
                  {getLanguageByKey("activity")}
                </Text>
              </Stack>
            </Group>

            <Group justify="space-between" align="center">
              <Group gap="xs" align="center">
                {HoursIconNode}
                <Text size={isVeryCompact ? "xs" : "sm"} c={colors.hours}>
                  {getLanguageByKey("Hours")}
                </Text>
              </Group>

              <Text size={isVeryCompact ? "xs" : "sm"} c={colors.minutes}>
                {fmt(activityMinutes)} {getLanguageByKey("min")}
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
                    const groupMinutes = Number.isFinite(ug.activity_minutes) ? ug.activity_minutes : 0;
                    const groupHours = Number.isFinite(ug.activity_hours) ? ug.activity_hours : 0;
                    if (groupMinutes === 0 && groupHours === 0) return null;

                    return (
                      <Box key={`ug-${ugIndex}`}>
                        <Text fw={600} size="sm" mb="xs" c="dark">
                          {ug.userGroupName || "-"}
                        </Text>
                        <Stack gap="xs">
                          <Group justify="space-between" align="center">
                            <Text size="xs" c="dimmed" fw={500}>
                              {getLanguageByKey("Activity hours")}
                            </Text>
                            <Text fw={700} size="sm" c={colors.hours}>
                              {fmtTime(groupHours)}
                            </Text>
                          </Group>
                          <Group justify="space-between" align="center">
                            <Group gap="xs" align="center">
                              {MinutesIconNode}
                              <Text size="xs" c={colors.minutes}>
                                {getLanguageByKey("Minutes")}
                              </Text>
                            </Group>
                            <Text size="xs" c={colors.minutes}>
                              {fmt(groupMinutes)} {getLanguageByKey("min")}
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
                    const userMinutes = Number.isFinite(ut.activity_minutes) ? ut.activity_minutes : 0;
                    const userHours = Number.isFinite(ut.activity_hours) ? ut.activity_hours : 0;
                    if (userMinutes === 0 && userHours === 0) return null;

                    return (
                      <Box key={`ut-${utIndex}`}>
                        <Text fw={600} size="sm" mb="xs" c="dark">
                          {ut.userName || `ID ${ut.userId}`}
                        </Text>
                        <Stack gap="xs">
                          <Group justify="space-between" align="center">
                            <Text size="xs" c="dimmed" fw={500}>
                              {getLanguageByKey("Activity hours")}
                            </Text>
                            <Text fw={700} size="sm" c={colors.hours}>
                              {fmtTime(userHours)}
                            </Text>
                          </Group>
                          <Group justify="space-between" align="center">
                            <Group gap="xs" align="center">
                              {MinutesIconNode}
                              <Text size="xs" c={colors.minutes}>
                                {getLanguageByKey("Minutes")}
                              </Text>
                            </Group>
                            <Text size="xs" c={colors.minutes}>
                              {fmt(userMinutes)} {getLanguageByKey("min")}
                            </Text>
                          </Group>
                        </Stack>
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
