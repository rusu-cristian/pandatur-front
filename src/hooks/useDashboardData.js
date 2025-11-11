import { useMemo } from "react";
import { createGeneralWidget } from "../utils/dashboardHelpers";
import {
  createGroupTitleWidgets,
  createUserGroupWidgets,
  createUserWidgets,
  createTopUsersWidget,
  createPlatformWidgets,
  createSourceWidgets,
} from "../utils/dashboardWidgets";

const SECTIONS = {
  GENERAL: "general",
  GROUP_TITLE: "group_title",
  USER_GROUP: "user_group",
  USER: "user",
  TOP_USERS: "top_users",
  PLATFORM: "platform",
  SOURCE: "source",
  OTHER: "other",
};

const buildWidgetsForType = (data, widgetType, userNameById, getLanguageByKey) => {
  if (!data) return [];

  const widgets = [];

  const appendWidgets = (items = [], section) => {
    (items || []).forEach((widget, index) => {
      if (!widget) return;
      const originId = String(widget.id ?? `${section}-${index}`);
      widgets.push({
        ...widget,
        widgetType,
        originId,
        section,
        id: `${widgetType}-${originId}`,
      });
    });
  };

  const generalWidget = createGeneralWidget(data, widgetType, getLanguageByKey);
  if (generalWidget) {
    appendWidgets([generalWidget], SECTIONS.GENERAL);
  }

  appendWidgets(createGroupTitleWidgets(data, widgetType, getLanguageByKey), SECTIONS.GROUP_TITLE);
  appendWidgets(createUserGroupWidgets(data, widgetType, getLanguageByKey), SECTIONS.USER_GROUP);
  appendWidgets(createUserWidgets(data, widgetType, getLanguageByKey, userNameById), SECTIONS.USER);

  const topUsersWidget = createTopUsersWidget(data, widgetType, getLanguageByKey, userNameById);
  if (topUsersWidget) {
    appendWidgets([topUsersWidget], SECTIONS.TOP_USERS);
  }

  appendWidgets(createPlatformWidgets(data, widgetType, getLanguageByKey), SECTIONS.PLATFORM);
  appendWidgets(createSourceWidgets(data, getLanguageByKey), SECTIONS.SOURCE);

  return widgets;
};

/**
 * Хук для построения виджетов дашборда
 */
export const useDashboardData = (rawData, userNameById, widgetTypes, getLanguageByKey) => {
  return useMemo(() => {
    if (!rawData) return [];

    const typesArray = Array.isArray(widgetTypes)
      ? widgetTypes
      : widgetTypes
      ? [widgetTypes]
      : [];

    if (!typesArray.length) return [];

    const combinedWidgets = [];

    typesArray.forEach((type) => {
      if (!type) return;
      const data = rawData?.[type];
      const widgets = buildWidgetsForType(data, type, userNameById, getLanguageByKey);
      combinedWidgets.push(...widgets);
    });

    return combinedWidgets;
  }, [rawData, userNameById, widgetTypes, getLanguageByKey]);
};
