import { memo } from "react";
import { Divider } from "@mantine/core";
import { Spin } from "@components";
import { WorkflowColumns } from "../Workflow/WorkflowColumns";
import { LeadTable } from "./LeadTable/LeadTable";
import { getTotalPages } from "../utils";
import { VIEW_MODE } from "./constants";

/**
 * Контент страницы Leads
 * 
 * Переключает между:
 * - LeadTable (режим LIST)
 * - WorkflowColumns (режим KANBAN)
 */
export const LeadsContent = memo(({
  // Режим
  viewMode,
  loading,
  leadsFilterHeight,
  
  // Данные для таблицы
  hardTickets,
  currentPage,
  perPage,
  totalLeads,
  selectedTickets,
  allHardIds,
  isAllResultsSelected,
  
  // Данные для канбана
  visibleTickets,
  kanbanFilterActive,
  choiceWorkflow,
  searchTerm,
  
  // Функции для таблицы
  onSelectRow,
  onToggleAll,
  onChangePagination,
  onPerPageChange,
  onSelectAllResults,
  onClearAllResults,
  
  // Функции для канбана
  fetchTickets,
  refreshKanbanTickets,
  onEditTicket,
}) => {
  return (
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
          onSelectRow={onSelectRow}
          onToggleAll={onToggleAll}
          totalLeadsPages={getTotalPages(totalLeads, perPage)}
          onChangePagination={onChangePagination}
          perPage={perPage}
          setPerPage={onPerPageChange}
          allResultIds={allHardIds}
          isAllResultsSelected={isAllResultsSelected}
          onSelectAllResults={onSelectAllResults}
          onClearAllResults={onClearAllResults}
        />
      ) : (
        <WorkflowColumns
          kanbanFilterActive={kanbanFilterActive}
          fetchTickets={fetchTickets}
          refreshKanbanTickets={refreshKanbanTickets}
          selectedWorkflow={choiceWorkflow}
          tickets={visibleTickets}
          searchTerm={searchTerm}
          onEditTicket={onEditTicket}
        />
      )}
    </div>
  );
});

LeadsContent.displayName = "LeadsContent";

