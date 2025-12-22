import {
  safeArray,
  createCountsData,
  createTicketStateData,
  createTicketsIntoWorkData,
  createSystemUsageData,
  createTicketDistributionData,
  createClosedTicketsCountData,
  createTicketsByDepartCountData,
  createTicketLifetimeStatsData,
  createTicketRateData,
  createWorkflowFromChangeData,
  createWorkflowToChangeData,
  createTicketCreationData,
  createWorkflowFromDePrelucratData,
  createWorkflowDurationData,
  createTicketDestinationData,
  createTicketMarketingStatsData,
  createTicketSourceStatsData,
  createTicketPlatformSourceStatsData,
  mapPlatforms,
  BG_COLORS,
} from "./dashboardHelpers";
import { groupTitleOptions } from "../FormOptions/GroupTitleOptions";

// Функция для получения полного названия воронки по короткому
const getGroupTitleLabel = (shortName) => {
  if (!shortName) return "-";
  const option = groupTitleOptions.find(opt => opt.value === shortName);
  return option ? option.label : shortName;
};

/**
 * Создает виджет для элемента данных
 */
const createWidgetFromData = (item, widgetType, getLanguageByKey, id, title, subtitle, bgColor) => {
  const baseWidget = {
    id,
    title: getLanguageByKey(title),
    subtitle,
    bg: bgColor,
  };

  switch (widgetType) {
    case "ticket_state": {
      const ts = createTicketStateData(item);
      return {
        ...baseWidget,
        type: "ticket_state",
        ...ts,
      };
    }
    case "tickets_into_work": {
      const tiw = createTicketsIntoWorkData(item);
      return {
        ...baseWidget,
        type: "tickets_into_work",
        ...tiw,
      };
    }
    case "system_usage": {
      const su = createSystemUsageData(item);
      return {
        ...baseWidget,
        type: "system_usage",
        ...su,
      };
    }
    case "ticket_distribution": {
      const td = createTicketDistributionData(item);
      return {
        ...baseWidget,
        type: "ticket_distribution",
        ...td,
      };
    }
    case "closed_tickets_count": {
      const ctc = createClosedTicketsCountData(item);
      return {
        ...baseWidget,
        type: "closed_tickets_count",
        ...ctc,
      };
    }
    case "tickets_by_depart_count": {
      const tbdc = createTicketsByDepartCountData(item);
      return {
        ...baseWidget,
        type: "tickets_by_depart_count",
        ...tbdc,
      };
    }
    case "ticket_lifetime_stats": {
      const tls = createTicketLifetimeStatsData(item);
      return {
        ...baseWidget,
        type: "ticket_lifetime_stats",
        ...tls,
      };
    }
    case "ticket_rate": {
      const tr = createTicketRateData(item);
      return {
        ...baseWidget,
        type: "ticket_rate",
        ...tr,
      };
    }
    case "workflow_from_change": {
      const wfc = createWorkflowFromChangeData(item);
      return {
        ...baseWidget,
        type: "workflow_from_change",
        ...wfc,
      };
    }
    case "workflow_to_change": {
      const wtc = createWorkflowToChangeData(item);
      return {
        ...baseWidget,
        type: "workflow_to_change",
        ...wtc,
      };
    }
    case "ticket_creation": {
      const tc = createTicketCreationData(item);
      return {
        ...baseWidget,
        type: "ticket_creation",
        ...tc,
      };
    }
    case "workflow_from_de_prelucrat": {
      const wfdp = createWorkflowFromDePrelucratData(item);
      return {
        ...baseWidget,
        type: "workflow_from_de_prelucrat",
        ...wfdp,
      };
    }
    case "workflow_duration": {
      const wd = createWorkflowDurationData(item);
      return {
        ...baseWidget,
        type: "workflow_duration",
        ...wd,
      };
    }
    case "ticket_marketing": {
      const tms = createTicketMarketingStatsData(item);
      return {
        ...baseWidget,
        type: "ticket_marketing",
        ...tms,
      };
    }
    case "ticket_source": {
      const tss = createTicketSourceStatsData(item);
      return {
        ...baseWidget,
        type: "ticket_source",
        ...tss,
      };
    }
    case "ticket_platform_source": {
      const tps = createTicketPlatformSourceStatsData(item);
      return {
        ...baseWidget,
        type: "ticket_platform_source",
        ...tps,
      };
    }
    default: {
      const c = createCountsData(item);
      return {
        ...baseWidget,
        type: "group",
        ...c,
      };
    }
  }
};

/**
 * Создает виджеты для группы по group_title
 * Каждый элемент массива = 1 виджет
 * Для виджетов со статистикой (ticket_source, ticket_marketing, ticket_platform_source)
 * включает вложенные user_groups в данные виджета
 */
