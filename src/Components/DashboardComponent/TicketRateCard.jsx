import React from "react";
import { Card, Stack, Group, Text, Badge, Progress, ThemeIcon, Box } from "@mantine/core";
import { FaTimes, FaCheckCircle, FaChartPie, FaExclamationTriangle } from "react-icons/fa";
import { getLanguageByKey } from "@utils";

const t = (key) => String(getLanguageByKey?.(key) ?? key);

export const TicketRateCard = ({
  totalTransitions = 0,
  directlyClosedCount = 0,
  directlyClosedPercentage = 0,
  workedOnCount = 0,
  workedOnPercentage = 0,
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
  const getQualityColor = (directlyClosedPct) => {
    if (directlyClosedPct <= 10) return "green"; // Хорошо - мало прямых закрытий
    if (directlyClosedPct <= 25) return "yellow"; // Нормально
    if (directlyClosedPct <= 40) return "orange"; // Плохо
    return "red"; // Очень плохо - много прямых закрытий
  };

  const getQualityLabel = (directlyClosedPct) => {
    if (directlyClosedPct <= 10) return t("Excellent");
    if (directlyClosedPct <= 25) return t("Good");
    if (directlyClosedPct <= 40) return t("Fair");
    return t("Poor");
  };

  const getQualityIcon = (directlyClosedPct) => {
    if (directlyClosedPct <= 10) return <FaCheckCircle size={12} color="green" />;
    if (directlyClosedPct <= 25) return <FaChartPie size={12} color="orange" />;
    return <FaExclamationTriangle size={12} color="red" />;
  };

  return (
    <Card
      shadow="sm"
      padding={cardPadding}
      radius="md"
      withBorder
      style={{ backgroundColor: bg, height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}
    >
      <Stack gap={statGap} style={{ flex: 1, height: "100%", minHeight: 0 }}>
        <Group justify="space-between" align="flex-start" style={{ flexShrink: 0 }}>
          <Stack gap={4}>
            <Text fw={600} size={titleSize} c="dimmed">
              {title}
            </Text>
            <Group gap={6} wrap="wrap">
              <Badge variant="light" color="blue" size="sm">
                {getLanguageByKey("Ticket Rate") || widgetType || "Ticket Rate"}
              </Badge>
              {subtitle && (
                <Text fw={700} size={subtitleSize}>
                  {subtitle}
                </Text>
              )}
            </Group>
          </Stack>
          <Badge color="blue" variant="light" size={badgeSize}>
            {totalTransitions}
          </Badge>
        </Group>

        {/* Прокручиваемая область с контентом */}
        <Box style={{ flex: 1, overflowY: "auto", overflowX: "hidden", minHeight: 0 }}>
          <Stack gap={isVeryCompact ? "xs" : "sm"}>
            {/* Обработано тикетов */}
            <Group justify="space-between" align="center">
              <Group gap="xs">
                <ThemeIcon color="green" variant="light" size={isVeryCompact ? "xs" : "sm"}>
                  <FaCheckCircle size={isVeryCompact ? 10 : 12} />
                </ThemeIcon>
                <Text size={isVeryCompact ? "xs" : "sm"} fw={500}>
                  {t("Worked on tickets")}
                </Text>
              </Group>
              <Group gap="xs">
                <Text fw={600} size={isVeryCompact ? "xs" : "sm"}>
                  {workedOnCount}
                </Text>
                <Text size="xs" c="dimmed">
                  ({workedOnPercentage.toFixed(1)}%)
                </Text>
              </Group>
            </Group>
            <Progress
              value={workedOnPercentage}
              color="green"
              size={isVeryCompact ? "xs" : "sm"}
              radius="xl"
            />

            {/* Прямо закрытые тикеты */}
            <Group justify="space-between" align="center">
              <Group gap="xs">
                <ThemeIcon color="red" variant="light" size={isVeryCompact ? "xs" : "sm"}>
                  <FaTimes size={isVeryCompact ? 10 : 12} />
                </ThemeIcon>
                <Text size={isVeryCompact ? "xs" : "sm"} fw={500}>
                  {t("Directly closed tickets")}
                </Text>
              </Group>
              <Group gap="xs">
                <Text fw={600} size={isVeryCompact ? "xs" : "sm"}>
                  {directlyClosedCount}
                </Text>
                <Text size="xs" c="dimmed">
                  ({directlyClosedPercentage.toFixed(1)}%)
                </Text>
              </Group>
            </Group>
            <Progress
              value={directlyClosedPercentage}
              color="red"
              size={isVeryCompact ? "xs" : "sm"}
              radius="xl"
            />

            {/* Вложенные группы пользователей (для by_group_title) */}
            {userGroups && userGroups.length > 0 && (
              <Box mt="md" pt="md" style={{ borderTop: "1px solid var(--crm-ui-kit-palette-border-default)" }}>
                <Text size="xs" fw={700} c="dimmed" mb="sm" tt="uppercase">
                  {getLanguageByKey("User Groups") || "User Groups"}
                </Text>
                <Stack gap="md">
                  {userGroups.map((ug, ugIndex) => {
                    // Обрабатываем статистику группы
                    const groupStats = (() => {
                      if (!ug.stats || typeof ug.stats !== "object") return { directlyClosed: { count: 0, percentage: 0 }, workedOn: { count: 0, percentage: 0 } };
                      if (Array.isArray(ug.stats)) return { directlyClosed: { count: 0, percentage: 0 }, workedOn: { count: 0, percentage: 0 } };
                      const directlyClosedObj = ug.stats.directly_closed;
                      const workedOnObj = ug.stats.worked_on;
                      return {
                        directlyClosed: {
                          count: directlyClosedObj && typeof directlyClosedObj === "object" ? (Number.isFinite(directlyClosedObj.count) ? directlyClosedObj.count : 0) : 0,
                          percentage: directlyClosedObj && typeof directlyClosedObj === "object" ? (Number.isFinite(directlyClosedObj.percentage) ? directlyClosedObj.percentage : 0) : 0,
                        },
                        workedOn: {
                          count: workedOnObj && typeof workedOnObj === "object" ? (Number.isFinite(workedOnObj.count) ? workedOnObj.count : 0) : 0,
                          percentage: workedOnObj && typeof workedOnObj === "object" ? (Number.isFinite(workedOnObj.percentage) ? workedOnObj.percentage : 0) : 0,
                        },
                      };
                    })();

                    const groupTotal = groupStats.directlyClosed.count + groupStats.workedOn.count;
                    if (groupTotal === 0) return null;

                    return (
                      <Box key={`ug-${ugIndex}`}>
                        <Text fw={600} size="sm" mb="xs" c="dark">
                          {ug.userGroupName || "-"}
                        </Text>
                        <Stack gap="xs">
                          {/* Worked on для группы */}
                          <Group justify="space-between" align="center">
                            <Group gap="xs">
                              <ThemeIcon color="green" variant="light" size="xs">
                                <FaCheckCircle size={10} />
                              </ThemeIcon>
                              <Text size="xs" fw={500}>
                                {t("Worked on tickets")}
                              </Text>
                            </Group>
                            <Group gap="xs">
                              <Text fw={600} size="xs">
                                {groupStats.workedOn.count}
                              </Text>
                              <Text size="xs" c="dimmed">
                                ({groupStats.workedOn.percentage.toFixed(1)}%)
                              </Text>
                            </Group>
                          </Group>
                          <Progress
                            value={groupStats.workedOn.percentage}
                            color="green"
                            size="xs"
                            radius="xl"
                          />
                          {/* Directly closed для группы */}
                          <Group justify="space-between" align="center">
                            <Group gap="xs">
                              <ThemeIcon color="red" variant="light" size="xs">
                                <FaTimes size={10} />
                              </ThemeIcon>
                              <Text size="xs" fw={500}>
                                {t("Directly closed tickets")}
                              </Text>
                            </Group>
                            <Group gap="xs">
                              <Text fw={600} size="xs">
                                {groupStats.directlyClosed.count}
                              </Text>
                              <Text size="xs" c="dimmed">
                                ({groupStats.directlyClosed.percentage.toFixed(1)}%)
                              </Text>
                            </Group>
                          </Group>
                          <Progress
                            value={groupStats.directlyClosed.percentage}
                            color="red"
                            size="xs"
                            radius="xl"
                          />
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
                    // Обрабатываем статистику пользователя
                    const userStats = (() => {
                      if (!ut.stats || typeof ut.stats !== "object") return { directlyClosed: { count: 0, percentage: 0 }, workedOn: { count: 0, percentage: 0 } };
                      if (Array.isArray(ut.stats)) return { directlyClosed: { count: 0, percentage: 0 }, workedOn: { count: 0, percentage: 0 } };
                      const directlyClosedObj = ut.stats.directly_closed;
                      const workedOnObj = ut.stats.worked_on;
                      return {
                        directlyClosed: {
                          count: directlyClosedObj && typeof directlyClosedObj === "object" ? (Number.isFinite(directlyClosedObj.count) ? directlyClosedObj.count : 0) : 0,
                          percentage: directlyClosedObj && typeof directlyClosedObj === "object" ? (Number.isFinite(directlyClosedObj.percentage) ? directlyClosedObj.percentage : 0) : 0,
                        },
                        workedOn: {
                          count: workedOnObj && typeof workedOnObj === "object" ? (Number.isFinite(workedOnObj.count) ? workedOnObj.count : 0) : 0,
                          percentage: workedOnObj && typeof workedOnObj === "object" ? (Number.isFinite(workedOnObj.percentage) ? workedOnObj.percentage : 0) : 0,
                        },
                      };
                    })();

                    const userTotal = userStats.directlyClosed.count + userStats.workedOn.count;
                    if (userTotal === 0) return null;

                    return (
                      <Box key={`ut-${utIndex}`}>
                        <Text fw={600} size="sm" mb="xs" c="dark">
                          {ut.userName || `ID ${ut.userId}`}
                        </Text>
                        <Stack gap="xs">
                          {/* Worked on для пользователя */}
                          <Group justify="space-between" align="center">
                            <Group gap="xs">
                              <ThemeIcon color="green" variant="light" size="xs">
                                <FaCheckCircle size={10} />
                              </ThemeIcon>
                              <Text size="xs" fw={500}>
                                {t("Worked on tickets")}
                              </Text>
                            </Group>
                            <Group gap="xs">
                              <Text fw={600} size="xs">
                                {userStats.workedOn.count}
                              </Text>
                              <Text size="xs" c="dimmed">
                                ({userStats.workedOn.percentage.toFixed(1)}%)
                              </Text>
                            </Group>
                          </Group>
                          <Progress
                            value={userStats.workedOn.percentage}
                            color="green"
                            size="xs"
                            radius="xl"
                          />
                          {/* Directly closed для пользователя */}
                          <Group justify="space-between" align="center">
                            <Group gap="xs">
                              <ThemeIcon color="red" variant="light" size="xs">
                                <FaTimes size={10} />
                              </ThemeIcon>
                              <Text size="xs" fw={500}>
                                {t("Directly closed tickets")}
                              </Text>
                            </Group>
                            <Group gap="xs">
                              <Text fw={600} size="xs">
                                {userStats.directlyClosed.count}
                              </Text>
                              <Text size="xs" c="dimmed">
                                ({userStats.directlyClosed.percentage.toFixed(1)}%)
                              </Text>
                            </Group>
                          </Group>
                          <Progress
                            value={userStats.directlyClosed.percentage}
                            color="red"
                            size="xs"
                            radius="xl"
                          />
                        </Stack>
                      </Box>
                    );
                  })}
                </Stack>
              </Box>
            )}

            {/* Общая статистика */}
            <Group justify="space-between" align="center" mt="md" pt="md" style={{ borderTop: "1px solid var(--crm-ui-kit-palette-border-default)" }}>
              <Text size="xs" c="dimmed">
                {t("Total transitions")}
              </Text>
              <Text fw={700} size={isVeryCompact ? "xs" : "sm"}>
                {totalTransitions}
              </Text>
            </Group>
          </Stack>
        </Box>
      </Stack>
    </Card>
  );
};
