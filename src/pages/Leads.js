import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useSearchParams, Link } from "react-router-dom";
import { useSnackbar } from "notistack";
import { Divider, Modal, Button, ActionIcon, Input, SegmentedControl, Flex, Select, Loader } from "@mantine/core";
import { ChatModal } from "../Components/ChatComponent/ChatModal";
import { useDOMElementHeight, useApp, useConfirmPopup, useGetTechniciansList } from "@hooks";
import { priorityOptions, groupTitleOptions } from "../FormOptions";
import { workflowOptions as defaultWorkflowOptions } from "../FormOptions/workflowOptions";
import { SpinnerRightBottom, AddLeadModal, PageHeader, Spin } from "@components";
import { WorkflowColumns } from "../Components/Workflow/WorkflowColumns";
import { ManageLeadInfoTabs } from "../Components/LeadsComponent/ManageLeadInfoTabs";
import { LeadsTableFilter } from "../Components/LeadsComponent/LeadsTableFilter";
import { LeadsKanbanFilter } from "../Components/LeadsComponent/LeadsKanbanFilter";
import SingleChat from "@components/ChatComponent/SingleChat";
import { LeadTable } from "../Components/LeadsComponent/LeadTable/LeadTable";
import Can from "../Components/CanComponent/Can";
import { getTotalPages, getLanguageByKey, showServerError } from "../Components/utils";
import { api } from "../api";
import { VIEW_MODE } from "@components/LeadsComponent/utils";
import { FaTrash, FaEdit, FaList } from "react-icons/fa";
import { IoMdAdd, IoMdClose } from "react-icons/io";
import { TbLayoutKanbanFilled } from "react-icons/tb";
import { LuFilter } from "react-icons/lu";
import { Search as SearchIcon } from "@mui/icons-material";
import "../css/SnackBarComponent.css";
import "../Components/LeadsComponent/LeadsHeader/LeadsFilter.css";

// новые хуки
import { useLeadsKanban } from "../hooks/useLeadsKanban";
import { useLeadsTable } from "../hooks/useLeadsTable";
import { useLeadsUrlSync } from "../hooks/useLeadsUrlSync";
import { useLeadsSelection } from "../hooks/useLeadsSelection";