export const createGroupTitleWidgets = (data, widgetType, getLanguageByKey) => {
  const byGt = safeArray(data.by_group_title);
  return byGt.map((r, idx) => {
    const shortName = r.group_title_name ?? r.group_title ?? r.group ?? "-";
    // Получаем полное название воронки (например, "MD" -> "MD-Sales")
    const fullName = getGroupTitleLabel(shortName);

    // Для виджетов со статистикой (ticket_source, ticket_marketing, ticket_platform_source)
    // данные могут быть в поле stats, и нужно включить user_groups
    const itemData = r.stats || r;

    // Проверяем, является ли это виджетом со статистикой или workflow
    const isStatsWidget = widgetType === "ticket_source" || 
                         widgetType === "ticket_marketing" || 
                         widgetType === "ticket_platform_source";
    const isWorkflowWidget = widgetType === "workflow_from_de_prelucrat";
    const isDurationWidget = widgetType === "workflow_duration";
    const isCreationWidget = widgetType === "ticket_creation";
    const isToChangeWidget = widgetType === "workflow_to_change";
    const isFromChangeWidget = widgetType === "workflow_from_change";
    const isRateWidget = widgetType === "ticket_rate";
    const isLifetimeWidget = widgetType === "ticket_lifetime_stats";
    const isDepartCountWidget = widgetType === "tickets_by_depart_count";
    const isClosedTicketsWidget = widgetType === "closed_tickets_count";
    const isTicketsIntoWorkWidget = widgetType === "tickets_into_work";
    const isTicketDistributionWidget = widgetType === "ticket_distribution";
    const isSystemUsageWidget = widgetType === "system_usage";
    const isCallsWidget = widgetType === "calls" || widgetType === "messages";
    const isTicketStateWidget = widgetType === "ticket_state";
    
    // Если это calls виджет, обрабатываем вложенные user_groups
    if (isCallsWidget) {
      const widget = createWidgetFromData(
        itemData,
        widgetType,
        getLanguageByKey,
        `gt-${shortName ?? idx}`,
        "Group title",
        fullName,
        BG_COLORS.by_group_title
      );

      // Добавляем вложенные группы пользователей, если они есть
      const userGroups = (r.user_groups && Array.isArray(r.user_groups))
        ? r.user_groups.map(ug => ({
            userGroupName: ug.user_group_name ?? ug.user_group ?? "-",
            // Для messages используем incoming_messages_count, для calls - incoming_calls_count
            incoming_messages_count: widgetType === "messages" && Number.isFinite(ug.incoming_messages_count) ? ug.incoming_messages_count : 0,
            outgoing_messages_count: widgetType === "messages" && Number.isFinite(ug.outgoing_messages_count) ? ug.outgoing_messages_count : 0,
            total_messages_count: widgetType === "messages" && Number.isFinite(ug.total_messages_count) ? ug.total_messages_count : 0,
            incoming_calls_count: widgetType === "calls" && Number.isFinite(ug.incoming_calls_count) ? ug.incoming_calls_count : 0,
            outgoing_calls_count: widgetType === "calls" && Number.isFinite(ug.outgoing_calls_count) ? ug.outgoing_calls_count : 0,
            total_calls_count: widgetType === "calls" && Number.isFinite(ug.total_calls_count) ? ug.total_calls_count : 0,
          }))
        : [];

      return {
        ...widget,
        userGroups,
      };
    }

    // Если это ticket state виджет и есть user_groups, добавляем их в данные
    if (isTicketStateWidget && r.user_groups && Array.isArray(r.user_groups)) {
      const widget = createWidgetFromData(
        itemData,
        widgetType,
        getLanguageByKey,
        `gt-${shortName ?? idx}`,
        "Group title",
        fullName,
        BG_COLORS.by_group_title
      );

      // Добавляем вложенные группы пользователей
      return {
        ...widget,
        userGroups: r.user_groups.map(ug => ({
          userGroupName: ug.user_group_name ?? ug.user_group ?? "-",
          old_client_tickets_count: Number.isFinite(ug.old_client_tickets_count) ? ug.old_client_tickets_count : 0,
          new_client_tickets_count: Number.isFinite(ug.new_client_tickets_count) ? ug.new_client_tickets_count : 0,
          total_tickets_count: Number.isFinite(ug.total_tickets_count) ? ug.total_tickets_count : 0,
        })),
      };
    }
    
    // Если это виджет со статистикой и есть user_groups, добавляем их в данные
    if (isStatsWidget && r.user_groups && Array.isArray(r.user_groups)) {
      const widget = createWidgetFromData(
        itemData,
        widgetType,
        getLanguageByKey,
        `gt-${shortName ?? idx}`,
        "Group title",
        fullName,
        BG_COLORS.by_group_title
      );

      // Добавляем вложенные группы пользователей
      return {
        ...widget,
        userGroups: r.user_groups.map(ug => ({
          userGroupName: ug.user_group_name ?? ug.user_group ?? "-",
          stats: ug.stats || ug,
        })),
      };
    }

    // Если это ticket creation виджет и есть user_groups, добавляем их в данные
    if (isCreationWidget && r.user_groups && Array.isArray(r.user_groups)) {
      const widget = createWidgetFromData(
        itemData,
        widgetType,
        getLanguageByKey,
        `gt-${shortName ?? idx}`,
        "Group title",
        fullName,
        BG_COLORS.by_group_title
      );

      // Добавляем вложенные группы пользователей
      return {
        ...widget,
        userGroups: r.user_groups.map(ug => ({
          userGroupName: ug.user_group_name ?? ug.user_group ?? "-",
          stats: ug.stats || ug,
        })),
      };
    }

    // Если это system usage виджет и есть user_groups, добавляем их в данные
    if (isSystemUsageWidget && r.user_groups && Array.isArray(r.user_groups)) {
      const widget = createWidgetFromData(
        itemData, 
        widgetType, 
        getLanguageByKey, 
        `gt-${shortName ?? idx}`, 
        "Group title", 
        fullName, 
        BG_COLORS.by_group_title
      );
      
      // Добавляем вложенные группы пользователей
      return {
        ...widget,
        userGroups: r.user_groups.map(ug => ({
          userGroupName: ug.user_group_name ?? ug.user_group ?? "-",
          activity_minutes: Number.isFinite(ug.activity_minutes) ? ug.activity_minutes : 0,
          activity_hours: Number.isFinite(ug.activity_hours) ? ug.activity_hours : 0,
        })),
      };
    }
    
    // Если это ticket distribution виджет и есть user_groups, добавляем их в данные
    if (isTicketDistributionWidget && r.user_groups && Array.isArray(r.user_groups)) {
      const widget = createWidgetFromData(
        itemData, 
        widgetType, 
        getLanguageByKey, 
        `gt-${shortName ?? idx}`, 
        "Group title", 
        fullName, 
        BG_COLORS.by_group_title
      );
      
      // Добавляем вложенные группы пользователей
      return {
        ...widget,
        userGroups: r.user_groups.map(ug => ({
          userGroupName: ug.user_group_name ?? ug.user_group ?? "-",
          distributed_tickets_count: Number.isFinite(ug.distributed_tickets_count) ? ug.distributed_tickets_count : 0,
        })),
      };
    }
    
    // Если это tickets into work виджет и есть user_groups, добавляем их в данные
    if (isTicketsIntoWorkWidget && r.user_groups && Array.isArray(r.user_groups)) {
      const widget = createWidgetFromData(
        itemData, 
        widgetType, 
        getLanguageByKey, 
        `gt-${shortName ?? idx}`, 
        "Group title", 
        fullName, 
        BG_COLORS.by_group_title
      );
      
      // Добавляем вложенные группы пользователей
      return {
        ...widget,
        userGroups: r.user_groups.map(ug => ({
          userGroupName: ug.user_group_name ?? ug.user_group ?? "-",
          stats: ug.stats || ug,
        })),
      };
    }
    
    // Если это closed tickets count виджет и есть user_groups, добавляем их в данные
    if (isClosedTicketsWidget && r.user_groups && Array.isArray(r.user_groups)) {
      const widget = createWidgetFromData(
        itemData,
        widgetType,
        getLanguageByKey,
        `gt-${shortName ?? idx}`,
        "Group title",
        fullName,
        BG_COLORS.by_group_title
      );

      // Добавляем вложенные группы пользователей
      return {
        ...widget,
        userGroups: r.user_groups.map(ug => ({
          userGroupName: ug.user_group_name ?? ug.user_group ?? "-",
          total_closed_tickets_count: Number.isFinite(ug.total_closed_tickets_count) ? ug.total_closed_tickets_count : 0,
          stats: ug.stats || ug,
        })),
      };
    }

    // Если это tickets by depart count виджет и есть user_groups, добавляем их в данные
    if (isDepartCountWidget && r.user_groups && Array.isArray(r.user_groups)) {
      const widget = createWidgetFromData(
        itemData,
        widgetType,
        getLanguageByKey,
        `gt-${shortName ?? idx}`,
        "Group title",
        fullName,
        BG_COLORS.by_group_title
      );

      // Добавляем вложенные группы пользователей
      return {
        ...widget,
        userGroups: r.user_groups.map(ug => ({
          userGroupName: ug.user_group_name ?? ug.user_group ?? "-",
          stats: ug.stats || ug,
        })),
      };
    }

    // Если это ticket lifetime stats виджет и есть user_groups, добавляем их в данные
    if (isLifetimeWidget && r.user_groups && Array.isArray(r.user_groups)) {
      const widget = createWidgetFromData(
        itemData,
        widgetType,
        getLanguageByKey,
        `gt-${shortName ?? idx}`,
        "Group title",
        fullName,
        BG_COLORS.by_group_title
      );

      // Добавляем вложенные группы пользователей
      return {
        ...widget,
        userGroups: r.user_groups.map(ug => ({
          userGroupName: ug.user_group_name ?? ug.user_group ?? "-",
          tickets_processed: Number.isFinite(ug.tickets_processed) ? ug.tickets_processed : 0,
          stats: ug.stats || ug,
        })),
      };
    }

    // Если это ticket rate виджет и есть user_groups, добавляем их в данные
    if (isRateWidget && r.user_groups && Array.isArray(r.user_groups)) {
      const widget = createWidgetFromData(
        itemData,
        widgetType,
        getLanguageByKey,
        `gt-${shortName ?? idx}`,
        "Group title",
        fullName,
        BG_COLORS.by_group_title
      );

      // Добавляем вложенные группы пользователей
      return {
        ...widget,
        userGroups: r.user_groups.map(ug => ({
          userGroupName: ug.user_group_name ?? ug.user_group ?? "-",
          stats: ug.stats || ug,
        })),
      };
    }

    // Если это workflow from change виджет и есть user_groups, добавляем их в данные
    if (isFromChangeWidget && r.user_groups && Array.isArray(r.user_groups)) {
      const widget = createWidgetFromData(
        itemData,
        widgetType,
        getLanguageByKey,
        `gt-${shortName ?? idx}`,
        "Group title",
        fullName,
        BG_COLORS.by_group_title
      );

      // Добавляем вложенные группы пользователей
      return {
        ...widget,
        userGroups: r.user_groups.map(ug => ({
          userGroupName: ug.user_group_name ?? ug.user_group ?? "-",
          stats: ug.stats || ug,
        })),
      };
    }

    // Если это workflow to change виджет и есть user_groups, добавляем их в данные
    if (isToChangeWidget && r.user_groups && Array.isArray(r.user_groups)) {
      const widget = createWidgetFromData(
        itemData,
        widgetType,
        getLanguageByKey,
        `gt-${shortName ?? idx}`,
        "Group title",
        fullName,
        BG_COLORS.by_group_title
      );

      // Добавляем вложенные группы пользователей
      return {
        ...widget,
        userGroups: r.user_groups.map(ug => ({
          userGroupName: ug.user_group_name ?? ug.user_group ?? "-",
          stats: ug.stats || ug,
        })),
      };
    }

    // Если это workflow duration виджет и есть user_groups, добавляем их в данные
    if (isDurationWidget && r.user_groups && Array.isArray(r.user_groups)) {
      const widget = createWidgetFromData(
        itemData,
        widgetType,
        getLanguageByKey,
        `gt-${shortName ?? idx}`,
        "Group title",
        fullName,
        BG_COLORS.by_group_title
      );

      // Добавляем вложенные группы пользователей
      return {
        ...widget,
        userGroups: r.user_groups.map(ug => ({
          userGroupName: ug.user_group_name ?? ug.user_group ?? "-",
          stats: ug.stats || ug,
        })),
      };
    }

    // Если это workflow виджет и есть user_groups, добавляем их в данные
    if (isWorkflowWidget && r.user_groups && Array.isArray(r.user_groups)) {
      const widget = createWidgetFromData(
        itemData,
        widgetType,
        getLanguageByKey,
        `gt-${shortName ?? idx}`,
        "Group title",
        fullName,
        BG_COLORS.by_group_title
      );

      // Добавляем вложенные группы пользователей
      // Для workflow виджетов данные могут быть в поле stats (объект)
      return {
        ...widget,
        userGroups: r.user_groups.map(ug => {
          const ugStats = ug.stats || ug;
          // Если это объект со stats (новый формат), преобразуем в массив
          let workflowChanges = [];
          let totalChanges = 0;

          if (ugStats && typeof ugStats === "object" && !Array.isArray(ugStats)) {
            // Новый формат: объект, где значения - объекты с destination_workflow и count
            workflowChanges = Object.values(ugStats)
              .filter(item => item && typeof item === "object")
              .map(item => ({
                destination_workflow: item.destination_workflow || item.destination || "-",
                change_count: Number.isFinite(item.count) ? item.count : (Number.isFinite(item.change_count) ? item.change_count : 0),
              }));
            totalChanges = workflowChanges.reduce((sum, item) => sum + (item.change_count || 0), 0);
          } else {
            // Старый формат: массив workflow_changes
            workflowChanges = safeArray(ug.workflow_changes || ug.changes || []);
            totalChanges = Number.isFinite(ug.total_changes) ? ug.total_changes :
              workflowChanges.reduce((sum, item) => sum + (Number.isFinite(item.change_count) ? item.change_count : (Number.isFinite(item.count) ? item.count : 0)), 0);
          }

          return {
            userGroupName: ug.user_group_name ?? ug.user_group ?? "-",
            workflowChanges,
            totalChanges,
          };
        }),
      };
    }

    return createWidgetFromData(
      itemData,
      widgetType, 
      getLanguageByKey, 
      `gt-${shortName ?? idx}`,
      "Group title", 
      fullName,
      BG_COLORS.by_group_title
    );
  });
};

