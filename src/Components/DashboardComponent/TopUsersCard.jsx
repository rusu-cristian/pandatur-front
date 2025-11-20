import React, { useMemo } from "react";
import { Card, Box, Group, Stack, Text, Badge, Progress, ThemeIcon } from "@mantine/core";
import { MdCall, MdMessage } from "react-icons/md";
import { FaTicketAlt, FaHandPaper, FaFileContract, FaClock, FaChartPie, FaCheckCircle, FaPlane, FaHourglassHalf, FaExchangeAlt, FaCogs, FaPlus, FaPlay, FaMapMarkerAlt } from "react-icons/fa";
import { getLanguageByKey } from "@utils";

const fmt = (n) => (typeof n === "number" ? n.toLocaleString() : "-");

// Функция для форматирования времени в минутах
const formatDuration = (minutes) => {
  if (!minutes || minutes === 0) return `0${getLanguageByKey("minutes")}`;
  
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  
  if (hours > 0) {
    return mins > 0 ? `${hours}${getLanguageByKey("hours")} ${mins}${getLanguageByKey("minutes")}` : `${hours}${getLanguageByKey("hours")}`;
  }
  return `${mins}${getLanguageByKey("minutes")}`;
};

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

// Получение иконки и цвета для типа виджета
const getWidgetIconAndColor = (widgetType) => {
  switch (widgetType) {
    case "calls":
      return { icon: MdCall, color: "blue" };
    case "messages":
      return { icon: MdMessage, color: "green" };
    case "ticket_state":
      return { icon: FaTicketAlt, color: "purple" };
    case "tickets_into_work":
      return { icon: FaHandPaper, color: "green" };
    case "system_usage":
      return { icon: FaClock, color: "orange" };
    case "ticket_distribution":
      return { icon: FaChartPie, color: "cyan" };
    case "closed_tickets_count":
      return { icon: FaCheckCircle, color: "green" };
    case "tickets_by_depart_count":
      return { icon: FaPlane, color: "teal" };
    case "ticket_lifetime_stats":
      return { icon: FaHourglassHalf, color: "grape" };
    case "ticket_rate":
      return { icon: FaExchangeAlt, color: "pink" };
    case "workflow_from_change":
      return { icon: FaCogs, color: "indigo" };
    case "workflow_to_change":
      return { icon: FaFileContract, color: "green" };
    case "ticket_creation":
      return { icon: FaPlus, color: "blue" };
    case "workflow_from_de_prelucrat":
      return { icon: FaPlay, color: "orange" };
    case "workflow_duration":
      return { icon: FaClock, color: "teal" };
    case "ticket_destination":
      return { icon: FaMapMarkerAlt, color: "purple" };
    default:
      return { icon: MdCall, color: "blue" };
  }
};

