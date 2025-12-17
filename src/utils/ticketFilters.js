/**
 * Утилиты для фильтрации тикетов
 * 
 * Используется в:
 * - useChatTicketsQuery для проверки соответствия тикета фильтрам при обновлении
 * - Других местах где нужна клиентская фильтрация
 */

/**
 * Проверяет соответствует ли тикет заданным фильтрам
 * 
 * @param {Object} ticket - Тикет для проверки
 * @param {Object} filters - Объект с фильтрами
 * @returns {boolean} - true если тикет соответствует всем фильтрам
 */
export const doesTicketMatchFilters = (ticket, filters) => {
  if (!ticket || !filters || Object.keys(filters).length === 0) return true;

  // Проверяем workflow
  if (filters.workflow) {
    const workflowFilter = Array.isArray(filters.workflow) 
      ? filters.workflow 
      : [filters.workflow];
    if (!workflowFilter.includes(ticket.workflow)) {
      return false;
    }
  }

  // Проверяем technician_id
  if (filters.technician_id) {
    const technicianFilter = Array.isArray(filters.technician_id) 
      ? filters.technician_id 
      : [filters.technician_id];
    if (!technicianFilter.includes(String(ticket.technician_id))) {
      return false;
    }
  }

  // Проверяем action_needed
  if (filters.action_needed !== undefined) {
    if (Boolean(ticket.action_needed) !== Boolean(filters.action_needed)) {
      return false;
    }
  }

  // Проверяем priority
  if (filters.priority) {
    const priorityFilter = Array.isArray(filters.priority) 
      ? filters.priority 
      : [filters.priority];
    if (!priorityFilter.includes(ticket.priority)) {
      return false;
    }
  }

  // Проверяем group_title
  if (filters.group_title) {
    const groupFilter = Array.isArray(filters.group_title) 
      ? filters.group_title 
      : [filters.group_title];
    if (!groupFilter.includes(ticket.group_title)) {
      return false;
    }
  }

  // Проверяем unseen (наличие непрочитанных)
  if (filters.unseen === "true") {
    if (!ticket.unseen_count || ticket.unseen_count === 0) {
      return false;
    }
  }

  // Проверяем last_message_author (0 - клиент)
  if (filters.last_message_author) {
    const authorFilter = Array.isArray(filters.last_message_author) 
      ? filters.last_message_author 
      : [filters.last_message_author];
    
    if (authorFilter.includes(0)) {
      // 0 означает "от клиента" — проверяем что последнее сообщение от клиента
      const lastSenderId = ticket.last_message_sender_id;
      
      // sender_id = 1 это система, не клиент
      if (lastSenderId === 1) {
        return false;
      }
    }
  }

  return true;
};

/**
 * Очищает объект фильтров от undefined/null значений
 * Полезно для создания стабильного ключа кэша
 * 
 * @param {Object} filters - Объект с фильтрами
 * @returns {Object} - Очищенный объект
 */
export const cleanFilters = (filters) => {
  if (!filters) return {};
  
  const cleaned = {};
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      cleaned[key] = value;
    }
  });
  return cleaned;
};
