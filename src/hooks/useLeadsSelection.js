import { useCallback, useMemo, useState } from "react";

/**
 * Выделение строк/карточек + вычисление responsibleId для Can.
 */
export const useLeadsSelection = ({ listForSelection }) => {
    const [selectedTickets, setSelectedTickets] = useState([]);

    const toggleSelectTicket = useCallback((ticketId) => {
        setSelectedTickets((prev) =>
            prev.includes(ticketId) ? prev.filter((id) => id !== ticketId) : [...prev, ticketId]
        );
    }, []);

    const toggleSelectAll = useCallback((ids) => {
        setSelectedTickets((prev) => (prev.length === ids.length ? [] : ids));
    }, []);

    const selectedTicket = useMemo(
        () => listForSelection.find((t) => t.id === selectedTickets?.[0]),
        [listForSelection, selectedTickets]
    );

    const responsibleId = selectedTicket?.technician_id
        ? String(selectedTicket.technician_id)
        : undefined;

    return {
        selectedTickets,
        setSelectedTickets,
        toggleSelectTicket,
        toggleSelectAll,
        responsibleId,
        selectedTicket,
    };
};
