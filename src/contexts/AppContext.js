import { createContext, useState, useEffect, useRef, useContext, useCallback } from "react";
import { useSnackbar } from "notistack";
import { useLocalStorage, useSocket } from "@hooks";
import { api } from "../api";
import { showServerError, getLanguageByKey } from "@utils";
import { TYPE_SOCKET_EVENTS, MEDIA_TYPE } from "@app-constants";
import { usePathnameWatcher } from "../Components/utils/usePathnameWatcher";
import { UserContext } from "./UserContext";
import { useGetTechniciansList } from "../hooks";

const SIDEBAR_COLLAPSE = "SIDEBAR_COLLAPSE";

export const AppContext = createContext();

const normalizeLightTickets = (tickets) =>
  tickets.map((ticket) => ({
    ...ticket,
    last_message: ticket.last_message || getLanguageByKey("no_messages"),
    time_sent: ticket.time_sent || null,
    unseen_count: ticket.unseen_count || 0,
  }));

const getLeadsUrlType = () => {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  return params.get("type");
};

const getLeadsUrlViewMode = () => {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  return (params.get("view") || "").toUpperCase();
};

export const AppProvider = ({ children }) => {
  const { sendedValue, socketRef } = useSocket();
  const { enqueueSnackbar } = useSnackbar();
  const { storage, changeLocalStorage } = useLocalStorage(SIDEBAR_COLLAPSE, "false");
  const [tickets, setTickets] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [spinnerTickets, setSpinnerTickets] = useState(false);
  const [lightTicketFilters, setLightTicketFilters] = useState({});
  const [chatFilteredTickets, setChatFilteredTickets] = useState([]);
  const [chatSpinner, setChatSpinner] = useState(false);
  const [isChatFiltered, setIsChatFiltered] = useState(false);
  const [currentChatFilters, setCurrentChatFilters] = useState({});
  const requestIdRef = useRef(0);

  // Hash map для быстрого доступа к тикетам по ID
  const ticketsMap = useRef(new Map());
  const chatFilteredTicketsMap = useRef(new Map());

  // Для отслеживания обработанных message_id (чтобы не дублировать счётчик при обновлении сообщений)
  const processedMessageIds = useRef(new Set());

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

  // Получаем данные всех пользователей
  const { technicians } = useGetTechniciansList();

  const {
    userId,
    isAdmin,
    workflowOptions,
    groupTitleForApi,
    accessibleGroupTitles,
    customGroupTitle,
    setCustomGroupTitle,
    userGroups,
  } = useContext(UserContext);

  const collapsed = () => changeLocalStorage(storage === "true" ? "false" : "true");

  const markMessagesAsRead = async (ticketId, count = 0) => {
    if (!ticketId) return;

    // ВАЖНО: unseen_count теперь всегда приходит через TICKET_UPDATE от сервера
    // Эта функция только триггерит обновление - сервер отправит обновленный тикет
    // с актуальным unseen_count через TICKET_UPDATE
    // Здесь мы ничего не меняем, только запрашиваем обновление тикета
    await fetchSingleTicket(ticketId);
  };

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
        // Создаем Set существующих ID для быстрой проверки
        const existingIds = new Set(prev.map(t => t.id));

        // Добавляем только новые тикеты (без дубликатов)
        const newTickets = processedTickets.filter(t => !existingIds.has(t.id));
        const updated = [...prev, ...newTickets];

        // Синхронизируем hash map
        updateTicketsMap(updated);
        return updated;
      });

      if (page < totalPages) {
        await getTicketsListRecursively(page + 1, requestId);
      } else {
        setSpinnerTickets(false);
      }
    } catch (error) {
      if (requestIdRef.current !== requestId) return;
      enqueueSnackbar(showServerError(error), { variant: "error" });
      setSpinnerTickets(false);
    }
  };

  const fetchTickets = async () => {
    const currentRequestId = Date.now();
    requestIdRef.current = currentRequestId;

    setSpinnerTickets(true);
    setTickets([]);
    setUnreadCount(0);

    // Очищаем hash map
    ticketsMap.current.clear();

    await getTicketsListRecursively(1, currentRequestId);
  };

  const fetchChatFilteredTickets = async (filters = {}) => {
    setChatSpinner(true);
    setChatFilteredTickets([]);
    setIsChatFiltered(true);
    setCurrentChatFilters(filters); // Сохраняем текущие фильтры

    // Очищаем hash map для отфильтрованных тикетов
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
          // Создаем Set существующих ID для быстрой проверки
          const existingIds = new Set(prev.map(t => t.id));

          // Добавляем только новые тикеты (без дубликатов)
          const newTickets = normalized.filter(t => !existingIds.has(t.id));
          const updated = [...prev, ...newTickets];

          // Синхронизируем hash map
          updateChatFilteredTicketsMap(updated);
          return updated;
        });

        if (page < res.pagination?.total_pages) {
          await loadPage(page + 1);
        } else {
          setChatSpinner(false);
        }
      };

      await loadPage(1);
    } catch (err) {
      enqueueSnackbar(showServerError(err), { variant: "error" });
      setChatSpinner(false);
    }
  };

  const resetChatFilters = () => {
    setIsChatFiltered(false);
    setChatFilteredTickets([]);
    setCurrentChatFilters({});
    chatFilteredTicketsMap.current.clear();
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

    // Проверяем unseen (наличие непрочитанных сообщений)
    if (filters.unseen === "true") {
      if (!ticket.unseen_count || ticket.unseen_count === 0) {
        return false;
      }
    }

    // Проверяем last_message_author (0 - клиент, 1 - пользователь)
    if (filters.last_message_author) {
      const authorFilter = Array.isArray(filters.last_message_author) ? filters.last_message_author : [filters.last_message_author];

      // 0 означает клиент - проверяем, что последнее сообщение от клиента
      if (authorFilter.includes(0)) {
        const lastSenderId = ticket.last_message_sender_id;

        // Если last_message_sender_id не установлен, считаем что сообщение от клиента (для совместимости)
        if (lastSenderId === undefined || lastSenderId === null) {
          return true;
        }

        // Проверяем, является ли отправитель клиентом (не система и не техник)
        const senderId = Number(lastSenderId);

        // sender_id = 1 - система, не клиент
        if (senderId === 1) {
          return false;
        }

        // Проверяем, что sender_id не совпадает с userId (не техник)
        if (String(senderId) === String(userId)) {
          return false;
        }

        // Проверяем, что отправитель является одним из клиентов тикета
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

  const hasLeadsFilterInUrl = () => {
    const params = new URLSearchParams(window.location.search);
    const filterKeys = Array.from(params.keys()).filter(
      (key) => key !== "view" && key !== "type"
    );
    return filterKeys.length > 0;
  };

  useEffect(() => {
    const isLeadsItemView = /^\/leads\/\d+$/.test(window.location.pathname);
    const urlType = getLeadsUrlType();
    const urlViewMode = getLeadsUrlViewMode();

    if (
      groupTitleForApi &&
      workflowOptions.length &&
      !isLeadsItemView &&
      !hasLeadsFilterInUrl() &&
      (!urlType || urlType === "light") &&
      (urlViewMode === "KANBAN" || !urlViewMode)
    ) {
      fetchTickets();
    }
    // eslint-disable-next-line
  }, [groupTitleForApi, workflowOptions, lightTicketFilters]);

  usePathnameWatcher((pathname) => {
    const isLeadsListView = pathname === "/leads";
    const urlType = getLeadsUrlType();

    if (
      isLeadsListView &&
      !spinnerTickets &&
      groupTitleForApi &&
      workflowOptions.length &&
      !hasLeadsFilterInUrl() &&
      (!urlType || urlType === "light")
    ) {
      // Сбрасываем состояние и загружаем тикеты
      setTickets([]);
      setUnreadCount(0);
      // Очищаем hash map
      ticketsMap.current.clear();
      fetchTickets();
    }
  });

  const fetchSingleTicket = useCallback(async (ticketId) => {
    try {
      const ticket = await api.tickets.ticket.getLightById(ticketId);

      // Нормализуем тикет
      const normalizedTicket = normalizeLightTickets([ticket])[0];

      // Проверяем, что тикет относится к текущей группе
      const isMatchingGroup = normalizedTicket.group_title === groupTitleForApi;

      if (!isMatchingGroup) {
        // ВАЖНО: Сохраняем тикет в ticketsMap для доступа через getTicketById,
        // даже если он не соответствует текущей группе (для случая открытия по прямой ссылке)
        const existingTicket = getTicketById(ticketId);

        // Обновляем тикет в hash map для доступа через getTicketById
        ticketsMap.current.set(ticketId, normalizedTicket);

        // Если тикет был в массиве tickets, удаляем его (так как он не соответствует текущей группе)
        // Но сохраняем в ticketsMap для доступа через getTicketById
        setTickets((prev) => {
          const wasInTickets = prev.find(t => t.id === ticketId);
          if (wasInTickets) {
            // Уменьшаем счётчик непрочитанных на старое значение unseen_count
            if (wasInTickets.unseen_count > 0) {
              setUnreadCount((prevCount) => Math.max(0, prevCount - wasInTickets.unseen_count));
            }
            // Удаляем из массива tickets, но оставляем в ticketsMap
            return prev.filter((t) => t.id !== ticketId);
          }
          return prev;
        });

        // Удаляем из chatFilteredTickets, если он там был
        const existingChatTicket = getChatFilteredTicketById(ticketId);
        if (existingChatTicket) {
          chatFilteredTicketsMap.current.delete(ticketId);
          setChatFilteredTickets((prev) => prev.filter((t) => t.id !== ticketId));
        }

        // Отправляем событие для обновления компонентов (например, SingleChat)
        window.dispatchEvent(new CustomEvent('ticketUpdated', {
          detail: { ticketId }
        }));

        return;
      }

      // ВАЖНО: Используем unseen_count напрямую из тикета с сервера
      const newUnseenCount = normalizedTicket.unseen_count || 0;

      // Получаем старый тикет для пересчета unreadCount
      const existingTicket = getTicketById(ticketId);
      const oldUnseenCount = existingTicket?.unseen_count || 0;

      // Обновляем или добавляем тикет в основной список
      setTickets((prev) => {
        const exists = getTicketById(ticketId);

        if (exists) {
          // Обновляем существующий тикет - используем все данные из сервера
          const updated = prev.map((t) => (t.id === ticketId ? normalizedTicket : t));
          ticketsMap.current.set(ticketId, normalizedTicket);
          return updated;
        } else {
          // Добавляем новый тикет
          const updated = [...prev, normalizedTicket];
          ticketsMap.current.set(ticketId, normalizedTicket);
          return updated;
        }
      });

      // Обновляем или добавляем тикет в отфильтрованном списке
      setChatFilteredTickets((prev) => {
        const exists = getChatFilteredTicketById(ticketId);

        // Проверяем, соответствует ли тикет текущим фильтрам
        if (isChatFiltered && Object.keys(currentChatFilters).length > 0) {
          if (!doesTicketMatchFilters(normalizedTicket, currentChatFilters)) {
            // Тикет больше не соответствует фильтрам - удаляем его
            if (exists) {
              chatFilteredTicketsMap.current.delete(ticketId);
              return prev.filter(t => t.id !== ticketId);
            }
            return prev;
          }
        }

        if (exists) {
          // Обновляем существующий тикет
          const updated = prev.map((t) => (t.id === ticketId ? normalizedTicket : t));
          chatFilteredTicketsMap.current.set(ticketId, normalizedTicket);
          return updated;
        } else {
          // Проверяем, нужно ли добавлять новый тикет в отфильтрованный список
          if (!isChatFiltered || !Object.keys(currentChatFilters).length > 0 || doesTicketMatchFilters(normalizedTicket, currentChatFilters)) {
            chatFilteredTicketsMap.current.set(ticketId, normalizedTicket);
            return [normalizedTicket, ...prev];
          }
          return prev;
        }
      });

      // Правильно пересчитываем общий счетчик непрочитанных
      // Вычитаем старое значение и добавляем новое
      const diff = newUnseenCount - oldUnseenCount;
      if (diff !== 0) {
        setUnreadCount((prev) => Math.max(0, prev + diff));
      }

      // Отправляем событие для обновления personalInfo в useFetchTicketChat
      window.dispatchEvent(new CustomEvent('ticketUpdated', {
        detail: { ticketId }
      }));
    } catch (error) {
      enqueueSnackbar(showServerError(error), { variant: "error" });
    }
  }, [groupTitleForApi, enqueueSnackbar, isChatFiltered, currentChatFilters, doesTicketMatchFilters]);

  const handleWebSocketMessage = useCallback((message) => {
    switch (message.type) {
      case TYPE_SOCKET_EVENTS.MESSAGE: {
        const { ticket_id, message: msgText, time_sent, mtype, sender_id, message_id } = message.data;

        // Сообщение считается от другого пользователя, если sender_id не совпадает с текущим userId и это не система (id=1)
        const isFromAnotherUser = String(sender_id) !== String(userId) && String(sender_id) !== "1";

        // Проверяем, было ли это сообщение уже обработано
        // Для звонков: первое событие - создание звонка, второе - обновление с URL записи
        const isNewMessage = message_id ? !processedMessageIds.current.has(message_id) : true;

        if (message_id && isNewMessage) {
          processedMessageIds.current.add(message_id);

          // Очистка старых ID (храним последние 1000)
          if (processedMessageIds.current.size > 1000) {
            const iterator = processedMessageIds.current.values();
            for (let i = 0; i < 500; i++) {
              processedMessageIds.current.delete(iterator.next().value);
            }
          }
        }

        // ВАЖНО: unseen_count и action_needed теперь всегда приходят через TICKET_UPDATE
        // Здесь обновляем только информацию о последнем сообщении

        setTickets((prev) => {
          // Используем hash map для быстрого поиска O(1)
          const existingTicket = getTicketById(ticket_id);

          if (!existingTicket) {
            return prev; // Тикет не найден
          }

          const updatedTicket = {
            ...existingTicket,
            // НЕ изменяем unseen_count - он придет через TICKET_UPDATE
            // НЕ изменяем action_needed - он придет через TICKET_UPDATE
            last_message_type: mtype,
            last_message: msgText,
            time_sent,
          };

          // Обновляем hash map
          ticketsMap.current.set(ticket_id, updatedTicket);

          return prev.map((ticket) =>
            ticket.id === ticket_id ? updatedTicket : ticket
          );
        });

        setChatFilteredTickets((prev) => {
          // Используем hash map для быстрого поиска O(1)
          const existingTicket = getChatFilteredTicketById(ticket_id);

          // Получаем тикет из основного списка, если его нет в отфильтрованном
          const ticketFromMain = existingTicket || getTicketById(ticket_id);

          if (!ticketFromMain) {
            return prev; // Тикет не найден ни в одном списке
          }

          const updatedTicket = {
            ...ticketFromMain,
            // НЕ изменяем unseen_count - он придет через TICKET_UPDATE
            // НЕ изменяем action_needed - он придет через TICKET_UPDATE
            last_message_type: mtype,
            last_message: msgText,
            time_sent,
          };

          // Проверяем, соответствует ли обновленный тикет текущим фильтрам чата
          if (isChatFiltered && Object.keys(currentChatFilters).length > 0) {
            const matchesFilters = doesTicketMatchFilters(updatedTicket, currentChatFilters);

            if (!matchesFilters) {
              // Тикет больше не соответствует фильтрам - удаляем его
              if (existingTicket) {
                chatFilteredTicketsMap.current.delete(ticket_id);
                return prev.filter(t => t.id !== ticket_id);
              }
              return prev;
            }

            // Тикет соответствует фильтрам
            if (existingTicket) {
              // Обновляем существующий тикет
              chatFilteredTicketsMap.current.set(ticket_id, updatedTicket);
              return prev.map((ticket) =>
                ticket.id === ticket_id ? updatedTicket : ticket
              );
            } else {
              // Добавляем новый тикет, который теперь соответствует фильтрам
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

          // Если фильтры не активны, просто обновляем существующий тикет или игнорируем
          if (existingTicket) {
            chatFilteredTicketsMap.current.set(ticket_id, updatedTicket);
            return prev.map((ticket) =>
              ticket.id === ticket_id ? updatedTicket : ticket
            );
          }

          return prev;
        });

        // ВАЖНО: Отправляем событие для обновления контекста сообщений
        // ТОЛЬКО для сообщений от других пользователей, системы или звонков
        // Сообщения от текущего пользователя уже добавлены при отправке через API
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

        // Проверяем наличие обязательных полей
        if (!ticket_id) {
          break;
        }

        // Отправляем событие для обновления статусов сообщений в MessagesContext
        // Это означает, что клиент прочитал сообщения в этом тикете
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

        const socketInstance = socketRef.current;
        if (socketInstance?.readyState === WebSocket.OPEN) {
          const CHUNK_SIZE = 50;
          for (let i = 0; i < ids.length; i += CHUNK_SIZE) {
            const chunk = ids.slice(i, i + CHUNK_SIZE);
            socketInstance.send(
              JSON.stringify({
                type: TYPE_SOCKET_EVENTS.CONNECT,
                data: { ticket_id: chunk },
              })
            );
          }
        } else {
          enqueueSnackbar(getLanguageByKey("errorConnectingToChatRoomWebSocket"), {
            variant: "error",
          });
        }

        break;
      }


      case TYPE_SOCKET_EVENTS.TICKET_UPDATE: {
        const { ticket_id, ticket_ids, tickets: ticketsList } = message.data || {};


        // Если пришел массив tickets с объектами
        if (Array.isArray(ticketsList) && ticketsList.length > 0) {
          ticketsList.forEach((ticketData) => {
            const { id, technician_id, workflow } = ticketData;

            if (!id) return;

            // Проверяем, совпадает ли technician_id с текущим userId (для не-админов)
            const isResponsible = String(technician_id) === String(userId);

            // Проверяем, входит ли workflow в список доступных пользователю
            const isWorkflowAllowed = Array.isArray(workflowOptions) && workflowOptions.includes(workflow);

            // Для админа: проверяем только workflow
            // Для обычного пользователя: проверяем и technician_id, и workflow
            const shouldFetch = isAdmin ? isWorkflowAllowed : (isResponsible && isWorkflowAllowed);

            if (shouldFetch) {
              // Получаем полный тикет
              try {
                fetchSingleTicket(id);
              } catch (e) {
                // Failed to fetch updated ticket
              }
            } else {
              // Условия не выполнены - удаляем тикет из списка
              // Используем hash map для быстрого поиска O(1)
              const removedTicket = getTicketById(id);

              if (removedTicket?.unseen_count > 0) {
                setUnreadCount((prev) => Math.max(0, prev - removedTicket.unseen_count));
              }

              // Удаляем из hash map
              ticketsMap.current.delete(id);
              chatFilteredTicketsMap.current.delete(id);

              setTickets((prev) => prev.filter((t) => t.id !== id));
              setChatFilteredTickets((prev) => prev.filter((t) => t.id !== id));
            }
          });
        }
        // Старый формат с ticket_ids или ticket_id (без проверки technician_id)
        else {
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
              // Используем hash map для быстрого поиска O(1)
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
  }, [userId, enqueueSnackbar, fetchSingleTicket, groupTitleForApi, isAdmin, socketRef, workflowOptions, currentChatFilters, doesTicketMatchFilters, isChatFiltered]); // Добавляем все необходимые зависимости

  useEffect(() => {
    if (sendedValue) {
      handleWebSocketMessage(sendedValue);
    }
  }, [sendedValue, handleWebSocketMessage]);

  // Обработчик события ticketUpdated убран - теперь используем TICKET_UPDATE от сервера

  useEffect(() => {
    const connectToWebSocketRooms = async () => {
      if (!groupTitleForApi || !workflowOptions.length || !socketRef.current) return;

      try {
        const res = await api.tickets.filters({
          type: "id",
          group_title: groupTitleForApi,
          attributes: { workflow: workflowOptions },
        });

        const ticketIds = res?.data?.filter(Boolean) || [];
        if (!ticketIds.length) return;

        const socketMessage = JSON.stringify({
          type: TYPE_SOCKET_EVENTS.CONNECT,
          data: { ticket_id: ticketIds },
        });

        const trySend = () => {
          if (socketRef.current?.readyState === WebSocket.OPEN) {
            socketRef.current.send(socketMessage);
          } else {
            setTimeout(trySend, 500);
          }
        };

        trySend();
      } catch (e) {
      }
    };

    connectToWebSocketRooms();
    // eslint-disable-next-line
  }, [groupTitleForApi, workflowOptions, socketRef]);

  useEffect(() => {
    if (!socketRef?.current || !groupTitleForApi || !workflowOptions.length) return;

    const socket = socketRef.current;

    const handleReconnect = async () => {
      try {
        const res = await api.tickets.filters({
          type: "id",
          group_title: groupTitleForApi,
          attributes: { workflow: workflowOptions },
        });

        const ticketIds = res?.data?.filter(Boolean) || [];
        if (!ticketIds.length) return;

        const socketMessage = JSON.stringify({
          type: TYPE_SOCKET_EVENTS.CONNECT,
          data: { ticket_id: ticketIds },
        });

        socket.send(socketMessage);
      } catch (e) {
      }
    };

    if (socket.readyState === WebSocket.OPEN) {
      handleReconnect();
    } else {
      const interval = setInterval(() => {
        if (socket.readyState === WebSocket.OPEN) {
          clearInterval(interval);
          handleReconnect();
        }
      }, 2000);

      return () => clearInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupTitleForApi, workflowOptions]);

  return (
    <AppContext.Provider
      value={{
        tickets,
        setTickets,
        unreadCount,
        markMessagesAsRead,
        spinnerTickets,
        isCollapsed: storage === "true",
        setIsCollapsed: collapsed,
        setUnreadCount,
        workflowOptions,
        groupTitleForApi,
        isAdmin,
        userGroups,
        fetchTickets,
        setLightTicketFilters,
        accessibleGroupTitles,
        setCustomGroupTitle,
        customGroupTitle,

        // chat
        chatFilteredTickets,
        fetchChatFilteredTickets,
        setChatFilteredTickets,
        chatSpinner,
        isChatFiltered,
        setIsChatFiltered,
        resetChatFilters,
        currentChatFilters,
        setCurrentChatFilters,
        doesTicketMatchFilters,

        // technicians
        technicians,

        // utils
        getTicketById,
        getChatFilteredTicketById,
        getTicketByIdWithFilters,
        fetchSingleTicket,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
