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
          
          // Если есть message_id или id - используем их для точного сопоставления
          if (incoming.message_id) {
            return (Number(m.message_id) === Number(incoming.message_id) || 
                    Number(m.id) === Number(incoming.message_id)) && 
                   sameTicket;
          }
          
          // Иначе ищем по тексту сообщения (старая логика)
          if (hasErrorInText) {
            const originalText = m.message?.trim();
            const fullText = incoming.message?.trim();
            const errorIncludesOriginal = fullText.includes(originalText);
            return isPending && sameSender && sameTicket && errorIncludesOriginal;
          }
          
          // Для ошибок с error_message ищем по platform_id (temp_xxx)
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

  return (
    <MessagesContext.Provider value={messages}>
      {children}
    </MessagesContext.Provider>
  );
};

