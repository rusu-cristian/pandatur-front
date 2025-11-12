// Утилиты для Dashboard компонента

/**
 * Безопасно преобразует значение в массив
 */
export const safeArray = (a) => (Array.isArray(a) ? a : []);

/**
 * Извлекает ID из массива объектов
 */
export const pickIds = (arr) => safeArray(arr).map((x) => Number(x?.value ?? x)).filter((n) => Number.isFinite(n));

/**
 * Извлекает числовое значение из объекта по списку ключей
 */
export const pickNum = (obj, keys) => {
  for (const k of keys) {
    const v = obj?.[k];
    if (v !== undefined && v !== null && !Number.isNaN(Number(v))) return Number(v);
  }
  return 0;
};

/**
 * Нормализует by_platform данные (массив/объект → массив)
 */
export const mapPlatforms = (bp) => {
  if (!bp) return [];
  if (Array.isArray(bp)) return bp;
  if (typeof bp === "object") {
    return Object.entries(bp).map(([platform, stats]) => ({ platform, ...(stats || {}) }));
  }
  return [];
};

/**
 * Создает данные для calls/messages виджетов
 */
export const createCountsData = (obj) => ({
  incoming: pickNum(obj, ["incoming_calls_count", "incoming_messages_count", "incoming_count", "incoming", "in"]),
  outgoing: pickNum(obj, ["outgoing_calls_count", "outgoing_messages_count", "outgoing_count", "outgoing", "out"]),
  total: pickNum(obj, ["total_calls_count", "total_messages_count", "total_count", "total", "count", "all"]),
});

/**
 * Преобразует маркетинговую статистику в массив [{ channel, count }]
 */
const normalizeCategoricalStats = (stats) => {
  if (!stats) return [];
  if (Array.isArray(stats)) {
    return stats
      .map((item) => {
        if (!item) return null;
        if (typeof item === "object" && item.channel !== undefined) {
          return { channel: String(item.channel || "-"), count: pickNum(item, ["count", "value", "total"]) };
        }
        return null;
      })
      .filter(Boolean);
  }
  if (typeof stats === "object") {
    return Object.entries(stats).map(([channel, value]) => ({
      channel: channel || "-",
      count: Number.isFinite(Number(value)) ? Number(value) : 0,
    }));
  }
  return [];
};

/**
 * Преобразует маркетинговую статистику в массив [{ channel, count }]
 */
export const normalizeMarketingStats = (stats) => normalizeCategoricalStats(stats);

/**
 * Создает данные для ticket marketing stats виджетов
 */
export const createTicketMarketingStatsData = (obj) => {
  const statsSource = obj?.marketing_stats ?? obj?.marketingStats ?? obj;
  const stats = normalizeMarketingStats(statsSource);
  const totalMarketing = stats.reduce((sum, item) => sum + (Number.isFinite(item.count) ? item.count : 0), 0);

  const marketingStats = stats
    .map((item) => ({
      channel: item.channel || "-",
      count: Number.isFinite(item.count) ? item.count : 0,
      percentage: totalMarketing > 0 ? (item.count / totalMarketing) * 100 : 0,
    }))
    .sort((a, b) => b.count - a.count);

  return {
    marketingStats,
    totalMarketing,
  };
};

/**
 * Создает данные для ticket source stats виджетов
 */
export const createTicketSourceStatsData = (obj) => {
  const statsSource = obj?.sursa_lead_stats ?? obj?.sursaLeadStats ?? obj;
  const stats = normalizeCategoricalStats(statsSource);
  const totalSources = stats.reduce((sum, item) => sum + (Number.isFinite(item.count) ? item.count : 0), 0);

  const sourceStats = stats
    .map((item) => ({
      channel: item.channel || "-",
      count: Number.isFinite(item.count) ? item.count : 0,
      percentage: totalSources > 0 ? (item.count / totalSources) * 100 : 0,
    }))
    .sort((a, b) => b.count - a.count);

  return {
    sourceStats,
    totalSources,
  };
};

/**
 * Создает данные для ticket state виджетов
 */
