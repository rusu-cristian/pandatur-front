import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSnackbar } from "notistack";
import { useApp } from "@hooks";
import { api } from "../api";
import { showServerError, getLanguageByKey } from "@utils";

/**
 * Отвечает за канбан: загрузка light, локальные фильтры, поиск, спиннеры, видимые тикеты.
 */
// Закрытые статусы, которые исключаются по умолчанию
const EXCLUDED_WORKFLOWS = ["Realizat cu succes", "Închis și nerealizat"];

export const useLeadsKanban = () => {
    const { enqueueSnackbar } = useSnackbar();
    const {
        tickets: globalTickets,
        fetchTickets: fetchGlobalLight,
        groupTitleForApi,
        workflowOptions,
        setLightTicketFilters,
    } = useApp();

    // local state
    const [kanbanTickets, setKanbanTickets] = useState([]);
    const [kanbanFilters, setKanbanFilters] = useState({});
    const [kanbanSearchTerm, setKanbanSearchTerm] = useState("");
    const [kanbanSpinner, setKanbanSpinner] = useState(false);
    const [kanbanFilterActive, setKanbanFilterActive] = useState(false);
    const [selectedWorkflow, setSelectedWorkflow] = useState([]); // для подсветки выбранных колонок
    const [choiceWorkflow, setChoiceWorkflow] = useState([]);     // прокидывается в WorkflowColumns

    const isSearching = !!kanbanSearchTerm?.trim();
    
    // Защита от "гонки" - отслеживаем актуальный запрос
    const kanbanReqIdRef = useRef(0);

    // загрузка light с локальными фильтрами (для канбана)
    const fetchKanbanTickets = useCallback(async (filters = {}) => {
        // Увеличиваем ID запроса - это делает предыдущие запросы неактуальными
        const reqId = ++kanbanReqIdRef.current;
        
        setKanbanSpinner(true);
        setKanbanFilters(filters);
        setKanbanTickets([]);

        let page = 1;
        let totalPages = 1;

        try {
            const { group_title, search, workflow, ...restAttributes } = filters;

            // Определяем workflow для запроса:
            // - Если явно указан в фильтрах — используем его
            // - Иначе — используем все workflow БЕЗ закрытых (дефолтное поведение)
            const effectiveWorkflow =
                Array.isArray(workflow) && workflow.length > 0
                    ? workflow
                    : workflowOptions.filter((w) => !EXCLUDED_WORKFLOWS.includes(w));

            while (page <= totalPages) {
                // Проверяем перед каждым запросом: актуален ли еще этот запрос?
                if (reqId !== kanbanReqIdRef.current) {
                    return; // Если начался новый запрос - останавливаем текущий
                }

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

                // Проверяем после получения ответа: актуален ли еще этот запрос?
                if (reqId !== kanbanReqIdRef.current) {
                    return; // Если начался новый запрос - не обновляем состояние
                }

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
            // Показываем ошибку только если этот запрос еще актуален
            if (reqId === kanbanReqIdRef.current) {
                enqueueSnackbar(showServerError(e), { variant: "error" });
            }
        } finally {
            // Убираем спиннер только если этот запрос еще актуален
            if (reqId === kanbanReqIdRef.current) {
                setKanbanSpinner(false);
            }
        }
    }, [enqueueSnackbar, groupTitleForApi, workflowOptions]);

    // ручной запуск поиска (вызывается при нажатии на кнопку поиска)
    const triggerSearch = useCallback(() => {
        if (!groupTitleForApi) return;

        const searchValue = kanbanSearchTerm?.trim();
        if (searchValue) {
            setKanbanFilterActive(true);
            fetchKanbanTickets({
                ...kanbanFilters,
                search: searchValue,
            });
        } else {
            // очищаем локальный список и выключаем флаг активного фильтра
            setKanbanTickets([]);
            setKanbanFilterActive(false);
        }
    }, [kanbanSearchTerm, kanbanFilters, groupTitleForApi, fetchKanbanTickets]);

    // синхронизация локального состояния канбана с глобальным при обновлении тикетов
    useEffect(() => {
        if (kanbanFilterActive && kanbanTickets.length > 0) {
            // Создаем Map для быстрого поиска обновленных тикетов
            const globalTicketsMap = new Map(globalTickets.map(ticket => [ticket.id, ticket]));
            
            // Обновляем локальные тикеты, если они изменились в глобальном состоянии
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

    // вычисление видимых тикетов
    const visibleTickets = useMemo(() => {
        return (kanbanFilterActive || kanbanSpinner) ? kanbanTickets : globalTickets;
    }, [kanbanFilterActive, kanbanSpinner, kanbanTickets, globalTickets]);

    // какой метод подхватит WorkflowColumns при "обновить"
    const currentFetchTickets = useMemo(() => {
        return kanbanFilterActive ? fetchKanbanTickets : fetchGlobalLight;
    }, [kanbanFilterActive, fetchKanbanTickets, fetchGlobalLight]);

    // программное применение фильтров из модалки
    const applyKanbanFilters = useCallback((selectedFilters) => {
        setLightTicketFilters(selectedFilters); // чтобы дефолтная загрузка знала, что было выбрано
        setKanbanFilters(selectedFilters);
        setKanbanFilterActive(true);
    }, [setLightTicketFilters]);

    // принудительное обновление отфильтрованных тикетов
    const refreshKanbanTickets = useCallback(() => {
        if (kanbanFilterActive) {
            // Пересчитываем фильтры с текущими параметрами
            fetchKanbanTickets(kanbanFilters);
        }
    }, [kanbanFilterActive, kanbanFilters, fetchKanbanTickets]);

    // полный сброс канбана (как в handleReset)
    const resetKanban = useCallback(() => {
        setKanbanFilters({});
        setKanbanFilterActive(false);
        setKanbanTickets([]);
        setKanbanSearchTerm("");
    }, []);

    return {
        // data
        visibleTickets,
        kanbanTickets,
        kanbanFilters,
        kanbanSpinner,
        kanbanFilterActive,
        selectedWorkflow,
        choiceWorkflow,

        // search
        kanbanSearchTerm,
        setKanbanSearchTerm,
        isSearching,
        triggerSearch,

        // actions
        fetchKanbanTickets,
        currentFetchTickets,
        applyKanbanFilters,
        refreshKanbanTickets,
        resetKanban,
        setKanbanFilters,
        setKanbanTickets,
        setKanbanFilterActive,
        setSelectedWorkflow,
        setChoiceWorkflow,
    };
};
