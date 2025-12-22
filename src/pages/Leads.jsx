/**
 * Leads Page
 * 
 * Архитектура:
 * - useLeadsFilters — единый источник правды для фильтров (URL)
 * - useLeadsKanbanQuery — React Query хук для light тикетов (Kanban)
 * - useLeadsTableQuery — React Query хук для hard тикетов (List)
 * - LeadsPageHeader — header с поиском и фильтрами
 * - LeadsContent — таблица или канбан
 * - LeadsModals — все модалки
 */

import { useState, useEffect, useRef, useCallback, useContext, useTransition } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSnackbar } from "notistack";
import { 
  useDOMElementHeight, 
  useConfirmPopup, 
  useGetTechniciansList, 
  useLeadsFilters, 
  useSearchInput,
  useLeadsTableQuery,
  useLeadsKanbanQuery,
} from "@hooks";
import { useUI } from "../contexts/UIContext";
import { UserContext } from "../contexts/UserContext";
import { priorityOptions, groupTitleOptions } from "../FormOptions";
import { workflowOptions as defaultWorkflowOptions } from "../FormOptions/workflowOptions";
import { SpinnerRightBottom } from "@components";
import { LeadsPageHeader, LeadsContent, LeadsModals } from "../Components/LeadsComponent";
import { getLanguageByKey, showServerError } from "../Components/utils";
import { api } from "../api";
import { VIEW_MODE, getEffectiveWorkflow } from "../Components/LeadsComponent/constants";
import "../css/SnackBarComponent.css";
import "../Components/LeadsComponent/LeadsHeader/LeadsFilter.css";

import { useLeadsSelection } from "../hooks/useLeadsSelection";

