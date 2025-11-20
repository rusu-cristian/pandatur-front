import React, { useMemo } from "react";
import { Card, Group, Stack, Text, Badge, Progress, ThemeIcon, Box } from "@mantine/core";
import { FaMapMarkerAlt } from "react-icons/fa";
import { Link } from "react-router-dom";
import { getLanguageByKey } from "../utils";

const fmt = (n) => (typeof n === "number" ? n.toLocaleString() : "-");

const clampPercentage = (value) => {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, value));
};

const parseDestinationValue = (value) => {
  if (value && typeof value === "object") {
    const count = Number(value.count);
    return {
      count: Number.isFinite(count) ? count : 0,
      href: typeof value.href === "string" && value.href ? value.href : undefined,
    };
  }
  const numeric = Number(value);
  return {
    count: Number.isFinite(numeric) ? numeric : 0,
    href: undefined,
  };
};

const mapDestinationItems = (destinationData = {}, limit = 100) => {
  if (!destinationData || typeof destinationData !== "object") return [];

  const workflowEntries = Object.entries(destinationData || {});

  return workflowEntries.map(([workflowKey, countriesObj]) => {
    const countryList = Object.entries(countriesObj || {})
      .map(([country, rawValue]) => {
        const { count, href } = parseDestinationValue(rawValue);
        return {
          country,
          count,
          href,
        };
      })
      .filter((item) => Number.isFinite(item.count) && item.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);

    const total = countryList.reduce((sum, item) => sum + item.count, 0);

    return {
      workflow: workflowKey,
      countries: countryList,
      total,
    };
  });
};

const STATE_COLORS = {
  "Ofertă trimisă": "orange",
  "Aprobat cu client": "green",
};

export const TicketDestinationCard = ({
  destinationData = {},
  title,
  subtitle,
  bg,
  limit = 100,
  widgetType,
}) => {
  const workflowStats = useMemo(() => mapDestinationItems(destinationData, limit), [destinationData, limit]);

  const summary = useMemo(() => {
    const totals = workflowStats.map((wf) => wf.total);
    return {
      grandTotal: totals.reduce((sum, value) => sum + value, 0),
      maxTotal: Math.max(1, ...totals, 1),
    };
  }, [workflowStats]);

  return (
    <Card
      withBorder
      radius="xl"
      p="lg"
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        borderColor: "var(--crm-ui-kit-palette-border-default)",
        background: bg || "var(--crm-ui-kit-palette-background-primary)",
        overflow: "hidden",
      }}
    >
      <Group justify="space-between" align="flex-start" mb="md">
        <Group gap="sm" align="center">
          <ThemeIcon size="xl" radius="xl" variant="light" color="blue">
            <FaMapMarkerAlt size={18} />
          </ThemeIcon>
          <Stack gap={4}>
            <Text size="md" c="dimmed" fw={700} tt="uppercase" style={{ letterSpacing: 0.8 }}>
              {title || getLanguageByKey("Ticket Destination")}
            </Text>
            <Group gap={6} wrap="wrap">
              <Badge variant="light" color="blue" size="sm">
                {getLanguageByKey("Ticket Destination") || widgetType || "Ticket Destination"}
              </Badge>
              {subtitle ? (
                <Badge variant="light" size="sm">
                  {subtitle}
                </Badge>
              ) : null}
            </Group>
          </Stack>
        </Group>
        <Box style={{ textAlign: "right" }}>
          <Text fz={36} fw={900} style={{ lineHeight: 1 }}>
            {fmt(summary.grandTotal)}
          </Text>
          <Text size="md" c="dimmed" fw={600}>
            {getLanguageByKey("Total")}
          </Text>
        </Box>
      </Group>

      <Stack gap="md" style={{ overflowY: "auto", flex: 1 }}>
        {workflowStats.length ? (
          workflowStats.map((workflowBlock) => {
            const color = STATE_COLORS[workflowBlock.workflow] || "blue";
            const workflowLabel = getLanguageByKey(workflowBlock.workflow) || workflowBlock.workflow;

            return (
              <Box key={workflowBlock.workflow}>
                <Group justify="space-between" align="center" mb={6}>
                  <Group gap="md" align="center">
                    <Badge variant="light" color={color} radius="sm">
                      {workflowLabel}
                    </Badge>
                  </Group>
                  <Box style={{ textAlign: "right" }}>
                    <Text size="sm" fw={700}>
                      {fmt(workflowBlock.total)}
                    </Text>
                  </Box>
                </Group>

                <Stack gap="sm" style={{ paddingLeft: 28 }}>
                  {workflowBlock.countries.length ? (
                    workflowBlock.countries.map((item, idx) => {
                      const share = summary.grandTotal > 0 ? Math.round((item.count / summary.grandTotal) * 100) : 0;
                      const percent = clampPercentage((item.count / workflowBlock.countries[0].count) * 100);

                      return (
                        <Box key={`${workflowBlock.workflow}-${item.country}-${idx}`}>
                          <Group justify="space-between" align="center" mb={4}>
                            <Text fw={500} size="sm">
                              {item.country}
                            </Text>
                            <Box style={{ textAlign: "right" }}>
                              {item.href ? (
                                <Link
                                  to={item.href}
                                  target="_blank"
                                  style={{
                                    color: "var(--crm-ui-kit-palette-link-primary)",
                                    textDecoration: "underline",
                                    fontSize: 14,
                                    fontWeight: 700,
                                    display: "inline-block",
                                  }}
                                  onMouseDown={(e) => e.stopPropagation()}
                                  onTouchStart={(e) => e.stopPropagation()}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {fmt(item.count)}
                                </Link>
                              ) : (
                                <Text size="sm" fw={700}>
                                  {fmt(item.count)}
                                </Text>
                              )}
                              <Text size="md" c="dimmed">
                                {share}%
                              </Text>
                            </Box>
                          </Group>
                          <Progress value={percent} size="md" radius="xl" color={color} />
                        </Box>
                      );
                    })
                  ) : (
                    <Text c="dimmed" size="sm">
                      {getLanguageByKey("No data")}
                    </Text>
                  )}
                </Stack>
              </Box>
            );
          })
        ) : (
          <Text c="dimmed" size="sm">
            {getLanguageByKey("No data")}
          </Text>
        )}
      </Stack>
    </Card>
  );
};
