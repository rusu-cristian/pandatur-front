import { useCallback, useRef, useState } from "react";
import { useSnackbar } from "notistack";
import { useApp } from "./useApp";
import { api } from "../api";
import { showServerError } from "../Components/utils";
import { getEffectiveWorkflow, DEFAULT_PER_PAGE, DEFAULT_PAGE } from "../Components/LeadsComponent/constants";

/**
 * Хук для работы с таблицей Leads (hard тикеты)
 * 
 * РЕФАКТОРИНГ:
 * - Убраны локальные hardTicketFilters — фильтры приходят из URL через useLeadsFilters
 * - Упрощена логика — хук только загружает данные и управляет пагинацией
 */
export const useLeadsTable = () => {
  const { enqueueSnackbar } = useSnackbar();
  const { groupTitleForApi, workflowOptions } = useApp();

  // Данные
  const [hardTickets, setHardTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalLeads, setTotalLeads] = useState(0);
  
  // Пагинация
  const [currentPage, setCurrentPage] = useState(DEFAULT_PAGE);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);

  // Защита от race condition
  const hardReqIdRef = useRef(0);

  /**
   * Загрузка hard тикетов с фильтрами
   * @param {Object} options - опции запроса
   * @param {number} options.page - номер страницы
   * @param {Object} options.filters - фильтры из URL (через useLeadsFilters)
   * @param {string} options.searchTerm - поисковый запрос
   */
  const fetchHardTickets = useCallback(async ({ 
    page = currentPage, 
    filters = {}, 
    searchTerm = "" 
  } = {}) => {
    if (!groupTitleForApi || !workflowOptions.length) return;

    const reqId = ++hardReqIdRef.current;

    try {
      setLoading(true);

      const { search, group_title, workflow, ...restFilters } = filters;
      const effectiveSearch = searchTerm || search;
      const isSearching = !!effectiveSearch?.trim();

      // Эффективный workflow: если не указан — без закрытых (или все при поиске)
      const effectiveWorkflow = getEffectiveWorkflow(
        workflow,
        workflowOptions,
        isSearching
      );

      const response = await api.tickets.filters({
        page,
        type: "hard",
        group_title: groupTitleForApi,
        sort_by: "creation_date",
        order: "DESC",
        limit: perPage,
        attributes: {
          ...restFilters,
          workflow: effectiveWorkflow,
          ...(effectiveSearch?.trim() ? { search: effectiveSearch.trim() } : {}),
        },
      });

      if (reqId !== hardReqIdRef.current) return;

      setHardTickets(response.data);
      setTotalLeads(response.pagination?.total || 0);
    } catch (error) {
      if (reqId === hardReqIdRef.current) {
        enqueueSnackbar(showServerError(error), { variant: "error" });
      }
    } finally {
      if (reqId === hardReqIdRef.current) {
        setLoading(false);
      }
    }
  }, [enqueueSnackbar, groupTitleForApi, workflowOptions, perPage, currentPage]);

  /**
   * Изменение количества элементов на странице
   */
  const handlePerPageChange = useCallback((next) => {
    const n = Number(next);
    if (!n || n === perPage) return;
    setCurrentPage(DEFAULT_PAGE);
    setPerPage(n);
  }, [perPage]);

  /**
   * Сброс к начальному состоянию
   */
  const resetTable = useCallback(() => {
    setHardTickets([]);
    setCurrentPage(DEFAULT_PAGE);
    setTotalLeads(0);
  }, []);

  return {
    // Данные
    hardTickets,
    loading,
    totalLeads,
    currentPage,
    perPage,

    // Действия
    fetchHardTickets,
    setCurrentPage,
    handlePerPageChange,
    resetTable,
  };
};
