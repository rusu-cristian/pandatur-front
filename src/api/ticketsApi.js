/**
 * API слой для тикетов (используется с React Query)
 * 
 * Этот файл содержит функции для запросов к API тикетов.
 * Функции возвращают Promise и используются в React Query хуках.
 */

import { baseAxios } from "./baseAxios";

/**
 * Нормализация тикетов из API (light версия)
 * Добавляет дефолтные значения для обязательных полей
 */
const normalizeLightTicket = (ticket) => ({
  ...ticket,
  last_message: ticket.last_message || "Нет сообщений",
  time_sent: ticket.time_sent || null,
  unseen_count: ticket.unseen_count || 0,
});

/**
 * Нормализация массива тикетов
 */
const normalizeLightTickets = (tickets) => 
  tickets.map(normalizeLightTicket);

/**
 * Загрузка списка тикетов с фильтрами
 * 
 * @param {Object} params - Параметры запроса
 * @param {number} params.page - Номер страницы
 * @param {string} params.groupTitle - Группа (MD, RO, etc)
 * @param {Object} params.filters - Фильтры
 * @param {string} params.sortBy - Поле для сортировки
 * @param {string} params.order - Направление сортировки (ASC, DESC)
 * @returns {Promise<{tickets: Array, pagination: Object}>}
 */
export const fetchTicketsList = async ({ 
  page = 1, 
  groupTitle, 
  filters = {},
  sortBy = "last_interaction_date",
  order = "DESC",
}) => {
  const { data } = await baseAxios.post("/api/tickets/filter", {
    page,
    type: "light",
    group_title: groupTitle,
    sort_by: sortBy,
    order,
    attributes: filters,
  });

  return {
    tickets: normalizeLightTickets(data.tickets || []),
    pagination: data.pagination || { page: 1, total_pages: 1 },
  };
};

/**
 * Загрузка одного тикета по ID (light версия)
 * 
 * @param {number} ticketId - ID тикета
 * @returns {Promise<Object>} - Данные тикета
 */
export const fetchTicketById = async (ticketId) => {
  const { data } = await baseAxios.get(`/api/light/ticket/${ticketId}`);
  return normalizeLightTicket(data);
};

/**
 * Загрузка всех страниц тикетов (для infinite query)
 * Используется как queryFn в useInfiniteQuery
 * 
 * @param {Object} context - Контекст React Query
 * @param {number} context.pageParam - Номер страницы
 * @param {Object} params - Дополнительные параметры
 * @returns {Promise<{tickets: Array, pagination: Object, nextPage: number|undefined}>}
 */
export const fetchTicketsPage = async ({ pageParam = 1 }, params) => {
  const result = await fetchTicketsList({
    ...params,
    page: pageParam,
  });

  return {
    ...result,
    nextPage: pageParam < result.pagination.total_pages 
      ? pageParam + 1 
      : undefined,
  };
};

/**
 * Query keys для React Query
 * Централизованное место для всех ключей кэша
 */
export const ticketKeys = {
  // Базовый ключ для всех тикетов
  all: ["tickets"],
  
  // Список тикетов с фильтрами
  list: (groupTitle, filters) => [...ticketKeys.all, "list", groupTitle, filters],
  
  // Отфильтрованный список для чата
  chatList: (groupTitle, filters) => [...ticketKeys.all, "chat", groupTitle, filters],
  
  // Один тикет
  detail: (id) => [...ticketKeys.all, "detail", id],
};
