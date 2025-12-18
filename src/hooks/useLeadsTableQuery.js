/**
 * React Query хук для загрузки hard тикетов (LIST режим)
 * 
 * Заменяет логику useLeadsTable.
 * URL (через useLeadsFilters) — единственный источник правды для фильтров.
 * Использует useTicketCacheSync для синхронизации с WebSocket.
 */

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useCallback, useState, useEffect, useContext } from "react";
import { UserContext } from "../contexts/UserContext";
import { api } from "../api";
import { getEffectiveWorkflow, DEFAULT_PER_PAGE, DEFAULT_PAGE } from "../Components/LeadsComponent/constants";
import { cleanFilters } from "../utils/ticketFilters";
import { useTicketCacheSync } from "./useTicketCacheSync";

/**
 * Загрузка hard тикетов
 */
const fetchHardTickets = async ({
  page,
  perPage,
  groupTitle,
  workflowOptions,
  filters,
}) => {
  const { search, group_title, workflow, ...restFilters } = filters;
  const isSearching = !!search?.trim();

  // Эффективный workflow: если не указан — без закрытых (или все при поиске)
  const effectiveWorkflow = getEffectiveWorkflow(workflow, workflowOptions, isSearching);

  const response = await api.tickets.filters({
    page,
    type: "hard",
    group_title: groupTitle,
    sort_by: "creation_date",
    order: "DESC",
    limit: perPage,
    attributes: {
      ...restFilters,
      workflow: effectiveWorkflow,
      ...(search?.trim() ? { search: search.trim() } : {}),
    },
  });

  return {
    tickets: response.data || [],
    total: response.pagination?.total || 0,
    totalPages: response.pagination?.total_pages || 1,
    page,
  };
};

/**
 * Хук для загрузки hard тикетов с пагинацией
 * 
 * @param {Object} options
 * @param {Object} options.filters - фильтры из useLeadsFilters
 * @param {boolean} options.enabled - включить загрузку
 */
export const useLeadsTableQuery = ({ filters: rawFilters = {}, enabled = true } = {}) => {
  const queryClient = useQueryClient();
  const { groupTitleForApi, workflowOptions } = useContext(UserContext);

  // Пагинация (локальное состояние)
  const [currentPage, setCurrentPage] = useState(DEFAULT_PAGE);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);

  // Очищаем фильтры от undefined значений
  const filters = useMemo(() => cleanFilters(rawFilters), [rawFilters]);
  
  // Стабильный ключ для фильтров
  const filtersKey = useMemo(() => JSON.stringify(filters), [filters]);

  // Ключ кэша
  const queryKey = useMemo(
    () => ["tickets", "leads", "hard", groupTitleForApi, currentPage, perPage, filtersKey],
    [groupTitleForApi, currentPage, perPage, filtersKey]
  );

  // React Query
  const {
    data,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: () =>
      fetchHardTickets({
        page: currentPage,
        perPage,
        groupTitle: groupTitleForApi,
        workflowOptions,
        filters,
      }),
    enabled: enabled && !!groupTitleForApi && workflowOptions.length > 0,
    staleTime: 30 * 1000, // 30 секунд
    refetchOnWindowFocus: false,
  });

  // Сброс страницы при изменении фильтров
  useEffect(() => {
    setCurrentPage(DEFAULT_PAGE);
  }, [filtersKey, groupTitleForApi]);

  // Данные
  const hardTickets = data?.tickets || [];
  const totalLeads = data?.total || 0;
  const totalPages = data?.totalPages || 1;

  // Изменение количества элементов на странице
  const handlePerPageChange = useCallback((next) => {
    const n = Number(next);
    if (!n || n === perPage) return;
    setCurrentPage(DEFAULT_PAGE);
    setPerPage(n);
  }, [perPage]);

  // Инвалидация кэша
  const invalidateCache = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: ["tickets", "leads", "hard"],
    });
  }, [queryClient]);

  // Обновление тикета в кэше
  const updateTicketInCache = useCallback((ticketId, updatedData) => {
    queryClient.setQueryData(queryKey, (oldData) => {
      if (!oldData?.tickets) return oldData;
      return {
        ...oldData,
        tickets: oldData.tickets.map((t) =>
          t.id === ticketId ? { ...t, ...updatedData } : t
        ),
      };
    });
  }, [queryClient, queryKey]);

  // Синхронизация кэша с WebSocket через TicketSyncContext
  // Для Table не удаляем тикеты при изменении — просто обновляем данные
  const { updateTicket } = useTicketCacheSync({
    queryKey,
    filters,
    matchFn: null, // Всегда обновляем, не удаляем
    dataPath: "tickets", // простой query, не infinite
  });

  return {
    // Данные
    hardTickets,
    totalLeads,
    totalPages,
    currentPage,
    perPage,

    // Состояние загрузки
    isLoading,
    isFetching,
    error,

    // Действия
    setCurrentPage,
    handlePerPageChange,
    refetch,
    invalidateCache,
    updateTicketInCache,

    // Для совместимости со старым API
    loading: isLoading || isFetching,
    fetchHardTickets: refetch,
  };
};
