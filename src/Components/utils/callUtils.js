import { getFullName } from "./index";

/**
 * Универсальная функция для определения имени звонящего/получателя
 * @param {string|number} identifier - ID техника или номер телефона
 * @param {Array} technicians - Массив техников
 * @param {Array} clients - Массив клиентов
 * @param {boolean} isClient - Является ли звонящий клиентом
 * @returns {string} Имя или идентификатор
 */
export const findCallParticipantName = (identifier, technicians = [], clients = [], isClient = null) => {
  if (!identifier) return 'Неизвестно';

  // Если явно указано что это клиент
  if (isClient === true) {
    const client = clients.find(
      (c) => String(c?.phone) === String(identifier) || 
             String(c?.sipuni) === String(identifier)
    );
    return getFullName(client?.name, client?.surname) || 
           client?.phone || 
           String(identifier);
  }

  // Если явно указано что это техник
  if (isClient === false) {
    const technician = technicians.find(
      (t) => String(t.value) === String(identifier)
    );
    return getFullName(technician?.id?.name, technician?.id?.surname) ||
           technician?.label ||
           `Техник #${identifier}`;
  }

  // Автоматическое определение (старая логика)
  // Сначала ищем техника по ID
  const technicianById = technicians.find(
    (t) => String(t.value) === String(identifier)
  );
  
  // Затем ищем техника по sipuni_id
  const technicianBySip = technicians.find(
    (t) => String(t.sipuni_id) === String(identifier)
  );
  
  // Ищем клиента по номеру телефона
  const client = clients.find(
    (c) => String(c?.phone) === String(identifier) || 
           String(c?.sipuni) === String(identifier)
  );

  return (
    technicianById?.label ||
    technicianBySip?.label ||
    getFullName(technicianById?.id?.name, technicianById?.id?.surname) ||
    getFullName(technicianBySip?.id?.name, technicianBySip?.id?.surname) ||
    getFullName(client?.name, client?.surname) ||
    client?.phone ||
    String(identifier)
  );
};

/**
 * Парсинг метаданных звонка для определения участников
 * @param {Object} callMetadata - Метаданные звонка
 * @param {Array} technicians - Массив техников
 * @param {Array} clients - Массив клиентов
 * @returns {Object} Объект с информацией о звонящем и получателе
 */
export const parseCallParticipants = (callMetadata, technicians = [], clients = []) => {
  const { 
    short_src_num, 
    short_dst_num, 
    src_num,
    from, 
    to, 
    caller_is_client 
  } = callMetadata || {};

  // Определяем ID звонящего и получателя
  const callerId = short_src_num || src_num || from;
  const receiverId = short_dst_num || to;

  // Определяем имена
  const callerName = findCallParticipantName(callerId, technicians, clients, caller_is_client);
  const receiverName = findCallParticipantName(receiverId, technicians, clients, null);

  return {
    callerId,
    receiverId,
    callerName,
    receiverName,
    isCallerClient: caller_is_client
  };
};
