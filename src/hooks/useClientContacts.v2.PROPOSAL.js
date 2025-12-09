/**
 * 🎯 УЛУЧШЕННАЯ ВЕРСИЯ useClientContacts
 * 
 * Ключевые улучшения:
 * 1. Разделение на специализированные хуки
 * 2. Автоматическая валидация выбранных значений
 * 3. Гарантированные fallback значения
 * 4. Упрощенная логика автовыбора
 * 5. Улучшенная типизация (TypeScript)
 */

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useSnackbar } from "notistack";
import { api } from "../api";
import { showServerError } from "@utils";
import { getPagesByType, filterPagesByGroupTitle } from "../constants/webhookPagesConfig";

// ==================== ВСПОМОГАТЕЛЬНЫЕ ХУКИ ====================

/**
 * Хук для загрузки данных клиентов с кэшированием
 */
function useClientContactsData(ticketId) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { enqueueSnackbar } = useSnackbar();
  
  // Кэш на уровне хука (можно переместить в React Query)
  const cacheRef = useRef(new Map());
  
  useEffect(() => {
    if (!ticketId) {
      setData(null);
      return;
    }
    
    // Проверяем кэш
    if (cacheRef.current.has(ticketId)) {
      setData(cacheRef.current.get(ticketId));
      return;
    }
    
    let isCancelled = false;
    
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await api.users.getUsersClientContactsByPlatform(ticketId, null);
        
        if (!isCancelled) {
          // Сохраняем в кэш
          cacheRef.current.set(ticketId, response);
          setData(response);
        }
      } catch (err) {
        if (!isCancelled) {
          setError(err);
          enqueueSnackbar(showServerError(err), { variant: "error" });
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };
    
    fetchData();
    
    return () => {
      isCancelled = true;
    };
  }, [ticketId, enqueueSnackbar]);
  
  // Метод для очистки кэша (при обновлении данных)
  const invalidateCache = useCallback((id) => {
    cacheRef.current.delete(id || ticketId);
  }, [ticketId]);
  
  return { data, loading, error, invalidateCache };
}

/**
 * Хук для автоматического выбора платформы с валидацией
 */
function usePlatformSelection(platformOptions, lastMessage, ticketId) {
  const [selectedPlatform, setSelectedPlatform] = useState(null);
  
  // Автовыбор с приоритетами
  useEffect(() => {
    if (!platformOptions?.length) {
      setSelectedPlatform(null);
      return;
    }
    
    // ✅ Валидация: проверяем что текущая платформа есть в списке
    const isCurrentValid = platformOptions.some(p => p.value === selectedPlatform);
    if (selectedPlatform && isCurrentValid) {
      return; // Текущий выбор валиден
    }
    
    // Приоритет 1: Платформа из последнего сообщения
    if (lastMessage?.ticket_id === ticketId) {
      const msgPlatform = lastMessage.platform?.toLowerCase();
      const foundPlatform = platformOptions.find(p => p.value === msgPlatform);
      if (foundPlatform) {
        setSelectedPlatform(foundPlatform.value);
        return;
      }
    }
    
    // Приоритет 2: Первая доступная платформа (гарантированный fallback)
    setSelectedPlatform(platformOptions[0].value);
  }, [platformOptions, lastMessage, ticketId, selectedPlatform]);
  
  const changePlatform = useCallback((platform) => {
    // Валидация перед сменой
    const isValid = platformOptions?.some(p => p.value === platform);
    if (isValid || !platform) {
      setSelectedPlatform(platform || null);
    }
  }, [platformOptions]);
  
  return [selectedPlatform, changePlatform];
}

/**
 * Хук для автоматического выбора page_id с валидацией
 */
function usePageIdSelection(selectedPlatform, groupTitle, lastMessage, ticketId) {
  const [selectedPageId, setSelectedPageId] = useState(null);
  
  // Мемоизированный список страниц
  const availablePages = useMemo(() => {
    if (!selectedPlatform) return [];
    const allPages = getPagesByType(selectedPlatform) || [];
    return filterPagesByGroupTitle(allPages, groupTitle);
  }, [selectedPlatform, groupTitle]);
  
  useEffect(() => {
    if (!availablePages.length) {
      setSelectedPageId(null);
      return;
    }
    
    // ✅ Валидация: проверяем что текущий page_id есть в списке
    const isCurrentValid = availablePages.some(p => p.page_id === selectedPageId);
    if (selectedPageId && isCurrentValid) {
      return; // Текущий выбор валиден
    }
    
    // Приоритет 1: page_id из последнего сообщения
    if (lastMessage?.ticket_id === ticketId) {
      const foundPage = availablePages.find(p => p.page_id === lastMessage.page_id);
      if (foundPage) {
        setSelectedPageId(foundPage.page_id);
        return;
      }
    }
    
    // Приоритет 2: Первая доступная страница (гарантированный fallback)
    setSelectedPageId(availablePages[0].page_id);
  }, [availablePages, lastMessage, ticketId, selectedPageId]);
  
  const changePageId = useCallback((pageId) => {
    const isValid = availablePages.some(p => p.page_id === pageId);
    if (isValid || !pageId) {
      setSelectedPageId(pageId || null);
    }
  }, [availablePages]);
  
  return [selectedPageId, changePageId, availablePages];
}