export const TopUsersCard = ({
    title = "Top users",
    subtitle,
    rows = [],          // [{ user_id, name, total }]
    limit = 100,
    bg,
    colors = { totalAccent: "indigo" },
    widgetType = "calls", // Тип виджета для определения отображаемых данных
    width,
    height,
}) => {
    // Адаптивные размеры в зависимости от размера виджета
    const isCompact = width < 40 || height < 15;
    const isVeryCompact = width < 30 || height < 12;
    
    const cardPadding = isVeryCompact ? "md" : isCompact ? "sm" : "lg";
    const titleSize = isVeryCompact ? "md" : isCompact ? "sm" : "md";
    const subtitleSize = isVeryCompact ? "md" : isCompact ? "sm" : "sm";
    const iconSize = isVeryCompact ? 14 : isCompact ? 16 : 18;
    const themeIconSize = isVeryCompact ? "md" : isCompact ? "lg" : "lg";
    const limitCount = 100;

    const data = useMemo(() => {
        const normal = (rows || []).map((r) => {
            if (widgetType === "ticket_state") {
                return {
                    ...r,
                    total: Number(r.total ?? r.totalTickets ?? 0),
                };
            } else if (widgetType === "tickets_into_work") {
                return {
                    ...r,
                    total: Number(r.total ?? r.takenIntoWorkTickets ?? 0),
                };
            } else if (widgetType === "system_usage") {
                return {
                    ...r,
                    total: Number(r.total ?? r.activityHours ?? 0),
                };
            } else if (widgetType === "ticket_distribution") {
                return {
                    ...r,
                    total: Number(r.total ?? r.distributedTickets ?? 0),
                };
            } else if (widgetType === "closed_tickets_count") {
                return {
                    ...r,
                    total: Number(r.total ?? r.totalClosedTickets ?? 0),
                };
            } else if (widgetType === "tickets_by_depart_count") {
                return {
                    ...r,
                    total: Number(r.total ?? r.totalTickets ?? 0),
                };
            } else if (widgetType === "ticket_lifetime_stats") {
                return {
                    ...r,
                    total: Number(r.total ?? r.ticketsProcessed ?? 0),
                };
            } else if (widgetType === "ticket_rate") {
                return {
                    ...r,
                    total: Number(r.total ?? r.totalTransitions ?? 0),
                };
            } else if (widgetType === "workflow_from_change") {
                return {
                    ...r,
                    total: Number(r.total ?? r.totalChanges ?? 0),
                };
            } else if (widgetType === "workflow_to_change") {
                return {
                    ...r,
                    total: Number(r.total ?? r.contractIncheiatChangedCount ?? 0),
                };
            } else if (widgetType === "ticket_creation") {
                return {
                    ...r,
                    total: Number(r.total ?? r.ticketsCreatedCount ?? 0),
                };
            } else if (widgetType === "workflow_from_de_prelucrat") {
                return {
                    ...r,
                    total: Number(r.total ?? r.totalChanges ?? 0),
                };
            } else if (widgetType === "workflow_duration") {
                return {
                    ...r,
                    total: Number(r.total ?? r.averageDurationMinutes ?? 0),
                };
            } else if (widgetType === "ticket_destination") {
                // Для ticket_destination нет пользовательских данных, возвращаем пустой массив
                return null;
            } else {
                return {
                    ...r,
                    total: Number(r.total ?? r.total_calls_count ?? 0),
                };
            }
        });
        const filtered = normal.filter(r => r !== null);
        const sorted = filtered.sort((a, b) => b.total - a.total);
        return sorted.slice(0, Math.min(limit, limitCount));
    }, [rows, limit, widgetType, limitCount]);

    const maxTotal = useMemo(
        () => Math.max(1, ...data.map((r) => r.total || 0)),
        [data]
    );

    const { icon: WidgetIcon, color: widgetColor } = getWidgetIconAndColor(widgetType);

    return (
        <Card
            withBorder
            radius="xl"
            p={cardPadding}
            style={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                // background:
                //     bg || "linear-gradient(135deg, rgba(99,102,241,0.06), rgba(45,212,191,0.06))",
                borderColor: "var(--crm-ui-kit-palette-border-default)",
                overflow: "hidden",
            }}
        >
            <Group justify="space-between" align="center" mb="sm">
                <Group gap="sm" align="center">
                    <ThemeIcon size={themeIconSize} radius="xl" variant="light" color={widgetColor}>
                        <WidgetIcon size={iconSize} />
                    </ThemeIcon>
                    <div>
                        <Text size={titleSize} c="dimmed" fw={700} tt="uppercase" style={{ letterSpacing: 0.6 }}>
                            {title}
                        </Text>
                        <Group gap={6} wrap="wrap" mt={4}>
                            <Badge variant="light" color="blue" size={isVeryCompact ? "md" : "sm"}>
                                {widgetType === "calls" 
                                    ? getLanguageByKey("Calls") 
                                    : widgetType === "messages"
                                    ? getLanguageByKey("Messages")
                                    : widgetType === "ticket_state"
                                    ? getLanguageByKey("Ticket State")
                                    : widgetType === "tickets_into_work"
                                    ? getLanguageByKey("Tickets Into Work")
                                    : widgetType === "system_usage"
                                    ? getLanguageByKey("System usage")
                                    : widgetType === "ticket_distribution"
                                    ? getLanguageByKey("Ticket Distribution")
                                    : widgetType === "closed_tickets_count"
                                    ? getLanguageByKey("Closed Tickets Count")
                                    : widgetType === "tickets_by_depart_count"
                                    ? getLanguageByKey("Tickets By Depart Count")
                                    : widgetType === "ticket_lifetime_stats"
                                    ? getLanguageByKey("Ticket Lifetime Stats")
                                    : widgetType === "ticket_rate"
                                    ? getLanguageByKey("Ticket Rate")
                                    : widgetType === "workflow_from_change"
                                    ? getLanguageByKey("Workflow From Change")
                                    : widgetType === "workflow_to_change"
                                    ? getLanguageByKey("Workflow Change To")
                                    : widgetType === "ticket_creation"
                                    ? getLanguageByKey("Ticket Creation")
                                    : widgetType === "workflow_from_de_prelucrat"
                                    ? getLanguageByKey("Workflow From De Prelucrat")
                                    : widgetType === "workflow_duration"
                                    ? getLanguageByKey("Workflow Duration")
                                    : widgetType === "ticket_destination"
                                    ? getLanguageByKey("Ticket Destination")
                                    : getLanguageByKey(widgetType) || widgetType || "Top users"}
                            </Badge>
                            {subtitle ? <Badge variant="light" size={isVeryCompact ? "md" : "sm"}>{subtitle}</Badge> : null}
                        </Group>
                    </div>
                </Group>
                
                {data.length > 0 && (
                    <div style={{ textAlign: "right" }}>
                        <Text fz={24} fw={700} style={{ lineHeight: 1 }}>
                            {widgetType === "system_usage" 
                                ? fmtTime(data.reduce((sum, u) => sum + (u.total || 0), 0))
                                : widgetType === "workflow_duration"
                                ? formatDuration(data.reduce((sum, u) => sum + (u.total || 0), 0))
                                : fmt(data.reduce((sum, u) => sum + (u.total || 0), 0))
                            }
                        </Text>
                        <Text size="md" c="dimmed" fw={500}>
                            {widgetType === "ticket_state" 
                                ? getLanguageByKey("Total tickets") 
                                : widgetType === "tickets_into_work"
                                ? getLanguageByKey("Tickets taken")
                                : widgetType === "system_usage"
                                ? getLanguageByKey("Activity hours")
                                : widgetType === "ticket_distribution"
                                ? getLanguageByKey("Distributed tickets")
                                : widgetType === "closed_tickets_count"
                                ? getLanguageByKey("Total closed tickets")
                                : widgetType === "tickets_by_depart_count"
                                ? getLanguageByKey("Total tickets")
                                : widgetType === "ticket_lifetime_stats"
                                ? getLanguageByKey("Tickets processed")
                                : widgetType === "ticket_rate"
                                ? getLanguageByKey("Total transitions")
                                : widgetType === "workflow_from_change"
                                ? getLanguageByKey("Total changes")
                                : widgetType === "workflow_to_change"
                                ? getLanguageByKey("Total completed contracts")
                                : widgetType === "ticket_creation"
                                ? getLanguageByKey("Total tickets created")
                                : widgetType === "workflow_from_de_prelucrat"
                                ? getLanguageByKey("Total workflow transitions")
                                : widgetType === "workflow_duration"
                                ? getLanguageByKey("Average processing time")
                                : widgetType === "ticket_destination"
                                ? getLanguageByKey("By country")
                                : getLanguageByKey("Total calls")
                            }
                        </Text>
                    </div>
                )}
            </Group>

            <Stack gap="sm" style={{ overflowY: "auto" }}>
                {data.map((u, idx) => {
                    const percent = Math.round(((u.total || 0) / maxTotal) * 100);
                    return (
                        <Box key={u.user_id ?? idx}>
                            <Group justify="space-between" align="center" mb={6} wrap="nowrap">
                                <Group gap="md" align="center" wrap="nowrap">
                                    <Badge variant="light" radius="sm">{idx + 1}</Badge>
                                    <Text fw={600} size="sm" lineClamp={1}>
                                        {u.name || (Number.isFinite(Number(u.user_id)) ? `ID ${u.user_id}` : "-")}
                                    </Text>
                                </Group>
                                <div style={{ textAlign: "right" }}>
                                    <Text size="sm" fw={700}>
                                        {widgetType === "system_usage" 
                                            ? fmtTime(u.total)
                                            : widgetType === "workflow_duration"
                                            ? formatDuration(u.total)
                                            : fmt(u.total)
                                        }
                                    </Text>
                                    <Text size="md" c="dimmed">
                                        {widgetType === "ticket_state" 
                                            ? getLanguageByKey("tickets") 
                                            : widgetType === "tickets_into_work"
                                            ? getLanguageByKey("tickets")
                                            : widgetType === "system_usage"
                                            ? getLanguageByKey("hours")
                                            : widgetType === "ticket_distribution"
                                            ? getLanguageByKey("tickets")
                                            : widgetType === "closed_tickets_count"
                                            ? getLanguageByKey("tickets")
                                            : widgetType === "tickets_by_depart_count"
                                            ? getLanguageByKey("tickets")
                                            : widgetType === "ticket_lifetime_stats"
                                            ? getLanguageByKey("tickets")
                                            : widgetType === "ticket_rate"
                                            ? getLanguageByKey("transitions")
                                            : widgetType === "workflow_from_change"
                                            ? getLanguageByKey("changes")
                                            : widgetType === "workflow_to_change"
                                            ? getLanguageByKey("completed contracts")
                                            : widgetType === "ticket_creation"
                                            ? getLanguageByKey("tickets created")
                                            : widgetType === "workflow_from_de_prelucrat"
                                            ? getLanguageByKey("workflow transitions")
                                            : widgetType === "workflow_duration"
                                            ? ""
                                            : widgetType === "ticket_destination"
                                            ? getLanguageByKey("tickets by country")
                                            : getLanguageByKey("calls")
                                        }
                                    </Text>
                                </div>
                            </Group>

                            {/* зелёная линия */}
                            <Progress value={percent} size="md" radius="xl" color="teal" />
                        </Box>
                    );
                })}
                {!data.length && <Text c="dimmed" size="sm">—</Text>}
            </Stack>
        </Card>
    );
};
