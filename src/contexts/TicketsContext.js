import { createContext, useState, useEffect, useRef, useContext, useCallback } from "react";
import { useSnackbar } from "notistack";
import { useSocket } from "@hooks";
import { api } from "../api";
import { showServerError, getLanguageByKey } from "@utils";
import { TYPE_SOCKET_EVENTS, MEDIA_TYPE } from "@app-constants";
import { UserContext } from "./UserContext";
import { FiltersContext } from "./FiltersContext";
import { useGetTechniciansList } from "../hooks";

export const TicketsContext = createContext();

const normalizeLightTickets = (tickets) =>
  tickets.map((ticket) => ({
    ...ticket,
    last_message: ticket.last_message || getLanguageByKey("no_messages"),
    time_sent: ticket.time_sent || null,
    unseen_count: ticket.unseen_count || 0,
  }));

/**
 * TicketsContext - Управление тикетами
 * 
 * Отвечает за:
 * - Основной список тикетов (tickets)
 * - Отфильтрованные тикеты для Chat (chatFilteredTickets)
 * - Счётчик непрочитанных (unreadCount)
 * - Hash maps для быстрого доступа
 * - WebSocket обновления
 * - Fetch функции для загрузки тикетов
 */
export const TicketsProvider = ({ children }) => {
  const { sendedValue } = useSocket();
  const { enqueueSnackbar } = useSnackbar();
  const [tickets, setTickets] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [chatFilteredTickets, setChatFilteredTickets] = useState([]);
  const requestIdRef = useRef(0);

  // Hash map для быстрого доступа к тикетам по ID
  const ticketsMap = useRef(new Map());
  const chatFilteredTicketsMap = useRef(new Map());

  // Для отслеживания обработанных message_id
  const processedMessageIds = useRef(new Set());

  // Получаем данные из других контекстов
  const { technicians } = useGetTechniciansList();
  const {
    userId,
    isAdmin,
    workflowOptions,
    groupTitleForApi,
    accessibleGroupTitles,
  } = useContext(UserContext);
  
  const {
    lightTicketFilters,
    isChatFiltered,
    currentChatFilters,
  } = useContext(FiltersContext);

  // Вспомогательные функции для работы с hash map
  const updateTicketsMap = (ticketsArray) => {
    ticketsMap.current.clear();
    ticketsArray.forEach(ticket => {
      ticketsMap.current.set(ticket.id, ticket);
    });
  };

  const updateChatFilteredTicketsMap = (ticketsArray) => {
    chatFilteredTicketsMap.current.clear();
    ticketsArray.forEach(ticket => {
      chatFilteredTicketsMap.current.set(ticket.id, ticket);
    });
  };

  const getTicketById = (ticketId) => {
    return ticketsMap.current.get(ticketId);
  };

  const getChatFilteredTicketById = (ticketId) => {
    return chatFilteredTicketsMap.current.get(ticketId);
  };

  // Универсальная функция для получения тикета с учетом фильтров
  const getTicketByIdWithFilters = (ticketId, isFiltered) => {
    if (isFiltered) {
      return getChatFilteredTicketById(ticketId) || getTicketById(ticketId);
    }
    return getTicketById(ticketId);
  };

  const markMessagesAsRead = async (ticketId, count = 0) => {
    if (!ticketId) return;
    await fetchSingleTicket(ticketId);
  };

  // Функция для проверки соответствия тикета примененным фильтрам
  const doesTicketMatchFilters = useCallback((ticket, filters) => {
    if (!filters || Object.keys(filters).length === 0) return true;

    // Проверяем workflow
    if (filters.workflow) {
      const workflowFilter = Array.isArray(filters.workflow) ? filters.workflow : [filters.workflow];
      if (!workflowFilter.includes(ticket.workflow)) {
        return false;
      }
    }

    // Проверяем action_needed
    if (filters.action_needed !== undefined) {
      const ticketActionNeeded = Boolean(ticket.action_needed);
      const filterActionNeeded = Boolean(filters.action_needed);
      if (ticketActionNeeded !== filterActionNeeded) {
        return false;
      }
    }

    // Проверяем technician_id
    if (filters.technician_id) {
      const technicianFilter = Array.isArray(filters.technician_id) ? filters.technician_id : [filters.technician_id];
      if (!technicianFilter.includes(String(ticket.technician_id))) {
        return false;
      }
    }

    // Проверяем priority
    if (filters.priority) {
      const priorityFilter = Array.isArray(filters.priority) ? filters.priority : [filters.priority];
      if (!priorityFilter.includes(ticket.priority)) {
        return false;
      }
    }

    // Проверяем group_title
    if (filters.group_title) {
      const groupFilter = Array.isArray(filters.group_title) ? filters.group_title : [filters.group_title];
      if (!groupFilter.includes(ticket.group_title)) {
        return false;
      }
    }

    // Проверяем unseen
    if (filters.unseen === "true") {
      if (!ticket.unseen_count || ticket.unseen_count === 0) {
        return false;
      }
    }

    // Проверяем last_message_author
    if (filters.last_message_author) {
      const authorFilter = Array.isArray(filters.last_message_author) ? filters.last_message_author : [filters.last_message_author];

      if (authorFilter.includes(0)) {
        const lastSenderId = ticket.last_message_sender_id;

        if (lastSenderId === undefined || lastSenderId === null) {
          return true;
        }

        const senderId = Number(lastSenderId);

        if (senderId === 1) {
          return false;
        }

        if (String(senderId) === String(userId)) {
          return false;
        }

        if (ticket.clients && ticket.clients.length > 0) {
          const clientIds = ticket.clients.map(client => Number(client.id));
          if (!clientIds.includes(senderId)) {
            return false;
          }
        }
      }
    }

    return true;
  }, [userId]);

  // Рекурсивная загрузка всех страниц тикетов
  const getTicketsListRecursively = async (page = 1, requestId) => {
    try {
      const excluded = ["Realizat cu succes", "Închis și nerealizat"];
      const baseWorkflow = lightTicketFilters.workflow ?? workflowOptions;
      const filteredWorkflow = baseWorkflow.filter((w) => !excluded.includes(w));

      const data = await api.tickets.filters({
        page,
        type: "light",
        group_title: groupTitleForApi,
        attributes: {
          ...lightTicketFilters,
          workflow: filteredWorkflow,
        },
      });

      if (requestIdRef.current !== requestId) return;

      const totalPages = data.pagination?.total_pages || 1;
      const totalUnread = data.tickets.reduce(
        (sum, ticket) => sum + (ticket.unseen_count || 0),
        0
      );

      setUnreadCount((prev) => prev + totalUnread);
      const processedTickets = normalizeLightTickets(data.tickets);
      setTickets((prev) => {
        const existingIds = new Set(prev.map(t => t.id));
        const newTickets = processedTickets.filter(t => !existingIds.has(t.id));
        const updated = [...prev, ...newTickets];
        updateTicketsMap(updated);
        return updated;
      });

      if (page < totalPages) {
        await getTicketsListRecursively(page + 1, requestId);
      }
    } catch (error) {
      if (requestIdRef.current !== requestId) return;
      enqueueSnackbar(showServerError(error), { variant: "error" });
    }
  };

  const fetchTickets = async () => {
    const currentRequestId = Date.now();
    requestIdRef.current = currentRequestId;

    setTickets([]);
    setUnreadCount(0);
    ticketsMap.current.clear();

    await getTicketsListRecursively(1, currentRequestId);
  };

  const fetchChatFilteredTickets = async (filters = {}) => {
    setChatFilteredTickets([]);
    chatFilteredTicketsMap.current.clear();

    try {
      const loadPage = async (page = 1) => {
        const res = await api.tickets.filters({
          page,
          type: "light",
          group_title: groupTitleForApi,
          sort_by: "last_interaction_date",
          order: "DESC",
          attributes: filters,
        });

        const normalized = normalizeLightTickets(res.tickets);
        setChatFilteredTickets((prev) => {
          const existingIds = new Set(prev.map(t => t.id));
          const newTickets = normalized.filter(t => !existingIds.has(t.id));
          const updated = [...prev, ...newTickets];
          updateChatFilteredTicketsMap(updated);
          return updated;
        });

        if (page < res.pagination?.total_pages) {
          await loadPage(page + 1);
        }
      };

      await loadPage(1);
    } catch (err) {
      enqueueSnackbar(showServerError(err), { variant: "error" });
    }
  };

  const fetchSingleTicket = useCallback(async (ticketId) => {
    try {
      const ticket = await api.tickets.ticket.getLightById(ticketId);
      const normalizedTicket = normalizeLightTickets([ticket])[0];
      const isMatchingGroup = normalizedTicket.group_title === groupTitleForApi;

      if (!isMatchingGroup) {
        const hasAccessToTicketGroup = accessibleGroupTitles.includes(normalizedTicket.group_title);
        
        if (!hasAccessToTicketGroup) {
          const existingTicket = getTicketById(ticketId);

          if (existingTicket) {
            if (existingTicket.unseen_count > 0) {
              setUnreadCount((prevCount) => Math.max(0, prevCount - existingTicket.unseen_count));
            }

            ticketsMap.current.delete(ticketId);
            setTickets((prev) => prev.filter((t) => t.id !== ticketId));
          }

          const existingChatTicket = getChatFilteredTicketById(ticketId);
          if (existingChatTicket) {
            chatFilteredTicketsMap.current.delete(ticketId);
            setChatFilteredTickets((prev) => prev.filter((t) => t.id !== ticketId));
          }
          return;
        }
        
        window.dispatchEvent(new CustomEvent('ticketUpdated', {
          detail: { ticketId, ticket: normalizedTicket }
        }));
        return normalizedTicket;
      }

      const newUnseenCount = normalizedTicket.unseen_count || 0;
      const existingTicket = getTicketById(ticketId);
      const oldUnseenCount = existingTicket?.unseen_count || 0;

      setTickets((prev) => {
        const exists = getTicketById(ticketId);

        if (exists) {
          const updated = prev.map((t) => (t.id === ticketId ? normalizedTicket : t));
          ticketsMap.current.set(ticketId, normalizedTicket);
          return updated;
        } else {
          const updated = [...prev, normalizedTicket];
          ticketsMap.current.set(ticketId, normalizedTicket);
          return updated;
        }
      });

      setChatFilteredTickets((prev) => {
        const exists = getChatFilteredTicketById(ticketId);

        if (isChatFiltered && Object.keys(currentChatFilters).length > 0) {
          if (!doesTicketMatchFilters(normalizedTicket, currentChatFilters)) {
            if (exists) {
              chatFilteredTicketsMap.current.delete(ticketId);
              return prev.filter(t => t.id !== ticketId);
            }
            return prev;
          }
        }

        if (exists) {
          const updated = prev.map((t) => (t.id === ticketId ? normalizedTicket : t));
          chatFilteredTicketsMap.current.set(ticketId, normalizedTicket);
          return updated;
        } else {
          if (!isChatFiltered || !Object.keys(currentChatFilters).length > 0 || doesTicketMatchFilters(normalizedTicket, currentChatFilters)) {
            chatFilteredTicketsMap.current.set(ticketId, normalizedTicket);
            return [normalizedTicket, ...prev];
          }
          return prev;
        }
      });

      const diff = newUnseenCount - oldUnseenCount;
      if (diff !== 0) {
        setUnreadCount((prev) => Math.max(0, prev + diff));
      }

      window.dispatchEvent(new CustomEvent('ticketUpdated', {
        detail: { ticketId }
      }));
    } catch (error) {
      enqueueSnackbar(showServerError(error), { variant: "error" });
    }
  }, [groupTitleForApi, accessibleGroupTitles, enqueueSnackbar, isChatFiltered, currentChatFilters, doesTicketMatchFilters]);

  // WebSocket обработчики
  const handleWebSocketMessage = useCallback((message) => {
    switch (message.type) {
      case TYPE_SOCKET_EVENTS.MESSAGE: {
        const { ticket_id, message: msgText, time_sent, mtype, sender_id, message_id } = message.data;

        const isFromAnotherUser = String(sender_id) !== String(userId) && String(sender_id) !== "1";
        const isNewMessage = message_id ? !processedMessageIds.current.has(message_id) : true;

        if (message_id && isNewMessage) {
          processedMessageIds.current.add(message_id);

          if (processedMessageIds.current.size > 1000) {
            const iterator = processedMessageIds.current.values();
            for (let i = 0; i < 500; i++) {
              processedMessageIds.current.delete(iterator.next().value);
            }
          }
        }

        setTickets((prev) => {
          const existingTicket = getTicketById(ticket_id);

          if (!existingTicket) {
            return prev;
          }

          const updatedTicket = {
            ...existingTicket,
            last_message_type: mtype,
            last_message: msgText,
            time_sent,
          };

          ticketsMap.current.set(ticket_id, updatedTicket);

          return prev.map((ticket) =>
            ticket.id === ticket_id ? updatedTicket : ticket
          );
        });

        setChatFilteredTickets((prev) => {
          const existingTicket = getChatFilteredTicketById(ticket_id);
          const ticketFromMain = existingTicket || getTicketById(ticket_id);

          if (!ticketFromMain) {
            return prev;
          }

          const updatedTicket = {
            ...ticketFromMain,
            last_message_type: mtype,
            last_message: msgText,
            time_sent,
          };

          if (isChatFiltered && Object.keys(currentChatFilters).length > 0) {
            const matchesFilters = doesTicketMatchFilters(updatedTicket, currentChatFilters);

            if (!matchesFilters) {
              if (existingTicket) {
                chatFilteredTicketsMap.current.delete(ticket_id);
                return prev.filter(t => t.id !== ticket_id);
              }
              return prev;
            }

            if (existingTicket) {
              chatFilteredTicketsMap.current.set(ticket_id, updatedTicket);
              return prev.map((ticket) =>
                ticket.id === ticket_id ? updatedTicket : ticket
              );
            } else {
              const alreadyInArray = prev.some(t => t.id === ticket_id);
              if (alreadyInArray) {
                chatFilteredTicketsMap.current.set(ticket_id, updatedTicket);
                return prev.map((ticket) =>
                  ticket.id === ticket_id ? updatedTicket : ticket
                );
              }
              chatFilteredTicketsMap.current.set(ticket_id, updatedTicket);
              return [updatedTicket, ...prev];
            }
          }

          if (existingTicket) {
            chatFilteredTicketsMap.current.set(ticket_id, updatedTicket);
            return prev.map((ticket) =>
              ticket.id === ticket_id ? updatedTicket : ticket
            );
          }

          return prev;
        });

        const shouldSendToMessagesContext = isFromAnotherUser || String(sender_id) === "1" || mtype === MEDIA_TYPE.CALL;

        if (shouldSendToMessagesContext) {
          window.dispatchEvent(new CustomEvent('newMessageFromSocket', {
            detail: message.data
          }));
        }

        break;
      }

      case TYPE_SOCKET_EVENTS.SEEN: {
        const { ticket_id, client_id } = message.data || {};

        if (!ticket_id) {
          break;
        }

        window.dispatchEvent(new CustomEvent('messagesSeenByClient', {
          detail: { ticket_id, client_id }
        }));

        break;
      }

      case TYPE_SOCKET_EVENTS.TICKET: {
        const { ticket_id, ticket_ids, group_title, workflow } = message.data || {};

        const idsRaw = Array.isArray(ticket_ids)
          ? ticket_ids
          : (ticket_id ? [ticket_id] : []);

        const ids = [...new Set(
          idsRaw
            .map((v) => Number(v))
            .filter((v) => Number.isFinite(v))
        )];

        const isMatchingGroup = group_title === groupTitleForApi;
        const isMatchingWorkflow = Array.isArray(workflowOptions) && workflowOptions.includes(workflow);

        if (!ids.length || !isMatchingGroup || !isMatchingWorkflow) {
          break;
        }

        ids.forEach((id) => {
          try {
            fetchSingleTicket(id);
          } catch (e) {
            // Failed to fetch ticket
          }
        });

        break;
      }

      case TYPE_SOCKET_EVENTS.TICKET_UPDATE: {
        const { ticket_id, ticket_ids, tickets: ticketsList } = message.data || {};

        if (Array.isArray(ticketsList) && ticketsList.length > 0) {
          ticketsList.forEach((ticketData) => {
            const { id, technician_id, workflow } = ticketData;

            if (!id) return;

            const isResponsible = String(technician_id) === String(userId);
            const isWorkflowAllowed = Array.isArray(workflowOptions) && workflowOptions.includes(workflow);
            const shouldFetch = isAdmin ? isWorkflowAllowed : (isResponsible && isWorkflowAllowed);

            if (shouldFetch) {
              try {
                fetchSingleTicket(id);
              } catch (e) {
                // Failed to fetch updated ticket
              }
            } else {
              const removedTicket = getTicketById(id);

              if (removedTicket?.unseen_count > 0) {
                setUnreadCount((prev) => Math.max(0, prev - removedTicket.unseen_count));
              }

              ticketsMap.current.delete(id);
              chatFilteredTicketsMap.current.delete(id);

              setTickets((prev) => prev.filter((t) => t.id !== id));
              setChatFilteredTickets((prev) => prev.filter((t) => t.id !== id));
            }
          });
        } else {
          const idsRaw = Array.isArray(ticket_ids)
            ? ticket_ids
            : (ticket_id ? [ticket_id] : []);

          const ids = [...new Set(
            idsRaw
              .map((v) => Number(v))
              .filter((v) => Number.isFinite(v))
          )];

          if (ids.length > 0) {
            ids.forEach((id) => {
              const existsInTickets = ticketsMap.current.has(id);
              const existsInChatFiltered = chatFilteredTicketsMap.current.has(id);

              if (existsInTickets || existsInChatFiltered) {
                try {
                  fetchSingleTicket(id);
                } catch (e) {
                  // Failed to fetch updated ticket
                }
              }
            });
          }
        }

        break;
      }

      default:
    }
  }, [userId, fetchSingleTicket, groupTitleForApi, isAdmin, workflowOptions, currentChatFilters, doesTicketMatchFilters, isChatFiltered]);

  useEffect(() => {
    if (sendedValue) {
      handleWebSocketMessage(sendedValue);
    }
  }, [sendedValue, handleWebSocketMessage]);

  return (
    <TicketsContext.Provider
      value={{
        tickets,
        setTickets,
        unreadCount,
        setUnreadCount,
        markMessagesAsRead,
        chatFilteredTickets,
        setChatFilteredTickets,
        fetchTickets,
        fetchChatFilteredTickets,
        fetchSingleTicket,
        getTicketById,
        getChatFilteredTicketById,
        getTicketByIdWithFilters,
        doesTicketMatchFilters,
        technicians,
      }}
    >
      {children}
    </TicketsContext.Provider>
  );
};

export const useTickets = () => {
  const context = useContext(TicketsContext);
  if (!context) {
    throw new Error("useTickets must be used within a TicketsProvider");
  }
  return context;
};

