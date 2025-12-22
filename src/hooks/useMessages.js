import { useState, useMemo, useEffect, useContext, useCallback } from "react";
import { useSnackbar } from "notistack";
import { api } from "@api";
import { useUser } from "@hooks";
import { showServerError } from "@utils";
import { MEDIA_TYPE } from "@app-constants";
import { SocketContext } from "../contexts/SocketContext";

const FORMAT_MEDIA = [
  MEDIA_TYPE.AUDIO,
  MEDIA_TYPE.VIDEO,
  MEDIA_TYPE.IMAGE,
  MEDIA_TYPE.FILE,
  MEDIA_TYPE.CALL,
  MEDIA_TYPE.EMAIL,
  "document", // Тип для документов (PDF и т.д.)
];

// Максимальное количество сообщений в памяти (баланс памяти и UX)
const MAX_MESSAGES_IN_MEMORY = 200;

const getMediaFileMessages = (messageList) => {
  return messageList.filter((msg) => FORMAT_MEDIA.includes(msg.mtype));
};

export const useMessages = () => {
  const { enqueueSnackbar } = useSnackbar();
  const { onEvent, offEvent } = useContext(SocketContext);

  const [messages, setMessages] = useState([]);
  const [logs, setLogs] = useState([]);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastMessage, setLastMessage] = useState();
  const [mediaFiles, setMediaFiles] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const { userId } = useUser();

  // Загрузка первой страницы сообщений (сброс всех данных)
  const getUserMessages = useCallback(async (id, page = 1, limit = 25) => {
    setLoading(true);
    try {
      const response = await api.messages.messagesTicketById(id, page, limit);
      const data = Array.isArray(response?.messages) ? response.messages : [];
      const logsData = Array.isArray(response?.logs) ? response.logs : [];
      const notesData = Array.isArray(response?.notes) ? response.notes : [];

      setMessages(data);
      setLogs(logsData);
      setNotes(notesData);
      setCurrentPage(page);
      
      // Используем информацию о пагинации из API
      setHasMoreMessages(response?.pagination?.has_more || false);

      const sortedMessages = data.filter(
        ({ sender_id }) => sender_id !== 1 && sender_id !== userId
      );
      setLastMessage(sortedMessages[sortedMessages.length - 1]);
      setMediaFiles(getMediaFileMessages(data));
    } catch (error) {
      enqueueSnackbar(showServerError(error), { variant: "error" });
    } finally {
      setLoading(false);
    }
  }, [enqueueSnackbar, userId]);

  // Загрузка дополнительных сообщений (добавление к существующим)
  const loadMoreMessages = useCallback(async (id, limit = 25) => {
    setLoading(true);
    try {
      const nextPage = currentPage + 1;
      const response = await api.messages.messagesTicketById(id, nextPage, limit);
      const newData = Array.isArray(response?.messages) ? response.messages : [];
      const newLogsData = Array.isArray(response?.logs) ? response.logs : [];
      const newNotesData = Array.isArray(response?.notes) ? response.notes : [];

      // Добавляем новые сообщения к существующим (вначало списка, так как это старые сообщения)
      // Ограничиваем максимальное количество сообщений в памяти
      setMessages((prev) => {
        const combined = [...newData, ...prev];
        if (combined.length > MAX_MESSAGES_IN_MEMORY) {
          // Оставляем только последние MAX_MESSAGES_IN_MEMORY сообщений
          return combined.slice(0, MAX_MESSAGES_IN_MEMORY);
        }
        return combined;
      });
      setLogs((prev) => [...newLogsData, ...prev]);
      setNotes((prev) => [...newNotesData, ...prev]);
      setCurrentPage(nextPage);
      
      // Используем информацию о пагинации из API
      setHasMoreMessages(response?.pagination?.has_more || false);

      // Обновляем mediaFiles
      setMediaFiles((prev) => [...getMediaFileMessages(newData), ...prev]);
    } catch (error) {
      enqueueSnackbar(showServerError(error), { variant: "error" });
    } finally {
      setLoading(false);
    }
  }, [currentPage, enqueueSnackbar]);

  const markMessageRead = useCallback((id) => {
    setMessages((prevMessages) =>
      prevMessages.map((msg) => {
        if (msg.ticket_id === id) {
          return {
            ...msg,
            seen_by: JSON.stringify({ [userId]: true }),
            seen_at: new Date().toISOString(),
          };
        }
        return msg;
      })
    );
  }, [userId]);

  const updateMessage = useCallback((message) => {
    setMessages((prevMessages) => {
      if (!message?.message_id) {
        // Если нет message_id - просто добавляем (старая логика для совместимости)
        return [...prevMessages, message];
      }

      // Ищем существующее сообщение по message_id или id
      const existingIndex = prevMessages.findIndex(
        (msg) => {
          // Сравниваем message_id с message_id
          if (msg.message_id && message.message_id) {
            return Number(msg.message_id) === Number(message.message_id);
          }
          // Сравниваем message_id с id (для сообщений из БД)
          if (msg.id && message.message_id) {
            return Number(msg.id) === Number(message.message_id);
          }
          // Сравниваем id с message_id (обратный случай)
          if (msg.message_id && message.id) {
            return Number(msg.message_id) === Number(message.id);
          }
          return false;
        }
      );

      // Если сообщение существует - обновляем его (мердж данных)
      if (existingIndex !== -1) {
        const updated = [...prevMessages];
        const existingMsg = updated[existingIndex];
        
        // Мерджим данные: сохраняем все поля из старого + добавляем/перезаписываем из нового
        // Особенно важно для звонков: сначала приходит без URL записи, потом с URL
        updated[existingIndex] = {
          ...existingMsg,
          ...message,
          // Убеждаемся, что call_metadata всегда актуальный
          call_metadata: message.call_metadata || existingMsg.call_metadata,
        };
        
        return updated;
      }

      // Если сообщения нет - добавляем новое в конец списка
      return [...prevMessages, message];
    });
    
    // Обновляем mediaFiles если это медиа-сообщение
    if (FORMAT_MEDIA.includes(message.mtype)) {
      setMediaFiles((prevMedia) => {
        const existingIndex = prevMedia.findIndex(
          (msg) => {
            // Сравниваем message_id с message_id
            if (msg.message_id && message.message_id) {
              return Number(msg.message_id) === Number(message.message_id);
            }
            // Сравниваем message_id с id (для сообщений из БД)
            if (msg.id && message.message_id) {
              return Number(msg.id) === Number(message.message_id);
            }
            // Сравниваем id с message_id (обратный случай)
            if (msg.message_id && message.id) {
              return Number(msg.message_id) === Number(message.id);
            }
            return false;
          }
        );
        
        if (existingIndex !== -1) {
          const updated = [...prevMedia];
          updated[existingIndex] = { ...updated[existingIndex], ...message };
          return updated;
        }
        
        return [...prevMedia, message];
      });
    }
  }, []); // Пустой массив зависимостей, так как функция не зависит от внешних переменных

  const markMessageSeen = useCallback((id, seenAt) => {
    setMessages((prevMessages) =>
      prevMessages.map((msg) =>
        msg.ticket_id === id ? { ...msg, seen_at: seenAt } : msg
      )
    );
  }, []);

  const markMessagesAsSeen = useCallback((ticketId) => {
    setMessages((prevMessages) =>
      prevMessages.map((msg) => {
        // Обновляем статус только для сообщений:
        // 1. Принадлежащих указанному тикету
        // 2. Отправленных текущим пользователем
        // 3. Имеющих статус SUCCESS (отправлено успешно)
        if (
          Number(msg.ticket_id) === Number(ticketId) &&
          Number(msg.sender_id) === Number(userId) &&
          (msg.messageStatus === "SUCCESS" || msg.message_status === "SENT")
        ) {
          return {
            ...msg,
            messageStatus: "SEEN",
          };
        }
        return msg;
      })
    );
  }, [userId]);

  // Удаление сообщения по message_id
  const deleteMessage = useCallback((messageId) => {
    if (!messageId) return;
    
    setMessages((prevMessages) => {
      // Фильтруем сообщения, исключая удаляемое
      const filtered = prevMessages.filter((msg) => {
        // Проверяем по message_id
        if (msg.message_id) {
          return Number(msg.message_id) !== Number(messageId);
        }
        // Проверяем по id (для сообщений из БД)
        if (msg.id) {
          return Number(msg.id) !== Number(messageId);
        }
        return true;
      });
      
      return filtered;
    });
    
    // Также удаляем из mediaFiles, если это медиа-сообщение
    setMediaFiles((prevMedia) => {
      return prevMedia.filter((msg) => {
        if (msg.message_id) {
          return Number(msg.message_id) !== Number(messageId);
        }
        if (msg.id) {
          return Number(msg.id) !== Number(messageId);
        }
        return true;
      });
    });
  }, []);

  useEffect(() => {
    if (!onEvent || !offEvent) return;

    const handleNoteDelete = (evt) => {
      const noteId = Number(evt?.data?.note_id);
      if (!noteId) return;
      setNotes((prev) => prev.filter((n) => Number(n.id) !== noteId));
    };

    const unsub = onEvent("ticket_note_delete", handleNoteDelete);
    return () => {
      offEvent("ticket_note_delete", handleNoteDelete);
      typeof unsub === "function" && unsub();
    };
  }, [onEvent, offEvent]);

  // Полная очистка всех данных (для освобождения памяти)
  const clearAll = useCallback(() => {
    setMessages([]);
    setLogs([]);
    setNotes([]);
    setMediaFiles([]);
    setLastMessage(undefined);
    setCurrentPage(1);
    setHasMoreMessages(false);
  }, []);

  return useMemo(
    () => ({
      messages,
      logs,
      notes,
      lastMessage,
      loading,
      mediaFiles,
      currentPage,
      hasMoreMessages,
      getUserMessages,
      loadMoreMessages,
      markMessageRead,
      updateMessage,
      markMessageSeen,
      markMessagesAsSeen,
      deleteMessage,
      clearAll, // Для освобождения памяти
      setMessages,
      setLogs,
      setNotes,
    }),
    [messages, logs, notes, lastMessage, mediaFiles, loading, currentPage, hasMoreMessages, getUserMessages, loadMoreMessages, markMessageRead, updateMessage, markMessageSeen, markMessagesAsSeen, deleteMessage, clearAll]
  );
};
