import React, { useEffect, useState, useCallback, useMemo } from "react";
import { Responsive, WidthProvider } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import { Box } from "@mantine/core";
import { useZoomScale } from "@hooks";
import { TotalCard } from "./TotalCard";
import { TopUsersCard } from "./TopUsersCard";
import { TicketStateCard } from "./TicketStateCard";
import { TicketsIntoWorkCard } from "./TicketsIntoWorkCard";
import { SystemUsageCard } from "./SystemUsageCard";
import { TicketDistributionCard } from "./TicketDistributionCard";
import { ClosedTicketsCountCard } from "./ClosedTicketsCountCard";
import { TicketsByDepartCountCard } from "./TicketsByDepartCountCard";
import { TicketLifetimeStatsCard } from "./TicketLifetimeStatsCard";
import { TicketRateCard } from "./TicketRateCard";
import { WorkflowFromChangeCard } from "./WorkflowFromChangeCard";
import { WorkflowToChangeCard } from "./WorkflowToChangeCard";
import { TicketCreationCard } from "./TicketCreationCard";
import { WorkflowFromDePrelucratCard } from "./WorkflowFromDePrelucratCard";
import { WorkflowDurationCard } from "./WorkflowDurationCard";
import { TicketDestinationCard } from "./TicketDestinationCard";
import { TicketMarketingStatsCard } from "./TicketMarketingStatsCard";
import { TicketSourceStatsCard } from "./TicketSourceStatsCard";
import { TicketPlatformSourceStatsCard } from "./TicketPlatformSourceStatsCard";
import { CallsCard } from "./CallsCard";

const ResponsiveGridLayout = WidthProvider(Responsive);

const ROW_HEIGHT = 8;
const MARGIN = [8, 8];
const PADDING = [8, 8];

const COLS_MAX = 150;

// размеры виджетов
const DEFAULT_SIZE_ROWX = { w: 42, h: 25, minW: 6, maxW: 150, minH: 6 };

const WIDGET_SIZES = {
    top_users: { ...DEFAULT_SIZE_ROWX, w: 60, h: 28 },
};

// Получение размера виджета
const getWidgetSize = (w) => {
    const explicit = WIDGET_SIZES[w.type];
    if (explicit) return explicit;
    return DEFAULT_SIZE_ROWX;
};

// Простая последовательная раскладка виджетов
const buildLayoutByRows = (widgets = []) => {
    const items = [];
    let x = 0;
    let y = 0;
    const rowBaseH = DEFAULT_SIZE_ROWX.h;

    widgets.forEach((w) => {
        if (w.type === "separator") return;

        const size = getWidgetSize(w);

        // Если виджет не помещается в текущую строку, переходим на новую
        if (x + size.w > COLS_MAX) {
            x = 0;
            y += rowBaseH;
        }

        items.push({
            i: String(w.id),
            x,
            y,
            w: size.w,
            h: size.h,
            minW: size.minW,
            maxW: size.maxW,
            minH: size.minH,
            static: false,
            resizeHandles: ["e", "se"],
        });

        x += size.w;
    });

    return items;
};

const buildLayoutsAllBps = (widgets = []) => {
    const single = buildLayoutByRows(widgets);
    return { lg: single, md: single, sm: single, xs: single, xxs: single };
};

const pickAnyBpLayout = (layouts) =>
    layouts.lg || layouts.md || layouts.sm || layouts.xs || layouts.xxs || [];

