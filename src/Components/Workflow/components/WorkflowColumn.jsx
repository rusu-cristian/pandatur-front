import { VariableSizeList } from "react-window";
import { Flex, Box } from "@mantine/core";
import { useRef, useEffect, forwardRef, useMemo, useCallback, memo } from "react";
import { useSnackbar } from "notistack";
import { TicketCard } from "./TicketCard";
import { useDOMElementHeight, useConfirmPopup } from "../../../hooks";
import { WorkflowColumnHeader } from "./WorkflowColumnHeader";
import { showServerError, getLanguageByKey } from "../../utils";
import { api } from "../../../api";


const DEFAULT_TICKET_CARD_HEIGHT = 140;
const SPACE_BETWEEN_CARDS = 8;

const priorityOrder = {
  joasă: 1,
  medie: 2,
  înaltă: 3,
  critică: 4,
};

const filterTickets = (workflow, tickets) => {
  const filteredTickets = tickets
    .filter((ticket) => ticket.workflow === workflow)
    .sort((a, b) => {
      const priorityDiff =
        (priorityOrder[b.priority] || 5) - (priorityOrder[a.priority] || 5);
      if (priorityDiff !== 0) return priorityDiff;

      const dateA = a.last_interaction_date
        ? Date.parse(a.last_interaction_date)
        : Number.POSITIVE_INFINITY;
      const dateB = b.last_interaction_date
        ? Date.parse(b.last_interaction_date)
        : Number.POSITIVE_INFINITY;

      if (isNaN(dateA) && isNaN(dateB)) return 0;
      if (isNaN(dateA)) return -1;
      if (isNaN(dateB)) return 1;

      return dateB - dateA;
    });

  return filteredTickets;
};

const wrapperColumn = forwardRef(({ style, ...rest }, ref) => (
  <Box
    ref={ref}
    pos="relative"
    mt={SPACE_BETWEEN_CARDS + SPACE_BETWEEN_CARDS}
    style={style}
    {...rest}
  />
));

wrapperColumn.displayName = 'WrapperColumn';

export const WorkflowColumn = memo(({
  onEditTicket,
  searchTerm,
  workflow,
  tickets,
  technicianList,
  fetchTickets,
  refreshKanbanTickets,
}) => {
  const columnRef = useRef(null);
  const columnHeight = useDOMElementHeight(columnRef);
  const listRef = useRef(null);
  const rowHeights = useRef({});
  const { enqueueSnackbar } = useSnackbar();

  const deleteTicketById = useConfirmPopup({
    subTitle: getLanguageByKey("confirm_delete_lead"),
  });

  // Мемоизируем отфильтрованные тикеты
  const filteredTickets = useMemo(() => 
    filterTickets(workflow, tickets), 
    [workflow, tickets]
  );

  const setRowHeight = useCallback((index, size) => {
    // Оптимизация: обновляем только если высота изменилась
    if (rowHeights.current[index] !== size) {
      rowHeights.current[index] = size;
      // Сбрасываем кеш только с текущего индекса, не с 0
      if (listRef.current) {
        listRef.current.resetAfterIndex(index, false);
      }
    }
  }, []);

  const handleDeleteLead = useCallback((id) => {
    deleteTicketById(async () => {
      try {
        await api.tickets.deleteById([id]);
        enqueueSnackbar(getLanguageByKey("lead_deleted_successfully"), {
          variant: "success",
        });
        await fetchTickets();
      } catch (error) {
        enqueueSnackbar(showServerError(error), {
          variant: "error",
        });
      }
    });
  }, [deleteTicketById, enqueueSnackbar, fetchTickets]);

  const CardItem = memo(({ index, style }) => {
    const rowRef = useRef(null);
    const ticket = filteredTickets[index];

    const technician = useMemo(() => 
      technicianList.find(
        ({ value }) => Number(value) === ticket.technician_id,
      ),
      [ticket.technician_id]
    );

    useEffect(() => {
      if (rowRef.current) {
        const height = rowRef.current.clientHeight + SPACE_BETWEEN_CARDS;
        setRowHeight(index, height);
      }
    }, [index, ticket.id]); // Зависим только от индекса и ID тикета

    return (
      <div style={style}>
        <div ref={rowRef}>
          <TicketCard
            ticket={ticket}
            onEditTicket={onEditTicket}
            technician={technician}
            onDeleteTicket={handleDeleteLead}
          />
        </div>
      </div>
    );
  });

  CardItem.displayName = 'WorkflowCardItem';

  return (
    <Flex
      pos="relative"
      direction="column"
      bg="var(--crm-ui-kit-palette-background-primary)"
      style={{
        flex: "0 0 300px",
        color: "var(--crm-ui-kit-palette-text-primary)",
      }}
    >
      <WorkflowColumnHeader
        workflow={workflow}
        filteredTickets={filteredTickets}
      />

      <Flex direction="column" h="100%" pb="100px" ref={columnRef}>
        <VariableSizeList
          ref={listRef}
          height={columnHeight}
          itemCount={filteredTickets.length}
          itemSize={(index) =>
            rowHeights.current[index] || DEFAULT_TICKET_CARD_HEIGHT
          }
          width="100%"
          innerElementType={wrapperColumn}
          overscanCount={2}
        >
          {CardItem}
        </VariableSizeList>
      </Flex>
    </Flex>
  );
});

WorkflowColumn.displayName = 'WorkflowColumn';