export const Leads = () => {
  const refLeadsHeader = useRef();
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();
  const leadsFilterHeight = useDOMElementHeight(refLeadsHeader);

  // === КОНТЕКСТ (специализированные хуки) ===
  const { isCollapsed } = useUI();
  const {
    groupTitleForApi,
    workflowOptions,
    accessibleGroupTitles,
    customGroupTitle,
    setCustomGroupTitle,
  } = useContext(UserContext);

  // === ФИЛЬТРЫ (URL как источник правды) ===
  const {
    viewMode,
    filters,
    hasFilters,
    apiAttributes,
    setViewMode,
    updateFilters,
    syncGroupTitleFromUrl,
    updateGroupTitle,
    kanbanUrl,
    listUrl,
  } = useLeadsFilters();

  // === URL ПАРАМЕТРЫ ===
  const { ticketId } = useParams();
  const { technicians } = useGetTechniciansList();

  // === МОДАЛКИ ===
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentTicket, setCurrentTicket] = useState(null);
  const [isOpenAddLeadModal, setIsOpenAddLeadModal] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(!!ticketId);

  // startTransition для не-срочных обновлений UI (открытие тяжёлых модалок)
  const [, startTransition] = useTransition();

  // === ПОИСК ===
  const {
    inputValue: searchInputValue,
    handleInputChange: handleSearchInputChange,
    handleKeyPress: handleSearchKeyPress,
    handleSearch,
    handleClear: handleSearchClear,
    hasValue: hasSearchValue,
  } = useSearchInput({
    urlValue: filters.search,
    onSearch: (term) => updateFilters({ search: term }),
  });

  // === REFS ===
  const allIdsReqIdRef = useRef(0);

  // === КАНБАН (React Query) ===
  const {
    visibleTickets,
    kanbanSpinner,
    kanbanFilterActive,
    choiceWorkflow,
    refetch: refetchKanban,
    setChoiceWorkflow,
  } = useLeadsKanbanQuery({
    filters,
    hasFilters,
    enabled: viewMode === VIEW_MODE.KANBAN,
  });

  // === ТАБЛИЦА (React Query) ===
  const {
    hardTickets,
    loading,
    totalLeads,
    currentPage,
    perPage,
    refetch: refetchTable,
    setCurrentPage,
    handlePerPageChange,
  } = useLeadsTableQuery({
    filters,
    enabled: viewMode === VIEW_MODE.LIST,
  });

  // === ВЫДЕЛЕНИЕ ===
  const {
    selectedTickets,
    setSelectedTickets,
    toggleSelectTicket,
    toggleSelectAll,
    responsibleId,
  } = useLeadsSelection({
    listForSelection: viewMode === VIEW_MODE.LIST ? hardTickets : visibleTickets,
  });

  // === IDs ДЛЯ "ВЫБРАТЬ ВСЕ" ===
  const [allHardIds, setAllHardIds] = useState([]);
  const isAllResultsSelected = allHardIds.length > 0 && selectedTickets.length === allHardIds.length;

  // === ЭФФЕКТЫ ===

  // Синхронизация group_title из URL
  useEffect(() => {
    syncGroupTitleFromUrl();
  }, [syncGroupTitleFromUrl]);

  // React Query автоматически загружает данные при изменении фильтров/режима
  // Больше не нужны ручные эффекты для загрузки!

  // IDs запрос для "выбрать все"
  useEffect(() => {
    if (viewMode !== VIEW_MODE.LIST || !groupTitleForApi || !workflowOptions.length) return;

    const reqId = ++allIdsReqIdRef.current;
    const effectiveWorkflow = getEffectiveWorkflow(filters.workflow, workflowOptions, !!filters.search?.trim());

    (async () => {
      try {
        const res = await api.tickets.filters({
          type: "id",
          group_title: groupTitleForApi,
          attributes: { ...apiAttributes, workflow: effectiveWorkflow },
        });
        if (reqId !== allIdsReqIdRef.current) return;
        setAllHardIds(Array.isArray(res?.data) ? res.data : []);
      } catch (err) {
        if (reqId === allIdsReqIdRef.current) {
          enqueueSnackbar(showServerError(err), { variant: "error" });
        }
      }
    })();
  }, [viewMode, groupTitleForApi, workflowOptions, apiAttributes, filters, enqueueSnackbar]);

  // Сброс выделения при изменении фильтров
  useEffect(() => {
    setSelectedTickets([]);
    setAllHardIds([]);
  }, [groupTitleForApi, JSON.stringify(filters), setSelectedTickets]);

  // Открытие чата — НЕ загружаем тикет здесь, SingleChat сам загрузит
  // и передаст данные через TicketsContext
  useEffect(() => {
    if (ticketId) {
      setIsChatOpen(true);
    }
  }, [ticketId]);

  // === ОБРАБОТЧИКИ ===

  const handleChangeViewMode = useCallback((mode) => {
    setViewMode(mode.toUpperCase?.() || mode);
    setCurrentPage(1);
  }, [setViewMode, setCurrentPage]);

  const deleteBulkLeads = useConfirmPopup({
    subTitle: getLanguageByKey("Sigur doriți să ștergeți aceste leaduri"),
  });

  const handleDelete = useCallback(async () => {
    deleteBulkLeads(async () => {
      try {
        await api.tickets.deleteById(selectedTickets);
        setSelectedTickets([]);
        enqueueSnackbar(getLanguageByKey("Leadurile au fost șterse cu succes"), { variant: "success" });
        // React Query автоматически обновит список
        if (viewMode === VIEW_MODE.LIST) {
          refetchTable();
        } else {
          refetchKanban();
        }
      } catch (error) {
        enqueueSnackbar(getLanguageByKey("A aparut o eroare la ștergere"), { variant: "error" });
      }
    });
  }, [deleteBulkLeads, selectedTickets, setSelectedTickets, enqueueSnackbar, viewMode, refetchTable, refetchKanban]);

  const handleCreate = useCallback(() => {
    setCurrentTicket({
      contact: "",
      transport: "",
      country: "",
      priority: priorityOptions[0],
      workflow: defaultWorkflowOptions[0],
      service_reference: "",
      technician_id: 0,
    });
    setIsOpenAddLeadModal(true);
  }, []);

  const handleGroupTitleChange = useCallback((val) => {
    if (val && accessibleGroupTitles.includes(val)) {
      setCustomGroupTitle(val);
      localStorage.setItem("leads_last_group_title", val);
      updateGroupTitle(val);
    } else {
      setCustomGroupTitle(null);
      localStorage.removeItem("leads_last_group_title");
      updateGroupTitle(null);
    }
    // React Query автоматически перезагрузит данные при смене группы
  }, [accessibleGroupTitles, setCustomGroupTitle, updateGroupTitle]);

  const handleEditTicket = useCallback((ticket) => {
    setCurrentTicket(ticket);
    setIsModalOpen(true);
  }, []);

  const handleRefreshAfterEdit = useCallback(async () => {
    // React Query автоматически обновит данные
    if (viewMode === VIEW_MODE.LIST) {
      refetchTable();
    } else {
      refetchKanban();
    }
  }, [viewMode, refetchTable, refetchKanban]);

  // === ВЫЧИСЛЯЕМЫЕ ЗНАЧЕНИЯ ===
  const groupTitleSelectData = groupTitleOptions.filter((o) => accessibleGroupTitles.includes(o.value));
  const isLoading = loading || kanbanSpinner;
  const ticketCount = viewMode === VIEW_MODE.LIST ? totalLeads : visibleTickets.length;

  // === РЕНДЕР ===
  return (
    <>
      <LeadsPageHeader
        ref={refLeadsHeader}
        ticketCount={ticketCount}
        viewMode={viewMode}
        isCollapsed={isCollapsed}
        hasFilters={hasFilters}
        isLoading={isLoading}
        selectedTickets={selectedTickets}
        responsibleId={responsibleId}
        groupTitleValue={customGroupTitle ?? groupTitleForApi}
        groupTitleSelectData={groupTitleSelectData}
        kanbanUrl={kanbanUrl}
        listUrl={listUrl}
        searchInputValue={searchInputValue}
        hasSearchValue={hasSearchValue}
        onSearchInputChange={handleSearchInputChange}
        onSearchKeyPress={handleSearchKeyPress}
        onSearch={handleSearch}
        onSearchClear={handleSearchClear}
        onFilterOpen={() => startTransition(() => setIsFilterModalOpen(true))}
        onGroupTitleChange={handleGroupTitleChange}
        onViewModeChange={handleChangeViewMode}
        onDelete={handleDelete}
        onEdit={() => setIsModalOpen(true)}
        onCreate={handleCreate}
      />

      <LeadsContent
        viewMode={viewMode}
        loading={loading}
        leadsFilterHeight={leadsFilterHeight}
        hardTickets={hardTickets}
        currentPage={currentPage}
        perPage={perPage}
        totalLeads={totalLeads}
        selectedTickets={selectedTickets}
        allHardIds={allHardIds}
        isAllResultsSelected={isAllResultsSelected}
        visibleTickets={visibleTickets}
        kanbanFilterActive={kanbanFilterActive}
        choiceWorkflow={choiceWorkflow}
        searchTerm={filters.search || ""}
        onSelectRow={toggleSelectTicket}
        onToggleAll={toggleSelectAll}
        onChangePagination={setCurrentPage}
        onPerPageChange={handlePerPageChange}
        onSelectAllResults={() => setSelectedTickets(allHardIds)}
        onClearAllResults={() => setSelectedTickets([])}
        fetchTickets={refetchKanban}
        refreshKanbanTickets={refetchKanban}
        onEditTicket={handleEditTicket}
      />

      {/* Спиннер загрузки */}
      {kanbanSpinner && viewMode === VIEW_MODE.KANBAN && <SpinnerRightBottom />}

      <LeadsModals
        isChatOpen={isChatOpen}
        ticketId={ticketId}
        technicians={technicians}
        onChatClose={() => { 
          setIsChatOpen(false); 
          // Сохраняем текущие фильтры при закрытии чата
          navigate(`/leads${window.location.search}`); 
        }}
        isAddModalOpen={isOpenAddLeadModal}
        groupTitleForApi={groupTitleForApi}
        onAddModalClose={() => setIsOpenAddLeadModal(false)}
        onAddSuccess={() => viewMode === VIEW_MODE.LIST ? refetchTable() : refetchKanban()}
        isFilterModalOpen={isFilterModalOpen}
        filters={filters}
        isLoading={isLoading}
        onFilterModalClose={() => setIsFilterModalOpen(false)}
        isEditModalOpen={isModalOpen}
        selectedTickets={selectedTickets}
        currentTicketId={currentTicket?.id}
        onEditModalClose={() => setIsModalOpen(false)}
        onEditSuccess={handleRefreshAfterEdit}
      />
    </>
  );
};
