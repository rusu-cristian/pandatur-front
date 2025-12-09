/**
 * ✨ useClientContacts с React Query
 * 
 * Преимущества:
 * - Автоматическое кэширование (вместо lastFetchedTicketIdRef)
 * - Автоматический retry при ошибках
 * - Меньше кода (~150 строк вместо 560)
 * - Stale-while-revalidate (показываем старые данные пока загружаются новые)
 * - Инвалидация кэша через queryClient
 */

import { useState, useEffect, useMemo, useCallback, startTransition } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSnackbar } from "notistack";
import { api } from "../api";
import { showServerError } from "@utils";
import { getPagesByType } from "../constants/webhookPagesConfig";

// ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====================

const DEBUG = false;
const debug = (...args) => { if (DEBUG) console.log("[useClientContacts]", ...args); };

export function filterPagesByGroupTitle(pages, groupTitle) {
  if (!groupTitle) return pages;
  return pages.filter((p) => {
    if (Array.isArray(p.group_title)) {
      return p.group_title.includes(groupTitle);
    }
    return p.group_title === groupTitle;
  });
}

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

// ==================== ГЛАВНЫЙ ХУК ====================

/**
 * 🎯 Хук для работы с контактами клиентов (с React Query)
 */
export const useClientContacts = (ticketId, lastMessage, groupTitle) => {
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();

  // ✅ React Query: Автоматическое кэширование и управление состоянием
  const {
    data: ticketData,
    isLoading: loading,
    error,
  } = useQuery({
    queryKey: ['clientContacts', ticketId],
    queryFn: async () => {
      if (!ticketId) return null;
      debug("Fetching client contacts for ticketId:", ticketId);
      return await api.users.getUsersClientContactsByPlatform(ticketId, null);
    },
    enabled: !!ticketId, // Делать запрос только если есть ticketId
    staleTime: 5 * 60 * 1000, // Данные свежие 5 минут
    cacheTime: 10 * 60 * 1000, // Кэш 10 минут
    retry: 1, // Повторить 1 раз при ошибке
    onError: (err) => {
      enqueueSnackbar(showServerError(err), { variant: "error" });
    },
  });

  // Локальное состояние для выбранных значений
  const [selectedPlatform, setSelectedPlatform] = useState(null);
  const [selectedClient, setSelectedClient] = useState({});
  const [selectedPageId, setSelectedPageId] = useState(null);

  // 1) Нормализация данных
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

  // 2) Опции платформ
  const platformOptions = useMemo(
    () => computePlatformOptionsFromBlocks(platformBlocks),
    [platformBlocks]
  );

  // 3) Опции контактов
  const contactOptions = useMemo(() => {
    if (!selectedPlatform) return [];
    const block = platformBlocks[selectedPlatform] || {};
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

    return contacts.sort((a, b) => a.label.localeCompare(b.label));
  }, [platformBlocks, selectedPlatform, clientIndex]);

  // 4) Автовыбор всех параметров (с валидацией)
  useEffect(() => {
    if (!ticketData || !platformOptions.length || !ticketId) {
      return;
    }

    let needsUpdate = false;
    let nextPlatform = selectedPlatform;
    let nextPageId = selectedPageId;
    let nextClient = selectedClient;

    // ============ ЭТАП 1: Платформа (с валидацией) ============
    const isPlatformValid = nextPlatform && platformOptions.some((p) => p.value === nextPlatform);
    
    if (!isPlatformValid) {
      if (lastMessage?.ticket_id === ticketId) {
        const msgPlatform = lastMessage.platform?.toLowerCase();
        if (msgPlatform && platformOptions.some((p) => p.value === msgPlatform)) {
          nextPlatform = msgPlatform;
        }
      }
      if (!nextPlatform || !platformOptions.some((p) => p.value === nextPlatform)) {
        nextPlatform = platformOptions[0]?.value || null;
      }
      
      if (nextPlatform) {
        debug("auto select/fix platform:", nextPlatform);
        needsUpdate = true;
      }
    }

    // ============ ЭТАП 2: Page ID (с валидацией) ============
    if (nextPlatform) {
      const allPages = getPagesByType(nextPlatform) || [];
      const availablePages = filterPagesByGroupTitle(allPages, groupTitle);
      
      // ✅ ИСПРАВЛЕНИЕ: Проверяем не только что page_id валиден,
      // но и что он соответствует lastMessage.page_id (если есть)
      const messagePageId = lastMessage?.ticket_id === ticketId ? lastMessage.page_id : null;
      const shouldMatchMessage = messagePageId && availablePages.some(p => p.page_id === messagePageId);
      
      const isPageIdValid = nextPageId && 
        availablePages.some(p => p.page_id === nextPageId) &&
        (!shouldMatchMessage || nextPageId === messagePageId); // ← ключевая проверка!
      
      debug("🔍 ЭТАП 2: Page ID selection", {
        nextPlatform,
        groupTitle,
        currentPageId: nextPageId,
        messagePageId,
        shouldMatchMessage,
        isPageIdValid,
        availablePagesCount: availablePages.length,
        availablePageIds: availablePages.map(p => p.page_id),
        lastMessage: lastMessage ? {
          ticket_id: lastMessage.ticket_id,
          page_id: lastMessage.page_id,
          page_reference: lastMessage.page_reference,
          platform: lastMessage.platform,
        } : null,
      });
      
      if (!isPageIdValid) {
        // Приоритет: берем page_id из сообщения
        if (messagePageId && availablePages.some(p => p.page_id === messagePageId)) {
          nextPageId = messagePageId;
          debug("🎯 Selected page_id from message:", nextPageId);
        } else if (lastMessage?.ticket_id === ticketId) {
          const candidate = selectPageIdByMessage(nextPlatform, lastMessage.page_id, groupTitle);
          debug("🎯 Candidate from selectPageIdByMessage:", candidate, "| message page_id:", lastMessage.page_id);
          if (candidate && availablePages.some(p => p.page_id === candidate)) {
            nextPageId = candidate;
          }
        }

        // Fallback: первая доступная страница
        if (!nextPageId || !availablePages.some(p => p.page_id === nextPageId)) {
          debug("⚠️ Fallback to first page:", availablePages[0]?.page_id);
          nextPageId = availablePages[0]?.page_id || null;
        }

        if (nextPageId) {
          debug("✅ Final auto selected page_id:", nextPageId);
          needsUpdate = true;
        }
      }
    }

    // ============ ЭТАП 3: Контакт (с валидацией) ============
    if (nextPlatform) {
      const block = platformBlocks[nextPlatform] || {};
      const hasContacts = Object.keys(block).length > 0;

      if (hasContacts) {
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
        
        const isContactValid = nextClient?.value && 
          tempContactOptions.some(c => c.value === nextClient.value);
        
        if (!isContactValid) {
          let contactValue = null;
          let messageClientId = null;

          if (lastMessage?.ticket_id === ticketId) {
            messageClientId = lastMessage.client_id;
            contactValue =
              lastMessage.sender_id === lastMessage.client_id
                ? lastMessage.from_reference
                : lastMessage.to_reference;

            if (!contactValue) {
              const entry = Object.entries(block).find(([cid]) => {
                const client = clientIndex.get(Number.parseInt(cid, 10));
                return client?.id === messageClientId;
              });
              if (entry) contactValue = entry[1]?.contact_value;
            }
          }

          const found = matchContact(tempContactOptions, contactValue, messageClientId);
          nextClient = found || tempContactOptions[0];

          if (nextClient) {
            debug("auto select/fix contact:", nextClient.value);
            needsUpdate = true;
          }
        }
      }
    }

    // Применяем все изменения одним батчем
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

  // Публичные callback
  const changePlatform = useCallback((platform) => {
    if (platform === selectedPlatform) return;
    const isValid = platformOptions?.some(p => p.value === platform);
    if (isValid || !platform) {
      startTransition(() => {
        setSelectedPlatform(platform || null);
        setSelectedClient({});
        setSelectedPageId(null);
      });
    }
  }, [selectedPlatform, platformOptions]);

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

  // Обновление данных клиента
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
    setSelectedClient((prev) =>
      prev?.payload?.id === clientId
        ? { ...prev, payload: { ...prev.payload, ...newData } }
        : prev
    );
  }, [queryClient, ticketId]);

  // ✅ Принудительная перезагрузка через React Query
  const refetch = useCallback(() => {
    queryClient.invalidateQueries(['clientContacts', ticketId]);
  }, [queryClient, ticketId]);

  return {
    platformOptions,
    selectedPlatform,
    changePlatform,

    contactOptions,
    changeContact,
    selectedClient,

    selectedPageId,
    changePageId,

    loading,
    updateClientData,
    refetch,
    
    // Экспортируем сырые данные для PersonalData4ClientForm
    ticketData,
  };
};