/**
 * Создает виджеты для группы по user_group
 * Каждый элемент массива = 1 виджет
 * Для виджетов со статистикой (ticket_source, ticket_marketing, ticket_platform_source)
 * включает вложенные user_technicians в данные виджета
 */
export const createUserGroupWidgets = (data, widgetType, getLanguageByKey, userNameById) => {
  const byUserGroup = safeArray(data.by_user_group);
  return byUserGroup.map((r, idx) => {
    const name = r.user_group_name ?? r.user_group ?? r.group ?? "-";
    // Для виджетов со статистикой (ticket_source, ticket_marketing, ticket_platform_source)
    // данные могут быть в поле stats, и нужно включить user_technicians
    const itemData = r.stats || r;

    // Проверяем, является ли это виджетом со статистикой или workflow
    const isStatsWidget = widgetType === "ticket_source" || 
                         widgetType === "ticket_marketing" || 
                         widgetType === "ticket_platform_source";
    const isWorkflowWidget = widgetType === "workflow_from_de_prelucrat";
    const isDurationWidget = widgetType === "workflow_duration";
    const isCreationWidget = widgetType === "ticket_creation";
    const isToChangeWidget = widgetType === "workflow_to_change";
    const isFromChangeWidget = widgetType === "workflow_from_change";
    const isRateWidget = widgetType === "ticket_rate";
    const isLifetimeWidget = widgetType === "ticket_lifetime_stats";
    const isDepartCountWidget = widgetType === "tickets_by_depart_count";
    const isClosedTicketsWidget = widgetType === "closed_tickets_count";
    const isTicketsIntoWorkWidget = widgetType === "tickets_into_work";
    const isTicketDistributionWidget = widgetType === "ticket_distribution";
    const isSystemUsageWidget = widgetType === "system_usage";
    const isCallsWidget = widgetType === "calls" || widgetType === "messages";
    const isTicketStateWidget = widgetType === "ticket_state";
    
    // Если это ticket state виджет и есть user_technicians, добавляем их в данные
    if (isTicketStateWidget && r.user_technicians && Array.isArray(r.user_technicians)) {
      const widget = createWidgetFromData(
        itemData,
        widgetType,
        getLanguageByKey,
        `ug-${idx}`,
        "User group",
        name || "-",
        BG_COLORS.by_user_group
      );

      // Добавляем вложенных пользователей с их именами
      return {
        ...widget,
        userTechnicians: r.user_technicians.map(ut => {
          const uid = Number(ut.user_id);
          const userName = userNameById?.get?.(uid) || (Number.isFinite(uid) ? `ID ${uid}` : "-");
          return {
            userId: uid,
            userName,
            sipuniId: ut.sipuni_id || null,
            old_client_tickets_count: Number.isFinite(ut.old_client_tickets_count) ? ut.old_client_tickets_count : 0,
            new_client_tickets_count: Number.isFinite(ut.new_client_tickets_count) ? ut.new_client_tickets_count : 0,
            total_tickets_count: Number.isFinite(ut.total_tickets_count) ? ut.total_tickets_count : 0,
          };
        }),
      };
    }
    
    // Если это calls виджет, обрабатываем вложенные user_technicians
    if (isCallsWidget) {
      const widget = createWidgetFromData(
        itemData,
        widgetType,
        getLanguageByKey,
        `ug-${idx}`,
        "User group",
        name || "-",
        BG_COLORS.by_user_group
      );

      // Добавляем вложенных пользователей с их именами, если они есть
      const userTechnicians = (r.user_technicians && Array.isArray(r.user_technicians))
        ? r.user_technicians.map(ut => {
            const uid = Number(ut.user_id);
            const userName = userNameById?.get?.(uid) || (Number.isFinite(uid) ? `ID ${uid}` : "-");
            return {
              userId: uid,
              userName,
              sipuniId: ut.sipuni_id || null,
              // Для messages используем incoming_messages_count, для calls - incoming_calls_count
              incoming_messages_count: widgetType === "messages" && Number.isFinite(ut.incoming_messages_count) ? ut.incoming_messages_count : 0,
              outgoing_messages_count: widgetType === "messages" && Number.isFinite(ut.outgoing_messages_count) ? ut.outgoing_messages_count : 0,
              total_messages_count: widgetType === "messages" && Number.isFinite(ut.total_messages_count) ? ut.total_messages_count : 0,
              incoming_calls_count: widgetType === "calls" && Number.isFinite(ut.incoming_calls_count) ? ut.incoming_calls_count : 0,
              outgoing_calls_count: widgetType === "calls" && Number.isFinite(ut.outgoing_calls_count) ? ut.outgoing_calls_count : 0,
              total_calls_count: widgetType === "calls" && Number.isFinite(ut.total_calls_count) ? ut.total_calls_count : 0,
            };
          })
        : [];

      return {
        ...widget,
        userTechnicians,
      };
    }
    
    // Если это виджет со статистикой и есть user_technicians, добавляем их в данные
    if (isStatsWidget && r.user_technicians && Array.isArray(r.user_technicians)) {
      const widget = createWidgetFromData(
        itemData,
        widgetType,
        getLanguageByKey,
        `ug-${idx}`,
        "User group",
        name || "-",
        BG_COLORS.by_user_group
      );

      // Добавляем вложенных пользователей с их именами
      return {
        ...widget,
        userTechnicians: r.user_technicians.map(ut => {
          const uid = Number(ut.user_id);
          const userName = userNameById?.get?.(uid) || (Number.isFinite(uid) ? `ID ${uid}` : "-");
          return {
            userId: uid,
            userName,
            stats: ut.stats || ut,
          };
        }),
      };
    }

    // Если это ticket creation виджет и есть user_technicians, добавляем их в данные
    if (isCreationWidget && r.user_technicians && Array.isArray(r.user_technicians)) {
      const widget = createWidgetFromData(
        itemData,
        widgetType,
        getLanguageByKey,
        `ug-${idx}`,
        "User group",
        name || "-",
        BG_COLORS.by_user_group
      );

      // Добавляем вложенных пользователей с их именами
      return {
        ...widget,
        userTechnicians: r.user_technicians.map(ut => {
          const uid = Number(ut.user_id);
          const userName = userNameById?.get?.(uid) || (Number.isFinite(uid) ? `ID ${uid}` : "-");
          return {
            userId: uid,
            userName,
            stats: ut.stats || ut,
          };
        }),
      };
    }

    // Если это system usage виджет и есть user_technicians, добавляем их в данные
    if (isSystemUsageWidget && r.user_technicians && Array.isArray(r.user_technicians)) {
      const widget = createWidgetFromData(
        itemData, 
        widgetType, 
        getLanguageByKey, 
        `ug-${idx}`, 
        "User group", 
        name || "-", 
        BG_COLORS.by_user_group
      );
      
      // Добавляем вложенных пользователей с их именами
      return {
        ...widget,
        userTechnicians: r.user_technicians.map(ut => {
          const uid = Number(ut.user_id);
          const userName = userNameById?.get?.(uid) || (Number.isFinite(uid) ? `ID ${uid}` : "-");
          return {
            userId: uid,
            userName,
            activity_minutes: Number.isFinite(ut.activity_minutes) ? ut.activity_minutes : 0,
            activity_hours: Number.isFinite(ut.activity_hours) ? ut.activity_hours : 0,
          };
        }),
      };
    }
    
    // Если это ticket distribution виджет и есть user_technicians, добавляем их в данные
    if (isTicketDistributionWidget && r.user_technicians && Array.isArray(r.user_technicians)) {
      const widget = createWidgetFromData(
        itemData, 
        widgetType, 
        getLanguageByKey, 
        `ug-${idx}`, 
        "User group", 
        name || "-", 
        BG_COLORS.by_user_group
      );
      
      // Добавляем вложенных пользователей с их именами
      return {
        ...widget,
        userTechnicians: r.user_technicians.map(ut => {
          const uid = Number(ut.user_id);
          const userName = userNameById?.get?.(uid) || (Number.isFinite(uid) ? `ID ${uid}` : "-");
          return {
            userId: uid,
            userName,
            distributed_tickets_count: Number.isFinite(ut.distributed_tickets_count) ? ut.distributed_tickets_count : 0,
          };
        }),
      };
    }
    
    // Если это tickets into work виджет и есть user_technicians, добавляем их в данные
    if (isTicketsIntoWorkWidget && r.user_technicians && Array.isArray(r.user_technicians)) {
      const widget = createWidgetFromData(
        itemData, 
        widgetType, 
        getLanguageByKey, 
        `ug-${idx}`, 
        "User group", 
        name || "-", 
        BG_COLORS.by_user_group
      );
      
      // Добавляем вложенных пользователей с их именами
      return {
        ...widget,
        userTechnicians: r.user_technicians.map(ut => {
          const uid = Number(ut.user_id);
          const userName = userNameById?.get?.(uid) || (Number.isFinite(uid) ? `ID ${uid}` : "-");
          return {
            userId: uid,
            userName,
            stats: ut.stats || ut,
          };
        }),
      };
    }
    
    // Если это closed tickets count виджет и есть user_technicians, добавляем их в данные
    if (isClosedTicketsWidget && r.user_technicians && Array.isArray(r.user_technicians)) {
      const widget = createWidgetFromData(
        itemData,
        widgetType,
        getLanguageByKey,
        `ug-${idx}`,
        "User group",
        name || "-",
        BG_COLORS.by_user_group
      );

      // Добавляем вложенных пользователей с их именами
      return {
        ...widget,
        userTechnicians: r.user_technicians.map(ut => {
          const uid = Number(ut.user_id);
          const userName = userNameById?.get?.(uid) || (Number.isFinite(uid) ? `ID ${uid}` : "-");
          return {
            userId: uid,
            userName,
            total_closed_tickets_count: Number.isFinite(ut.total_closed_tickets_count) ? ut.total_closed_tickets_count : 0,
            stats: ut.stats || ut,
          };
        }),
      };
    }

    // Если это tickets by depart count виджет и есть user_technicians, добавляем их в данные
    if (isDepartCountWidget && r.user_technicians && Array.isArray(r.user_technicians)) {
      const widget = createWidgetFromData(
        itemData,
        widgetType,
        getLanguageByKey,
        `ug-${idx}`,
        "User group",
        name || "-",
        BG_COLORS.by_user_group
      );

      // Добавляем вложенных пользователей с их именами
      return {
        ...widget,
        userTechnicians: r.user_technicians.map(ut => {
          const uid = Number(ut.user_id);
          const userName = userNameById?.get?.(uid) || (Number.isFinite(uid) ? `ID ${uid}` : "-");
          return {
            userId: uid,
            userName,
            stats: ut.stats || ut,
          };
        }),
      };
    }

    // Если это ticket lifetime stats виджет и есть user_technicians, добавляем их в данные
    if (isLifetimeWidget && r.user_technicians && Array.isArray(r.user_technicians)) {
      const widget = createWidgetFromData(
        itemData,
        widgetType,
        getLanguageByKey,
        `ug-${idx}`,
        "User group",
        name || "-",
        BG_COLORS.by_user_group
      );

      // Добавляем вложенных пользователей с их именами
      return {
        ...widget,
        userTechnicians: r.user_technicians.map(ut => {
          const uid = Number(ut.user_id);
          const userName = userNameById?.get?.(uid) || (Number.isFinite(uid) ? `ID ${uid}` : "-");
          return {
            userId: uid,
            userName,
            tickets_processed: Number.isFinite(ut.tickets_processed) ? ut.tickets_processed : 0,
            stats: ut.stats || ut,
          };
        }),
      };
    }

    // Если это ticket rate виджет и есть user_technicians, добавляем их в данные
    if (isRateWidget && r.user_technicians && Array.isArray(r.user_technicians)) {
      const widget = createWidgetFromData(
        itemData,
        widgetType,
        getLanguageByKey,
        `ug-${idx}`,
        "User group",
        name || "-",
        BG_COLORS.by_user_group
      );

      // Добавляем вложенных пользователей с их именами
      return {
        ...widget,
        userTechnicians: r.user_technicians.map(ut => {
          const uid = Number(ut.user_id);
          const userName = userNameById?.get?.(uid) || (Number.isFinite(uid) ? `ID ${uid}` : "-");
          return {
            userId: uid,
            userName,
            stats: ut.stats || ut,
          };
        }),
      };
    }

    // Если это workflow from change виджет и есть user_technicians, добавляем их в данные
    if (isFromChangeWidget && r.user_technicians && Array.isArray(r.user_technicians)) {
      const widget = createWidgetFromData(
        itemData,
        widgetType,
        getLanguageByKey,
        `ug-${idx}`,
        "User group",
        name || "-",
        BG_COLORS.by_user_group
      );

      // Добавляем вложенных пользователей с их именами
      return {
        ...widget,
        userTechnicians: r.user_technicians.map(ut => {
          const uid = Number(ut.user_id);
          const userName = userNameById?.get?.(uid) || (Number.isFinite(uid) ? `ID ${uid}` : "-");
          return {
            userId: uid,
            userName,
            stats: ut.stats || ut,
          };
        }),
      };
    }

    // Если это workflow to change виджет и есть user_technicians, добавляем их в данные
    if (isToChangeWidget && r.user_technicians && Array.isArray(r.user_technicians)) {
      const widget = createWidgetFromData(
        itemData,
        widgetType,
        getLanguageByKey,
        `ug-${idx}`,
        "User group",
        name || "-",
        BG_COLORS.by_user_group
      );

      // Добавляем вложенных пользователей с их именами
      return {
        ...widget,
        userTechnicians: r.user_technicians.map(ut => {
          const uid = Number(ut.user_id);
          const userName = userNameById?.get?.(uid) || (Number.isFinite(uid) ? `ID ${uid}` : "-");
          return {
            userId: uid,
            userName,
            stats: ut.stats || ut,
          };
        }),
      };
    }

    // Если это workflow duration виджет и есть user_technicians, добавляем их в данные
    if (isDurationWidget && r.user_technicians && Array.isArray(r.user_technicians)) {
      const widget = createWidgetFromData(
        itemData,
        widgetType,
        getLanguageByKey,
        `ug-${idx}`,
        "User group",
        name || "-",
        BG_COLORS.by_user_group
      );

      // Добавляем вложенных пользователей с их именами
      return {
        ...widget,
        userTechnicians: r.user_technicians.map(ut => {
          const uid = Number(ut.user_id);
          const userName = userNameById?.get?.(uid) || (Number.isFinite(uid) ? `ID ${uid}` : "-");
          return {
            userId: uid,
            userName,
            stats: ut.stats || ut,
          };
        }),
      };
    }

    // Если это workflow виджет и есть user_technicians, добавляем их в данные
    if (isWorkflowWidget && r.user_technicians && Array.isArray(r.user_technicians)) {
      const widget = createWidgetFromData(
        itemData,
        widgetType,
        getLanguageByKey,
        `ug-${idx}`,
        "User group",
        name || "-",
        BG_COLORS.by_user_group
      );

      // Добавляем вложенных пользователей с их именами
      // Для workflow виджетов данные могут быть в поле stats (объект)
      return {
        ...widget,
        userTechnicians: r.user_technicians.map(ut => {
          const uid = Number(ut.user_id);
          const userName = userNameById?.get?.(uid) || (Number.isFinite(uid) ? `ID ${uid}` : "-");
          const utStats = ut.stats || ut;

          // Если это объект со stats (новый формат), преобразуем в массив
          let workflowChanges = [];
          let totalChanges = 0;

          if (utStats && typeof utStats === "object" && !Array.isArray(utStats)) {
            // Новый формат: объект, где значения - объекты с destination_workflow и count
            workflowChanges = Object.values(utStats)
              .filter(item => item && typeof item === "object")
              .map(item => ({
                destination_workflow: item.destination_workflow || item.destination || "-",
                change_count: Number.isFinite(item.count) ? item.count : (Number.isFinite(item.change_count) ? item.change_count : 0),
              }));
            totalChanges = workflowChanges.reduce((sum, item) => sum + (item.change_count || 0), 0);
          } else {
            // Старый формат: массив workflow_changes
            workflowChanges = safeArray(ut.workflow_changes || ut.changes || []);
            totalChanges = Number.isFinite(ut.total_changes) ? ut.total_changes :
              workflowChanges.reduce((sum, item) => sum + (Number.isFinite(item.change_count) ? item.change_count : (Number.isFinite(item.count) ? item.count : 0)), 0);
          }

          return {
            userId: uid,
            userName,
            workflowChanges,
            totalChanges,
          };
        }),
      };
    }

    return createWidgetFromData(
      itemData,
      widgetType, 
      getLanguageByKey, 
      `ug-${idx}`, 
      "User group", 
      name || "-", 
      BG_COLORS.by_user_group
    );
  });
};

