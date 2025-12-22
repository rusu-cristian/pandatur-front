import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSnackbar } from "notistack";
import { useApp } from "@hooks";
import { api } from "../api";
import { showServerError, getLanguageByKey } from "@utils";
import { EXCLUDED_WORKFLOWS, getEffectiveWorkflow } from "../Components/LeadsComponent/constants";

/**
 * Хук для работы с Kanban (light тикеты)
 * 
 * РЕФАКТОРИНГ:
 * - Убраны локальные kanbanFilters — фильтры приходят из URL через useLeadsFilters
 * - Упрощена логика — хук только загружает данные и управляет спиннером
 */
export const useLeadsKanban = () => {
  const { enqueueSnackbar } = useSnackbar();
  const {
    tickets: globalTickets,
    fetchTickets: fetchGlobalLight,
    groupTitleForApi,
    workflowOptions,
  } = useApp();

  // Локальные тикеты (результат фильтрации)
  const [kanbanTickets, setKanbanTickets] = useState([]);
  const [kanbanSpinner, setKanbanSpinner] = useState(false);
  
  // Флаг активного фильтра — управляется извне через setKanbanFilterActive
  const [kanbanFilterActive, setKanbanFilterActive] = useState(false);
  
  // Для подсветки выбранных колонок
  const [choiceWorkflow, setChoiceWorkflow] = useState([]);

  // Защита от race condition
  const kanbanReqIdRef = useRef(0);

  /**
   * Загрузка light тикетов с фильтрами
   * @param {Object} filters - фильтры из URL (через useLeadsFilters)
   */
  const fetchKanbanTickets = useCallback(async (filters = {}) => {
    const reqId = ++kanbanReqIdRef.current;

    setKanbanSpinner(true);
    setKanbanTickets([]);

    let page = 1;
    let totalPages = 1;

    try {
      const { group_title, search, workflow, ...restAttributes } = filters;

      // Эффективный workflow: если не указан — без закрытых статусов
      const effectiveWorkflow = getEffectiveWorkflow(
        workflow,
        workflowOptions,
        !!search?.trim()
      );

      while (page <= totalPages) {
        if (reqId !== kanbanReqIdRef.current) return;

        const res = await api.tickets.filters({
          page,
          type: "light",
          group_title: group_title || groupTitleForApi,
          attributes: {
            ...restAttributes,
            workflow: effectiveWorkflow,
            ...(search?.trim() ? { search: search.trim() } : {}),
          },
        });

        if (reqId !== kanbanReqIdRef.current) return;

        const normalized = res.tickets.map((t) => ({
          ...t,
          last_message: t.last_message || getLanguageByKey("no_messages"),
          time_sent: t.time_sent || null,
          unseen_count: t.unseen_count || 0,
        }));

        setKanbanTickets((prev) => [...prev, ...normalized]);

        totalPages = res.pagination?.total_pages || 1;
        page += 1;
      }
    } catch (e) {
      if (reqId === kanbanReqIdRef.current) {
        enqueueSnackbar(showServerError(e), { variant: "error" });
      }
    } finally {
      if (reqId === kanbanReqIdRef.current) {
        setKanbanSpinner(false);
      }
    }
  }, [enqueueSnackbar, groupTitleForApi, workflowOptions]);

  /**
   * Обновление тикетов с текущими фильтрами
   * @param {Object} filters - текущие фильтры
   */
  const refreshKanbanTickets = useCallback((filters = {}) => {
    if (kanbanFilterActive) {
      fetchKanbanTickets(filters);
    }
  }, [kanbanFilterActive, fetchKanbanTickets]);

  /**
   * Сброс канбана к глобальным тикетам
   */
  const resetKanban = useCallback(() => {
    setKanbanFilterActive(false);
    setKanbanTickets([]);
    setChoiceWorkflow([]);
  }, []);

  // Синхронизация с глобальными тикетами при их обновлении
  useEffect(() => {
    if (kanbanFilterActive && kanbanTickets.length > 0) {
      const globalTicketsMap = new Map(globalTickets.map(ticket => [ticket.id, ticket]));

      setKanbanTickets(prevKanbanTickets => {
        let hasChanges = false;
        const updatedTickets = prevKanbanTickets.map(localTicket => {
          const globalTicket = globalTicketsMap.get(localTicket.id);
          if (globalTicket && JSON.stringify(localTicket) !== JSON.stringify(globalTicket)) {
            hasChanges = true;
            return globalTicket;
          }
          return localTicket;
        });

        return hasChanges ? updatedTickets : prevKanbanTickets;
      });
    }
  }, [globalTickets, kanbanFilterActive]);

  // Видимые тикеты: отфильтрованные или глобальные
  const visibleTickets = useMemo(() => {
    return (kanbanFilterActive || kanbanSpinner) ? kanbanTickets : globalTickets;
  }, [kanbanFilterActive, kanbanSpinner, kanbanTickets, globalTickets]);

  // Какой метод использовать для обновления
  const currentFetchTickets = useMemo(() => {
    return kanbanFilterActive ? fetchKanbanTickets : fetchGlobalLight;
  }, [kanbanFilterActive, fetchKanbanTickets, fetchGlobalLight]);

  return {
    // Данные
    visibleTickets,
    kanbanTickets,
    kanbanSpinner,
    kanbanFilterActive,
    choiceWorkflow,

    // Действия
    fetchKanbanTickets,
    currentFetchTickets,
    refreshKanbanTickets,
    resetKanban,
    setKanbanTickets,
    setKanbanFilterActive,
    setChoiceWorkflow,
  };
};
