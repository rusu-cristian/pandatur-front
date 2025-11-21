import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useApp } from "@hooks";
import { parseFiltersFromUrl } from "../Components/utils/parseFiltersFromUrl";
import { VIEW_MODE } from "@components/LeadsComponent/utils";

export const useLeadsUrlSync = ({
    viewMode,
    setViewMode,

    // kanban
    setKanbanFilters,
    setKanbanFilterActive,
    fetchKanbanTickets,
    setChoiceWorkflow,

    // table
    handleApplyFiltersHardTicket,

    // groupTitle sync
    accessibleGroupTitles,
    customGroupTitle,
    setCustomGroupTitle,
}) => {
    const [searchParams] = useSearchParams();
    const { groupTitleForApi, workflowOptions } = useApp();

    const [filtersReady, setFiltersReady] = useState(false);

    const isGroupTitleSyncedRef = useRef(false);
    const hardApplyRef = useRef(handleApplyFiltersHardTicket);
    const lastHardAppliedRef = useRef(null);

    useEffect(() => {
        hardApplyRef.current = handleApplyFiltersHardTicket;
    }, [handleApplyFiltersHardTicket]);

    const areEqual = (a, b) => {
        if (a === b) return true;
        if (!a || !b) return false;
        try { return JSON.stringify(a) === JSON.stringify(b); } catch { return false; }
    };

    // синк view из URL
    useEffect(() => {
        const urlView = searchParams.get("view");
        const urlViewUpper = urlView ? urlView.toUpperCase() : undefined;
        if (urlViewUpper && urlViewUpper !== viewMode) {
            setViewMode(urlViewUpper);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams, viewMode, setViewMode]);

    // главный эффект: применяем фильтры из URL, но В ЛЮБОМ СЛУЧАЕ выставляем filtersReady(true)
    useEffect(() => {
        const ctxReady = !!groupTitleForApi && Array.isArray(workflowOptions) && workflowOptions.length > 0;
        if (!ctxReady) return;

        const parsed = parseFiltersFromUrl(searchParams);
        const urlGroupTitle = parsed.group_title ?? null;
        const type = searchParams.get("type");
        // group_title не считается фильтром, это параметр контекста
        const { group_title, ...actualFilters } = parsed;
        const hasUrlFilters = Object.keys(actualFilters).length > 0;

        // 1) сначала пробуем синхронизировать group_title из URL
        if (
            urlGroupTitle &&
            Array.isArray(accessibleGroupTitles) &&
            accessibleGroupTitles.includes(urlGroupTitle) &&
            customGroupTitle !== urlGroupTitle
        ) {
            setCustomGroupTitle(urlGroupTitle);
            isGroupTitleSyncedRef.current = true;
            return; // подождём следующий прогон
        }

        // 2) после синка group_title применяем фильтры из URL
        if (isGroupTitleSyncedRef.current && urlGroupTitle && customGroupTitle === urlGroupTitle) {
            if (type === "light" && viewMode === VIEW_MODE.KANBAN) {
                setKanbanFilters(parsed);
                setKanbanFilterActive(true);
                fetchKanbanTickets(parsed);
                setChoiceWorkflow(parsed.workflow || []);
            } else if (type === "hard" && viewMode === VIEW_MODE.LIST) {
                if (!areEqual(lastHardAppliedRef.current, parsed)) {
                    lastHardAppliedRef.current = parsed;
                    hardApplyRef.current(parsed);
                }
            }
            isGroupTitleSyncedRef.current = false;
            setFiltersReady(true); // ВСЕГДА поднимаем
            return;
        }

        // 3) обычный путь: либо group_title уже совпал, либо его НЕТ в URL (тоже считаем «синхронизированным»)
        const groupTitleAligned = !urlGroupTitle || customGroupTitle === urlGroupTitle;

        if (!isGroupTitleSyncedRef.current && groupTitleAligned) {
            if (type === "light" && viewMode === VIEW_MODE.KANBAN) {
                if (hasUrlFilters) {
                    setKanbanFilters(parsed);
                    setKanbanFilterActive(true);
                    fetchKanbanTickets(parsed);
                    setChoiceWorkflow(parsed.workflow || []);
                } else {
                    setKanbanFilterActive(false);
                    setKanbanFilters({});
                }
                setFiltersReady(true); // ВСЕГДА поднимаем
                return;
            }

            if (type === "hard" && viewMode === VIEW_MODE.LIST) {
                if (hasUrlFilters) {
                    if (!areEqual(lastHardAppliedRef.current, parsed)) {
                        lastHardAppliedRef.current = parsed;
                        hardApplyRef.current(parsed);
                    }
                } else {
                    // не трогаем API здесь: дефолтный fetch уйдёт из компонента по filtersReady && LIST
                    lastHardAppliedRef.current = null;
                }
                setFiltersReady(true); // ВСЕГДА поднимаем
                return;
            }

            // тип не задан/не совпал — но как договаривались, всё равно поднимаем
            setFiltersReady(true);
            return;
        }

        // если дошли сюда (редко) — всё равно освобождаем внешний эффект
        setFiltersReady(true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        searchParams.toString(),
        viewMode,
        groupTitleForApi,
        workflowOptions,
        accessibleGroupTitles,
        customGroupTitle,
        setCustomGroupTitle,
        setKanbanFilters,
        setKanbanFilterActive,
        fetchKanbanTickets,
        setChoiceWorkflow,
    ]);

    return { filtersReady };
};
