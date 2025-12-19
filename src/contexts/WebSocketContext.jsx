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
 * Использует onEvent из SocketContext вместо sendedValue
 * для избежания лишних ре-рендеров
 */

import { createContext, useContext, useCallback, useEffect, useRef, useMemo } from "react";
import { useSocket } from "@hooks";
import { TYPE_SOCKET_EVENTS, MEDIA_TYPE } from "@app-constants";
import { useTicketSync } from "./TicketSyncContext";
import { useTickets } from "./TicketsContext";
import { UserContext } from "./UserContext";

const WebSocketContext = createContext(null);

// Максимальный размер кэша обработанных сообщений
const MAX_PROCESSED_MESSAGES = 500;

export const WebSocketProvider = ({ children }) => {
  const { onEvent } = useSocket();
  const { notifyMessageReceived, notifyMessagesSeen, notifyMessageDeleted } = useTicketSync();
  const { 
    ticketsMap, 
    getTicketById, 
    fetchSingleTicket, 
    removeTicket,
    updateTicketInState,
  } = useTickets();
  
  const {
    userId,
    workflowOptions,
    groupTitleForApi,
  } = useContext(UserContext);

  // Map для отслеживания обработанных message_id с TTL
  const processedMessagesRef = useRef(new Map());

  /**
   * Проверка и добавление message_id в кэш
   * Возвращает true если сообщение новое
   */
  const isNewMessage = useCallback((messageId) => {
    if (!messageId) return true;
    
    const cache = processedMessagesRef.current;
    
    if (cache.has(messageId)) {
      return false;
    }
    
    // Добавляем в кэш с timestamp
    cache.set(messageId, Date.now());
    
    // Очистка старых записей если превышен лимит
    if (cache.size > MAX_PROCESSED_MESSAGES) {
      // Удаляем самые старые записи
      const entries = Array.from(cache.entries());
      entries
        .sort((a, b) => a[1] - b[1])
        .slice(0, MAX_PROCESSED_MESSAGES / 2)
        .forEach(([key]) => cache.delete(key));
    }
    
    return true;
  }, []);

  // === Обработчики событий ===

  /**
   * Обработка нового сообщения
   */
  const handleMessage = useCallback((message) => {
    const { ticket_id, message: msgText, time_sent, mtype, sender_id, message_id } = message.data;

    const isFromAnotherUser = String(sender_id) !== String(userId) && String(sender_id) !== "1";
    const messageIsNew = isNewMessage(message_id);

    if (!messageIsNew) return;

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
  }, [userId, isNewMessage, getTicketById, updateTicketInState, notifyMessageReceived]);

  /**
   * Обработка события "сообщения прочитаны"
   */
  const handleSeen = useCallback((message) => {
    const { ticket_id, client_id } = message.data || {};
    if (!ticket_id) return;
    notifyMessagesSeen(ticket_id, client_id);
  }, [notifyMessagesSeen]);

  /**
   * Обработка удаления сообщения
   */
  const handleDelete = useCallback((message) => {
    const { message_id } = message.data || {};
    if (!message_id) return;
    notifyMessageDeleted(message_id);
  }, [notifyMessageDeleted]);

  /**
   * Обработка нового тикета
   */
  const handleTicket = useCallback((message) => {
    const { ticket_id, ticket_ids, group_title, workflow } = message.data || {};

    const idsRaw = Array.isArray(ticket_ids)
      ? ticket_ids
      : (ticket_id ? [ticket_id] : []);

    const ids = [...new Set(
      idsRaw.map((v) => Number(v)).filter((v) => Number.isFinite(v))
    )];

    const isMatchingGroup = group_title === groupTitleForApi;
    const isMatchingWorkflow = Array.isArray(workflowOptions) && workflowOptions.includes(workflow);

    if (!ids.length || !isMatchingGroup || !isMatchingWorkflow) return;

    ids.forEach((id) => {
      try {
        fetchSingleTicket(id);
      } catch { /* ignore */ }
    });
  }, [groupTitleForApi, workflowOptions, fetchSingleTicket]);

  /**
   * Обработка обновления тикета
   * 
   * Логика:
   * 1. Если groupTitleForApi не определён — пропускаем (данные ещё грузятся)
   * 2. Если group_title изменился на ДРУГОЙ и тикет есть в списке → УДАЛИТЬ
   * 3. Если group_title совпадает и workflow разрешён → FETCH (добавить/обновить)
   * 4. Если group_title совпадает но workflow не разрешён → УДАЛИТЬ (если был)
   */
  const handleTicketUpdate = useCallback((message) => {
    const { ticket_id, ticket_ids, tickets: ticketsList } = message.data || {};

    // Если groupTitleForApi или workflowOptions не определены — данные ещё грузятся
    if (!groupTitleForApi || !workflowOptions?.length) return;

    // Новый формат с массивом tickets
    if (Array.isArray(ticketsList) && ticketsList.length > 0) {
      ticketsList.forEach((ticketData) => {
        const { id, workflow, group_title } = ticketData;
        if (!id) return;

        const existsInOurList = ticketsMap.current.has(id);
        const isMatchingGroup = group_title === groupTitleForApi;

        // Если тикет ушёл в другую группу — удаляем из нашего списка
        if (!isMatchingGroup) {
          if (existsInOurList) {
            removeTicket(id);
          }
          return;
        }

        // group_title совпадает — проверяем workflow
        const isWorkflowAllowed = workflowOptions.includes(workflow);

        if (isWorkflowAllowed) {
          // Workflow разрешён (или workflowOptions ещё не загружен) — загружаем/обновляем тикет
          try {
            fetchSingleTicket(id);
          } catch { /* ignore */ }
        } else if (existsInOurList) {
          // Workflow не разрешён и тикет был в списке — удаляем
          removeTicket(id);
        }
      });
      return;
    }

    // Старый формат (без group_title в событии — fetch чтобы получить актуальные данные)
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
          // fetchSingleTicket сам проверит group_title и удалит если нужно
          try {
            fetchSingleTicket(id);
          } catch { /* ignore */ }
        }
      });
    }
  }, [workflowOptions, groupTitleForApi, fetchSingleTicket, removeTicket, ticketsMap]);

  // === Подписка на события через onEvent ===
  // Это эффективнее чем слушать sendedValue — не вызывает ре-рендер компонента

  useEffect(() => {
    const unsubMessage = onEvent(TYPE_SOCKET_EVENTS.MESSAGE, handleMessage);
    return unsubMessage;
  }, [onEvent, handleMessage]);

  useEffect(() => {
    const unsubSeen = onEvent(TYPE_SOCKET_EVENTS.SEEN, handleSeen);
    return unsubSeen;
  }, [onEvent, handleSeen]);

  useEffect(() => {
    const unsubDelete = onEvent(TYPE_SOCKET_EVENTS.DELETE, handleDelete);
    return unsubDelete;
  }, [onEvent, handleDelete]);

  useEffect(() => {
    const unsubTicket = onEvent(TYPE_SOCKET_EVENTS.TICKET, handleTicket);
    return unsubTicket;
  }, [onEvent, handleTicket]);

  useEffect(() => {
    const unsubTicketUpdate = onEvent(TYPE_SOCKET_EVENTS.TICKET_UPDATE, handleTicketUpdate);
    return unsubTicketUpdate;
  }, [onEvent, handleTicketUpdate]);

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
