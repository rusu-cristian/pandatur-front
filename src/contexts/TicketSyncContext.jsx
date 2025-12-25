/**
 * TicketSyncContext — контекст для синхронизации обновлений тикетов
 * 
 * Заменяет window.dispatchEvent('ticketUpdated') на типизированный React Context.
 * Позволяет компонентам подписываться на обновления тикетов без прямой связи.
 * 
 * Преимущества перед window.dispatchEvent:
 * - Типизировано (легко добавить TypeScript)
 * - Отслеживается в React DevTools
 * - Автоматическая очистка при unmount
 * - Можно легко добавить middleware (логирование, дебаг)
 */

import { createContext, useContext, useCallback, useRef, useMemo, useEffect } from "react";

// Типы событий синхронизации
export const SYNC_EVENTS = {
  TICKET_UPDATED: "ticketUpdated",
  MESSAGE_RECEIVED: "messageReceived",
  MESSAGES_SEEN: "messagesSeen",
  MESSAGE_DELETED: "messageDeleted",
  TICKETS_MERGED: "ticketsMerged",
};

const TicketSyncContext = createContext(null);

/**
 * Провайдер для синхронизации тикетов
 */
export const TicketSyncProvider = ({ children }) => {
  // Хранилище подписчиков: { eventType: Set<callback> }
  const subscribersRef = useRef(new Map());

  /**
   * Подписаться на событие
   * 
   * @param {string} eventType - Тип события из SYNC_EVENTS
   * @param {Function} callback - Функция обработчик
   * @returns {Function} - Функция отписки
   */
  const subscribe = useCallback((eventType, callback) => {
    if (!subscribersRef.current.has(eventType)) {
      subscribersRef.current.set(eventType, new Set());
    }
    
    subscribersRef.current.get(eventType).add(callback);
    
    // Возвращаем функцию отписки
    return () => {
      const subscribers = subscribersRef.current.get(eventType);
      if (subscribers) {
        subscribers.delete(callback);
      }
    };
  }, []);

  /**
   * Отправить событие всем подписчикам
   * 
   * @param {string} eventType - Тип события
   * @param {Object} payload - Данные события
   */
  const emit = useCallback((eventType, payload) => {
    const subscribers = subscribersRef.current.get(eventType);
    if (subscribers) {
      subscribers.forEach((callback) => {
        try {
          callback(payload);
        } catch (error) {
          console.error(`[TicketSync] Error in subscriber for ${eventType}:`, error);
        }
      });
    }
  }, []);

  // === Методы для конкретных событий ===

  /**
   * Оповестить об обновлении тикета
   */
  const notifyTicketUpdated = useCallback((ticketId, ticket) => {
    emit(SYNC_EVENTS.TICKET_UPDATED, { ticketId, ticket });
  }, [emit]);

  /**
   * Оповестить о новом сообщении
   */
  const notifyMessageReceived = useCallback((messageData) => {
    emit(SYNC_EVENTS.MESSAGE_RECEIVED, messageData);
  }, [emit]);

  /**
   * Оповестить что сообщения прочитаны
   */
  const notifyMessagesSeen = useCallback((ticketId, clientId) => {
    emit(SYNC_EVENTS.MESSAGES_SEEN, { ticketId, clientId });
  }, [emit]);

  /**
   * Оповестить об удалении сообщения
   */
  const notifyMessageDeleted = useCallback((messageId) => {
    emit(SYNC_EVENTS.MESSAGE_DELETED, { messageId });
  }, [emit]);

  /**
   * Оповестить об объединении тикетов
   * 
   * @param {number[]} deletedTicketIds - ID удалённых тикетов
   * @param {number} targetTicketId - ID целевого тикета (куда объединили)
   */
  const notifyTicketsMerged = useCallback((deletedTicketIds, targetTicketId) => {
    emit(SYNC_EVENTS.TICKETS_MERGED, { deletedTicketIds, targetTicketId });
  }, [emit]);

  const value = useMemo(() => ({
    // Низкоуровневый API
    subscribe,
    emit,
    
    // Высокоуровневый API (рекомендуется)
    notifyTicketUpdated,
    notifyMessageReceived,
    notifyMessagesSeen,
    notifyMessageDeleted,
    notifyTicketsMerged,
    
    // Константы
    SYNC_EVENTS,
  }), [subscribe, emit, notifyTicketUpdated, notifyMessageReceived, notifyMessagesSeen, notifyMessageDeleted, notifyTicketsMerged]);

  return (
    <TicketSyncContext.Provider value={value}>
      {children}
    </TicketSyncContext.Provider>
  );
};

/**
 * Хук для доступа к контексту синхронизации
 */
export const useTicketSync = () => {
  const context = useContext(TicketSyncContext);
  if (!context) {
    throw new Error("useTicketSync must be used within TicketSyncProvider");
  }
  return context;
};

/**
 * Хук для подписки на обновления тикетов
 * Автоматически отписывается при unmount
 * 
 * @param {Function} callback - Обработчик обновления { ticketId, ticket }
 */
export const useOnTicketUpdated = (callback) => {
  const { subscribe } = useTicketSync();
  
  // Храним актуальный callback в ref
  const callbackRef = useRef(callback);
  callbackRef.current = callback;
  
  // useEffect для side effects (подписка/отписка)
  useEffect(() => {
    const unsubscribe = subscribe(SYNC_EVENTS.TICKET_UPDATED, (payload) => {
      callbackRef.current(payload);
    });
    return unsubscribe;
  }, [subscribe]);
};

/**
 * Хук для подписки на новые сообщения
 * 
 * @param {Function} callback - Обработчик сообщения
 */
export const useOnMessageReceived = (callback) => {
  const { subscribe } = useTicketSync();
  const callbackRef = useRef(callback);
  callbackRef.current = callback;
  
  useEffect(() => {
    const unsubscribe = subscribe(SYNC_EVENTS.MESSAGE_RECEIVED, (payload) => {
      callbackRef.current(payload);
    });
    return unsubscribe;
  }, [subscribe]);
};

/**
 * Хук для подписки на событие "сообщения прочитаны"
 * 
 * @param {Function} callback - Обработчик
 */
export const useOnMessagesSeen = (callback) => {
  const { subscribe } = useTicketSync();
  const callbackRef = useRef(callback);
  callbackRef.current = callback;
  
  useEffect(() => {
    const unsubscribe = subscribe(SYNC_EVENTS.MESSAGES_SEEN, (payload) => {
      callbackRef.current(payload);
    });
    return unsubscribe;
  }, [subscribe]);
};

/**
 * Хук для подписки на удаление сообщения
 * 
 * @param {Function} callback - Обработчик
 */
export const useOnMessageDeleted = (callback) => {
  const { subscribe } = useTicketSync();
  const callbackRef = useRef(callback);
  callbackRef.current = callback;
  
  useEffect(() => {
    const unsubscribe = subscribe(SYNC_EVENTS.MESSAGE_DELETED, (payload) => {
      callbackRef.current(payload);
    });
    return unsubscribe;
  }, [subscribe]);
};

/**
 * Хук для подписки на объединение тикетов
 * 
 * @param {Function} callback - Обработчик { deletedTicketIds: number[], targetTicketId: number }
 */
export const useOnTicketsMerged = (callback) => {
  const { subscribe } = useTicketSync();
  const callbackRef = useRef(callback);
  callbackRef.current = callback;
  
  useEffect(() => {
    const unsubscribe = subscribe(SYNC_EVENTS.TICKETS_MERGED, (payload) => {
      callbackRef.current(payload);
    });
    return unsubscribe;
  }, [subscribe]);
};
