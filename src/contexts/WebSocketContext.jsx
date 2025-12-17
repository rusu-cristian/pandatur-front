/**
 * WebSocketContext — контекст для обработки WebSocket сообщений
 * 
 * Обрабатывает события:
 * - MESSAGE — новое сообщение
 * - SEEN — сообщения прочитаны
 * - DELETE — сообщение удалено
 * - TICKET — новый тикет
 * - TICKET_UPDATE — обновление тикета
 * 
 * Использует TicketSyncContext для оповещения других компонентов
 */

import { createContext, useContext, useCallback, useEffect, useRef, useMemo } from "react";
import { useSocket } from "@hooks";
import { TYPE_SOCKET_EVENTS, MEDIA_TYPE } from "@app-constants";
import { useTicketSync } from "./TicketSyncContext";
import { useTickets } from "./TicketsContext";
import { UserContext } from "./UserContext";

const WebSocketContext = createContext(null);

export const WebSocketProvider = ({ children }) => {
  const { sendedValue } = useSocket();
  const { notifyMessageReceived, notifyMessagesSeen, notifyMessageDeleted } = useTicketSync();
  const { 
    tickets, 
    ticketsMap, 
    getTicketById, 
    fetchSingleTicket, 
    removeTicket,
    updateTicketInState,
    setUnreadCount,
  } = useTickets();
  
  const {
    userId,
    isAdmin,
    workflowOptions,
    groupTitleForApi,
  } = useContext(UserContext);

  // Для отслеживания обработанных message_id
  const processedMessageIds = useRef(new Set());

  /**
   * Обработчик WebSocket сообщений
   */
  const handleWebSocketMessage = useCallback((message) => {
    switch (message.type) {
      case TYPE_SOCKET_EVENTS.MESSAGE: {
        const { ticket_id, message: msgText, time_sent, mtype, sender_id, message_id } = message.data;

        const isFromAnotherUser = String(sender_id) !== String(userId) && String(sender_id) !== "1";
        const isNewMessage = message_id ? !processedMessageIds.current.has(message_id) : true;

        if (message_id && isNewMessage) {
          processedMessageIds.current.add(message_id);

          // Очистка старых ID
          if (processedMessageIds.current.size > 1000) {
            const iterator = processedMessageIds.current.values();
            for (let i = 0; i < 500; i++) {
              processedMessageIds.current.delete(iterator.next().value);
            }
          }
        }

        // Обновляем информацию о последнем сообщении в tickets state
        const existingTicket = getTicketById(ticket_id);
        if (existingTicket) {
          updateTicketInState(ticket_id, {
            last_message_type: mtype,
            last_message: msgText,
            time_sent,
          });
        }

        // Оповещаем через TicketSync
        const shouldNotify = isFromAnotherUser || String(sender_id) === "1" || mtype === MEDIA_TYPE.CALL;
        if (shouldNotify) {
          notifyMessageReceived(message.data);
        }

        break;
      }

      case TYPE_SOCKET_EVENTS.SEEN: {
        const { ticket_id, client_id } = message.data || {};
        if (!ticket_id) break;

        notifyMessagesSeen(ticket_id, client_id);
        break;
      }

      case TYPE_SOCKET_EVENTS.DELETE: {
        const { message_id } = message.data || {};
        if (!message_id) break;

        notifyMessageDeleted(message_id);
        break;
      }

      case TYPE_SOCKET_EVENTS.TICKET: {
        const { ticket_id, ticket_ids, group_title, workflow } = message.data || {};

        const idsRaw = Array.isArray(ticket_ids)
          ? ticket_ids
          : (ticket_id ? [ticket_id] : []);

        const ids = [...new Set(
          idsRaw.map((v) => Number(v)).filter((v) => Number.isFinite(v))
        )];

        const isMatchingGroup = group_title === groupTitleForApi;
        const isMatchingWorkflow = Array.isArray(workflowOptions) && workflowOptions.includes(workflow);

        if (!ids.length || !isMatchingGroup || !isMatchingWorkflow) break;

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

        // Новый формат с массивом tickets
        if (Array.isArray(ticketsList) && ticketsList.length > 0) {
          ticketsList.forEach((ticketData) => {
            const { id, technician_id, workflow, group_title } = ticketData;
            if (!id) return;

            const isMatchingGroup = group_title === groupTitleForApi;
            if (!isMatchingGroup) return;

            const isResponsible = String(technician_id) === String(userId);
            const isWorkflowAllowed = Array.isArray(workflowOptions) && workflowOptions.includes(workflow);

            const shouldFetch = isAdmin ? isWorkflowAllowed : (isResponsible && isWorkflowAllowed);

            if (shouldFetch) {
              try {
                fetchSingleTicket(id);
              } catch (e) {
                // Failed to fetch
              }
            } else {
              removeTicket(id);
            }
          });
        }
        // Старый формат
        else {
          const idsRaw = Array.isArray(ticket_ids)
            ? ticket_ids
            : (ticket_id ? [ticket_id] : []);

          const ids = [...new Set(
            idsRaw.map((v) => Number(v)).filter((v) => Number.isFinite(v))
          )];

          if (ids.length > 0) {
            ids.forEach((id) => {
              const existsInTickets = ticketsMap.current.has(id);
              if (existsInTickets) {
                try {
                  fetchSingleTicket(id);
                } catch (e) {
                  // Failed to fetch
                }
              }
            });
          }
        }

        break;
      }

      default:
    }
  }, [
    userId, 
    isAdmin, 
    workflowOptions, 
    groupTitleForApi, 
    getTicketById,
    fetchSingleTicket, 
    removeTicket,
    updateTicketInState,
    notifyMessageReceived,
    notifyMessagesSeen,
    notifyMessageDeleted,
    ticketsMap,
  ]);

  // Слушаем WebSocket сообщения
  useEffect(() => {
    if (sendedValue) {
      handleWebSocketMessage(sendedValue);
    }
  }, [sendedValue, handleWebSocketMessage]);

  const value = useMemo(() => ({
    // Можно добавить методы для отправки сообщений через WebSocket
  }), []);

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error("useWebSocket must be used within WebSocketProvider");
  }
  return context;
};
