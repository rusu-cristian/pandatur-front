import React from "react";
import {
    Card, Group, Stack, Text, Progress, Divider, Badge, ThemeIcon, Tooltip
} from "@mantine/core";
import { format } from "date-fns";
import { getLanguageByKey } from "@utils";
import { FaBriefcase, FaTasks } from "react-icons/fa";

const fmt = (n) => (typeof n === "number" ? n.toLocaleString() : "-");

export const TicketsIntoWorkCard = ({
    takenIntoWorkTickets,
    dateRange,
    title,
    subtitle,
    colors = { totalAccent: "blue" },
    icons = {},
    sizeInfo,
    sizePx,
    bg,
    widgetType,
}) => {
    const TotalIconNode = icons.total ?? <FaBriefcase size={18} />;

    const pxLabel =
        sizePx && Number.isFinite(sizePx.width) && Number.isFinite(sizePx.height)
            ? `${Math.round(sizePx.width)}×${Math.round(sizePx.height)}px`
            : null;

    return (
        <Card
            withBorder
            radius="xl"
            p="lg"
            style={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                background:
                "var(--crm-ui-kit-palette-background-primary)" ||
                    "linear-gradient(135deg, rgba(99,102,241,0.06), rgba(45,212,191,0.06))",
                borderColor: "var(--crm-ui-kit-palette-border-default)",
            }}
        >
            {/* Header */}
            <Group justify="space-between" align="center">
                <Group gap="sm" align="center">
                    <ThemeIcon size="lg" radius="xl" variant="light" color={colors.totalAccent}>
                        {TotalIconNode}
                    </ThemeIcon>
                    <div>
                        <Text size="xs" c="dimmed" fw={700} tt="uppercase" style={{ letterSpacing: 0.6 }}>
                            {title || getLanguageByKey("Tickets Into Work")}
                        </Text>

                        <Group gap={6} wrap="wrap">
                            <Badge variant="light" color="blue" size="sm">
                                {getLanguageByKey("Tickets Into Work") || widgetType || "Tickets Into Work"}
                            </Badge>
                            {subtitle ? <Badge variant="light">{subtitle}</Badge> : null}
                            <Badge variant="light">
                                {dateRange?.[0] ? format(dateRange[0], "dd.MM.yyyy") : "—"} →{" "}
                                {dateRange?.[1] ? format(dateRange[1], "dd.MM.yyyy") : "—"}
                            </Badge>

                            {sizeInfo ? (
                                <Badge variant="outline" color="gray">{sizeInfo}</Badge>
                            ) : null}
                            {pxLabel ? (
                                <Tooltip label="Текущий размер в пикселях">
                                    <Badge variant="outline" color="gray">{pxLabel}</Badge>
                                </Tooltip>
                            ) : null}
                        </Group>
                    </div>
                </Group>

                <div style={{ textAlign: "right" }}>
                    <Text fz={38} fw={900} style={{ lineHeight: 1 }}>
                        {fmt(takenIntoWorkTickets)}
                    </Text>
                    <Text size="xs" c="dimmed" fw={500}>
                        {getLanguageByKey("Tickets taken")}
                    </Text>
                </div>
            </Group>

            <Divider my="sm" />

            {/* Body */}
            <Stack gap={12} style={{ flex: 1, minWidth: 200 }}>
                <Group justify="space-between" align="center">
                    <Group gap={8} align="center">
                        <ThemeIcon size="sm" radius="xl" variant="light" color={colors.totalAccent}>
                            <FaTasks size={14} />
                        </ThemeIcon>
                        <Text size="sm" c={colors.totalAccent}>{getLanguageByKey("Taken into work")}</Text>
                    </Group>
                    <div style={{ textAlign: "right" }}>
                        <Text size="sm" fw={700}>{fmt(takenIntoWorkTickets)}</Text>
                        <Text size="xs" c="dimmed">{getLanguageByKey("tickets")}</Text>
                    </div>
                </Group>
                <Progress value={100} size="md" radius="xl" color={colors.totalAccent} />
            </Stack>
        </Card>
    );
};
