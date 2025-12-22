/**
 * Утилиты для нормализации данных тикетов
 * 
 * Единое место для трансформации данных с сервера
 */

import { getLanguageByKey } from "../Components/utils";

/**
 * Нормализует light тикет (добавляет дефолтные значения)
 * 
 * @param {Object} ticket - Тикет с сервера
 * @returns {Object} - Нормализованный тикет
 */
export const normalizeLightTicket = (ticket) => ({
  ...ticket,
  last_message: ticket.last_message || getLanguageByKey("no_messages"),
  time_sent: ticket.time_sent || null,
  unseen_count: ticket.unseen_count || 0,
});

/**
 * Нормализует массив light тикетов
 * 
 * @param {Array} tickets - Массив тикетов с сервера
 * @returns {Array} - Массив нормализованных тикетов
 */
export const normalizeLightTickets = (tickets) => 
  tickets.map(normalizeLightTicket);

/**
 * Нормализует hard тикет (полные данные)
 * 
 * @param {Object} ticket - Тикет с сервера
 * @returns {Object} - Нормализованный тикет
 */
export const normalizeHardTicket = (ticket) => ({
  ...ticket,
  // Hard тикеты могут иметь дополнительные поля
  // Добавляем их по мере необходимости
});

/**
 * Нормализует массив hard тикетов
 * 
 * @param {Array} tickets - Массив тикетов с сервера
 * @returns {Array} - Массив нормализованных тикетов
 */
export const normalizeHardTickets = (tickets) => 
  tickets.map(normalizeHardTicket);
