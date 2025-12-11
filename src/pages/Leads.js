/**
 * Leads Page — Рефакторенная версия
 * 
 * Архитектура:
 * - useLeadsFilters — единый источник правды для фильтров (URL)
 * - useLeadsKanban — загрузка light тикетов для Kanban
 * - useLeadsTable — загрузка hard тикетов для List
 * - LeadsFilter — единый компонент фильтра
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useSnackbar } from "notistack";
import { Divider, Modal, Button, ActionIcon, Input, SegmentedControl, Flex, Select, Loader } from "@mantine/core";
import { ChatModal } from "../Components/ChatComponent/ChatModal";
import { useDOMElementHeight, useApp, useConfirmPopup, useGetTechniciansList, useLeadsFilters } from "@hooks";
import { priorityOptions, groupTitleOptions } from "../FormOptions";
import { workflowOptions as defaultWorkflowOptions } from "../FormOptions/workflowOptions";
import { SpinnerRightBottom, AddLeadModal, PageHeader, Spin } from "@components";
import { WorkflowColumns } from "../Components/Workflow/WorkflowColumns";
import { ManageLeadInfoTabs } from "../Components/LeadsComponent/ManageLeadInfoTabs";
import { LeadsFilter } from "../Components/LeadsComponent/LeadsFilter";
import SingleChat from "@components/ChatComponent/SingleChat";
import { LeadTable } from "../Components/LeadsComponent/LeadTable/LeadTable";
import Can from "../Components/CanComponent/Can";
import { getTotalPages, getLanguageByKey, showServerError } from "../Components/utils";
import { api } from "../api";
import { VIEW_MODE, VIEW_MODE_URL, getEffectiveWorkflow } from "../Components/LeadsComponent/constants";
import { FaTrash, FaEdit, FaList } from "react-icons/fa";
import { IoMdAdd, IoMdClose } from "react-icons/io";
import { TbLayoutKanbanFilled } from "react-icons/tb";
import { LuFilter } from "react-icons/lu";
import { Search as SearchIcon } from "@mui/icons-material";
import "../css/SnackBarComponent.css";
import "../Components/LeadsComponent/LeadsHeader/LeadsFilter.css";

import { useLeadsKanban } from "../hooks/useLeadsKanban";
import { useLeadsTable } from "../hooks/useLeadsTable";
import { useLeadsSelection } from "../hooks/useLeadsSelection";

export const Leads = () => {
  const refLeadsHeader = useRef();
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();
  const leadsFilterHeight = useDOMElementHeight(refLeadsHeader);

  // === КОНТЕКСТ ПРИЛОЖЕНИЯ ===
  const {
    tickets,
    spinnerTickets,
    fetchTickets,
    groupTitleForApi,
    workflowOptions,
    isCollapsed,
    accessibleGroupTitles,
    customGroupTitle,
    setCustomGroupTitle,
  } = useApp();

  // === ЕДИНЫЙ ХУК ДЛЯ ФИЛЬТРОВ (URL как источник правды) ===
  const {
    viewMode,
    filters,
    hasFilters,
    apiAttributes,
    setViewMode,
    resetFilters,
    updateFilters,
    syncGroupTitleFromUrl,
    updateGroupTitle,
  } = useLeadsFilters();

  // === ПАРАМЕТРЫ URL ===
  const { ticketId } = useParams();
  const { technicians } = useGetTechniciansList();

  // === ЛОКАЛЬНОЕ СОСТОЯНИЕ ===
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentTicket, setCurrentTicket] = useState(null);
  const [isOpenAddLeadModal, setIsOpenAddLeadModal] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(!!ticketId);
  const [localSearchTerm, setLocalSearchTerm] = useState("");

  // Ref для предотвращения повторной загрузки глобальных тикетов
  const didLoadGlobalTicketsRef = useRef(false);
  const prevFiltersRef = useRef(null);

  // === КАНБАН (light) ===
  const {
    visibleTickets,
    kanbanSpinner,
    kanbanFilterActive,
    choiceWorkflow,
    fetchKanbanTickets,
    currentFetchTickets,
    refreshKanbanTickets,
    resetKanban,
    setKanbanFilterActive,
    setChoiceWorkflow,
  } = useLeadsKanban();

  // === ТАБЛИЦА (hard) ===
  const {
    hardTickets,
    loading,
    totalLeads,
    currentPage,
    perPage,
    fetchHardTickets,
    setCurrentPage,
    handlePerPageChange,
    resetTable,
  } = useLeadsTable();

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
  const allIdsReqIdRef = useRef(0);
  const isAllResultsSelected = allHardIds.length > 0 && selectedTickets.length === allHardIds.length;

  // === ЭФФЕКТЫ ===

  // Синхронизация group_title из URL при первой загрузке
  useEffect(() => {
    syncGroupTitleFromUrl();
  }, [syncGroupTitleFromUrl]);

  // Синхронизация локального поиска с URL
  useEffect(() => {
    setLocalSearchTerm(filters.search || "");
  }, [filters.search]);

  // Главный эффект: загрузка данных при изменении фильтров или режима
  useEffect(() => {
    if (!groupTitleForApi || !workflowOptions.length) return;

    // Проверяем изменились ли фильтры
    const filtersKey = JSON.stringify({ viewMode, filters, groupTitleForApi });
    if (prevFiltersRef.current === filtersKey) return;
    prevFiltersRef.current = filtersKey;

    if (viewMode === VIEW_MODE.KANBAN) {
      if (hasFilters) {
        // Есть фильтры — загружаем отфильтрованные
        setKanbanFilterActive(true);
        setChoiceWorkflow(filters.workflow || []);
        fetchKanbanTickets(filters);
      } else {
        // Нет фильтров — используем глобальные тикеты
        resetKanban();
        if (!didLoadGlobalTicketsRef.current) {
          fetchTickets().then(() => {
            didLoadGlobalTicketsRef.current = true;
          });
        }
      }
    } else {
      // LIST режим — всегда загружаем hard тикеты
      fetchHardTickets({ page: 1, filters });
    }
  }, [
    viewMode,
    hasFilters,
    filters,
    groupTitleForApi,
    workflowOptions,
    fetchKanbanTickets,
    fetchHardTickets,
    fetchTickets,
    resetKanban,
    setKanbanFilterActive,
    setChoiceWorkflow,
  ]);

  // Загрузка при изменении страницы (для LIST)
  useEffect(() => {
    if (viewMode === VIEW_MODE.LIST && groupTitleForApi && workflowOptions.length) {
      fetchHardTickets({ page: currentPage, filters });
    }
  }, [currentPage, perPage]);

  // IDs запрос для "выбрать все" в LIST
  useEffect(() => {
    if (viewMode !== VIEW_MODE.LIST || !groupTitleForApi || !workflowOptions.length) return;

    const reqId = ++allIdsReqIdRef.current;
    const effectiveWorkflow = getEffectiveWorkflow(
      filters.workflow,
      workflowOptions,
      !!filters.search?.trim()
    );

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

  // Сброс выделения при изменении фильтров/группы
  useEffect(() => {
    setSelectedTickets([]);
    setAllHardIds([]);
  }, [groupTitleForApi, JSON.stringify(filters), setSelectedTickets]);

  // Открытие чата при переходе на /leads/:ticketId
  useEffect(() => {
    if (ticketId) {
      setIsChatOpen(true);
      
      // Загружаем информацию о тикете для автопереключения группы
      const loadTicketGroup = async () => {
        try {
          const ticketData = await api.tickets.ticket.getLightById(Number(ticketId));
          if (ticketData?.group_title && accessibleGroupTitles.includes(ticketData.group_title)) {
            if (ticketData.group_title !== groupTitleForApi && ticketData.group_title !== customGroupTitle) {
              setCustomGroupTitle(ticketData.group_title);
              localStorage.setItem("leads_last_group_title", ticketData.group_title);
            }
          }
        } catch (error) {
          console.error("Failed to load ticket group:", error);
        }
      };
      loadTicketGroup();
    }
  }, [ticketId, accessibleGroupTitles, groupTitleForApi, customGroupTitle, setCustomGroupTitle]);

  // === ОБРАБОТЧИКИ ===

  // Смена режима просмотра
  const handleChangeViewMode = useCallback((mode) => {
    const upperMode = mode.toUpperCase?.() || mode;
    setViewMode(upperMode);
    didLoadGlobalTicketsRef.current = false;
    setCurrentPage(1);
  }, [setViewMode, setCurrentPage]);

  // Поиск
  const handleSearch = useCallback(() => {
    if (localSearchTerm?.trim()) {
      updateFilters({ search: localSearchTerm.trim() });
    }
  }, [localSearchTerm, updateFilters]);

  // Сброс поиска
  const handleResetSearch = useCallback(() => {
    setLocalSearchTerm("");
    const { search, ...rest } = filters;
    updateFilters(rest);
  }, [filters, updateFilters]);

  // Enter в поле поиска
  const handleSearchKeyPress = useCallback((e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  }, [handleSearch]);

  // Массовое удаление
  const deleteBulkLeads = useConfirmPopup({
    subTitle: getLanguageByKey("Sigur doriți să ștergeți aceste leaduri"),
  });

  const deleteTicket = useCallback(async () => {
    deleteBulkLeads(async () => {
      try {
        await api.tickets.deleteById(selectedTickets);
        setSelectedTickets([]);
        enqueueSnackbar(getLanguageByKey("Leadurile au fost șterse cu succes"), { variant: "success" });
        fetchHardTickets({ page: currentPage, filters });
      } catch (error) {
        enqueueSnackbar(getLanguageByKey("A aparut o eroare la ștergere"), { variant: "error" });
      }
    });
  }, [deleteBulkLeads, selectedTickets, setSelectedTickets, enqueueSnackbar, fetchHardTickets, currentPage, filters]);

  // Создание тикета
  const openCreateTicketModal = useCallback(() => {
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

  // Пагинация
  const handlePaginationWorkflow = useCallback((page) => {
    setCurrentPage(page);
  }, [setCurrentPage]);

  // Изменение группы
  const handleGroupTitleChange = useCallback((val) => {
    if (val && accessibleGroupTitles.includes(val)) {
      setCustomGroupTitle(val);
      localStorage.setItem("leads_last_group_title", val);
      // Обновляем URL с новым group_title напрямую (не через state)
      updateGroupTitle(val);
    } else {
      setCustomGroupTitle(null);
      localStorage.removeItem("leads_last_group_title");
      updateGroupTitle(null);
    }
    didLoadGlobalTicketsRef.current = false;
  }, [accessibleGroupTitles, setCustomGroupTitle, updateGroupTitle]);

  // Закрытие чата
  const closeChatModal = useCallback(() => {
    setIsChatOpen(false);
    navigate("/leads");
  }, [navigate]);

  // Выбор всех результатов
  const handleSelectAllResults = useCallback(() => {
    if (allHardIds.length > 0) {
      setSelectedTickets(allHardIds);
    }
  }, [allHardIds, setSelectedTickets]);

  const handleClearAllResults = useCallback(() => {
    setSelectedTickets([]);
  }, [setSelectedTickets]);

  // === ВЫЧИСЛЯЕМЫЕ ЗНАЧЕНИЯ ===
  const groupTitleSelectData = groupTitleOptions.filter((o) => accessibleGroupTitles.includes(o.value));
  const isLoading = loading || kanbanSpinner;
  const ticketCount = viewMode === VIEW_MODE.LIST ? totalLeads : visibleTickets.length;

  // === РЕНДЕР ===
  return (
    <>
      {/* HEADER */}
      <Flex
        ref={refLeadsHeader}
        style={{ "--side-bar-width": isCollapsed ? "79px" : "249px" }}
        className="leads-header-container"
        bg="var(--crm-ui-kit-palette-background-primary)"
      >
        <PageHeader
          count={ticketCount}
          title={getLanguageByKey("Leads")}
          extraInfo={
            <>
              {/* Кнопки массовых действий */}
              {selectedTickets.length > 0 && (
                <>
                  <Can permission={{ module: "leads", action: "delete" }} context={{ responsibleId }}>
                    <Button variant="danger" leftSection={<FaTrash size={16} />} onClick={deleteTicket}>
                      {getLanguageByKey("Ștergere")} ({selectedTickets.length})
                    </Button>
                  </Can>
                  <Can permission={{ module: "leads", action: "edit" }} context={{ responsibleId }}>
                    <Button variant="warning" leftSection={<FaEdit size={16} />} onClick={() => setIsModalOpen(true)}>
                      {getLanguageByKey("Editare")} ({selectedTickets.length})
                    </Button>
                  </Can>
                </>
              )}

              {/* Кнопка фильтра */}
              <ActionIcon
                variant={hasFilters ? "filled" : "default"}
                size="36"
                onClick={() => setIsFilterModalOpen(true)}
              >
                <LuFilter size={16} />
              </ActionIcon>

              {/* Поиск */}
              <Input
                value={localSearchTerm}
                onChange={(e) => setLocalSearchTerm(e.target.value)}
                onKeyPress={handleSearchKeyPress}
                placeholder={getLanguageByKey("Cauta dupa Lead, Client sau Tag")}
                className="min-w-300"
                rightSectionPointerEvents="all"
                rightSection={
                  <Flex gap="xs" align="center" mr="20px">
                    {isLoading ? (
                      <Loader size="xs" />
                    ) : (
                      <ActionIcon
                        variant="subtle"
                        onClick={handleSearch}
                        disabled={!localSearchTerm?.trim()}
                        size="sm"
                      >
                        <SearchIcon fontSize="small" />
                      </ActionIcon>
                    )}
                    {localSearchTerm && (
                      <ActionIcon variant="subtle" onClick={handleResetSearch} size="sm">
                        <IoMdClose size={16} />
                      </ActionIcon>
                    )}
                  </Flex>
                }
              />

              {/* Селектор группы */}
              <Select
                placeholder={getLanguageByKey("filter_by_group")}
                value={customGroupTitle ?? groupTitleForApi}
                data={groupTitleSelectData}
                className="min-w-300"
                onChange={handleGroupTitleChange}
              />

              {/* Переключатель Kanban/List */}
              <SegmentedControl
                onChange={handleChangeViewMode}
                value={viewMode}
                data={[
                  {
                    value: VIEW_MODE.KANBAN,
                    label: (
                      <Link
                        to={`/leads?view=${VIEW_MODE_URL.KANBAN}&type=light`}
                        onClick={(e) => e.stopPropagation()}
                        style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
                      >
                        <TbLayoutKanbanFilled color="var(--crm-ui-kit-palette-text-primary)" />
                      </Link>
                    )
                  },
                  {
                    value: VIEW_MODE.LIST,
                    label: (
                      <Link
                        to={`/leads?view=${VIEW_MODE_URL.LIST}&type=hard`}
                        onClick={(e) => e.stopPropagation()}
                        style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
                      >
                        <FaList color="var(--crm-ui-kit-palette-text-primary)" />
                      </Link>
                    )
                  },
                ]}
              />

              {/* Кнопка создания */}
              <Can permission={{ module: "leads", action: "create" }}>
                <Button onClick={openCreateTicketModal} leftSection={<IoMdAdd size={16} />}>
                  {getLanguageByKey("Adaugă lead")}
                </Button>
              </Can>
            </>
          }
        />
      </Flex>

      {/* КОНТЕНТ */}
      <div style={{ "--leads-filter-height": `${leadsFilterHeight}px` }} className="leads-container">
        <Divider style={{ borderColor: 'var(--crm-ui-kit-palette-border-primary)' }} />
        
        {loading && viewMode === VIEW_MODE.LIST ? (
          <div className="d-flex align-items-center justify-content-center h-full">
            <Spin />
          </div>
        ) : viewMode === VIEW_MODE.LIST ? (
          <LeadTable
            currentPage={currentPage}
            filteredLeads={hardTickets}
            selectTicket={selectedTickets}
            onSelectRow={toggleSelectTicket}
            onToggleAll={toggleSelectAll}
            totalLeadsPages={getTotalPages(totalLeads, perPage)}
            onChangePagination={handlePaginationWorkflow}
            perPage={perPage}
            setPerPage={handlePerPageChange}
            allResultIds={allHardIds}
            isAllResultsSelected={isAllResultsSelected}
            onSelectAllResults={handleSelectAllResults}
            onClearAllResults={handleClearAllResults}
          />
        ) : (
          <WorkflowColumns
            kanbanFilterActive={kanbanFilterActive}
            fetchTickets={currentFetchTickets}
            refreshKanbanTickets={() => refreshKanbanTickets(filters)}
            selectedWorkflow={choiceWorkflow}
            tickets={visibleTickets}
            searchTerm={filters.search || ""}
            onEditTicket={(ticket) => {
              setCurrentTicket(ticket);
              setIsModalOpen(true);
            }}
          />
        )}
      </div>

      {/* СПИННЕРЫ */}
      {spinnerTickets && <SpinnerRightBottom />}
      {kanbanSpinner && viewMode === VIEW_MODE.KANBAN && <SpinnerRightBottom />}

      {/* ЧАТ */}
      <ChatModal opened={isChatOpen && !!ticketId} onClose={closeChatModal}>
        <SingleChat ticketId={ticketId} onClose={closeChatModal} technicians={technicians} />
      </ChatModal>

      {/* МОДАЛ СОЗДАНИЯ */}
      <Modal
        opened={isOpenAddLeadModal}
        onClose={() => setIsOpenAddLeadModal(false)}
        title={getLanguageByKey("Adaugă lead")}
        withCloseButton
        centered
        size="lg"
      >
        <AddLeadModal
          open
          onClose={() => setIsOpenAddLeadModal(false)}
          selectedGroupTitle={groupTitleForApi}
          fetchTickets={() => fetchHardTickets({ page: currentPage, filters })}
        />
      </Modal>

      {/* ЕДИНЫЙ МОДАЛ ФИЛЬТРА */}
      <Modal
        opened={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        title={getLanguageByKey("Filtrează tichete")}
        withCloseButton
        centered
        size="lg"
        styles={{
          content: { height: "700px", display: "flex", flexDirection: "column" },
          body: { flex: 1, overflowY: "auto", padding: "1rem" },
          title: { color: "var(--crm-ui-kit-palette-text-primary)" }
        }}
      >
        <LeadsFilter
          initialData={filters}
          loading={isLoading}
          onClose={() => setIsFilterModalOpen(false)}
        />
      </Modal>

      {/* МОДАЛ РЕДАКТИРОВАНИЯ */}
      <Modal
        opened={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={getLanguageByKey("Editarea tichetelor în grup")}
        withCloseButton
        centered
        size="lg"
        styles={{
          content: { height: "700px", display: "flex", flexDirection: "column" },
          body: { flex: 1, overflowY: "auto", padding: "1rem" },
          title: { color: "var(--crm-ui-kit-palette-text-primary)" }
        }}
      >
        <ManageLeadInfoTabs
          onClose={() => setIsModalOpen(false)}
          selectedTickets={selectedTickets}
          fetchLeads={async () => {
            await fetchHardTickets({ page: currentPage, filters });
            if (kanbanFilterActive) {
              refreshKanbanTickets(filters);
            }
          }}
          id={selectedTickets.length === 1 ? selectedTickets[0] : currentTicket?.id}
        />
      </Modal>
    </>
  );
};
