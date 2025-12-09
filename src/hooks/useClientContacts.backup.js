import { useState, useEffect, useMemo, useCallback, useRef, startTransition } from "react";
import { useSnackbar } from "notistack";
import { api } from "../api";
import { showServerError } from "@utils";
import { getPagesByType } from "../constants/webhookPagesConfig";

/** ====================== helpers ====================== */

const DEBUG = false;
const debug = (...args) => { if (DEBUG) console.log("[useClientContacts]", ...args); };

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

      // Не перезаписываем данные, пришедшие из API
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

function computePlatformOptionsFromBlocks(platformBlocks) {
  const options = Object.keys(platformBlocks)
    .filter((key) => Object.keys(platformBlocks[key] || {}).length > 0)
    .map((key) => ({ label: key, value: key, payload: { platform: key } }))
    .sort((a, b) => a.label.localeCompare(b.label));
  return options;
}

// Универсальная функция фильтрации страниц по group_title (экспортируем для переиспользования)
export function filterPagesByGroupTitle(pages, groupTitle) {
  if (!groupTitle) return pages;
  return pages.filter((p) => {
    if (Array.isArray(p.group_title)) {
      return p.group_title.includes(groupTitle);
    }
    return p.group_title === groupTitle;
  });
}

function selectPageIdByMessage(platform, messagePageId, groupTitle) {
  if (!platform) return null;
  const allPages = getPagesByType(platform) || [];
  const filtered = filterPagesByGroupTitle(allPages, groupTitle);
  if (!filtered.length) return null;
  return filtered.some((p) => p.page_id === messagePageId) ? messagePageId : filtered[0].page_id;
}

function matchContact(contactOptions, contactValue, clientId) {
  if (!contactOptions?.length || !contactValue) return null;
  const full = contactOptions.find(
    (c) => c?.payload?.contact_value === contactValue && c?.payload?.client_id === clientId
  );
  return full || contactOptions.find((c) => c?.payload?.contact_value === contactValue) || null;
}

/** ====================== hook ====================== */