export const createTicketStateData = (obj) => ({
  oldClientTickets: pickNum(obj, ["old_client_tickets_count", "old_client", "old"]),
  newClientTickets: pickNum(obj, ["new_client_tickets_count", "new_client", "new"]),
  totalTickets: pickNum(obj, ["total_tickets_count", "total_tickets", "total"]),
});

/**
 * Создает данные для tickets into work виджетов
 */
export const createTicketsIntoWorkData = (obj) => ({
  takenIntoWorkTickets: pickNum(obj, ["taken_into_work_tickets_count", "taken_into_work", "taken"]),
});

/**
 * Создает данные для system usage виджетов
 */
export const createSystemUsageData = (obj) => {
  const minutes = pickNum(obj, ["activity_minutes", "minutes", "min"]);
  const hours = pickNum(obj, ["activity_hours", "hours", "hrs"]);
  
  // Если есть минуты, конвертируем их в часы (с округлением до 2 знаков)
  const convertedHours = minutes ? Math.round((minutes / 60) * 100) / 100 : 0;
  
  return {
    activityMinutes: minutes,
    activityHours: hours || convertedHours, // Используем переданные часы или конвертированные из минут
  };
};

/**
 * Создает данные для ticket distribution виджетов
 */
export const createTicketDistributionData = (obj) => ({
  distributedTickets: pickNum(obj, ["distributed_tickets_count", "distributed_tickets", "distributed"]),
});

/**
 * Создает данные для closed tickets count виджетов
 */
export const createClosedTicketsCountData = (obj) => ({
  olderThan11Days: pickNum(obj, ["older_than_11_days_count", "older_than_11_days", "older"]),
  newerThan11Days: pickNum(obj, ["newer_than_11_days_count", "newer_than_11_days", "newer"]),
  totalClosedTickets: pickNum(obj, ["total_closed_tickets_count", "total_closed_tickets", "total"]),
});

/**
 * Создает данные для tickets by depart count виджетов
 */
export const createTicketsByDepartCountData = (obj) => ({
  lessThan14Days: pickNum(obj, ["less_than_14_days_count", "less_than_14_days", "less_14"]),
  between14And30Days: pickNum(obj, ["between_14_30_days_count", "between_14_30_days", "between_14_30"]),
  moreThan30Days: pickNum(obj, ["more_than_30_days_count", "more_than_30_days", "more_30"]),
  totalTickets: pickNum(obj, ["total_tickets_count", "total_tickets", "total"]) || 
    (pickNum(obj, ["less_than_14_days_count"]) + pickNum(obj, ["between_14_30_days_count"]) + pickNum(obj, ["more_than_30_days_count"])),
});

/**
 * Создает данные для ticket lifetime stats виджетов
 */
export const createTicketLifetimeStatsData = (obj) => ({
  totalLifetimeMinutes: pickNum(obj, ["total_lifetime_minutes", "total_lifetime", "total"]),
  averageLifetimeMinutes: pickNum(obj, ["average_lifetime_minutes", "average_lifetime", "average"]),
  ticketsProcessed: pickNum(obj, ["tickets_processed", "processed", "count"]),
  totalLifetimeHours: Math.round((pickNum(obj, ["total_lifetime_minutes", "total_lifetime", "total"]) || 0) / 60 * 10) / 10,
  averageLifetimeHours: Math.round((pickNum(obj, ["average_lifetime_minutes", "average_lifetime", "average"]) || 0) / 60 * 10) / 10,
});

/**
 * Создает данные для ticket rate виджетов
 */
export const createTicketRateData = (obj) => ({
  totalTransitions: pickNum(obj, ["total_transitions", "total", "count"]),
  directlyClosedCount: pickNum(obj, ["directly_closed_count", "directly_closed", "closed"]),
  directlyClosedPercentage: pickNum(obj, ["directly_closed_percentage", "closed_percentage", "closed_pct"]),
  workedOnCount: pickNum(obj, ["worked_on_count", "worked_on", "worked"]),
  workedOnPercentage: pickNum(obj, ["worked_on_percentage", "worked_percentage", "worked_pct"]),
});