const DashboardGrid = ({ widgets = [], dateRange, widgetType = "calls" }) => {
    // Определяем текущий zoom из CSS для компенсации позиционирования
    const transformScale = useZoomScale(1);

    const COLS = useMemo(
        () => ({ lg: COLS_MAX, md: COLS_MAX, sm: COLS_MAX, xs: COLS_MAX, xxs: COLS_MAX }),
        []
    );

    // Универсальная обертка для виджетов
    const renderWidgetWrapper = (children, key) => (
        <div key={key}>
            {children}
        </div>
    );

    const visibleWidgets = useMemo(
        () => (widgets || []).filter((w) => w.type !== "separator"),
        [widgets]
    );

    // Просто используем виджеты в том порядке, в котором они пришли
    const [layouts, setLayouts] = useState(() => buildLayoutsAllBps(visibleWidgets));

    useEffect(() => {
        setLayouts(buildLayoutsAllBps(visibleWidgets));
    }, [visibleWidgets]);

    const handleLayoutChange = useCallback((_curr, all) => setLayouts(all), []);
    const gridKey = useMemo(() => visibleWidgets.map((w) => w.id).join("|"), [visibleWidgets]);
    const currentLayout = pickAnyBpLayout(layouts);

    return (
        <Box style={{ width: "100%", height: "100%" }}>
            <ResponsiveGridLayout
                key={gridKey}
                className="layout"
                breakpoints={{ lg: 1400, md: 1100, sm: 900, xs: 600, xxs: 0 }}
                cols={COLS}
                layouts={layouts}
                rowHeight={ROW_HEIGHT}
                margin={MARGIN}
                containerPadding={PADDING}
                compactType="vertical"
                preventCollision={false}
                isResizable
                isDraggable={true}
                onLayoutChange={handleLayoutChange}
                draggableCancel=".mantine-Badge,.mantine-Progress,.mantine-Button,.mantine-Input,a,.dashboard-link,[role='link']"
                transformScale={transformScale}
                useCSSTransforms={true}
            >
                {visibleWidgets.map((w) => {
                    const li = currentLayout.find((l) => l.i === String(w.id));
                    const sizeInfo = li ? `${li.w} × ${li.h}` : null;

                    if (w.type === "top_users") {
                        return renderWidgetWrapper(
                            <TopUsersCard
                                title={w.title}
                                subtitle={w.subtitle}
                                rows={w.rows}
                                bg={w.bg}
                                widgetType={w.widgetType || widgetType}
                                width={w.w}
                                height={w.h}
                            />,
                            w.id
                        );
                    }

                    if (w.type === "ticket_state") {
                        return renderWidgetWrapper(
                            <Box style={{ height: "100%" }}>
                                <TicketStateCard
                                    title={w.title}
                                    subtitle={w.subtitle}
                                    oldClientTickets={Number.isFinite(w.oldClientTickets) ? w.oldClientTickets : 0}
                                    newClientTickets={Number.isFinite(w.newClientTickets) ? w.newClientTickets : 0}
                                    totalTickets={Number.isFinite(w.totalTickets) ? w.totalTickets : 0}
                                    dateRange={dateRange}
                                    sizeInfo={sizeInfo}
                                    bg={w.bg}
                                    widgetType={w.type}
                                />
                            </Box>,
                            w.id
                        );
                    }

                    if (w.type === "tickets_into_work") {
                        return renderWidgetWrapper(
                            <Box style={{ height: "100%" }}>
                                <TicketsIntoWorkCard
                                    title={w.title}
                                    subtitle={w.subtitle}
                                    takenIntoWorkTickets={Number.isFinite(w.takenIntoWorkTickets) ? w.takenIntoWorkTickets : 0}
                                    bg={w.bg}
                                    width={w.w}
                                    height={w.h}
                                    widgetType={w.type}
                                    userGroups={w.userGroups || []}
                                    userTechnicians={w.userTechnicians || []}
                                />
                            </Box>,
                            w.id
                        );
                    }

                    if (w.type === "system_usage") {
                        return renderWidgetWrapper(
                            <Box style={{ height: "100%" }}>
                                <SystemUsageCard
                                    title={w.title}
                                    subtitle={w.subtitle}
                                    activityMinutes={Number.isFinite(w.activityMinutes) ? w.activityMinutes : 0}
                                    activityHours={Number.isFinite(w.activityHours) ? w.activityHours : 0}
                                    bg={w.bg}
                                    width={w.w}
                                    height={w.h}
                                    widgetType={w.type}
                                    userGroups={w.userGroups || []}
                                    userTechnicians={w.userTechnicians || []}
                                />
                            </Box>,
                            w.id
                        );
                    }

                    if (w.type === "ticket_distribution") {
                        return renderWidgetWrapper(
                            <Box style={{ height: "100%" }}>
                                <TicketDistributionCard
                                    title={w.title}
                                    subtitle={w.subtitle}
                                    distributedTickets={Number.isFinite(w.distributedTickets) ? w.distributedTickets : 0}
                                    bg={w.bg}
                                    width={w.w}
                                    height={w.h}
                                    widgetType={w.type}
                                    userGroups={w.userGroups || []}
                                    userTechnicians={w.userTechnicians || []}
                                />
                            </Box>,
                            w.id
                        );
                    }

                    if (w.type === "closed_tickets_count") {
                        return renderWidgetWrapper(
                            <Box style={{ height: "100%" }}>
                                <ClosedTicketsCountCard
                                    title={w.title}
                                    subtitle={w.subtitle}
                                    olderThan11Days={Number.isFinite(w.olderThan11Days) ? w.olderThan11Days : 0}
                                    newerThan11Days={Number.isFinite(w.newerThan11Days) ? w.newerThan11Days : 0}
                                    totalClosedTickets={Number.isFinite(w.totalClosedTickets) ? w.totalClosedTickets : 0}
                                    bg={w.bg}
                                    width={w.w}
                                    height={w.h}
                                    widgetType={w.type}
                                    userGroups={w.userGroups || []}
                                    userTechnicians={w.userTechnicians || []}
                                />
                            </Box>,
                            w.id
                        );
                    }

                    if (w.type === "tickets_by_depart_count") {
                        return renderWidgetWrapper(
                            <Box style={{ height: "100%" }}>
                                <TicketsByDepartCountCard
                                    title={w.title}
                                    subtitle={w.subtitle}
                                    lessThan14Days={Number.isFinite(w.lessThan14Days) ? w.lessThan14Days : 0}
                                    between14And30Days={Number.isFinite(w.between14And30Days) ? w.between14And30Days : 0}
                                    moreThan30Days={Number.isFinite(w.moreThan30Days) ? w.moreThan30Days : 0}
                                    totalTickets={Number.isFinite(w.totalTickets) ? w.totalTickets : 0}
                                    bg={w.bg}
                                    width={w.w}
                                    height={w.h}
                                    widgetType={w.type}
                                    userGroups={w.userGroups || []}
                                    userTechnicians={w.userTechnicians || []}
                                />
                            </Box>,
                            w.id
                        );
                    }

                    if (w.type === "ticket_lifetime_stats") {
                        return renderWidgetWrapper(
                            <Box style={{ height: "100%" }}>
                                <TicketLifetimeStatsCard
                                    title={w.title}
                                    subtitle={w.subtitle}
                                    totalLifetimeMinutes={Number.isFinite(w.totalLifetimeMinutes) ? w.totalLifetimeMinutes : 0}
                                    averageLifetimeMinutes={Number.isFinite(w.averageLifetimeMinutes) ? w.averageLifetimeMinutes : 0}
                                    ticketsProcessed={Number.isFinite(w.ticketsProcessed) ? w.ticketsProcessed : 0}
                                    totalLifetimeHours={Number.isFinite(w.totalLifetimeHours) ? w.totalLifetimeHours : 0}
                                    averageLifetimeHours={Number.isFinite(w.averageLifetimeHours) ? w.averageLifetimeHours : 0}
                                    bg={w.bg}
                                    width={w.w}
                                    height={w.h}
                                    widgetType={w.type}
                                    userGroups={w.userGroups || []}
                                    userTechnicians={w.userTechnicians || []}
                                />
                            </Box>,
                            w.id
                        );
                    }

                    if (w.type === "ticket_rate") {
                        return renderWidgetWrapper(
                            <Box style={{ height: "100%" }}>
                                <TicketRateCard
                                    title={w.title}
                                    subtitle={w.subtitle}
                                    totalTransitions={Number.isFinite(w.totalTransitions) ? w.totalTransitions : 0}
                                    directlyClosedCount={Number.isFinite(w.directlyClosedCount) ? w.directlyClosedCount : 0}
                                    directlyClosedPercentage={Number.isFinite(w.directlyClosedPercentage) ? w.directlyClosedPercentage : 0}
                                    workedOnCount={Number.isFinite(w.workedOnCount) ? w.workedOnCount : 0}
                                    workedOnPercentage={Number.isFinite(w.workedOnPercentage) ? w.workedOnPercentage : 0}
                                    bg={w.bg}
                                    width={w.w}
                                    height={w.h}
                                    widgetType={w.type}
                                    userGroups={w.userGroups || []}
                                    userTechnicians={w.userTechnicians || []}
                                />
                            </Box>,
                            w.id
                        );
                    }

                    if (w.type === "workflow_from_change") {
                        return renderWidgetWrapper(
                            <Box style={{ height: "100%" }}>
                                <WorkflowFromChangeCard
                                    title={w.title}
                                    subtitle={w.subtitle}
                                    luatInLucruChangedCount={Number.isFinite(w.luatInLucruChangedCount) ? w.luatInLucruChangedCount : 0}
                                    ofertaTrimisaChangedCount={Number.isFinite(w.ofertaTrimisaChangedCount) ? w.ofertaTrimisaChangedCount : 0}
                                    totalChanges={Number.isFinite(w.totalChanges) ? w.totalChanges : 0}
                                    bg={w.bg}
                                    width={w.w}
                                    height={w.h}
                                    widgetType={w.type}
                                    userGroups={w.userGroups || []}
                                    userTechnicians={w.userTechnicians || []}
                                />
                            </Box>,
                            w.id
                        );
                    }

                    if (w.type === "workflow_to_change") {
                        return renderWidgetWrapper(
                            <Box style={{ height: "100%" }}>
                                <WorkflowToChangeCard
                                    title={w.title}
                                    subtitle={w.subtitle}
                                    contractIncheiatChangedCount={Number.isFinite(w.contractIncheiatChangedCount) ? w.contractIncheiatChangedCount : 0}
                                    bg={w.bg}
                                    width={w.w}
                                    height={w.h}
                                    widgetType={w.type}
                                    userGroups={w.userGroups || []}
                                    userTechnicians={w.userTechnicians || []}
                                />
                            </Box>,
                            w.id
                        );
                    }

                    if (w.type === "ticket_creation") {
                        return renderWidgetWrapper(
                            <Box style={{ height: "100%" }}>
                                <TicketCreationCard
                                    title={w.title}
                                    subtitle={w.subtitle}
                                    ticketsCreatedCount={Number.isFinite(w.ticketsCreatedCount) ? w.ticketsCreatedCount : 0}
                                    bg={w.bg}
                                    width={w.w}
                                    height={w.h}
                                    widgetType={w.type}
                                    userGroups={w.userGroups || []}
                                    userTechnicians={w.userTechnicians || []}
                                />
                            </Box>,
                            w.id
                        );
                    }

                    if (w.type === "workflow_from_de_prelucrat") {
                        return renderWidgetWrapper(
                            <Box style={{ height: "100%" }}>
                                <WorkflowFromDePrelucratCard
                                    title={w.title}
                                    subtitle={w.subtitle}
                                    workflowChanges={w.workflowChanges || []}
                                    totalChanges={Number.isFinite(w.totalChanges) ? w.totalChanges : 0}
                                    bg={w.bg}
                                    width={w.w}
                                    height={w.h}
                                    widgetType={w.type}
                                    userGroups={w.userGroups || []}
                                    userTechnicians={w.userTechnicians || []}
                                />
                            </Box>,
                            w.id
                        );
                    }

                    if (w.type === "workflow_duration") {
                        return renderWidgetWrapper(
                            <Box style={{ height: "100%" }}>
                                <WorkflowDurationCard
                                    title={w.title}
                                    subtitle={w.subtitle}
                                    durationBuckets={w.durationBuckets || []}
                                    totalTickets={Number.isFinite(w.totalTickets) ? w.totalTickets : 0}
                                    totalDurationMinutes={Number.isFinite(w.totalDurationMinutes) ? w.totalDurationMinutes : 0}
                                    averageDurationMinutes={Number.isFinite(w.averageDurationMinutes) ? w.averageDurationMinutes : 0}
                                    ticketsProcessed={Number.isFinite(w.ticketsProcessed) ? w.ticketsProcessed : 0}
                                    bg={w.bg}
                                    width={w.w}
                                    height={w.h}
                                    widgetType={w.type}
                                    userGroups={w.userGroups || []}
                                    userTechnicians={w.userTechnicians || []}
                                />
                            </Box>,
                            w.id
                        );
                    }

                    if (w.type === "ticket_destination") {
                        return renderWidgetWrapper(
                            <Box style={{ height: "100%" }}>
                                <TicketDestinationCard
                                    title={w.title}
                                    subtitle={w.subtitle}
                                    destinationData={w.destinationData || {}}
                                    bg={w.bg}
                                    width={w.w}
                                    height={w.h}
                                    widgetType={w.type}
                                />
                            </Box>,
                            w.id
                        );
                    }

                    if (w.type === "ticket_marketing") {
                        return renderWidgetWrapper(
                            <Box style={{ height: "100%" }}>
                                <TicketMarketingStatsCard
                                    title={w.title}
                                    subtitle={w.subtitle}
                                    marketingStats={w.marketingStats || []}
                                    totalMarketing={Number.isFinite(w.totalMarketing) ? w.totalMarketing : undefined}
                                    bg={w.bg}
                                    widgetType={w.type}
                                    userGroups={w.userGroups || []}
                                    userTechnicians={w.userTechnicians || []}
                                />
                            </Box>,
                            w.id
                        );
                    }

                    if (w.type === "ticket_source") {
                        return renderWidgetWrapper(
                            <Box style={{ height: "100%" }}>
                                <TicketSourceStatsCard
                                    title={w.title}
                                    subtitle={w.subtitle}
                                    sourceStats={w.sourceStats || []}
                                    totalSources={Number.isFinite(w.totalSources) ? w.totalSources : undefined}
                                    bg={w.bg}
                                    widgetType={w.type}
                                    userGroups={w.userGroups || []}
                                    userTechnicians={w.userTechnicians || []}
                                />
                            </Box>,
                            w.id
                        );
                    }

                    if (w.type === "ticket_platform_source") {
                        return renderWidgetWrapper(
                            <Box style={{ height: "100%" }}>
                                <TicketPlatformSourceStatsCard
                                    title={w.title}
                                    subtitle={w.subtitle}
                                    platformSourceStats={w.platformSourceStats || []}
                                    totalPlatformSources={
                                        Number.isFinite(w.totalPlatformSources) ? w.totalPlatformSources : undefined
                                    }
                                    bg={w.bg}
                                    widgetType={w.type}
                                    userGroups={w.userGroups || []}
                                    userTechnicians={w.userTechnicians || []}
                                />
                            </Box>,
                            w.id
                        );
                    }

                    // Source widgets (Platform, Source) - используют CallsCard для звонков, TotalCard для остального
                    if (w.type === "source") {
                        const currentWidgetType = w.widgetType || widgetType;
                        if (currentWidgetType === "calls") {
                            return renderWidgetWrapper(
                                <Box style={{ height: "100%" }}>
                                    <CallsCard
                                        title={w.title}
                                        subtitle={w.subtitle}
                                        totalAll={Number.isFinite(w.total) ? w.total : 0}
                                        totalIncoming={Number.isFinite(w.incoming) ? w.incoming : 0}
                                        totalOutgoing={Number.isFinite(w.outgoing) ? w.outgoing : 0}
                                        dateRange={dateRange}
                                        sizeInfo={sizeInfo}
                                        bg={w.bg}
                                        widgetType={currentWidgetType}
                                    />
                                </Box>,
                                w.id
                            );
                        }
                        return renderWidgetWrapper(
                            <Box style={{ height: "100%" }}>
                                <TotalCard
                                    title={w.title}
                                    subtitle={w.subtitle}
                                    totalAll={Number.isFinite(w.total) ? w.total : 0}
                                    totalIncoming={Number.isFinite(w.incoming) ? w.incoming : 0}
                                    totalOutgoing={Number.isFinite(w.outgoing) ? w.outgoing : 0}
                                    dateRange={dateRange}
                                    sizeInfo={sizeInfo}
                                    bg={w.bg}
                                    widgetType={currentWidgetType}
                                />
                            </Box>,
                            w.id
                        );
                    }

                    // Виджеты звонков (general, group) - используют CallsCard
                    const currentWidgetType = w.widgetType || widgetType;
                    if (currentWidgetType === "calls") {
                        return renderWidgetWrapper(
                            <Box style={{ height: "100%" }}>
                                <CallsCard
                                    title={w.title}
                                    subtitle={w.subtitle}
                                    totalAll={Number.isFinite(w.total) ? w.total : 0}
                                    totalIncoming={Number.isFinite(w.incoming) ? w.incoming : 0}
                                    totalOutgoing={Number.isFinite(w.outgoing) ? w.outgoing : 0}
                                    dateRange={dateRange}
                                    sizeInfo={sizeInfo}
                                    bg={w.bg}
                                    widgetType={currentWidgetType}
                                />
                            </Box>,
                            w.id
                        );
                    }

                    // Остальные виджеты используют TotalCard
                    return renderWidgetWrapper(
                        <Box style={{ height: "100%" }}>
                                <TotalCard
                                title={w.title}
                                subtitle={w.subtitle}
                                totalAll={Number.isFinite(w.total) ? w.total : 0}
                                totalIncoming={Number.isFinite(w.incoming) ? w.incoming : 0}
                                totalOutgoing={Number.isFinite(w.outgoing) ? w.outgoing : 0}
                                dateRange={dateRange}
                                sizeInfo={sizeInfo}
                                bg={w.bg}
                                    widgetType={currentWidgetType}
                            />
                        </Box>,
                        w.id
                    );
                })}
            </ResponsiveGridLayout>
        </Box>
    );
};

export default DashboardGrid;