/**
 * Хук для автоматического выбора контакта с валидацией
 */
function useContactSelection(contactOptions, lastMessage, ticketId, platformBlocks, selectedPlatform, clientIndex) {
  const [selectedClient, setSelectedClient] = useState(null);
  
  useEffect(() => {
    if (!contactOptions?.length) {
      setSelectedClient(null);
      return;
    }
    
    // ✅ Валидация: проверяем что текущий контакт есть в списке
    const isCurrentValid = contactOptions.some(c => c.value === selectedClient?.value);
    if (selectedClient && isCurrentValid) {
      return; // Текущий выбор валиден
    }
    
    // Приоритет 1: Контакт из последнего сообщения
    if (lastMessage?.ticket_id === ticketId) {
      const messageClientId = lastMessage.client_id;
      const contactValue = lastMessage.sender_id === lastMessage.client_id
        ? lastMessage.from_reference
        : lastMessage.to_reference;
      
      // Точное совпадение (contact_value + client_id)
      let found = contactOptions.find(
        c => c.payload?.contact_value === contactValue && c.payload?.client_id === messageClientId
      );
      
      // Совпадение по contact_value
      if (!found) {
        found = contactOptions.find(c => c.payload?.contact_value === contactValue);
      }
      
      if (found) {
        setSelectedClient(found);
        return;
      }
    }
    
    // Приоритет 2: Первый доступный контакт (гарантированный fallback)
    setSelectedClient(contactOptions[0]);
  }, [contactOptions, lastMessage, ticketId, selectedClient]);
  
  const changeContact = useCallback((value) => {
    const contact = contactOptions?.find(o => o.value === value);
    if (contact) {
      setSelectedClient(contact);
    }
  }, [contactOptions]);
  
  return [selectedClient, changeContact];
}

// ==================== ГЛАВНЫЙ ХУК ====================

/**
 * 🎯 Главный хук для работы с контактами клиентов
 * 
 * Гарантии:
 * - Всегда возвращает валидные значения
 * - Автоматически пересчитывает при изменении данных
 * - Защита от race conditions
 * - Кэширование запросов
 */
export function useClientContacts(ticketId, lastMessage, groupTitle) {
  // 1. Загрузка данных с кэшированием
  const { data: ticketData, loading, invalidateCache } = useClientContactsData(ticketId);
  
  // 2. Обработка данных (нормализация, индексы)
  const { platformBlocks, clientIndex, platformOptions, contactOptionsMap } = useMemo(() => {
    if (!ticketData) {
      return { 
        platformBlocks: {}, 
        clientIndex: new Map(), 
        platformOptions: [],
        contactOptionsMap: {}
      };
    }
    
    // ... здесь логика из оригинального хука ...
    // (нормализация, enrichBlocksWithClientContacts, buildClientIndex)
    
    return {
      platformBlocks: {}, // TODO: реализовать
      clientIndex: new Map(),
      platformOptions: [],
      contactOptionsMap: {}
    };
  }, [ticketData]);
  
  // 3. Автоматический выбор платформы (с валидацией)
  const [selectedPlatform, changePlatform] = usePlatformSelection(
    platformOptions, 
    lastMessage, 
    ticketId
  );
  
  // 4. Автоматический выбор page_id (с валидацией)
  const [selectedPageId, changePageId, availablePages] = usePageIdSelection(
    selectedPlatform,
    groupTitle,
    lastMessage,
    ticketId
  );
  
  // 5. Генерация опций контактов для выбранной платформы
  const contactOptions = useMemo(() => {
    if (!selectedPlatform) return [];
    return contactOptionsMap[selectedPlatform] || [];
  }, [selectedPlatform, contactOptionsMap]);
  
  // 6. Автоматический выбор контакта (с валидацией)
  const [selectedClient, changeContact] = useContactSelection(
    contactOptions,
    lastMessage,
    ticketId,
    platformBlocks,
    selectedPlatform,
    clientIndex
  );
  
  // 7. Обновление данных клиента (оптимистичное обновление)
  const updateClientData = useCallback((clientId, platform, newData) => {
    // TODO: реализовать оптимистичное обновление
    // Инвалидировать кэш после успешного обновления
    invalidateCache();
  }, [invalidateCache]);
  
  // 8. Принудительная перезагрузка
  const refetch = useCallback(() => {
    invalidateCache();
  }, [invalidateCache]);
  
  return {
    // Опции для select
    platformOptions,
    contactOptions,
    pageIdOptions: availablePages.map(p => ({ 
      value: p.page_id, 
      label: p.page_name 
    })),
    
    // Выбранные значения (всегда валидные или null)
    selectedPlatform,
    selectedClient,
    selectedPageId,
    
    // Методы изменения
    changePlatform,
    changeContact,
    changePageId,
    
    // Дополнительные данные
    ticketData,
    loading,
    
    // Методы обновления
    updateClientData,
    refetch,
  };
}