/**
 * Создает данные для workflow from change виджетов
 */
export const createWorkflowFromChangeData = (obj) => ({
  luatInLucruChangedCount: pickNum(obj, ["luat_in_lucru_changed_count", "luat_in_lucru", "luat"]),
  ofertaTrimisaChangedCount: pickNum(obj, ["oferta_trimisa_changed_count", "oferta_trimisa", "oferta"]),
  totalChanges: pickNum(obj, ["total_changes", "total"]) ||
    (pickNum(obj, ["luat_in_lucru_changed_count"]) + pickNum(obj, ["oferta_trimisa_changed_count"])),
});

/**
 * Создает данные для workflow to change виджетов
 */
export const createWorkflowToChangeData = (obj) => ({
  contractIncheiatChangedCount: pickNum(obj, ["contract_incheiat_changed_count", "contract_incheiat", "contract"]),
});

/**
 * Создает данные для ticket creation виджетов
 */
export const createTicketCreationData = (obj) => ({
  ticketsCreatedCount: pickNum(obj, ["tickets_created_count", "tickets_created", "created"]),
});

/**
 * Создает данные для workflow from de prelucrat виджетов
 */
export const createWorkflowFromDePrelucratData = (obj) => {
  if (Array.isArray(obj)) {
    // Для general секции - это массив объектов
    const totalChanges = obj.reduce((sum, item) => sum + (pickNum(item, ["change_count", "count"]) || 0), 0);
    return {
      workflowChanges: obj.map(item => ({
        destination_workflow: item.destination_workflow || item.destination || "-",
        change_count: pickNum(item, ["change_count", "count"]) || 0,
      })),
      totalChanges,
    };
  } else {
    // Для других секций - это объект с workflow_changes массивом
    const workflowChanges = safeArray(obj.workflow_changes || obj.changes || []);
    const totalChanges = pickNum(obj, ["total_changes", "total"]) || 
      workflowChanges.reduce((sum, item) => sum + (pickNum(item, ["change_count", "count"]) || 0), 0);
    
    return {
      workflowChanges: workflowChanges.map(item => ({
        destination_workflow: item.destination_workflow || item.destination || "-",
        change_count: pickNum(item, ["change_count", "count"]) || 0,
      })),
      totalChanges,
    };
  }
};

/**
 * Создает данные для workflow duration виджетов
 */
export const createWorkflowDurationData = (obj) => ({
  totalDurationMinutes: pickNum(obj, ["total_duration_minutes", "total_duration", "duration"]) || 0,
  averageDurationMinutes: pickNum(obj, ["average_duration_minutes", "average_duration", "avg_duration"]) || 0,
  ticketsProcessed: pickNum(obj, ["tickets_processed", "tickets", "processed"]) || 0,
});

/**
 * Создает данные для ticket destination виджетов
 */
export const createTicketDestinationData = (obj) => {
  // Данные уже в нужном формате: { "Ofertă trimisă": { "Romania": 45, ... }, "Aprobat cu client": { ... } }
  return obj || {};
};

/**
 * Цвета фона для виджетов
 */
export const BG_COLORS = {
  general: "var(--crm-ui-kit-palette-background-primary)",     // белый
  by_user_group: "var(--crm-ui-kit-palette-background-primary)", // синий темнее (blue-300)
  by_user: "var(--crm-ui-kit-palette-background-primary)",       // светло-синий темнее (blue-100)
  by_group_title: "var(--crm-ui-kit-palette-background-primary)",// жёлтый (бледный)
  by_source: "#FFE8E8",     // красный (бледный)
};

/**
 * Создает виджет для General секции
 */
