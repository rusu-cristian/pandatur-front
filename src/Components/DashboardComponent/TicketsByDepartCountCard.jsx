import React from "react";
import { Card, Stack, Group, Text, Badge, Progress, Box } from "@mantine/core";
import { FaCalendarAlt, FaClock, FaCheckCircle } from "react-icons/fa";
import { getLanguageByKey } from "@utils";

const t = (key) => String(getLanguageByKey?.(key) ?? key);

export const TicketsByDepartCountCard = ({ 
  lessThan14Days = 0, 
  between14And30Days = 0, 
  moreThan30Days = 0, 
  totalTickets = 0,
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
  const total = lessThan14Days + between14And30Days + moreThan30Days;
  
  const getProgressColor = (value) => {
    if (value === 0) return "gray";
    if (value === lessThan14Days) return "green";
    if (value === between14And30Days) return "yellow";
    return "red";
  };

  const getIcon = (value) => {
    if (value === lessThan14Days) return <FaCheckCircle size={16} color="green" />;
    if (value === between14And30Days) return <FaClock size={16} color="orange" />;
    return <FaCalendarAlt size={16} color="red" />;
  };

  return (
    <Card
      shadow="sm"
      padding={cardPadding}
      radius="md"
      withBorder
      style={{ backgroundColor: "var(--crm-ui-kit-palette-background-primary)", height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}
    >
      <Stack gap={statGap} style={{ flex: 1, height: "100%", minHeight: 0 }}>
        <Group justify="space-between" align="flex-start" style={{ flemdhrink: 0 }}>
          <Stack gap={4}>
            <Text fw={600} size={titleSize} c="dimmed">
              {title}
            </Text>
            <Group gap={6} wrap="wrap">
              <Badge variant="light" color="blue" size="sm">
                {getLanguageByKey("Tickets By Depart Count") || widgetType || "Tickets By Depart Count"}
              </Badge>
              {subtitle && (
                <Text fw={700} size={subtitleSize}>
              {subtitle}
            </Text>
              )}
            </Group>
          </Stack>
          <Badge color="blue" variant="light" size={badgeSize}>
            {totalTickets || total}
          </Badge>
        </Group>

        {/* Прокручиваемая область с контентом */}
        <Box style={{ flex: 1, overflowY: "auto", overflowX: "hidden", minHeight: 0 }}>
          <Stack gap={isVeryCompact ? "md" : "sm"}>
          {/* Less than 14 days */}
          <Group justify="space-between" align="center">
            <Group gap="md">
              {getIcon(lessThan14Days)}
                <Text size={isVeryCompact ? "md" : "sm"} fw={500}>
                {t("Less than 14 days")}
              </Text>
            </Group>
              <Text fw={600} size={isVeryCompact ? "md" : "sm"}>
              {lessThan14Days}
            </Text>
          </Group>
          <Progress
            value={total > 0 ? (lessThan14Days / total) * 100 : 0}
            color={getProgressColor(lessThan14Days)}
              size={isVeryCompact ? "md" : "sm"}
            radius="xl"
          />

          {/* Between 14-30 days */}
          <Group justify="space-between" align="center">
            <Group gap="md">
              {getIcon(between14And30Days)}
                <Text size={isVeryCompact ? "md" : "sm"} fw={500}>
                {t("Between 14-30 days")}
              </Text>
            </Group>
              <Text fw={600} size={isVeryCompact ? "md" : "sm"}>
              {between14And30Days}
            </Text>
          </Group>
          <Progress
            value={total > 0 ? (between14And30Days / total) * 100 : 0}
            color={getProgressColor(between14And30Days)}
              size={isVeryCompact ? "md" : "sm"}
            radius="xl"
          />

          {/* More than 30 days */}
          <Group justify="space-between" align="center">
            <Group gap="md">
              {getIcon(moreThan30Days)}
                <Text size={isVeryCompact ? "md" : "sm"} fw={500}>
                {t("More than 30 days")}
              </Text>
            </Group>
              <Text fw={600} size={isVeryCompact ? "md" : "sm"}>
              {moreThan30Days}
            </Text>
          </Group>
          <Progress
            value={total > 0 ? (moreThan30Days / total) * 100 : 0}
            color={getProgressColor(moreThan30Days)}
              size={isVeryCompact ? "md" : "sm"}
              radius="xl"
            />

            {/* Вложенные группы пользователей (для by_group_title) */}
            {userGroups && userGroups.length > 0 && (
              <Box mt="md" pt="md" style={{ borderTop: "1px solid var(--crm-ui-kit-palette-border-default)" }}>
                <Text size="md" fw={700} c="dimmed" mb="sm" tt="uppercase">
                  {getLanguageByKey("User Groups") || "User Groups"}
                </Text>
                <Stack gap="md">
                  {userGroups.map((ug, ugIndex) => {
                    // Обрабатываем статистику группы
                    const groupStats = (() => {
                      if (!ug.stats || typeof ug.stats !== "object") return { lessThan14Days: 0, between14And30Days: 0, moreThan30Days: 0 };
                      if (Array.isArray(ug.stats)) return { lessThan14Days: 0, between14And30Days: 0, moreThan30Days: 0 };
                      const lessThan14DaysObj = ug.stats.less_than_14_days;
                      const between14And30DaysObj = ug.stats.between_14_30_days;
                      const moreThan30DaysObj = ug.stats.more_than_30_days;
                      return {
                        lessThan14Days: lessThan14DaysObj && typeof lessThan14DaysObj === "object" ? (Number.isFinite(lessThan14DaysObj.count) ? lessThan14DaysObj.count : 0) : 0,
                        between14And30Days: between14And30DaysObj && typeof between14And30DaysObj === "object" ? (Number.isFinite(between14And30DaysObj.count) ? between14And30DaysObj.count : 0) : 0,
                        moreThan30Days: moreThan30DaysObj && typeof moreThan30DaysObj === "object" ? (Number.isFinite(moreThan30DaysObj.count) ? moreThan30DaysObj.count : 0) : 0,
                      };
                    })();

                    const groupTotal = groupStats.lessThan14Days + groupStats.between14And30Days + groupStats.moreThan30Days;
                    if (groupTotal === 0) return null;

                    return (
                      <Box key={`ug-${ugIndex}`}>
                        <Text fw={600} size="sm" mb="md" c="dark">
                          {ug.userGroupName || "-"}
                        </Text>
                        <Stack gap="md">
                          {/* Less than 14 days для группы */}
                          <Group justify="space-between" align="center">
                            <Group gap="md">
                              {getIcon(groupStats.lessThan14Days)}
                              <Text size="md" fw={500}>
                                {t("Less than 14 days")}
                              </Text>
                            </Group>
                            <Text fw={600} size="md">
                              {groupStats.lessThan14Days}
                            </Text>
                          </Group>
                          <Progress
                            value={groupTotal > 0 ? (groupStats.lessThan14Days / groupTotal) * 100 : 0}
                            color={getProgressColor(groupStats.lessThan14Days)}
                            size="md"
                            radius="xl"
                          />
                          {/* Between 14-30 days для группы */}
                          <Group justify="space-between" align="center">
                            <Group gap="md">
                              {getIcon(groupStats.between14And30Days)}
                              <Text size="md" fw={500}>
                                {t("Between 14-30 days")}
                              </Text>
                            </Group>
                            <Text fw={600} size="md">
                              {groupStats.between14And30Days}
                            </Text>
                          </Group>
                          <Progress
                            value={groupTotal > 0 ? (groupStats.between14And30Days / groupTotal) * 100 : 0}
                            color={getProgressColor(groupStats.between14And30Days)}
                            size="md"
                            radius="xl"
                          />
                          {/* More than 30 days для группы */}
                          <Group justify="space-between" align="center">
                            <Group gap="md">
                              {getIcon(groupStats.moreThan30Days)}
                              <Text size="md" fw={500}>
                                {t("More than 30 days")}
                              </Text>
                            </Group>
                            <Text fw={600} size="md">
                              {groupStats.moreThan30Days}
                            </Text>
                          </Group>
                          <Progress
                            value={groupTotal > 0 ? (groupStats.moreThan30Days / groupTotal) * 100 : 0}
                            color={getProgressColor(groupStats.moreThan30Days)}
                            size="md"
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
                <Text size="md" fw={700} c="dimmed" mb="sm" tt="uppercase">
                  {getLanguageByKey("Users") || "Users"}
                </Text>
                <Stack gap="md">
                  {userTechnicians.map((ut, utIndex) => {
                    // Обрабатываем статистику пользователя
                    const userStats = (() => {
                      if (!ut.stats || typeof ut.stats !== "object") return { lessThan14Days: 0, between14And30Days: 0, moreThan30Days: 0 };
                      if (Array.isArray(ut.stats)) return { lessThan14Days: 0, between14And30Days: 0, moreThan30Days: 0 };
                      const lessThan14DaysObj = ut.stats.less_than_14_days;
                      const between14And30DaysObj = ut.stats.between_14_30_days;
                      const moreThan30DaysObj = ut.stats.more_than_30_days;
                      return {
                        lessThan14Days: lessThan14DaysObj && typeof lessThan14DaysObj === "object" ? (Number.isFinite(lessThan14DaysObj.count) ? lessThan14DaysObj.count : 0) : 0,
                        between14And30Days: between14And30DaysObj && typeof between14And30DaysObj === "object" ? (Number.isFinite(between14And30DaysObj.count) ? between14And30DaysObj.count : 0) : 0,
                        moreThan30Days: moreThan30DaysObj && typeof moreThan30DaysObj === "object" ? (Number.isFinite(moreThan30DaysObj.count) ? moreThan30DaysObj.count : 0) : 0,
                      };
                    })();

                    const userTotal = userStats.lessThan14Days + userStats.between14And30Days + userStats.moreThan30Days;
                    if (userTotal === 0) return null;

                    return (
                      <Box key={`ut-${utIndex}`}>
                        <Text fw={600} size="sm" mb="md" c="dark">
                          {ut.userName || `ID ${ut.userId}`}
                        </Text>
                        <Stack gap="md">
                          {/* Less than 14 days для пользователя */}
                          <Group justify="space-between" align="center">
                            <Group gap="md">
                              {getIcon(userStats.lessThan14Days)}
                              <Text size="md" fw={500}>
                                {t("Less than 14 days")}
                              </Text>
                            </Group>
                            <Text fw={600} size="md">
                              {userStats.lessThan14Days}
                            </Text>
                          </Group>
                          <Progress
                            value={userTotal > 0 ? (userStats.lessThan14Days / userTotal) * 100 : 0}
                            color={getProgressColor(userStats.lessThan14Days)}
                            size="md"
                            radius="xl"
                          />
                          {/* Between 14-30 days для пользователя */}
                          <Group justify="space-between" align="center">
                            <Group gap="md">
                              {getIcon(userStats.between14And30Days)}
                              <Text size="md" fw={500}>
                                {t("Between 14-30 days")}
                              </Text>
                            </Group>
                            <Text fw={600} size="md">
                              {userStats.between14And30Days}
                            </Text>
                          </Group>
                          <Progress
                            value={userTotal > 0 ? (userStats.between14And30Days / userTotal) * 100 : 0}
                            color={getProgressColor(userStats.between14And30Days)}
                            size="md"
                            radius="xl"
                          />
                          {/* More than 30 days для пользователя */}
                          <Group justify="space-between" align="center">
                            <Group gap="md">
                              {getIcon(userStats.moreThan30Days)}
                              <Text size="md" fw={500}>
                                {t("More than 30 days")}
                              </Text>
                            </Group>
                            <Text fw={600} size="md">
                              {userStats.moreThan30Days}
                            </Text>
                          </Group>
                          <Progress
                            value={userTotal > 0 ? (userStats.moreThan30Days / userTotal) * 100 : 0}
                            color={getProgressColor(userStats.moreThan30Days)}
                            size="md"
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
          <Text size="md" c="dimmed">
            {t("Total tickets")}
          </Text>
              <Text fw={700} size={isVeryCompact ? "md" : "sm"}>
            {totalTickets || total}
          </Text>
        </Group>
          </Stack>
        </Box>
      </Stack>
    </Card>
  );
};
