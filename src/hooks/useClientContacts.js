/**
 * ✨ useClientContacts - Рефакторинг
 * 
 * Архитектура:
 * 1. useClientContactsData - загрузка и нормализация данных (React Query)
 * 2. useReducer - управление связанным состоянием (platform, pageId, contact)
 * 3. Отдельные эффекты для автовыбора каждой сущности
 * 
 * Принципы:
 * - Single Responsibility: каждая функция делает одно дело
 * - Нет циклических зависимостей в useEffect
 * - Простая и понятная логика автовыбора
 */

import { useEffect, useMemo, useCallback, useReducer } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSnackbar } from "notistack";
import { api } from "../api";
import { showServerError } from "@utils";
import { getPagesByType } from "../constants/webhookPagesConfig";

// ==================== КОНСТАНТЫ ====================

const DEBUG = false;
const debug = (...args) => { if (DEBUG) console.log("[useClientContacts]", ...args); };

// ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====================

/**
 * Фильтрует страницы по group_title воронки
 */
export function filterPagesByGroupTitle(pages, groupTitle) {
  if (!groupTitle) return pages;
  return pages.filter((p) => {
    if (Array.isArray(p.group_title)) {
      return p.group_title.includes(groupTitle);
    }
    return p.group_title === groupTitle;
  });
}

/**
 * Нормализует блок платформы в объект { id: data }
 */
function normalizePlatformBlock(block) {
  if (!block) return {};
  if (Array.isArray(block)) {
    return block.reduce((acc, item, idx) => {
      const id = item?.id ?? idx;
      acc[id] = item || {};
      return acc;
    }, {});
  }
  if (typeof block === "object") return block;
  return {};
}

/**
 * Строит индекс клиентов для быстрого поиска
 */
function buildClientIndex(clients) {
  const map = new Map();
  (clients || []).forEach((client) => {
    const clientId = client?.id != null ? Number.parseInt(client.id, 10) : null;
    if (clientId != null && !Number.isNaN(clientId)) {
      map.set(clientId, client);
    }

    const register = (items = []) => {
      items.forEach((item) => {
        const itemId = item?.id != null ? Number.parseInt(item.id, 10) : null;
        if (itemId != null && !Number.isNaN(itemId)) {
          map.set(itemId, client);
        }
      });
    };

    register(client.contacts);
    register(client.emails);
    register(client.phones);
  });
  return map;
}

/**
 * Обогащает блоки платформ контактами клиентов
 */
function enrichBlocksWithClientContacts(blocks, clients) {
  if (!clients?.length) return blocks;

  const nextBlocks = { ...blocks };

  const getPlatformByContactType = (type) => {
    switch ((type || "").toLowerCase()) {
      case "email":
        return "";
      case "phone":
      case "sipuni":
        return "telegram";
      case "whatsapp":
      case "viber":
      case "telegram":
        return type.toLowerCase();
      default:
        return "";
    }
  };

  clients.forEach((client) => {
    (client.contacts || []).forEach((contact) => {
      const platform = getPlatformByContactType(contact?.contact_type);
      if (!platform) return;

      if (!nextBlocks[platform]) {
        nextBlocks[platform] = {};
      }

      const contactId = contact?.id != null ? String(contact.id) : null;
      if (!contactId) return;

      if (nextBlocks[platform][contactId]) return;

      nextBlocks[platform][contactId] = {
        contact_value: contact?.contact_value ?? "",
        name: client?.name ?? "",
        surname: client?.surname ?? "",
        client_id: client?.id,
        is_primary: contact?.is_primary ?? false,
      };
    });
  });

  return nextBlocks;
}

// ==================== REDUCER ДЛЯ СОСТОЯНИЯ ВЫБОРА ====================

const ACTIONS = {
  RESET: 'RESET',
  SET_PLATFORM: 'SET_PLATFORM',
  SET_PAGE_ID: 'SET_PAGE_ID',
  SET_CONTACT: 'SET_CONTACT',
  AUTO_SELECT_ALL: 'AUTO_SELECT_ALL',
};

const initialState = {
  platform: null,
  pageId: null,
  contact: {},
  // Флаг: пользователь вручную выбрал pageId (не сбрасываем автоматически)
  isPageIdManual: false,
};

