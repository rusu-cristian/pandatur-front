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

  const countryMap = new Map();
  const stateOrder = Object.keys(destinationData || {});

  stateOrder.forEach((stateKey) => {
    Object.entries(destinationData?.[stateKey] || {}).forEach(([country, rawValue]) => {
      const { count, href } = parseDestinationValue(rawValue);
      if (!count) return;

      if (!countryMap.has(country)) {
        countryMap.set(country, {
          country,
          details: [],
          total: 0,
          totalHref: undefined,
        });
      }

      const entry = countryMap.get(country);
      entry.details.push({
        state: stateKey,
        count,
        href,
      });
      if (!entry.totalHref && href) {
        entry.totalHref = href;
      }
      entry.total += count;
    });
  });

  const normalized = Array.from(countryMap.values())
    .map((item) => ({
      ...item,
      details: item.details.filter((detail) => detail.count > 0),
    }))
    .filter((item) => item.total > 0);

  normalized.sort((a, b) => b.total - a.total);

  return normalized.slice(0, limit);
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
}) => {
  const normalizedStats = useMemo(() => mapDestinationItems(destinationData, limit), [destinationData, limit]);

  const totalValue = useMemo(
    () => normalizedStats.reduce((sum, item) => sum + (Number.isFinite(item.total) ? item.total : 0), 0),
    [normalizedStats]
  );

  const maxCount = useMemo(
    () => Math.max(1, ...normalizedStats.map((item) => (Number.isFinite(item.total) ? item.total : 0))),
    [normalizedStats]
  );

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
            <Text size="xs" c="dimmed" fw={700} tt="uppercase" style={{ letterSpacing: 0.8 }}>
              {title || getLanguageByKey("Ticket Destination")}
            </Text>
            {subtitle ? (
              <Badge variant="light" size="sm">
                {subtitle}
              </Badge>
            ) : null}
          </Stack>
        </Group>
        <Box style={{ textAlign: "right" }}>
          <Text fz={36} fw={900} style={{ lineHeight: 1 }}>
            {fmt(totalValue)}
          </Text>
          <Text size="xs" c="dimmed" fw={600}>
            {getLanguageByKey("Total")}
          </Text>
        </Box>
      </Group>

      <Stack gap="sm" style={{ overflowY: "auto", flex: 1 }}>
        {normalizedStats.length ? (
          normalizedStats.map((item, index) => {
            const totalCount = Number.isFinite(item.total) ? item.total : 0;
            const percent = clampPercentage((totalCount / maxCount) * 100);
            const share = totalValue > 0 ? Math.round((totalCount / totalValue) * 100) : 0;
            const countryLabel = item.country || getLanguageByKey("No source");

            return (
              <Box key={`${item.country}-${index}`}>
                <Group justify="space-between" align="center" mb={6}>
                  <Group gap="xs" align="center">
                    <Badge variant="light" radius="sm">
                      {index + 1}
                    </Badge>
                    <Text fw={600} size="sm">
                      {countryLabel}
                    </Text>
                  </Group>
                  <Box style={{ textAlign: "right" }}>
                    {item.totalHref ? (
                      <Link
                        to={item.totalHref}
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
                        {fmt(totalCount)}
                      </Link>
                    ) : (
                      <Text size="sm" fw={700}>
                        {fmt(totalCount)}
                      </Text>
                    )}
                    <Text size="xs" c="dimmed">
                      {share}%
                    </Text>
                  </Box>
                </Group>

                {item.details.length ? (
                  <Group gap="xs" justify="flex-start" wrap="wrap" mb={6}>
                    {item.details.map((detail) => {
                      const stateLabel = getLanguageByKey(detail.state) || detail.state;
                      const badgeColor = STATE_COLORS[detail.state] || "blue";
                      const badgeContent = (
                        <Badge
                          size="xs"
                          variant="light"
                          color={badgeColor}
                          style={{ cursor: detail.href ? "pointer" : "default" }}
                        >
                          {stateLabel}: {fmt(detail.count)}
                        </Badge>
                      );

                      return detail.href ? (
                        <Link
                          target="_blank"
                          key={`${item.country}-${detail.state}`}
                          to={detail.href}
                          style={{ textDecoration: "none" }}
                          onMouseDown={(e) => e.stopPropagation()}
                          onTouchStart={(e) => e.stopPropagation()}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {badgeContent}
                        </Link>
                      ) : (
                        <Box key={`${item.country}-${detail.state}`}>{badgeContent}</Box>
                      );
                    })}
                  </Group>
                ) : null}

                <Progress value={percent} size="md" radius="xl" color="blue" />
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
