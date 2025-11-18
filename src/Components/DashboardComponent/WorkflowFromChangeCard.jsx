import React from "react";
import { Card, Text, Group, Stack, Badge, Box } from "@mantine/core";
import { FaHandPaper, FaFileContract } from "react-icons/fa";
import { getLanguageByKey } from "../utils";

export const WorkflowFromChangeCard = ({
  luatInLucruChangedCount = 0,
  ofertaTrimisaChangedCount = 0,
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
  const luatPercentage = totalChanges > 0 ? Math.round((luatInLucruChangedCount / totalChanges) * 100) : 0;
  const ofertaPercentage = totalChanges > 0 ? Math.round((ofertaTrimisaChangedCount / totalChanges) * 100) : 0;

  const getEfficiencyRating = (percentage) => {
    if (percentage >= 80) return { label: getLanguageByKey("Excellent"), color: "green" };
    if (percentage >= 60) return { label: getLanguageByKey("Good"), color: "blue" };
    if (percentage >= 40) return { label: getLanguageByKey("Fair"), color: "yellow" };
    return { label: getLanguageByKey("Poor"), color: "red" };
  };

  const luatRating = getEfficiencyRating(luatPercentage);
  const ofertaRating = getEfficiencyRating(ofertaPercentage);

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
                {getLanguageByKey("Workflow From Change") || widgetType || "Workflow From Change"}
              </Badge>
              {subtitle && (
                <Text fw={700} size={subtitleSize} c="dark">
                  {subtitle}
                </Text>
              )}
            </Group>
          </Box>
          <Badge size={badgeSize} variant="light" color="blue">
            {totalChanges} {getLanguageByKey("changes")}
          </Badge>
        </Group>

        {/* Прокручиваемая область с контентом */}
        <Box style={{ flex: 1, overflowY: "auto", overflowX: "hidden", minHeight: 0 }}>
          <Stack gap={isVeryCompact ? "xs" : "sm"}>
            {/* Статистика по "Luat în lucru" */}
            <Group justify="space-between" align="center" p={isVeryCompact ? "xs" : "xs"} style={{ backgroundColor: "var(--crm-ui-kit-palette-background-primary-disabled)", borderRadius: "6px" }}>
              <Group gap="xs">
                <FaHandPaper size={isVeryCompact ? 12 : 14} color="#28a745" />
                <Text fw={500} size={isVeryCompact ? "xs" : "xs"} c="dark">
                  {getLanguageByKey("Luat în lucru")}
                </Text>
              </Group>
              <Group gap="xs" align="center">
                <Text fw={700} size={isVeryCompact ? "xs" : "sm"} c="#28a745">
                  {luatInLucruChangedCount}
                </Text>
                <Badge size={isVeryCompact ? "xs" : "xs"} color={luatRating.color} variant="light">
                  {luatPercentage}%
                </Badge>
              </Group>
            </Group>

            {/* Статистика по "Ofertă trimisă" */}
            <Group justify="space-between" align="center" p={isVeryCompact ? "xs" : "xs"} style={{ backgroundColor: "var(--crm-ui-kit-palette-background-primary-disabled)", borderRadius: "6px" }}>
              <Group gap="xs">
                <FaFileContract size={isVeryCompact ? 12 : 14} color="#007bff" />
                <Text fw={500} size={isVeryCompact ? "xs" : "xs"} c="dark">
                  {getLanguageByKey("Ofertă trimisă")}
                </Text>
              </Group>
              <Group gap="xs" align="center">
                <Text fw={700} size={isVeryCompact ? "xs" : "sm"} c="#007bff">
                  {ofertaTrimisaChangedCount}
                </Text>
                <Badge size={isVeryCompact ? "xs" : "xs"} color={ofertaRating.color} variant="light">
                  {ofertaPercentage}%
                </Badge>
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
                    const groupStats = (() => {
                      if (!ug.stats || typeof ug.stats !== "object") return { luat: 0, oferta: 0 };
                      if (Array.isArray(ug.stats)) return { luat: 0, oferta: 0 };
                      const luatObj = ug.stats["Luat în lucru"] || ug.stats["luat_in_lucru"] || ug.stats["Luat \u00een lucru"];
                      const ofertaObj = ug.stats["Ofertă trimisă"] || ug.stats["oferta_trimisa"] || ug.stats["Ofert\u0103 trimis\u0103"];
                      return {
                        luat: luatObj && typeof luatObj === "object" ? (Number.isFinite(luatObj.count) ? luatObj.count : 0) : 0,
                        oferta: ofertaObj && typeof ofertaObj === "object" ? (Number.isFinite(ofertaObj.count) ? ofertaObj.count : 0) : 0,
                      };
                    })();

                    const groupTotal = groupStats.luat + groupStats.oferta;
                    if (groupTotal === 0) return null;

                    const groupLuatPercentage = groupTotal > 0 ? Math.round((groupStats.luat / groupTotal) * 100) : 0;
                    const groupOfertaPercentage = groupTotal > 0 ? Math.round((groupStats.oferta / groupTotal) * 100) : 0;
                    const groupLuatRating = getEfficiencyRating(groupLuatPercentage);
                    const groupOfertaRating = getEfficiencyRating(groupOfertaPercentage);

                    return (
                      <Box key={`ug-${ugIndex}`}>
                        <Text fw={600} size="sm" mb="xs" c="dark">
                          {ug.userGroupName || "-"}
                        </Text>
                        <Stack gap="xs">
                          {/* Luat în lucru для группы */}
                          <Group justify="space-between" align="center" p={isVeryCompact ? "xs" : "xs"} style={{ backgroundColor: "var(--crm-ui-kit-palette-background-primary-disabled)", borderRadius: "6px" }}>
                            <Group gap="xs">
                              <FaHandPaper size={isVeryCompact ? 10 : 12} color="#28a745" />
                              <Text fw={500} size={isVeryCompact ? "xs" : "xs"} c="dark">
                                {getLanguageByKey("Luat în lucru")}
                              </Text>
                            </Group>
                            <Group gap="xs" align="center">
                              <Text fw={700} size={isVeryCompact ? "xs" : "xs"} c="#28a745">
                                {groupStats.luat}
                              </Text>
                              <Badge size="xs" color={groupLuatRating.color} variant="light">
                                {groupLuatPercentage}%
                              </Badge>
                            </Group>
                          </Group>
                          {/* Ofertă trimisă для группы */}
                          <Group justify="space-between" align="center" p={isVeryCompact ? "xs" : "xs"} style={{ backgroundColor: "var(--crm-ui-kit-palette-background-primary-disabled)", borderRadius: "6px" }}>
                            <Group gap="xs">
                              <FaFileContract size={isVeryCompact ? 10 : 12} color="#007bff" />
                              <Text fw={500} size={isVeryCompact ? "xs" : "xs"} c="dark">
                                {getLanguageByKey("Ofertă trimisă")}
                              </Text>
                            </Group>
                            <Group gap="xs" align="center">
                              <Text fw={700} size={isVeryCompact ? "xs" : "xs"} c="#007bff">
                                {groupStats.oferta}
                              </Text>
                              <Badge size="xs" color={groupOfertaRating.color} variant="light">
                                {groupOfertaPercentage}%
                              </Badge>
                            </Group>
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
                    // Обрабатываем статистику пользователя
                    const userStats = (() => {
                      if (!ut.stats || typeof ut.stats !== "object") return { luat: 0, oferta: 0 };
                      if (Array.isArray(ut.stats)) return { luat: 0, oferta: 0 };
                      const luatObj = ut.stats["Luat în lucru"] || ut.stats["luat_in_lucru"] || ut.stats["Luat \u00een lucru"];
                      const ofertaObj = ut.stats["Ofertă trimisă"] || ut.stats["oferta_trimisa"] || ut.stats["Ofert\u0103 trimis\u0103"];
                      return {
                        luat: luatObj && typeof luatObj === "object" ? (Number.isFinite(luatObj.count) ? luatObj.count : 0) : 0,
                        oferta: ofertaObj && typeof ofertaObj === "object" ? (Number.isFinite(ofertaObj.count) ? ofertaObj.count : 0) : 0,
                      };
                    })();

                    const userTotal = userStats.luat + userStats.oferta;
                    if (userTotal === 0) return null;

                    const userLuatPercentage = userTotal > 0 ? Math.round((userStats.luat / userTotal) * 100) : 0;
                    const userOfertaPercentage = userTotal > 0 ? Math.round((userStats.oferta / userTotal) * 100) : 0;
                    const userLuatRating = getEfficiencyRating(userLuatPercentage);
                    const userOfertaRating = getEfficiencyRating(userOfertaPercentage);

                    return (
                      <Box key={`ut-${utIndex}`}>
                        <Text fw={600} size="sm" mb="xs" c="dark">
                          {ut.userName || `ID ${ut.userId}`}
                        </Text>
                        <Stack gap="xs">
                          {/* Luat în lucru для пользователя */}
                          <Group justify="space-between" align="center" p={isVeryCompact ? "xs" : "xs"} style={{ backgroundColor: "var(--crm-ui-kit-palette-background-primary-disabled)", borderRadius: "6px" }}>
                            <Group gap="xs">
                              <FaHandPaper size={isVeryCompact ? 10 : 12} color="#28a745" />
                              <Text fw={500} size={isVeryCompact ? "xs" : "xs"} c="dark">
                                {getLanguageByKey("Luat în lucru")}
                              </Text>
                            </Group>
                            <Group gap="xs" align="center">
                              <Text fw={700} size={isVeryCompact ? "xs" : "xs"} c="#28a745">
                                {userStats.luat}
                              </Text>
                              <Badge size="xs" color={userLuatRating.color} variant="light">
                                {userLuatPercentage}%
                              </Badge>
                            </Group>
                          </Group>
                          {/* Ofertă trimisă для пользователя */}
                          <Group justify="space-between" align="center" p={isVeryCompact ? "xs" : "xs"} style={{ backgroundColor: "var(--crm-ui-kit-palette-background-primary-disabled)", borderRadius: "6px" }}>
                            <Group gap="xs">
                              <FaFileContract size={isVeryCompact ? 10 : 12} color="#007bff" />
                              <Text fw={500} size={isVeryCompact ? "xs" : "xs"} c="dark">
                                {getLanguageByKey("Ofertă trimisă")}
                              </Text>
                            </Group>
                            <Group gap="xs" align="center">
                              <Text fw={700} size={isVeryCompact ? "xs" : "xs"} c="#007bff">
                                {userStats.oferta}
                              </Text>
                              <Badge size="xs" color={userOfertaRating.color} variant="light">
                                {userOfertaPercentage}%
                              </Badge>
                            </Group>
                          </Group>
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
                {getLanguageByKey("Total workflow changes")}
              </Text>
            </Group>
          </Stack>
        </Box>
      </Stack>
    </Card>
  );
};