export const createGeneralWidget = (data, widgetType, getLanguageByKey) => {
  if (!data.general) return null;

  const baseWidget = {
    id: "general",
    subtitle: getLanguageByKey("All company"),
    bg: BG_COLORS.general,
  };

  switch (widgetType) {
    case "ticket_state": {
      const ts = createTicketStateData(data.general);
      return {
        ...baseWidget,
        type: "ticket_state",
        title: getLanguageByKey("Total tickets for the period"),
        ...ts,
      };
    }
    case "tickets_into_work": {
      const tiw = createTicketsIntoWorkData(data.general);
      return {
        ...baseWidget,
        type: "tickets_into_work",
        title: getLanguageByKey("Tickets taken into work"),
        ...tiw,
      };
    }
    case "system_usage": {
      const su = createSystemUsageData(data.general);
      return {
        ...baseWidget,
        type: "system_usage",
        title: getLanguageByKey("System usage"),
        ...su,
      };
    }
    case "ticket_distribution": {
      const td = createTicketDistributionData(data.general);
      return {
        ...baseWidget,
        type: "ticket_distribution",
        title: getLanguageByKey("Ticket Distribution"),
        ...td,
      };
    }
    case "closed_tickets_count": {
      const ctc = createClosedTicketsCountData(data.general);
      return {
        ...baseWidget,
        type: "closed_tickets_count",
        title: getLanguageByKey("Closed Tickets Count"),
        ...ctc,
      };
    }
    case "tickets_by_depart_count": {
      const tbdc = createTicketsByDepartCountData(data.general);
      return {
        ...baseWidget,
        type: "tickets_by_depart_count",
        title: getLanguageByKey("Tickets By Depart Count"),
        ...tbdc,
      };
    }
    case "ticket_lifetime_stats": {
      const tls = createTicketLifetimeStatsData(data.general);
      return {
        ...baseWidget,
        type: "ticket_lifetime_stats",
        title: getLanguageByKey("Ticket Lifetime Stats"),
        ...tls,
      };
    }
    case "ticket_rate": {
      const tr = createTicketRateData(data.general);
      return {
        ...baseWidget,
        type: "ticket_rate",
        title: getLanguageByKey("Ticket Rate"),
        ...tr,
      };
    }
    case "workflow_from_change": {
      const wfc = createWorkflowFromChangeData(data.general);
      return {
        ...baseWidget,
        type: "workflow_from_change",
        title: getLanguageByKey("Workflow From Change"),
        ...wfc,
      };
    }
    case "workflow_to_change": {
      const wtc = createWorkflowToChangeData(data.general);
      return {
        ...baseWidget,
        type: "workflow_to_change",
        title: getLanguageByKey("Workflow Change To"),
        ...wtc,
      };
    }
    case "ticket_creation": {
      const tc = createTicketCreationData(data.general);
      return {
        ...baseWidget,
        type: "ticket_creation",
        title: getLanguageByKey("Ticket Creation"),
        ...tc,
      };
    }
    case "workflow_from_de_prelucrat": {
      const wfdp = createWorkflowFromDePrelucratData(data.general);
      return {
        ...baseWidget,
        type: "workflow_from_de_prelucrat",
        title: getLanguageByKey("Workflow From De Prelucrat"),
        ...wfdp,
      };
    }
    case "workflow_duration": {
      const wd = createWorkflowDurationData(data.general);
      return {
        ...baseWidget,
        type: "workflow_duration",
        title: getLanguageByKey("Workflow Duration"),
        ...wd,
      };
    }
    case "ticket_destination": {
      const td = createTicketDestinationData(data.general);
      return {
        ...baseWidget,
        type: "ticket_destination",
        title: getLanguageByKey("Ticket Destination"),
        destinationData: td,
      };
    }
    case "ticket_marketing": {
      const tms = createTicketMarketingStatsData(data.general);
      return {
        ...baseWidget,
        type: "ticket_marketing",
        title: getLanguageByKey("Ticket Marketing Stats"),
        ...tms,
      };
    }
    case "ticket_source": {
      const tss = createTicketSourceStatsData(data.general);
      return {
        ...baseWidget,
        type: "ticket_source",
        title: getLanguageByKey("Ticket Source Stats"),
        ...tss,
      };
    }
    default: {
      const c = createCountsData(data.general);
      return {
        ...baseWidget,
        type: "general",
        title: widgetType === "messages" ? getLanguageByKey("Total messages for the period") : getLanguageByKey("Total calls for the period"),
        ...c,
      };
    }
  }
};
