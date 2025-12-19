/**
 * MessagesContext — контекст для работы с сообщениями чата
 * 
 * Отвечает за:
 * - Хранение списка сообщений текущего чата
 * - Обработку входящих сообщений
 * - Обработку ошибок отправки
 * - Синхронизацию с TicketSyncContext
 * 
 * Использует onEvent из SocketContext для обработки ошибок
 */

import React, { createContext, useEffect, useCallback, useRef } from "react";
import { useMessages, useSocket, useUser } from "@hooks";
import { TYPE_SOCKET_EVENTS, MEDIA_TYPE } from "@app-constants";
import { useTicketSync, SYNC_EVENTS } from "./TicketSyncContext";

export const MessagesContext = createContext(null);

const ERROR_PREFIX = "❗️❗️❗️Mesajul nu poate fi trimis";

export const MessagesProvider = ({ children }) => {
  const messages = useMessages();
  const { onEvent } = useSocket();
  const { userId } = useUser();
  const { subscribe } = useTicketSync();

  // Стабильная ссылка на messages
  const messagesRef = useRef(messages);
  messagesRef.current = messages;

  /**
   * Обработка входящего сообщения
   */
  const handleIncomingMessage = useCallback((incoming) => {
    // Для звонков: всегда обновляем сообщение
    const isCall = incoming.mtype === MEDIA_TYPE.CALL;
    
    // Для сообщений от других пользователей
    const isFromAnotherUser = Number(incoming.sender_id) !== Number(userId) && Number(incoming.sender_id) !== 1;
    
    // Для сообщений от системы (sender_id = 1)
    const isFromSystem = Number(incoming.sender_id) === 1;
    
    // Для сообщений от текущего пользователя
    const isFromCurrentUser = Number(incoming.sender_id) === Number(userId);
    
    // Проверяем ошибки
    const hasErrorInText = incoming.message?.startsWith(ERROR_PREFIX);
    const hasErrorInField = (incoming.status === "NOT_SENT" || incoming.message_status === "NOT_SENT") && incoming.error_message;
    
    // Обработка ошибок для сообщений текущего пользователя
    if (isFromCurrentUser && (hasErrorInText || hasErrorInField)) {
      messagesRef.current.setMessages((prev) => {
        const index = prev.findIndex((m) => {
          const isPending = m.messageStatus === "PENDING";
          const sameSender = Number(m.sender_id) === Number(incoming.sender_id);
          const sameTicket = Number(m.ticket_id) === Number(incoming.ticket_id);
          
          // Если есть message_id — используем для точного сопоставления
          if (incoming.message_id) {
            return (Number(m.message_id) === Number(incoming.message_id) || 
                    Number(m.id) === Number(incoming.message_id)) && 
                   sameTicket;
          }
          
          // Иначе ищем по тексту сообщения
          if (hasErrorInText) {
            const originalText = m.message?.trim();
            const fullText = incoming.message?.trim();
            const errorIncludesOriginal = fullText.includes(originalText);
            return isPending && sameSender && sameTicket && errorIncludesOriginal;
          }
          
          // Для ошибок с error_message ищем по platform_id
          if (hasErrorInField && incoming.platform_id) {
            return isPending && sameSender && sameTicket && 
                   (m.platform_id === incoming.platform_id || 
                    m.message === incoming.message);
          }
          
          return false;
        });

        if (index !== -1) {
          const updated = [...prev];
          updated[index] = {
            ...prev[index],
            ...incoming,
            messageStatus: "ERROR",
            message_status: incoming.message_status || incoming.status || "NOT_SENT",
            error_message: incoming.error_message || updated[index].error_message,
            id: prev[index].id || incoming.message_id || Math.random().toString(),
          };
          return updated;
        }

        return prev;
      });
      return;
    }
    
    // Для всех остальных сообщений (от других пользователей, системы, звонков)
    if (isCall || isFromAnotherUser || isFromSystem) {
      messagesRef.current.updateMessage(incoming);
    }
    
    // Игнорируем обычные сообщения от текущего пользователя (они уже добавлены как pending)
  }, [userId]);

  // === Подписка на WebSocket события через onEvent ===
  // Обрабатываем только ошибки и служебные сообщения
  useEffect(() => {
    const unsubscribe = onEvent(TYPE_SOCKET_EVENTS.MESSAGE, (message) => {
      if (message?.data) {
        handleIncomingMessage(message.data);
      }
    });
    return unsubscribe;
  }, [onEvent, handleIncomingMessage]);

  // === Подписка на TicketSync события ===
  
  // Новые сообщения от других пользователей
  useEffect(() => {
    const unsubscribe = subscribe(SYNC_EVENTS.MESSAGE_RECEIVED, (messageData) => {
      if (messageData) {
        handleIncomingMessage(messageData);
      }
    });
    return unsubscribe;
  }, [subscribe, handleIncomingMessage]);

  // Сообщения прочитаны
  useEffect(() => {
    const unsubscribe = subscribe(SYNC_EVENTS.MESSAGES_SEEN, ({ ticketId }) => {
      if (ticketId && messagesRef.current.markMessagesAsSeen) {
        messagesRef.current.markMessagesAsSeen(ticketId);
      }
    });
    return unsubscribe;
  }, [subscribe]);

  // Удаление сообщения
  useEffect(() => {
    const unsubscribe = subscribe(SYNC_EVENTS.MESSAGE_DELETED, ({ messageId }) => {
      if (messageId && messagesRef.current.deleteMessage) {
        messagesRef.current.deleteMessage(messageId);
      }
    });
    return unsubscribe;
  }, [subscribe]);

  return (
    <MessagesContext.Provider value={messages}>
      {children}
    </MessagesContext.Provider>
  );
};