/**
 * Создает виджеты для пользователей
 */
export const createUserWidgets = (data, widgetType, getLanguageByKey, userNameById) => {
  const byUser = safeArray(data.by_user);
  return byUser.map((r, idx) => {
    const uid = Number(r.user_id);
    const name = userNameById.get(uid);
    const subtitle = (name || (Number.isFinite(uid) ? `ID ${uid}` : "-")) + (r.sipuni_id ? ` • ${r.sipuni_id}` : "");
    // Для workflow и stats виджетов данные могут быть в поле stats
    const isStatsWidget = widgetType === "ticket_source" ||
      widgetType === "ticket_marketing" ||
      widgetType === "ticket_platform_source";
    const isDurationWidget = widgetType === "workflow_duration";
    const isCreationWidget = widgetType === "ticket_creation";
    const isToChangeWidget = widgetType === "workflow_to_change";
    const isFromChangeWidget = widgetType === "workflow_from_change";
    const isRateWidget = widgetType === "ticket_rate";
    const isLifetimeWidget = widgetType === "ticket_lifetime_stats";
    const isDepartCountWidget = widgetType === "tickets_by_depart_count";
    const isClosedTicketsWidget = widgetType === "closed_tickets_count";
    const isTicketsIntoWorkWidget = widgetType === "tickets_into_work";
    const itemData = ((isStatsWidget || isDurationWidget || isCreationWidget || isToChangeWidget || isFromChangeWidget || isRateWidget || isLifetimeWidget || isDepartCountWidget || isClosedTicketsWidget || isTicketsIntoWorkWidget || widgetType === "workflow_from_de_prelucrat") && r.stats) ? r.stats : r;
    return createWidgetFromData(
      itemData,
      widgetType, 
      getLanguageByKey, 
      `user-${uid || idx}`, 
      "User", 
      subtitle, 
      BG_COLORS.by_user
    );
  });
};

