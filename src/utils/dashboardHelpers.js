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

const getCategoricalChannelName = (value, fallback) => {
  if (!value || typeof value !== "object") {
    return String(fallback ?? "-");
  }

  const keys = ["channel", "marketing", "name", "title", "label", "source", "platform", "category"];
  for (const key of keys) {
    const candidate = value[key];
    if (candidate !== undefined && candidate !== null && String(candidate).trim()) {
      return String(candidate).trim();
    }
  }

  return String(fallback ?? "-");
};

const extractHref = (value) => {
  if (!value || typeof value !== "object") return undefined;
  const linkKeys = ["href", "url", "link"];
  for (const key of linkKeys) {
    const candidate = value[key];
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate.trim();
    }
  }
  return undefined;
};

const extractPercentage = (value) => {
  if (!value || typeof value !== "object") return undefined;
  const percentageKeys = ["percentage", "percent"];
  for (const key of percentageKeys) {
    if (Object.prototype.hasOwnProperty.call(value, key)) {
      const candidate = Number(value[key]);
      if (Number.isFinite(candidate)) return candidate;
      return undefined;
    }
  }
  return undefined;
};

/**
 * Преобразует маркетинговую статистику в массив [{ channel, count }]
 */
const normalizeCategoricalStats = (stats) => {
  if (!stats) return [];
  if (Array.isArray(stats)) {
    return stats
      .map((item) => {
        if (!item) return null;
        if (typeof item === "object") {
          const channel = getCategoricalChannelName(item, "-");
          const count = pickNum(item, ["count", "value", "total"]);
          const percentage = extractPercentage(item);
          const href = extractHref(item);

          return {
            channel,
            count: Number.isFinite(count) ? count : 0,
            ...(percentage !== undefined ? { percentage } : {}),
            href,
          };
        }
        if (typeof item === "string" || typeof item === "number") {
          return {
            channel: String(item),
            count: typeof item === "number" && Number.isFinite(item) ? item : 0,
          };
        }
        return null;
      })
      .filter(Boolean);
  }
  if (typeof stats === "object") {
    return Object.entries(stats).map(([channel, value]) => {
      if (value && typeof value === "object") {
        const normalizedChannel = getCategoricalChannelName(value, channel);
        const count = pickNum(value, ["count", "value", "total"]);
        const percentage = extractPercentage(value);
        const href = extractHref(value);

        return {
          channel: normalizedChannel,
          count: Number.isFinite(count) ? count : 0,
          ...(percentage !== undefined ? { percentage } : {}),
          href,
        };
      }

      const numericValue = Number(value);

      return {
        channel: channel || "-",
        count: Number.isFinite(numericValue) ? numericValue : 0,
      };
    });
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
  const statsSource = obj?.marketing_stats ?? obj?.marketingStats ?? obj?.stats ?? obj;
  const stats = normalizeMarketingStats(statsSource);
  const totalMarketing = stats.reduce(
    (sum, item) => sum + (Number.isFinite(item.count) ? item.count : 0),
    0
  );

  const marketingStats = stats
    .map((item) => {
      const count = Number.isFinite(item.count) ? item.count : 0;
      return {
        channel: item.channel || "-",
        count,
        percentage: totalMarketing > 0 && count > 0 ? (count / totalMarketing) * 100 : 0,
        href: item.href, // ✅ сохраняем href из normalizeCategoricalStats
      };
    })
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
  const statsSource = obj?.sursa_lead_stats ?? obj?.sursaLeadStats ?? obj?.stats ?? obj;
  const stats = normalizeCategoricalStats(statsSource);
  const totalSources = stats.reduce((sum, item) => sum + (Number.isFinite(item.count) ? item.count : 0), 0);

  const sourceStats = stats
    .map((item) => {
      const count = Number.isFinite(item.count) ? item.count : 0;
      return {
        channel: item.channel || "-",
        count,
        percentage: totalSources > 0 && count > 0 ? (count / totalSources) * 100 : 0,
        href: item.href, // ✅ сохраняем href из normalizeCategoricalStats
      };
    })
    .sort((a, b) => b.count - a.count);

  return {
    sourceStats,
    totalSources,
  };
};

/**
 * Создает данные для ticket platform source stats виджетов
 */
export const createTicketPlatformSourceStatsData = (obj) => {
  const statsSource = obj?.platform_source_stats ?? obj?.platformSourceStats ?? obj?.stats ?? obj;
  const stats = normalizeCategoricalStats(statsSource);
  const totalPlatformSources = stats.reduce((sum, item) => sum + (Number.isFinite(item.count) ? item.count : 0), 0);

  const platformSourceStats = stats
    .map((item) => {
      const count = Number.isFinite(item.count) ? item.count : 0;
      return {
        channel: item.channel || "-",
        count,
        percentage: totalPlatformSources > 0 && count > 0 ? (count / totalPlatformSources) * 100 : 0,
        href: item.href, // ✅ сохраняем href из normalizeCategoricalStats
      };
    })
    .sort((a, b) => b.count - a.count);

  return {
    platformSourceStats,
    totalPlatformSources,
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
export const createClosedTicketsCountData = (obj) => {
  // Проверяем, является ли это объектом со stats (новый формат)
  // где stats содержит older_than_11_days и newer_than_11_days с time_range и count
  const totalClosedTickets = pickNum(obj, ["total_closed_tickets_count", "total_closed_tickets", "total"]) || 0;
  const statsSource = obj?.stats ?? obj;

  // Если это объект, где есть stats с временными диапазонами
  if (statsSource && typeof statsSource === "object" && !Array.isArray(statsSource)) {
    const olderThan11DaysObj = statsSource.older_than_11_days;
    const newerThan11DaysObj = statsSource.newer_than_11_days;

    const olderThan11Days = olderThan11DaysObj && typeof olderThan11DaysObj === "object"
      ? (pickNum(olderThan11DaysObj, ["count", "value", "total"]) || 0)
      : 0;
    
    const newerThan11Days = newerThan11DaysObj && typeof newerThan11DaysObj === "object"
      ? (pickNum(newerThan11DaysObj, ["count", "value", "total"]) || 0)
      : 0;

    return {
      olderThan11Days,
      newerThan11Days,
      totalClosedTickets: totalClosedTickets || (olderThan11Days + newerThan11Days),
    };
  }

  // Старый формат или прямой доступ
  const olderThan11Days = pickNum(obj, ["older_than_11_days_count", "older_than_11_days", "older"]) || 0;
  const newerThan11Days = pickNum(obj, ["newer_than_11_days_count", "newer_than_11_days", "newer"]) || 0;
  return {
    olderThan11Days,
    newerThan11Days,
    totalClosedTickets: totalClosedTickets || (olderThan11Days + newerThan11Days),
  };
};

/**
 * Создает данные для tickets by depart count виджетов
 */
export const createTicketsByDepartCountData = (obj) => {
  // Проверяем, является ли это объектом со stats (новый формат)
  // где stats содержит less_than_14_days, between_14_30_days, more_than_30_days с time_range и count
  const statsSource = obj?.stats ?? obj;

  // Если это объект, где есть stats с временными диапазонами
  if (statsSource && typeof statsSource === "object" && !Array.isArray(statsSource)) {
    const lessThan14DaysObj = statsSource.less_than_14_days;
    const between14And30DaysObj = statsSource.between_14_30_days;
    const moreThan30DaysObj = statsSource.more_than_30_days;

    const lessThan14Days = lessThan14DaysObj && typeof lessThan14DaysObj === "object"
      ? (pickNum(lessThan14DaysObj, ["count", "value", "total"]) || 0)
      : 0;
    
    const between14And30Days = between14And30DaysObj && typeof between14And30DaysObj === "object"
      ? (pickNum(between14And30DaysObj, ["count", "value", "total"]) || 0)
      : 0;
    
    const moreThan30Days = moreThan30DaysObj && typeof moreThan30DaysObj === "object"
      ? (pickNum(moreThan30DaysObj, ["count", "value", "total"]) || 0)
      : 0;

    return {
      lessThan14Days,
      between14And30Days,
      moreThan30Days,
      totalTickets: lessThan14Days + between14And30Days + moreThan30Days,
    };
  }

  // Старый формат или прямой доступ
  const lessThan14Days = pickNum(obj, ["less_than_14_days_count", "less_than_14_days", "less_14"]) || 0;
  const between14And30Days = pickNum(obj, ["between_14_30_days_count", "between_14_30_days", "between_14_30"]) || 0;
  const moreThan30Days = pickNum(obj, ["more_than_30_days_count", "more_than_30_days", "more_30"]) || 0;
  return {
    lessThan14Days,
    between14And30Days,
    moreThan30Days,
    totalTickets: pickNum(obj, ["total_tickets_count", "total_tickets", "total"]) ||
      (lessThan14Days + between14And30Days + moreThan30Days),
  };
};

/**
 * Создает данные для ticket lifetime stats виджетов
 */
export const createTicketLifetimeStatsData = (obj) => {
  // Проверяем, является ли это объектом со stats (новый формат)
  // где stats содержит lifetime с total_minutes, average_minutes, count
  const ticketsProcessed = pickNum(obj, ["tickets_processed", "processed", "count"]) || 0;
  const statsSource = obj?.stats ?? obj;

  // Если это объект, где есть stats с lifetime
  if (statsSource && typeof statsSource === "object" && !Array.isArray(statsSource)) {
    const lifetimeObj = statsSource.lifetime;

    if (lifetimeObj && typeof lifetimeObj === "object") {
      const totalMinutes = pickNum(lifetimeObj, ["total_minutes", "total", "value"]) || 0;
      const averageMinutes = pickNum(lifetimeObj, ["average_minutes", "average", "avg"]) || 0;
      const count = pickNum(lifetimeObj, ["count", "tickets_processed"]) || ticketsProcessed || 0;

      return {
        totalLifetimeMinutes: totalMinutes,
        averageLifetimeMinutes: averageMinutes,
        ticketsProcessed: count || ticketsProcessed,
        totalLifetimeHours: Math.round((totalMinutes / 60) * 10) / 10,
        averageLifetimeHours: Math.round((averageMinutes / 60) * 10) / 10,
      };
    }
  }

  // Старый формат или прямой доступ
  const totalMinutes = pickNum(obj, ["total_lifetime_minutes", "total_lifetime", "total"]) || 0;
  const averageMinutes = pickNum(obj, ["average_lifetime_minutes", "average_lifetime", "average"]) || 0;
  return {
    totalLifetimeMinutes: totalMinutes,
    averageLifetimeMinutes: averageMinutes,
    ticketsProcessed: ticketsProcessed || pickNum(obj, ["tickets_processed", "processed", "count"]) || 0,
    totalLifetimeHours: Math.round((totalMinutes / 60) * 10) / 10,
    averageLifetimeHours: Math.round((averageMinutes / 60) * 10) / 10,
  };
};

/**
 * Создает данные для ticket rate виджетов
 */
export const createTicketRateData = (obj) => {
  // Проверяем, является ли это объектом со stats (новый формат)
  // где stats содержит directly_closed и worked_on с count и percentage
  const statsSource = obj?.stats ?? obj;
  const totalTransitions = pickNum(obj, ["total_transitions", "total", "count"]) || 0;

  // Если это объект, где есть stats с directly_closed и worked_on
  if (statsSource && typeof statsSource === "object" && !Array.isArray(statsSource)) {
    const directlyClosedObj = statsSource.directly_closed;
    const workedOnObj = statsSource.worked_on;

    const directlyClosedCount = directlyClosedObj && typeof directlyClosedObj === "object"
      ? (pickNum(directlyClosedObj, ["count", "value", "total"]) || 0)
      : 0;
    
    const directlyClosedPercentage = directlyClosedObj && typeof directlyClosedObj === "object"
      ? (pickNum(directlyClosedObj, ["percentage", "pct", "percent"]) || 0)
      : 0;

    const workedOnCount = workedOnObj && typeof workedOnObj === "object"
      ? (pickNum(workedOnObj, ["count", "value", "total"]) || 0)
      : 0;
    
    const workedOnPercentage = workedOnObj && typeof workedOnObj === "object"
      ? (pickNum(workedOnObj, ["percentage", "pct", "percent"]) || 0)
      : 0;

    return {
      totalTransitions: totalTransitions || (directlyClosedCount + workedOnCount),
      directlyClosedCount,
      directlyClosedPercentage,
      workedOnCount,
      workedOnPercentage,
    };
  }

  // Старый формат или прямой доступ
  return {
    totalTransitions: totalTransitions || pickNum(obj, ["total_transitions", "total", "count"]) || 0,
    directlyClosedCount: pickNum(obj, ["directly_closed_count", "directly_closed", "closed"]) || 0,
    directlyClosedPercentage: pickNum(obj, ["directly_closed_percentage", "closed_percentage", "closed_pct"]) || 0,
    workedOnCount: pickNum(obj, ["worked_on_count", "worked_on", "worked"]) || 0,
    workedOnPercentage: pickNum(obj, ["worked_on_percentage", "worked_percentage", "worked_pct"]) || 0,
  };
};

/**
 * Создает данные для workflow from change виджетов
 */
export const createWorkflowFromChangeData = (obj) => {
  // Проверяем, является ли это объектом со stats (новый формат)
  // где ключи - это названия workflow (например, "Luat în lucru", "Ofertă trimisă")
  const statsSource = obj?.stats ?? obj;

  // Если это объект, где ключи - это названия workflow, а значения - объекты с source_workflow и count
  if (statsSource && typeof statsSource === "object" && !Array.isArray(statsSource)) {
    const luatInLucruObj = statsSource["Luat în lucru"] || statsSource["luat_in_lucru"] || statsSource["Luat \u00een lucru"];
    const ofertaTrimisaObj = statsSource["Ofertă trimisă"] || statsSource["oferta_trimisa"] || statsSource["Ofert\u0103 trimis\u0103"];

    const luatCount = luatInLucruObj && typeof luatInLucruObj === "object" 
      ? (pickNum(luatInLucruObj, ["count", "value", "total"]) || 0)
      : 0;
    
    const ofertaCount = ofertaTrimisaObj && typeof ofertaTrimisaObj === "object"
      ? (pickNum(ofertaTrimisaObj, ["count", "value", "total"]) || 0)
      : 0;

    return {
      luatInLucruChangedCount: luatCount,
      ofertaTrimisaChangedCount: ofertaCount,
      totalChanges: luatCount + ofertaCount,
    };
  }

  // Старый формат или прямой доступ
  return {
    luatInLucruChangedCount: pickNum(obj, ["luat_in_lucru_changed_count", "luat_in_lucru", "luat"]) || 0,
    ofertaTrimisaChangedCount: pickNum(obj, ["oferta_trimisa_changed_count", "oferta_trimisa", "oferta"]) || 0,
    totalChanges: pickNum(obj, ["total_changes", "total"]) ||
      (pickNum(obj, ["luat_in_lucru_changed_count"]) + pickNum(obj, ["oferta_trimisa_changed_count"])),
  };
};

/**
 * Создает данные для workflow to change виджетов
 */
export const createWorkflowToChangeData = (obj) => {
  // Проверяем, является ли это объектом со stats (новый формат)
  // где может быть объект с contract_incheiat внутри
  const statsSource = obj?.stats ?? obj;

  // Если это объект, где есть contract_incheiat с workflow и count
  if (statsSource && typeof statsSource === "object" && !Array.isArray(statsSource)) {
    const contractIncheiatObj = statsSource.contract_incheiat;
    if (contractIncheiatObj && typeof contractIncheiatObj === "object") {
      const count = pickNum(contractIncheiatObj, ["count", "value", "total"]) || 0;
      return {
        contractIncheiatChangedCount: count,
      };
    }
  }

  // Старый формат или прямой доступ
  return {
    contractIncheiatChangedCount: pickNum(obj, ["contract_incheiat_changed_count", "contract_incheiat", "contract"]) || 0,
  };
};

/**
 * Создает данные для ticket creation виджетов
 */
export const createTicketCreationData = (obj) => {
  // Проверяем, является ли это объектом со stats (новый формат)
  // где может быть объект с tickets_created внутри
  const statsSource = obj?.stats ?? obj;

  // Если это объект, где есть tickets_created с metric и count
  if (statsSource && typeof statsSource === "object" && !Array.isArray(statsSource)) {
    const ticketsCreatedObj = statsSource.tickets_created;
    if (ticketsCreatedObj && typeof ticketsCreatedObj === "object") {
      const count = pickNum(ticketsCreatedObj, ["count", "value", "total"]) || 0;
      return {
        ticketsCreatedCount: count,
      };
    }
  }

  // Старый формат или прямой доступ
  return {
    ticketsCreatedCount: pickNum(obj, ["tickets_created_count", "tickets_created", "created"]) || 0,
  };
};

/**
 * Создает данные для workflow from de prelucrat виджетов
 */
export const createWorkflowFromDePrelucratData = (obj) => {
  if (Array.isArray(obj)) {
    // Для general секции (старый формат) - это массив объектов
    const totalChanges = obj.reduce((sum, item) => sum + (pickNum(item, ["change_count", "count"]) || 0), 0);
    return {
      workflowChanges: obj.map(item => ({
        destination_workflow: item.destination_workflow || item.destination || "-",
        change_count: pickNum(item, ["change_count", "count"]) || 0,
      })),
      totalChanges,
    };
  } else if (obj && typeof obj === "object") {
    // Проверяем, является ли это объектом со stats (новый формат)
    // где ключи - это названия workflow, а значения - объекты с destination_workflow и count
    const statsObj = obj.stats || obj;
    
    // Если это объект, где значения - объекты с destination_workflow и count
    if (statsObj && typeof statsObj === "object" && !Array.isArray(statsObj)) {
      const workflowChanges = Object.values(statsObj)
        .filter(item => item && typeof item === "object")
        .map(item => ({
          destination_workflow: item.destination_workflow || item.destination || "-",
          change_count: pickNum(item, ["change_count", "count"]) || 0,
        }));
      
      const totalChanges = workflowChanges.reduce((sum, item) => sum + (item.change_count || 0), 0);
      
      return {
        workflowChanges,
        totalChanges,
      };
    }
    
    // Для других секций (старый формат) - это объект с workflow_changes массивом
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
  
  // Fallback для пустых или неожиданных данных
  return {
    workflowChanges: [],
    totalChanges: 0,
  };
};

/**
 * Создает данные для workflow duration виджетов
 */
export const createWorkflowDurationData = (obj) => {
  // Проверяем, является ли это объектом со stats (новый формат)
  // где ключи - это названия duration_bucket, а значения - объекты с duration_bucket и count
  const statsSource = obj?.stats ?? obj;

  // Если это объект, где значения - объекты с duration_bucket и count
  if (statsSource && typeof statsSource === "object" && !Array.isArray(statsSource)) {
    const durationBuckets = Object.values(statsSource)
      .filter(item => item && typeof item === "object")
      .map(item => ({
        duration_bucket: item.duration_bucket || item.bucket || "-",
        count: pickNum(item, ["count", "value", "total"]) || 0,
      }));

    const totalTickets = durationBuckets.reduce((sum, item) => sum + (item.count || 0), 0);

    return {
      durationBuckets: durationBuckets.sort((a, b) => {
        // Сортируем по порядку: сначала числовые диапазоны, потом "Not processed"
        const order = {
          "0-1 hour": 1,
          "1-4 hours": 2,
          "4-8 hours": 3,
          "8-24 hours": 4,
          "1-2 days": 5,
          "2-7 days": 6,
          "7+ days": 7,
          "Not processed": 8,
        };
        const aOrder = order[a.duration_bucket] || 99;
        const bOrder = order[b.duration_bucket] || 99;
        return aOrder - bOrder;
      }),
      totalTickets,
      // Для обратной совместимости
      totalDurationMinutes: pickNum(obj, ["total_duration_minutes", "total_duration", "duration"]) || 0,
      averageDurationMinutes: pickNum(obj, ["average_duration_minutes", "average_duration", "avg_duration"]) || 0,
      ticketsProcessed: totalTickets || pickNum(obj, ["tickets_processed", "tickets", "processed"]) || 0,
    };
  }

  // Старый формат - возвращаем как было
  return {
    durationBuckets: [],
    totalTickets: 0,
    totalDurationMinutes: pickNum(obj, ["total_duration_minutes", "total_duration", "duration"]) || 0,
    averageDurationMinutes: pickNum(obj, ["average_duration_minutes", "average_duration", "avg_duration"]) || 0,
    ticketsProcessed: pickNum(obj, ["tickets_processed", "tickets", "processed"]) || 0,
  };
};

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
    case "ticket_platform_source": {
      const tps = createTicketPlatformSourceStatsData(data.general);
      return {
        ...baseWidget,
        type: "ticket_platform_source",
        title: getLanguageByKey("Ticket Platform Source Stats"),
        ...tps,
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