function selectionReducer(state, action) {
  switch (action.type) {
    case ACTIONS.RESET:
      return { ...initialState };

    case ACTIONS.SET_PLATFORM:
      // При смене платформы сбрасываем pageId и contact
      return {
        ...state,
        platform: action.payload,
        pageId: null,
        contact: {},
        isPageIdManual: false,
      };

    case ACTIONS.SET_PAGE_ID:
      return {
        ...state,
        pageId: action.payload.pageId,
        isPageIdManual: action.payload.isManual ?? false,
      };

    case ACTIONS.SET_CONTACT:
      return {
        ...state,
        contact: action.payload,
      };

    case ACTIONS.AUTO_SELECT_ALL:
      // Батч-обновление всех значений (для автовыбора)
      return {
        ...state,
        platform: action.payload.platform ?? state.platform,
        pageId: action.payload.pageId ?? state.pageId,
        contact: action.payload.contact ?? state.contact,
        // isPageIdManual не меняем при автовыборе
      };

    default:
      return state;
  }
}

// ==================== ВЫЧИСЛЕНИЕ ОПЦИЙ ====================

/**
 * Вычисляет опции платформ из блоков данных
 */
function computePlatformOptions(platformBlocks) {
  return Object.keys(platformBlocks)
    .filter((key) => Object.keys(platformBlocks[key] || {}).length > 0)
    .map((key) => ({ label: key, value: key, payload: { platform: key } }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

/**
 * Вычисляет опции контактов для выбранной платформы
 */
function computeContactOptions(platformBlocks, platform, clientIndex) {
  if (!platform) return [];
  
  const block = platformBlocks[platform] || {};
  const isMessengerPlatform = ["whatsapp", "viber", "telegram"].includes(platform);

  const contacts = Object.entries(block).map(([contactIdRaw, contactData]) => {
    const contactId = Number.parseInt(contactIdRaw, 10);
    const contactClientId = contactData?.client_id != null
      ? Number.parseInt(contactData.client_id, 10)
      : null;

    const client = clientIndex.get(contactId) ||
      (contactClientId != null ? clientIndex.get(contactClientId) : null);

    const client_id = client?.id ?? contactClientId ??
      (Number.isNaN(contactId) ? null : contactId);

    const name = contactData?.name || client?.name || "";
    const surname = contactData?.surname || client?.surname || "";
    const contact_value = contactData?.contact_value || "";

    const label = isMessengerPlatform
      ? `${name} ${surname}`.trim() + (contact_value ? ` - ${contact_value}` : "")
      : `${contactId} - ${name} ${surname}`.trim();

    return {
      label,
      value: `${client_id ?? "x"}-${contactId}`,
      payload: {
        id: client_id,
        client_id,
        contact_id: contactId,
        platform,
        name,
        surname,
        phone: platform === "phone" ? contact_value : "",
        email: platform === "email" ? contact_value : "",
        contact_value,
        is_primary: Boolean(contactData?.is_primary),
        photo: client?.photo,
      },
    };
  });

  return contacts.sort((a, b) => a.label.localeCompare(b.label));
}

/**
 * Вычисляет опции pageId для платформы и воронки
 */
function computePageIdOptions(platform, groupTitle) {
  if (!platform) return [];
  const pages = getPagesByType(platform) || [];
  const filtered = filterPagesByGroupTitle(pages, groupTitle);
  return filtered.map(p => ({ value: p.page_id, label: p.page_name }));
}

// ==================== ЛОГИКА АВТОВЫБОРА ====================

/**
 * Определяет лучшую платформу для автовыбора
 */
function selectBestPlatform(platformOptions, lastMessage, ticketId) {
  if (!platformOptions.length) return null;

  // Приоритет 1: платформа из последнего сообщения
  if (lastMessage?.ticket_id === ticketId) {
    const msgPlatform = lastMessage.platform?.toLowerCase();
    if (msgPlatform && platformOptions.some(p => p.value === msgPlatform)) {
      return msgPlatform;
    }
  }

  // Приоритет 2: первая доступная платформа
  return platformOptions[0]?.value || null;
}

/**
 * Определяет лучший pageId для автовыбора
 */
function selectBestPageId(platform, groupTitle, lastMessage, ticketId) {
  if (!platform) return null;

  const pages = getPagesByType(platform) || [];
  const availablePages = filterPagesByGroupTitle(pages, groupTitle);

  if (!availablePages.length) return null;

  // Приоритет 1: pageId из последнего сообщения (если валиден для воронки)
  if (lastMessage?.ticket_id === ticketId && lastMessage.page_id) {
    if (availablePages.some(p => p.page_id === lastMessage.page_id)) {
      return lastMessage.page_id;
    }
  }

  // Приоритет 2: первая доступная страница
  return availablePages[0]?.page_id || null;
}

/**
 * Определяет лучший контакт для автовыбора
 */
function selectBestContact(contactOptions, platformBlocks, platform, clientIndex, lastMessage, ticketId) {
  if (!contactOptions.length) return null;

  // Приоритет 1: контакт из последнего сообщения
  if (lastMessage?.ticket_id === ticketId) {
    const contactValue = lastMessage.sender_id === lastMessage.client_id
      ? lastMessage.from_reference
      : lastMessage.to_reference;

    if (contactValue) {
      const found = contactOptions.find(c => c.payload?.contact_value === contactValue);
      if (found) return found;
    }

    // Попробуем найти по client_id
    const block = platformBlocks[platform] || {};
    const entry = Object.entries(block).find(([cid]) => {
      const client = clientIndex.get(Number.parseInt(cid, 10));
      return client?.id === lastMessage.client_id;
    });
    if (entry) {
      const contactVal = entry[1]?.contact_value;
      const found = contactOptions.find(c => c.payload?.contact_value === contactVal);
      if (found) return found;
    }
  }

  // Приоритет 2: первый контакт
  return contactOptions[0] || null;
}

// ==================== ГЛАВНЫЙ ХУК ====================

/**
 * Хук для работы с контактами клиентов
 * 
 * @param {number} ticketId - ID тикета
 * @param {object} lastMessage - Последнее сообщение в чате
 * @param {string} groupTitle - Название воронки (group_title тикета)
 */
export const useClientContacts = (ticketId, lastMessage, groupTitle) => {
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();

  // ==================== 1. ЗАГРУЗКА ДАННЫХ ====================
  const {
    data: ticketData,
    isLoading: loading,
  } = useQuery({
    queryKey: ['clientContacts', ticketId],
    queryFn: async () => {
      if (!ticketId) return null;
      debug("📡 Fetching client contacts for ticketId:", ticketId);
      return await api.users.getUsersClientContactsByPlatform(ticketId, null);
    },
    enabled: !!ticketId,
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
    retry: 1,
    onError: (err) => {
      enqueueSnackbar(showServerError(err), { variant: "error" });
    },
  });

  // ==================== 2. СОСТОЯНИЕ ВЫБОРА ====================
  const [state, dispatch] = useReducer(selectionReducer, initialState);

  // ==================== 3. НОРМАЛИЗАЦИЯ ДАННЫХ ====================
  const { platformBlocks, clientIndex } = useMemo(() => {
    if (!ticketData) return { platformBlocks: {}, clientIndex: new Map() };

    const initialBlocks = Object.entries(ticketData).reduce((acc, [key, val]) => {
      if (key === "clients") return acc;
      acc[key] = normalizePlatformBlock(val);
      return acc;
    }, {});

    const blocks = enrichBlocksWithClientContacts(initialBlocks, ticketData.clients);

    return {
      platformBlocks: blocks,
      clientIndex: buildClientIndex(ticketData.clients),
    };
  }, [ticketData]);

  // ==================== 4. ВЫЧИСЛЕНИЕ ОПЦИЙ ====================
  const platformOptions = useMemo(
    () => computePlatformOptions(platformBlocks),
    [platformBlocks]
  );

  const contactOptions = useMemo(
    () => computeContactOptions(platformBlocks, state.platform, clientIndex),
    [platformBlocks, state.platform, clientIndex]
  );

  const pageIdOptions = useMemo(
    () => computePageIdOptions(state.platform, groupTitle),
    [state.platform, groupTitle]
  );

  // ==================== 5. СБРОС ПРИ СМЕНЕ ТИКЕТА ====================
  useEffect(() => {
    debug("🔄 ticketId changed, resetting state:", ticketId);
    dispatch({ type: ACTIONS.RESET });
  }, [ticketId]);

  // ==================== 6. АВТОВЫБОР ПЛАТФОРМЫ ====================
  useEffect(() => {
    // Не запускаем если нет данных или платформа уже выбрана валидно
    if (!ticketData || !platformOptions.length) return;

    const isPlatformValid = state.platform && platformOptions.some(p => p.value === state.platform);
    if (isPlatformValid) return;

    const bestPlatform = selectBestPlatform(platformOptions, lastMessage, ticketId);
    if (bestPlatform) {
      debug("🎯 Auto-selecting platform:", bestPlatform);
      dispatch({ type: ACTIONS.SET_PLATFORM, payload: bestPlatform });
    }
  }, [ticketData, platformOptions, state.platform, lastMessage, ticketId]);

  // ==================== 7. АВТОВЫБОР PAGE_ID ====================
  useEffect(() => {
    // Не запускаем если нет платформы или pageId выбран вручную
    if (!state.platform || state.isPageIdManual) return;

    const isPageIdValid = state.pageId && pageIdOptions.some(p => p.value === state.pageId);
    if (isPageIdValid) return;

    const bestPageId = selectBestPageId(state.platform, groupTitle, lastMessage, ticketId);
    if (bestPageId) {
      debug("🎯 Auto-selecting pageId:", bestPageId);
      dispatch({ type: ACTIONS.SET_PAGE_ID, payload: { pageId: bestPageId, isManual: false } });
    }
  }, [state.platform, state.pageId, state.isPageIdManual, pageIdOptions, groupTitle, lastMessage, ticketId]);

  // ==================== 8. АВТОВЫБОР КОНТАКТА ====================
  useEffect(() => {
    // Не запускаем если нет платформы или контактов
    if (!state.platform || !contactOptions.length) return;

    const isContactValid = state.contact?.value && contactOptions.some(c => c.value === state.contact.value);
    if (isContactValid) return;

    const bestContact = selectBestContact(
      contactOptions,
      platformBlocks,
      state.platform,
      clientIndex,
      lastMessage,
      ticketId
    );

    if (bestContact) {
      debug("🎯 Auto-selecting contact:", bestContact.value);
      dispatch({ type: ACTIONS.SET_CONTACT, payload: bestContact });
    }
  }, [state.platform, state.contact?.value, contactOptions, platformBlocks, clientIndex, lastMessage, ticketId]);

  // ==================== 9. ПУБЛИЧНЫЕ CALLBACKS ====================
  
  const changePlatform = useCallback((platform) => {
    if (platform === state.platform) return;
    debug("👆 Manual platform change:", platform);
    dispatch({ type: ACTIONS.SET_PLATFORM, payload: platform || null });
  }, [state.platform]);

  const changePageId = useCallback((pageId) => {
    if (pageId === state.pageId) return;
    debug("👆 Manual pageId change:", pageId);
    dispatch({ type: ACTIONS.SET_PAGE_ID, payload: { pageId: pageId || null, isManual: true } });
  }, [state.pageId]);

  const changeContact = useCallback((value) => {
    if (!value || value === state.contact?.value) return;
    const contact = contactOptions.find(o => o.value === value);
    if (contact) {
      debug("👆 Manual contact change:", value);
      dispatch({ type: ACTIONS.SET_CONTACT, payload: contact });
    }
  }, [state.contact?.value, contactOptions]);

  const updateClientData = useCallback((clientId, platform, newData) => {
    // Оптимистичное обновление через React Query
    queryClient.setQueryData(['clientContacts', ticketId], (old) => {
      if (!old?.clients) return old;
      return {
        ...old,
        clients: old.clients.map((c) =>
          c.id === clientId
            ? {
                ...c,
                name: newData.name ?? c.name,
                surname: newData.surname ?? c.surname,
                phone: newData.phone ?? c.phone,
                email: newData.email ?? c.email,
              }
            : c
        ),
      };
    });

    // Обновляем selectedClient если это текущий клиент
    if (state.contact?.payload?.id === clientId) {
      dispatch({
        type: ACTIONS.SET_CONTACT,
        payload: {
          ...state.contact,
          payload: { ...state.contact.payload, ...newData },
        },
      });
    }
  }, [queryClient, ticketId, state.contact]);

  const refetch = useCallback(() => {
    queryClient.invalidateQueries(['clientContacts', ticketId]);
  }, [queryClient, ticketId]);

  // ==================== 10. ВОЗВРАТ API ====================
  return {
    // Опции для селектов
    platformOptions,
    contactOptions,

    // Выбранные значения
    selectedPlatform: state.platform,
    selectedClient: state.contact,
    selectedPageId: state.pageId,

    // Callbacks для изменения
    changePlatform,
    changeContact,
    changePageId,

    // Утилиты
    loading,
    updateClientData,
    refetch,

    // Сырые данные для PersonalData4ClientForm
    ticketData,
  };
};