export const useClientContacts = (ticketId, lastMessage, groupTitle) => {
  const { enqueueSnackbar } = useSnackbar();

  const [ticketData, setTicketData] = useState(null);
  const [selectedPlatform, setSelectedPlatform] = useState(null);
  const [selectedClient, setSelectedClient] = useState({}); // option
  const [selectedPageId, setSelectedPageId] = useState(null);
  const [loading, setLoading] = useState(false);

  const mountedRef = useRef(true);
  const currentTicketIdRef = useRef(null);
  const lastFetchedTicketIdRef = useRef(null); // Защита от повторных запросов
  
  useEffect(() => {
    mountedRef.current = true;
    return () => { 
      mountedRef.current = false;
      // Сбрасываем при размонтировании
      lastFetchedTicketIdRef.current = null;
    };
  }, []);

  /** 1) Единожды нормализуем все платформенные блоки и строим индекс клиентов */
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

  /** 2) Опции платформ и контактов на мемо-данных */
  const platformOptions = useMemo(
    () => computePlatformOptionsFromBlocks(platformBlocks),
    [platformBlocks]
  );

  // Кэшируем отфильтрованные страницы для текущей платформы и groupTitle
  const filteredPages = useMemo(() => {
    if (!selectedPlatform) return [];
    const allPages = getPagesByType(selectedPlatform) || [];
    return filterPagesByGroupTitle(allPages, groupTitle);
  }, [selectedPlatform, groupTitle]);

  const contactOptions = useMemo(() => {
    if (!selectedPlatform) return [];
    
    const block = platformBlocks[selectedPlatform];
    if (!block || Object.keys(block).length === 0) return [];

    // Определяем формат label один раз
    const isMessengerPlatform = ["whatsapp", "viber", "telegram"].includes(selectedPlatform);
    
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

      // Оптимизированное формирование label
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
          platform: selectedPlatform,
          name,
          surname,
          phone: selectedPlatform === "phone" ? contact_value : "",
          email: selectedPlatform === "email" ? contact_value : "",
          contact_value,
          is_primary: Boolean(contactData?.is_primary),
          photo: client?.photo,
        },
      };
    });

    // Сортировка с кэшированием locale
    return contacts.sort((a, b) => a.label.localeCompare(b.label));
  }, [platformBlocks, selectedPlatform, clientIndex]);

  /** Загрузка ticketData */
  const fetchClientContacts = useCallback(async () => {
    if (!ticketId) return;

    // Фиксируем ticketId для текущего запроса
    const requestTicketId = ticketId;
    currentTicketIdRef.current = requestTicketId;

    setLoading(true);
    try {
      const response = await api.users.getUsersClientContactsByPlatform(requestTicketId, null);
      
      // Проверяем актуальность: запрос устарел, если ticketId изменился
      if (!mountedRef.current || currentTicketIdRef.current !== requestTicketId) {
        return;
      }

      startTransition(() => {
        setTicketData(response);
        // мягкий локальный сброс — автоэтапы ниже всё выставят
        setSelectedPlatform(null);
        setSelectedClient({});
        setSelectedPageId(null);
      });
      
      // Помечаем что данные для этого ticketId загружены
      lastFetchedTicketIdRef.current = requestTicketId;
    } catch (error) {
      // Показываем ошибку только если запрос актуален
      if (mountedRef.current && currentTicketIdRef.current === requestTicketId) {
        enqueueSnackbar(showServerError(error), { variant: "error" });
      }
    } finally {
      // Обновляем loading только если запрос актуален
      if (mountedRef.current && currentTicketIdRef.current === requestTicketId) {
        setLoading(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketId]);

  /** Рефетч по ticketId */
  useEffect(() => {
    if (!ticketId) return;
    
    // 🛡️ Защита от повторных запросов для того же ticketId
    if (lastFetchedTicketIdRef.current === ticketId) {
      debug("Пропускаем запрос - данные для ticketId", ticketId, "уже загружены");
      return;
    }
    
    debug("ticketId changed → refetch + local reset", ticketId);

    // Обновляем ref сразу, чтобы этапы автовыбора не сработали на старых данных
    currentTicketIdRef.current = ticketId;

    // Сбрасываем все состояния сразу, включая ticketData, чтобы автовыбор не сработал на старых данных
    startTransition(() => {
      setTicketData(null);
      setSelectedPlatform(null);
      setSelectedClient({});
      setSelectedPageId(null);
    });

    fetchClientContacts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketId]);

  /** 
   * ✨ ОПТИМИЗАЦИЯ: Объединенный автовыбор всех параметров
   * Вместо 3 отдельных useEffect (3 ререндера), делаем 1 батч-обновление.
   * Это ускоряет загрузку тикета и улучшает UX.
   */
  useEffect(() => {
    // Защита: работаем только с актуальными данными текущего тикета
    if (!ticketData || !platformOptions.length || currentTicketIdRef.current !== ticketId) {
      return;
    }

    // Флаги для отслеживания изменений
    let needsUpdate = false;
    let nextPlatform = selectedPlatform;
    let nextPageId = selectedPageId;
    let nextClient = selectedClient;

    // ============ ЭТАП 1: Платформа (с валидацией) ============
    // ✅ Валидация: проверяем что текущая платформа есть в списке
    const isPlatformValid = nextPlatform && platformOptions.some((p) => p.value === nextPlatform);
    
    if (!isPlatformValid) {
      // Платформа невалидна или отсутствует - выбираем новую
      if (lastMessage?.ticket_id === ticketId) {
        const msgPlatform = lastMessage.platform?.toLowerCase();
        if (msgPlatform && platformOptions.some((p) => p.value === msgPlatform)) {
          nextPlatform = msgPlatform;
        }
      }
      if (!nextPlatform || !platformOptions.some((p) => p.value === nextPlatform)) {
        // Гарантированный fallback: первая доступная платформа
        nextPlatform = platformOptions[0]?.value || null;
      }
      
      if (nextPlatform) {
        debug("auto select/fix platform:", nextPlatform);
        needsUpdate = true;
      }
    }

    // ============ ЭТАП 2: Page ID (с валидацией) ============
    if (nextPlatform) {
      // ✅ Валидация: проверяем что page_id есть в списке доступных страниц
      const allPages = getPagesByType(nextPlatform) || [];
      const availablePages = filterPagesByGroupTitle(allPages, groupTitle);
      const isPageIdValid = nextPageId && availablePages.some(p => p.page_id === nextPageId);
      
      if (!isPageIdValid) {
        // Page ID невалиден или отсутствует - выбираем новый
        if (lastMessage?.ticket_id === ticketId) {
          const candidate = selectPageIdByMessage(nextPlatform, lastMessage.page_id, groupTitle);
          if (candidate && availablePages.some(p => p.page_id === candidate)) {
            nextPageId = candidate;
          }
        }

        if (!nextPageId || !availablePages.some(p => p.page_id === nextPageId)) {
          // Гарантированный fallback: первая доступная страница
          nextPageId = availablePages[0]?.page_id || null;
        }

        if (nextPageId) {
          debug("auto select/fix page_id:", nextPageId);
          needsUpdate = true;
        }
      }
    }

    // ============ ЭТАП 3: Контакт (с валидацией) ============
    if (nextPlatform) {
      // Получаем контакты для выбранной платформы
      const block = platformBlocks[nextPlatform] || {};
      const hasContacts = Object.keys(block).length > 0;

      if (hasContacts) {
        // Генерируем список доступных контактов
        const tempContactOptions = Object.entries(block).map(([contactIdRaw, contactData]) => {
          const contactId = Number.parseInt(contactIdRaw, 10);
          const contactClientId = contactData?.client_id != null 
            ? Number.parseInt(contactData.client_id, 10) 
            : null;
          
          const client = clientIndex.get(contactId) || 
            (contactClientId != null ? clientIndex.get(contactClientId) : null);
          
          const client_id = client?.id ?? contactClientId ?? 
            (Number.isNaN(contactId) ? null : contactId);

          return {
            value: `${client_id ?? "x"}-${contactId}`,
            payload: {
              client_id,
              contact_id: contactId,
              contact_value: contactData?.contact_value || "",
              name: contactData?.name || client?.name || "",
              surname: contactData?.surname || client?.surname || "",
              platform: nextPlatform,
            },
          };
        });
        
        // ✅ Валидация: проверяем что текущий контакт есть в списке
        const isContactValid = nextClient?.value && 
          tempContactOptions.some(c => c.value === nextClient.value);
        
        if (!isContactValid) {
          // Контакт невалиден или отсутствует - выбираем новый
          let contactValue = null;
          let messageClientId = null;

          if (lastMessage?.ticket_id === ticketId) {
            messageClientId = lastMessage.client_id;
            
            // входящее — from_reference; исходящее — to_reference
            contactValue =
              lastMessage.sender_id === lastMessage.client_id
                ? lastMessage.from_reference
                : lastMessage.to_reference;

            // Фоллбэк: поиск по client_id
            if (!contactValue) {
              const entry = Object.entries(block).find(([cid]) => {
                const client = clientIndex.get(Number.parseInt(cid, 10));
                return client?.id === messageClientId;
              });
              if (entry) contactValue = entry[1]?.contact_value;
            }
          }

          const found = matchContact(tempContactOptions, contactValue, messageClientId);
          
          // Гарантированный fallback: первый доступный контакт
          nextClient = found || tempContactOptions[0];

          if (nextClient) {
            debug("auto select/fix contact:", nextClient.value);
            needsUpdate = true;
          }
        }
      }
    }

    // Применяем все изменения одним батчем (1 ререндер)
    if (needsUpdate) {
      startTransition(() => {
        if (nextPlatform !== selectedPlatform) setSelectedPlatform(nextPlatform);
        if (nextPageId !== selectedPageId) setSelectedPageId(nextPageId);
        if (nextClient?.value !== selectedClient?.value) setSelectedClient(nextClient);
      });
    }
  }, [
    ticketData,
    platformOptions,
    platformBlocks,
    clientIndex,
    lastMessage,
    ticketId,
    groupTitle,
    selectedPlatform,
    selectedPageId,
    selectedClient?.value,
  ]);

  /** Публичные коллбеки (idempotent) */
  const changePlatform = useCallback((platform) => {
    if (platform === selectedPlatform) return;
    startTransition(() => {
      setSelectedPlatform(platform || null);
      setSelectedClient({});
      setSelectedPageId(null);
    });
  }, [selectedPlatform]);

  const changeContact = useCallback((value) => {
    if (!value) return;
    const contact = contactOptions.find((o) => o.value === value);
    if (contact && contact.value !== selectedClient?.value) {
      setSelectedClient(contact);
    }
  }, [contactOptions, selectedClient?.value]);

  const changePageId = useCallback((pageId) => {
    if (pageId === selectedPageId) return;
    setSelectedPageId(pageId || null);
  }, [selectedPageId]);

  /** Точечное обновление клиента */
  const updateClientData = useCallback((clientId, platform, newData) => {
    setTicketData((prev) => {
      if (!prev?.clients) return prev;
      
      // Проверяем, есть ли изменения перед копированием
      let hasChanges = false;
      const newClients = prev.clients.map((c) => {
        if (c.id !== clientId) return c;
        
        // Обновляем только измененные поля
        const updated = {
          ...c,
          name: newData.name ?? c.name,
          surname: newData.surname ?? c.surname,
          phone: newData.phone ?? c.phone,
          email: newData.email ?? c.email,
        };
        
        // Проверяем, действительно ли что-то изменилось
        if (updated.name !== c.name || updated.surname !== c.surname || 
            updated.phone !== c.phone || updated.email !== c.email) {
          hasChanges = true;
        }
        return updated;
      });

      // Возвращаем старый объект, если изменений нет (оптимизация ререндеров)
      return hasChanges ? { ...prev, clients: newClients } : prev;
    });

    setSelectedClient((prev) => {
      // Обновляем только если это текущий клиент
      if (prev?.payload?.id !== clientId) return prev;
      
      const newPayload = { ...prev.payload, ...newData };
      // Проверяем реальные изменения
      const hasPayloadChanges = Object.keys(newData).some(
        key => newPayload[key] !== prev.payload[key]
      );
      
      return hasPayloadChanges ? { ...prev, payload: newPayload } : prev;
    });
  }, []);

  // Публичная функция для принудительной перезагрузки (игнорирует кэш)
  const refetch = useCallback(() => {
    lastFetchedTicketIdRef.current = null; // Сбрасываем кэш
    return fetchClientContacts();
  }, [fetchClientContacts]);

  return {
    platformOptions,            // memo
    selectedPlatform,
    changePlatform,

    contactOptions,             // memo
    changeContact,
    selectedClient,

    selectedPageId,
    changePageId,

    loading,
    updateClientData,
    refetch,
    
    // Экспортируем сырые данные для PersonalData4ClientForm (чтобы избежать дублирующего запроса)
    ticketData,
  };
};
