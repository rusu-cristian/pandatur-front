import React, { createContext, useEffect, useCallback, useRef } from "react";
import { useMessages, useSocket, useUser } from "@hooks";
import { TYPE_SOCKET_EVENTS, MEDIA_TYPE } from "@app-constants";

export const MessagesContext = createContext();

const ERROR_PREFIX = "❗️❗️❗️Mesajul nu poate fi trimis";

export const MessagesProvider = ({ children }) => {
  const messages = useMessages();
  const { sendedValue } = useSocket();
  const { userId } = useUser();

  // Создаем стабильные ссылки на функции
  const messagesRef = useRef(messages);
  messagesRef.current = messages;

  const handleIncomingMessage = useCallback((message) => {
    const incoming = message.data;

    // Для звонков: всегда обновляем сообщение (независимо от sender_id)
    // Потому что звонок сначала приходит без записи, потом с URL записи
    const isCall = incoming.mtype === MEDIA_TYPE.CALL;
    
    // Для сообщений от других пользователей: добавляем/обновляем
    const isFromAnotherUser = Number(incoming.sender_id) !== Number(userId) && Number(incoming.sender_id) !== 1;
    
    // Для сообщений от системы (sender_id = 1): всегда добавляем
    const isFromSystem = Number(incoming.sender_id) === 1;
    
    // Для сообщений от текущего пользователя: обрабатываем только ошибки
    const isFromCurrentUser = Number(incoming.sender_id) === Number(userId);
    
    // Обработка ошибок для сообщений текущего пользователя
    // Проверяем два случая: ошибка в тексте сообщения или ошибка в поле error_message
    const hasErrorInText = incoming.message?.startsWith(ERROR_PREFIX);
    const hasErrorInField = (incoming.status === "NOT_SENT" || incoming.message_status === "NOT_SENT") && incoming.error_message;
    
    if (isFromCurrentUser && (hasErrorInText || hasErrorInField)) {
      messagesRef.current.setMessages((prev) => {
        const index = prev.findIndex((m) => {
          const isPending = m.messageStatus === "PENDING";
          const sameSender = Number(m.sender_id) === Number(incoming.sender_id);
          const sameTicket = Number(m.ticket_id) === Number(incoming.ticket_id);
          
          // Сначала пробуем найти по platform_id (temp_xxx) - это самый надежный способ
          // так как pending сообщение создается с platform_id до получения message_id от сервера
          if (incoming.platform_id && m.platform_id === incoming.platform_id && sameTicket) {
            return true;
          }
          
          // Затем пробуем найти по message_id если оба имеют его
          if (incoming.message_id && m.message_id && 
              Number(m.message_id) === Number(incoming.message_id) && sameTicket) {
            return true;
          }
          
          // Пробуем найти по id === message_id
          if (incoming.message_id && m.id && 
              Number(m.id) === Number(incoming.message_id) && sameTicket) {
            return true;
          }
          
          // Ищем по тексту сообщения (для ошибок в тексте)
          if (hasErrorInText && isPending && sameSender && sameTicket) {
            const originalText = m.message?.trim();
            const fullText = incoming.message?.trim();
            if (fullText && originalText && fullText.includes(originalText)) {
              return true;
            }
          }
          
          // Последняя попытка - по тексту сообщения для pending сообщений
          if (hasErrorInField && isPending && sameSender && sameTicket && 
              m.message === incoming.message) {
            return true;
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

        // Если pending сообщение не найдено, но есть message_id - попробуем обновить по ID
        if (incoming.message_id) {
          const idIndex = prev.findIndex((m) => 
            Number(m.message_id) === Number(incoming.message_id) || 
            Number(m.id) === Number(incoming.message_id)
          );
          
          if (idIndex !== -1) {
            const updated = [...prev];
            updated[idIndex] = {
              ...prev[idIndex],
              ...incoming,
              messageStatus: "ERROR",
              message_status: incoming.message_status || incoming.status || "NOT_SENT",
              error_message: incoming.error_message || updated[idIndex].error_message,
            };
            return updated;
          }
        }

        return prev;
      });
      return;
    }
    
    // Для всех остальных сообщений (от других пользователей, системы, звонков)
    if (isCall || isFromAnotherUser || isFromSystem) {
      // Проверяем, есть ли ошибка в сообщении, и устанавливаем статус
      const hasError = (incoming.status === "NOT_SENT" || incoming.message_status === "NOT_SENT");
      const messageWithStatus = hasError ? {
        ...incoming,
        messageStatus: "ERROR",
      } : incoming;
      
      messagesRef.current.updateMessage(messageWithStatus);
      return;
    }
    
    // Игнорируем сообщения от текущего пользователя (кроме ошибок)
  }, [userId]); // Убираем messages из зависимостей, используем useRef

  // Обрабатываем сообщения от сокета напрямую (для ошибок от текущего пользователя)
  useEffect(() => {
    if (sendedValue?.type === TYPE_SOCKET_EVENTS.MESSAGE) {
      handleIncomingMessage(sendedValue);
    }
  }, [sendedValue, handleIncomingMessage]);

  // Слушаем события от AppContext для обновления сообщений от других пользователей
  useEffect(() => {
    const handleNewMessageFromSocket = (event) => {
      const messageData = event.detail;
      if (messageData) {
        handleIncomingMessage({ data: messageData });
      }
    };

    window.addEventListener('newMessageFromSocket', handleNewMessageFromSocket);
    
    return () => {
      window.removeEventListener('newMessageFromSocket', handleNewMessageFromSocket);
    };
  }, [handleIncomingMessage]);

  // Обрабатываем событие "seen" от клиента - обновляем статусы сообщений
  useEffect(() => {
    const handleMessagesSeenByClient = (event) => {
      const { ticket_id } = event.detail || {};
      if (ticket_id && messagesRef.current.markMessagesAsSeen) {
        messagesRef.current.markMessagesAsSeen(ticket_id);
      }
    };

    window.addEventListener('messagesSeenByClient', handleMessagesSeenByClient);
    
    return () => {
      window.removeEventListener('messagesSeenByClient', handleMessagesSeenByClient);
    };
  }, []); // Пустой массив зависимостей, так как используем useRef

  // Обрабатываем событие удаления сообщения
  useEffect(() => {
    const handleMessageDeleted = (event) => {
      const { message_id } = event.detail || {};
      if (message_id && messagesRef.current.deleteMessage) {
        messagesRef.current.deleteMessage(message_id);
      }
    };

    window.addEventListener('messageDeleted', handleMessageDeleted);
    
    return () => {
      window.removeEventListener('messageDeleted', handleMessageDeleted);
    };
  }, []); // Пустой массив зависимостей, так как используем useRef

  return (
    <MessagesContext.Provider value={messages}>
      {children}
    </MessagesContext.Provider>
  );
};