/**
 * Создает виджет топ пользователей
 */
export const createTopUsersWidget = (data, widgetType, getLanguageByKey, userNameById) => {
  const byUser = safeArray(data.by_user);
  const byUserGroup = safeArray(data.by_user_group);
  
  // Если нет данных ни в by_user, ни в by_user_group, возвращаем null
  if (!byUser.length && !byUserGroup.length) return null;

  // Функция для создания объекта пользователя из данных
  const createUserRow = (r) => {
    const uid = Number(r.user_id);
    
    switch (widgetType) {
      case "ticket_marketing": {
        // Для ticket_marketing данные находятся в поле stats
        // Если r.stats существует, используем его напрямую (это объект со статистикой)
        // Иначе используем весь объект r (для случаев, когда stats уже распакован)
        const statsSource = r.stats || r;
        const statsData = createTicketMarketingStatsData(statsSource);
        const total = statsData.totalMarketing || 0;
        return {
          user_id: uid,
          name: userNameById.get(uid) || (Number.isFinite(uid) ? `ID ${uid}` : "-"),
          sipuni_id: r.sipuni_id,
          ...statsData,
          total,
        };
      }
      case "ticket_source": {
        // Для ticket_source данные находятся в поле stats
        const statsSource = r.stats || r;
        const statsData = createTicketSourceStatsData(statsSource);
        const total = statsData.totalSources || 0;
        return {
          user_id: uid,
          name: userNameById.get(uid) || (Number.isFinite(uid) ? `ID ${uid}` : "-"),
          sipuni_id: r.sipuni_id,
          ...statsData,
          total,
        };
      }
      case "ticket_platform_source": {
        // Для ticket_platform_source данные находятся в поле stats
        const statsSource = r.stats || r;
        const statsData = createTicketPlatformSourceStatsData(statsSource);
        const total = statsData.totalPlatformSources || 0;
        return {
          user_id: uid,
          name: userNameById.get(uid) || (Number.isFinite(uid) ? `ID ${uid}` : "-"),
          sipuni_id: r.sipuni_id,
          ...statsData,
          total,
        };
      }
      case "ticket_state": {
        const ts = createTicketStateData(r);
        return {
          user_id: uid,
          name: userNameById.get(uid) || (Number.isFinite(uid) ? `ID ${uid}` : "-"),
          sipuni_id: r.sipuni_id,
          ...ts,
          total: ts.totalTickets,
        };
      }
      case "tickets_into_work": {
        const tiw = createTicketsIntoWorkData(r);
        return {
          user_id: uid,
          name: userNameById.get(uid) || (Number.isFinite(uid) ? `ID ${uid}` : "-"),
          sipuni_id: r.sipuni_id,
          ...tiw,
          total: tiw.takenIntoWorkTickets,
        };
      }
      case "system_usage": {
        const su = createSystemUsageData(r);
        return {
          user_id: uid,
          name: userNameById.get(uid) || (Number.isFinite(uid) ? `ID ${uid}` : "-"),
          sipuni_id: r.sipuni_id,
          ...su,
          total: su.activityHours,
        };
      }
      case "ticket_distribution": {
        const td = createTicketDistributionData(r);
        return {
          user_id: uid,
          name: userNameById.get(uid) || (Number.isFinite(uid) ? `ID ${uid}` : "-"),
          sipuni_id: r.sipuni_id,
          ...td,
          total: td.distributedTickets,
        };
      }
      case "closed_tickets_count": {
        const ctc = createClosedTicketsCountData(r);
        return {
          user_id: uid,
          name: userNameById.get(uid) || (Number.isFinite(uid) ? `ID ${uid}` : "-"),
          sipuni_id: r.sipuni_id,
          ...ctc,
          total: ctc.totalClosedTickets,
        };
      }
      case "tickets_by_depart_count": {
        const tbdc = createTicketsByDepartCountData(r);
        return {
          user_id: uid,
          name: userNameById.get(uid) || (Number.isFinite(uid) ? `ID ${uid}` : "-"),
          sipuni_id: r.sipuni_id,
          ...tbdc,
          total: tbdc.totalTickets,
        };
      }
      case "ticket_lifetime_stats": {
        const tls = createTicketLifetimeStatsData(r);
        return {
          user_id: uid,
          name: userNameById.get(uid) || (Number.isFinite(uid) ? `ID ${uid}` : "-"),
          sipuni_id: r.sipuni_id,
          ...tls,
          total: tls.ticketsProcessed,
        };
      }
      case "ticket_rate": {
        const tr = createTicketRateData(r);
        return {
          user_id: uid,
          name: userNameById.get(uid) || (Number.isFinite(uid) ? `ID ${uid}` : "-"),
          sipuni_id: r.sipuni_id,
          ...tr,
          total: tr.totalTransitions,
        };
      }
      case "workflow_from_change": {
        const wfc = createWorkflowFromChangeData(r);
        return {
          user_id: uid,
          name: userNameById.get(uid) || (Number.isFinite(uid) ? `ID ${uid}` : "-"),
          sipuni_id: r.sipuni_id,
          ...wfc,
          total: wfc.totalChanges,
        };
      }
      case "workflow_to_change": {
        const wtc = createWorkflowToChangeData(r);
        return {
          user_id: uid,
          name: userNameById.get(uid) || (Number.isFinite(uid) ? `ID ${uid}` : "-"),
          sipuni_id: r.sipuni_id,
          ...wtc,
          total: wtc.contractIncheiatChangedCount,
        };
      }
      case "ticket_creation": {
        const tc = createTicketCreationData(r);
        return {
          user_id: uid,
          name: userNameById.get(uid) || (Number.isFinite(uid) ? `ID ${uid}` : "-"),
          sipuni_id: r.sipuni_id,
          ...tc,
          total: tc.ticketsCreatedCount,
        };
      }
      case "workflow_from_de_prelucrat": {
        const wfdp = createWorkflowFromDePrelucratData(r);
        return {
          user_id: uid,
          name: userNameById.get(uid) || (Number.isFinite(uid) ? `ID ${uid}` : "-"),
          sipuni_id: r.sipuni_id,
          ...wfdp,
          total: wfdp.totalChanges,
        };
      }
      case "workflow_duration": {
        const wd = createWorkflowDurationData(r);
        return {
          user_id: uid,
          name: userNameById.get(uid) || (Number.isFinite(uid) ? `ID ${uid}` : "-"),
          sipuni_id: r.sipuni_id,
          ...wd,
          total: wd.averageDurationMinutes,
        };
      }
      default: {
        return {
          user_id: uid,
          name: userNameById.get(uid) || (Number.isFinite(uid) ? `ID ${uid}` : "-"),
          sipuni_id: r.sipuni_id,
          incoming: Number(r.incoming_calls_count) || 0,
          outgoing: Number(r.outgoing_calls_count) || 0,
          total: Number(r.total_calls_count) || 0,
        };
      }
    }
  };

  // Собираем пользователей из by_user
  const usersFromByUser = byUser.map(createUserRow);

  // Собираем пользователей из by_user_group[].user_technicians[]
  const usersFromByUserGroup = [];
  byUserGroup.forEach((group) => {
    const userTechnicians = safeArray(group.user_technicians);
    userTechnicians.forEach((ut) => {
      // Для типов виджетов со статистикой данные находятся в поле stats
      // Для остальных типов данные могут быть напрямую в объекте
      if (widgetType === "ticket_marketing" || widgetType === "ticket_source" || widgetType === "ticket_platform_source") {
        // Для этих типов передаем объект с явно указанным stats
        const userRow = createUserRow({
          user_id: ut.user_id,
          sipuni_id: ut.sipuni_id,
          stats: ut.stats || ut,
        });
        usersFromByUserGroup.push(userRow);
      } else {
        // Для остальных типов используем стандартную обработку
        const itemData = ut.stats || ut;
        const userRow = createUserRow({
          ...itemData,
          user_id: ut.user_id,
          sipuni_id: ut.sipuni_id,
        });
        usersFromByUserGroup.push(userRow);
      }
    });
  });

  // Объединяем пользователей из обоих источников
  // Используем Map для удаления дубликатов (приоритет у by_user)
  const usersMap = new Map();
  
  // Сначала добавляем пользователей из by_user_group (они могут быть перезаписаны)
  usersFromByUserGroup.forEach((user) => {
    const uid = user.user_id;
    if (uid && !usersMap.has(uid)) {
      usersMap.set(uid, user);
    }
  });
  
  // Затем добавляем пользователей из by_user (они имеют приоритет)
  usersFromByUser.forEach((user) => {
    const uid = user.user_id;
    if (uid) {
      usersMap.set(uid, user);
    }
  });

  // Преобразуем Map обратно в массив
  const rows = Array.from(usersMap.values());

  return {
    id: "top-users",
    type: "top_users",
    title: getLanguageByKey("Top users"),
    subtitle: getLanguageByKey("By total (desc)"),
    rows,
    bg: BG_COLORS.by_user,
    widgetType,
  };
};

/**
 * Создает виджеты для платформ (messages)
 */
export const createPlatformWidgets = (data, widgetType, getLanguageByKey) => {
  if (widgetType !== "messages") return [];
  
  const platforms = mapPlatforms(data.by_platform);
  return platforms.map((row, idx) => {
    const c = createCountsData(row || {});
    const name = row?.platform || "-";
    return {
      id: `plat-${name ?? idx}`,
      type: "source",
      title: getLanguageByKey("Platform"),
      subtitle: name,
      ...c,
      bg: BG_COLORS.by_source,
    };
  });
};

/**
 * Создает виджеты для источников (calls)
 */
export const createSourceWidgets = (data, getLanguageByKey) => {
  const bySrc = safeArray(data.by_source);
  return bySrc.map((r, idx) => {
    const c = createCountsData(r);
    const name = r.source ?? r.channel ?? r.platform ?? "-";
    return {
      id: `src-${name ?? idx}`,
      type: "source",
      title: getLanguageByKey("Source"),
      subtitle: name || "-",
      ...c,
      bg: BG_COLORS.by_source,
    };
  });
};