export const Leads = () => {
  const refLeadsHeader = useRef();
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();
  const leadsFilterHeight = useDOMElementHeight(refLeadsHeader);

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

  const { ticketId } = useParams();
  const { technicians } = useGetTechniciansList();
  const [searchParams, setSearchParams] = useSearchParams();
  const didLoadGlobalTicketsRef = useRef(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentTicket, setCurrentTicket] = useState(null);
  const [isOpenAddLeadModal, setIsOpenAddLeadModal] = useState(false);
  const [isOpenKanbanFilterModal, setIsOpenKanbanFilterModal] = useState(false);
  const [isOpenListFilterModal, setIsOpenListFilterModal] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(!!ticketId);

  const [viewMode, setViewMode] = useState(VIEW_MODE.KANBAN);

  // --- КАНБАН (light) ---
  const {
    visibleTickets,
    kanbanFilters,
    kanbanSpinner,
    kanbanFilterActive,
    selectedWorkflow,
    choiceWorkflow,

    kanbanSearchTerm,
    setKanbanSearchTerm,
    triggerSearch: triggerKanbanSearch,

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
  } = useLeadsKanban();

  // --- ТАБЛИЦА (hard) ---
  const {
    hardTickets,
    hardTicketFilters,
    loading,
    totalLeads,
    currentPage,
    perPage,
    hasHardFilters,
    searchTerm,
    setSearchTerm,
    fetchHardTickets,
    setHardTicketFilters,
    setCurrentPage,
    handleApplyFiltersHardTicket,
    handlePerPageChange,
    triggerSearch: triggerTableSearch,
  } = useLeadsTable();

  // --- Выделение текущего списка ---
  const {
    selectedTickets,
    setSelectedTickets,
    toggleSelectTicket,
    toggleSelectAll,
    responsibleId,
    selectedTicket,
  } = useLeadsSelection({
    listForSelection: viewMode === VIEW_MODE.LIST ? hardTickets : visibleTickets,
  });

  // --- Хранение ВСЕХ id результатов hard-поиска ---
  const [allHardIds, setAllHardIds] = useState([]);
  const allIdsReqIdRef = useRef(0);
  const isAllResultsSelected =
    allHardIds.length > 0 && selectedTickets.length === allHardIds.length;

  // --- URL-синк ---
  const { filtersReady } = useLeadsUrlSync({
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
  });

  // helper: построить атрибуты для hard/id запросов (как в hard-странице)
  const buildHardAttributes = (filters) => {
    const { search, group_title, workflow, type, view, ...restFilters } = filters || {};
    const excludedWorkflows = ["Realizat cu succes", "Închis și nerealizat"];
    const isSearchingInList = !!(search && search.trim());

    const effectiveWorkflow =
      Array.isArray(workflow) && workflow.length > 0
        ? workflow
        : isSearchingInList
          ? workflowOptions
          : workflowOptions.filter((w) => !excludedWorkflows.includes(w));

    return {
      attributes: {
        ...restFilters,
        workflow: effectiveWorkflow,
        ...(search && search.trim() ? { search: search.trim() } : {}),
      },
    };
  };


  // открытие чата при переходе на /leads/:ticketId
  // и автоматическое переключение воронки на группу тикета
  useEffect(() => {
    if (ticketId) {
      setIsChatOpen(true);

      // Загружаем тикет, чтобы узнать его группу
      const loadTicketGroup = async () => {
        try {
          const ticketData = await api.tickets.ticket.getLightById(Number(ticketId));
          if (ticketData?.group_title && accessibleGroupTitles.includes(ticketData.group_title)) {
            // Если группа тикета отличается от текущей, переключаем воронку
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

  // загрузка таблицы (hard) при готовности фильтров/смене зависимостей
  useEffect(() => {
    if (viewMode === VIEW_MODE.LIST && filtersReady) {
      fetchHardTickets(currentPage);
    }
  }, [hardTicketFilters, groupTitleForApi, workflowOptions, currentPage, viewMode, filtersReady, perPage, fetchHardTickets]);

  // ПАРАЛЛЕЛЬНО: ids-only запрос под те же фильтры (без пагинации)
  useEffect(() => {
    if (!(viewMode === VIEW_MODE.LIST && filtersReady)) return;
    if (!groupTitleForApi || !workflowOptions.length) return;

    const reqId = ++allIdsReqIdRef.current;
    const { attributes } = buildHardAttributes(hardTicketFilters);

    (async () => {
      try {
        const res = await api.tickets.filters({
          type: "id",                  // сервер вернёт только ID
          group_title: groupTitleForApi,
          attributes,
        });
        if (reqId !== allIdsReqIdRef.current) return; // гонкозащита
        const ids = Array.isArray(res?.data) ? res.data : [];
        setAllHardIds(ids);
      } catch (err) {
        if (reqId === allIdsReqIdRef.current) {
          enqueueSnackbar(showServerError(err), { variant: "error" });
        }
      }
    })();
  }, [viewMode, filtersReady, groupTitleForApi, workflowOptions, hardTicketFilters]); // страница/лимит не влияют на ids

  // при смене фильтров/группы — сбрасываем выделение и кеш ID всех результатов
  useEffect(() => {
    setSelectedTickets([]);
    setAllHardIds([]);
  }, [groupTitleForApi, JSON.stringify(hardTicketFilters)]);

  // смена режима (kanban/list)
  const handleChangeViewMode = (mode) => {
    const upperMode = mode.toUpperCase();
    setViewMode(upperMode);

    // Сохраняем фильтры из URL и только меняем view и type
    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev);
      newParams.set("view", upperMode.toLowerCase());

      // Меняем тип в зависимости от режима
      if (upperMode === VIEW_MODE.LIST) {
        newParams.set("type", "hard");
      } else {
        newParams.set("type", "light");
      }

      return newParams;
    }, { replace: true });

    if (upperMode === VIEW_MODE.LIST) {
      setCurrentPage(1);
      setSearchTerm("");
      // НЕ сбрасываем hardTicketFilters - они будут применены из URL через useLeadsUrlSync
    } else {
      // kanban - сбрасываем локальный поиск, но фильтры остаются в URL
      setKanbanSearchTerm("");
      // НЕ сбрасываем kanbanFilters - они будут применены из URL через useLeadsUrlSync

      if (!didLoadGlobalTicketsRef.current && !searchParams.get("workflow")) {
        // Загружаем глобальные тикеты только если нет фильтров в URL
        fetchTickets().then(() => {
          didLoadGlobalTicketsRef.current = true;
        });
      }
    }
  };

  // обработчик поиска (для обоих режимов)
  const handleSearch = () => {
    if (viewMode === VIEW_MODE.LIST) {
      triggerTableSearch();
    } else {
      triggerKanbanSearch();
    }
  };

  // обработчик сброса поиска (очистка поля и результатов)
  const handleResetSearch = () => {
    if (viewMode === VIEW_MODE.LIST) {
      setSearchTerm("");
      setCurrentPage(1);
      // Перезагружаем данные без поиска
      fetchHardTickets(1, "");
    } else {
      // Сбрасываем поиск в канбане
      setKanbanSearchTerm("");
      setKanbanFilterActive(false);
      setKanbanTickets([]);
    }
  };

  // обработчик нажатия Enter в поле поиска
  const handleSearchKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  // при смене groupTitle — сбрасываем локальные списки (как раньше)
  useEffect(() => {
    didLoadGlobalTicketsRef.current = false;
  }, [groupTitleForApi]);

  // держим view из URL (на случай внешней навигации)
  useEffect(() => {
    const urlView = searchParams.get("view");
    const urlViewUpper = urlView ? urlView.toUpperCase() : undefined;
    if (urlViewUpper && urlViewUpper !== viewMode) {
      setViewMode(urlViewUpper);
    }
  }, [searchParams, viewMode]);

  // применить фильтры для light (канбан) + обновить URL
  const handleApplyFilterLightTicket = (selectedFilters) => {
    applyKanbanFilters(selectedFilters);
    setIsOpenKanbanFilterModal(false);
    didLoadGlobalTicketsRef.current = false;

    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev);

      for (const key of Array.from(newParams.keys())) {
        if (key !== "view") newParams.delete(key);
      }

      Object.entries(selectedFilters).forEach(([key, value]) => {
        if (
          value !== undefined &&
          value !== null &&
          value !== "" &&
          (!Array.isArray(value) || value.length > 0)
        ) {
          newParams.set(key, JSON.stringify(value));
        }
      });

      newParams.set("type", "light");
      return newParams;
    });
  };

  // массовое удаление (table)
  const deleteBulkLeads = useConfirmPopup({
    subTitle: getLanguageByKey("Sigur doriți să ștergeți aceste leaduri"),
  });

  const deleteTicket = async () => {
    deleteBulkLeads(async () => {
      try {
        await api.tickets.deleteById(selectedTickets);
        setSelectedTickets([]);
        enqueueSnackbar(getLanguageByKey("Leadurile au fost șterse cu succes"), { variant: "success" });
        fetchHardTickets(currentPage);
      } catch (error) {
        enqueueSnackbar(getLanguageByKey("A aparut o eroare la ștergere"), { variant: "error" });
      }
    });
  };

  // открыть создание
  const openCreateTicketModal = () => {
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
  };

  // пагинация таблицы
  const handlePaginationWorkflow = (page) => setCurrentPage(page);

  // доступные groupTitle в Select
  const groupTitleSelectData = groupTitleOptions.filter((o) => accessibleGroupTitles.includes(o.value));

  // Загрузка сохраненного значения groupTitle из localStorage при инициализации
  // ВАЖНО: всегда проверяем значение из localStorage против списка доступных прав
  // Если недоступно - сохраняем первое доступное значение
  useEffect(() => {
    if (accessibleGroupTitles.length > 0 && !customGroupTitle) {
      const savedGroupTitle = localStorage.getItem("leads_last_group_title");
      // Безопасность: проверяем, что сохраненное значение доступно по правам
      if (savedGroupTitle && accessibleGroupTitles.includes(savedGroupTitle)) {
        setCustomGroupTitle(savedGroupTitle);
      } else {
        // Если сохраненное значение недоступно - устанавливаем и сохраняем первое доступное
        const firstAccessible = accessibleGroupTitles[0];
        if (firstAccessible) {
          setCustomGroupTitle(firstAccessible);
          localStorage.setItem("leads_last_group_title", firstAccessible);
        }
      }
    }
  }, [accessibleGroupTitles, customGroupTitle, setCustomGroupTitle]);

  // Дополнительная проверка: если текущий customGroupTitle стал недоступен по правам
  // Устанавливаем и сохраняем первое доступное значение
  useEffect(() => {
    if (customGroupTitle && accessibleGroupTitles.length > 0) {
      // Безопасность: проверяем, что текущее значение все еще доступно по правам
      if (!accessibleGroupTitles.includes(customGroupTitle)) {
        // Если права изменились и текущее значение больше не доступно - устанавливаем первое доступное
        const firstAccessible = accessibleGroupTitles[0];
        if (firstAccessible) {
          setCustomGroupTitle(firstAccessible);
          localStorage.setItem("leads_last_group_title", firstAccessible);
        } else {
          setCustomGroupTitle(null);
          localStorage.removeItem("leads_last_group_title");
        }
      }
    }
  }, [accessibleGroupTitles, customGroupTitle, setCustomGroupTitle]);

  // закрытие чата
  const closeChatModal = () => {
    setIsChatOpen(false);
    navigate("/leads");
  };

  // обработчики «выбрать все результаты» / «снять выбор»
  const handleSelectAllResults = () => {
    if (allHardIds.length > 0) {
      setSelectedTickets(allHardIds);
    }
  };

  const handleClearAllResults = () => {
    setSelectedTickets([]);
  };

  return (
    <>
      <Flex
        ref={refLeadsHeader}
        style={{ "--side-bar-width": isCollapsed ? "79px" : "249px" }}
        className="leads-header-container"
        bg="var(--crm-ui-kit-palette-background-primary)"
      >
        <PageHeader
          count={viewMode === VIEW_MODE.LIST ? totalLeads : visibleTickets.length}
          title={getLanguageByKey("Leads")}
          extraInfo={
            <>
              {selectedTickets.length > 0 && (
                <Can permission={{ module: "leads", action: "delete" }} context={{ responsibleId }}>
                  <Button variant="danger" leftSection={<FaTrash size={16} />} onClick={deleteTicket}>
                    {getLanguageByKey("Ștergere")} ({selectedTickets.length})
                  </Button>
                </Can>
              )}
              {selectedTickets.length > 0 && (
                <Can permission={{ module: "leads", action: "edit" }} context={{ responsibleId }}>
                  <Button variant="warning" leftSection={<FaEdit size={16} />} onClick={() => setIsModalOpen(true)}>
                    {getLanguageByKey("Editare")} ({selectedTickets.length})
                  </Button>
                </Can>
              )}

              <ActionIcon
                variant={
                  viewMode === VIEW_MODE.KANBAN
                    ? kanbanFilterActive
                      ? "filled"
                      : "default"
                    : hasHardFilters
                      ? "filled"
                      : "default"
                }
                size="36"
                onClick={() => {
                  if (viewMode === VIEW_MODE.KANBAN) {
                    setIsOpenKanbanFilterModal(true);
                  } else {
                    setIsOpenListFilterModal(true);
                  }
                }}
              >
                <LuFilter size={16} />
              </ActionIcon>

              <Input
                value={viewMode === VIEW_MODE.KANBAN ? kanbanSearchTerm : searchTerm}
                onChange={(e) => {
                  const value = e.target.value;
                  if (viewMode === VIEW_MODE.KANBAN) {
                    setKanbanSearchTerm(value);
                  } else {
                    setSearchTerm(value);
                  }
                }}
                onKeyPress={handleSearchKeyPress}
                placeholder={getLanguageByKey("Cauta dupa Lead, Client sau Tag")}
                className="min-w-300"
                rightSectionPointerEvents="all"
                rightSection={
                  <Flex gap="xs" align="center" mr="20px">
                    {viewMode === VIEW_MODE.KANBAN ? (
                      kanbanSpinner ? (
                        <Loader size="xs" />
                      ) : (
                        <ActionIcon
                          variant="subtle"
                          onClick={handleSearch}
                          disabled={!kanbanSearchTerm?.trim()}
                          size="sm"
                        >
                          <SearchIcon fontSize="small" />
                        </ActionIcon>
                      )
                    ) : (
                      loading ? (
                        <Loader size="xs" />
                      ) : (
                        <ActionIcon
                          variant="subtle"
                          onClick={handleSearch}
                          disabled={!searchTerm?.trim()}
                          size="sm"
                        >
                          <SearchIcon fontSize="small" />
                        </ActionIcon>
                      )
                    )}
                    {(viewMode === VIEW_MODE.KANBAN ? kanbanSearchTerm : searchTerm) && (
                      <ActionIcon
                        variant="subtle"
                        onClick={handleResetSearch}
                        size="sm"
                      >
                        <IoMdClose size={16} />
                      </ActionIcon>
                    )}
                  </Flex>
                }
              />

              <Select
                placeholder={getLanguageByKey("filter_by_group")}
                value={customGroupTitle ?? groupTitleForApi}
                data={groupTitleSelectData}
                className="min-w-300"
                onChange={(val) => {
                  // Безопасность: всегда проверяем значение против списка доступных прав
                  let valueToSet = null;

                  if (val) {
                    // Если значение указано - проверяем доступность по правам
                    if (accessibleGroupTitles.includes(val)) {
                      // Если доступно - используем его
                      valueToSet = val;
                    } else {
                      // Если значение не доступно по правам - используем первое доступное
                      valueToSet = accessibleGroupTitles[0] || null;
                    }
                  } else {
                    // Если val === null, сбрасываем
                    valueToSet = null;
                  }

                  // Устанавливаем и сохраняем значение (только если есть доступ)
                  if (valueToSet && accessibleGroupTitles.includes(valueToSet)) {
                    setCustomGroupTitle(valueToSet);
                    localStorage.setItem("leads_last_group_title", valueToSet);
                  } else {
                    setCustomGroupTitle(null);
                    localStorage.removeItem("leads_last_group_title");
                  }

                  // Сбрасываем query-параметры фильтров, чтобы не перетирали выбор группы
                  setSearchParams(() => {
                    const params = new URLSearchParams();
                    params.set("view", viewMode);
                    return params;
                  });

                  // Сброс фильтров и состояния при изменении
                  if (viewMode === VIEW_MODE.LIST) {
                    setCurrentPage(1);
                    setHardTicketFilters({});
                  } else {
                    // сброс канбана
                    setKanbanFilters({});
                    setKanbanSearchTerm("");
                    setKanbanFilterActive(false);
                    setKanbanTickets([]);
                    didLoadGlobalTicketsRef.current = false;
                  }
                }}
              />

              {(() => {
                const basePath = `/leads${ticketId ? `/${ticketId}` : ''}`;
                const kanbanParams = new URLSearchParams(searchParams);
                kanbanParams.set("view", "kanban");
                kanbanParams.set("type", "light");
                const listParams = new URLSearchParams(searchParams);
                listParams.set("view", "list");
                listParams.set("type", "hard");

                return (
                  <SegmentedControl
                    onChange={handleChangeViewMode}
                    value={viewMode}
                    data={[
                      {
                        value: VIEW_MODE.KANBAN,
                        label: (
                          <Link
                            to={`${basePath}?${kanbanParams.toString()}`}
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
                            to={`${basePath}?${listParams.toString()}`}
                            onClick={(e) => e.stopPropagation()}
                            style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
                          >
                            <FaList color="var(--crm-ui-kit-palette-text-primary)" />
                          </Link>
                        )
                      },
                    ]}
                  />
                );
              })()}

              <Can permission={{ module: "leads", action: "create" }}>
                <Button onClick={openCreateTicketModal} leftSection={<IoMdAdd size={16} />}>
                  {getLanguageByKey("Adaugă lead")}
                </Button>
              </Can>
            </>
          }
        />
      </Flex>

      <div style={{ "--leads-filter-height": `${leadsFilterHeight}px` }} className="leads-container">
        <Divider style={{ borderColor: 'var(--crm-ui-kit-palette-border-primary)' }} />
        {loading ? (
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

            // НОВОЕ: поддержка выбора всех результатов
            allResultIds={allHardIds}
            isAllResultsSelected={isAllResultsSelected}
            onSelectAllResults={handleSelectAllResults}
            onClearAllResults={handleClearAllResults}
          />
        ) : (
          <WorkflowColumns
            kanbanFilterActive={kanbanFilterActive}
            fetchTickets={currentFetchTickets}
            refreshKanbanTickets={refreshKanbanTickets}
            selectedWorkflow={choiceWorkflow}
            tickets={visibleTickets}
            searchTerm={kanbanSearchTerm}
            onEditTicket={(ticket) => {
              setCurrentTicket(ticket);
              setIsModalOpen(true);
            }}
          />
        )}
      </div>

      {spinnerTickets && <SpinnerRightBottom />}
      {kanbanSpinner && viewMode === VIEW_MODE.KANBAN && <SpinnerRightBottom />}

      <ChatModal opened={isChatOpen && !!ticketId} onClose={closeChatModal}>
        <SingleChat ticketId={ticketId} onClose={closeChatModal} technicians={technicians} />
      </ChatModal>

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
          fetchTickets={() => fetchHardTickets(currentPage)}
        />
      </Modal>

      <Modal
        opened={isOpenKanbanFilterModal}
        onClose={() => setIsOpenKanbanFilterModal(false)}
        title={getLanguageByKey("Filtrează tichete")}
        withCloseButton
        centered
        size="lg"
        styles={{
          content: {
            height: "700px",
            display: "flex",
            flexDirection: "column",
          },
          body: {
            flex: 1,
            overflowY: "auto",
            padding: "1rem"
          },
          title: {
            color: "var(--crm-ui-kit-palette-text-primary)"
          }
        }}
      >
        <LeadsKanbanFilter
          fetchTickets={fetchTickets}
          initialData={kanbanFilters}
          systemWorkflow={kanbanFilterActive ? selectedWorkflow : []}
          loading={loading}
          onClose={() => setIsOpenKanbanFilterModal(false)}
          onApplyWorkflowFilters={setSelectedWorkflow}
          onSubmitTicket={handleApplyFilterLightTicket}
          fetchKanbanTickets={fetchKanbanTickets}
          setKanbanFilterActive={setKanbanFilterActive}
          setKanbanFilters={setKanbanFilters}
          setKanbanTickets={setKanbanTickets}
          onWorkflowSelected={(workflow) => setChoiceWorkflow(workflow)}
          groupTitleForApi={groupTitleForApi}
          kanbanSearchTerm={kanbanSearchTerm}
        />
      </Modal>

      <Modal
        opened={isOpenListFilterModal}
        onClose={() => setIsOpenListFilterModal(false)}
        title={getLanguageByKey("Filtrează tichete")}
        withCloseButton
        centered
        size="lg"
        styles={{
          content: {
            height: "700px",
            display: "flex",
            flexDirection: "column",
          },
          body: {
            flex: 1,
            overflowY: "auto",
            padding: "1rem"
          },
          title: {
            color: "var(--crm-ui-kit-palette-text-primary)"
          }
        }}
      >
        <LeadsTableFilter
          initialData={hardTicketFilters}
          loading={loading}
          onClose={() => setIsOpenListFilterModal(false)}
          onSubmitTicket={handleApplyFiltersHardTicket}
          onResetFilters={() => {
            setHardTicketFilters({});
            setCurrentPage(1);
          }}
          groupTitleForApi={groupTitleForApi}
        />
      </Modal>

      <Modal
        opened={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={getLanguageByKey("Editarea tichetelor în grup")}
        withCloseButton
        centered
        size="lg"
        styles={{
          content: {
            height: "700px",
            display: "flex",
            flexDirection: "column",
          },
          body: {
            flex: 1,
            overflowY: "auto",
            padding: "1rem"
          },
          title: {
            color: "var(--crm-ui-kit-palette-text-primary)"
          }
        }}
      >
        <ManageLeadInfoTabs
          onClose={() => setIsModalOpen(false)}
          selectedTickets={selectedTickets}
          fetchLeads={async () => {
            // Обновляем таблицу
            await fetchHardTickets(currentPage);
            // Обновляем канбан, если активен фильтр
            if (kanbanFilterActive) {
              refreshKanbanTickets();
            }
          }}
          id={selectedTickets.length === 1 ? selectedTickets[0] : currentTicket?.id}
        />
      </Modal>
    </>
  );
};
