import { useState, useRef, useMemo, useCallback, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { FixedSizeList } from "react-window";
import { LuFilter } from "react-icons/lu";
import {
  TextInput,
  Title,
  Flex,
  Box,
  Divider,
  ActionIcon,
  Badge,
  Tabs,
  Modal,
  Text,
  Button,
  Loader
} from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { getLanguageByKey } from "../utils";
import { useUser, useApp, useDOMElementHeight, useChatUrlSync } from "../../hooks";
import { ChatListItem } from "./components";
import { TicketFormTabs } from "../TicketFormTabs";
import { MessageFilterForm } from "../LeadsComponent/MessageFilterForm";

const CHAT_ITEM_HEIGHT = 94;

// Финальные статусы, которые исключаем из показа в чате
const EXCLUDED_WORKFLOWS = ["Realizat cu succes", "Închis și nerealizat", "Interesat"];

// Hash map для быстрого поиска тикетов по различным критериям
const createSearchIndex = (tickets) => {
  const index = {
    byId: new Map(),
    byClientName: new Map(),
    byClientPhone: new Map(),
    byTicketId: new Map()
  };

  tickets.forEach(ticket => {
    // Индекс по ID тикета
    index.byId.set(ticket.id, ticket);
    index.byTicketId.set(ticket.id.toString(), ticket);

    // Индексы по клиентам
    if (ticket.clients) {
      ticket.clients.forEach(client => {
        // По имени
        if (client.name) {
          const nameKey = client.name.toLowerCase();
          if (!index.byClientName.has(nameKey)) {
            index.byClientName.set(nameKey, []);
          }
          index.byClientName.get(nameKey).push(ticket);
        }

        // По фамилии
        if (client.surname) {
          const surnameKey = client.surname.toLowerCase();
          if (!index.byClientName.has(surnameKey)) {
            index.byClientName.set(surnameKey, []);
          }
          index.byClientName.get(surnameKey).push(ticket);
        }

        // По телефонам
        if (client.phones) {
          client.phones.forEach(phone => {
            if (phone) {
              const phoneKey = phone.toString().toLowerCase();
              if (!index.byClientPhone.has(phoneKey)) {
                index.byClientPhone.set(phoneKey, []);
              }
              index.byClientPhone.get(phoneKey).push(ticket);
            }
          });
        }
      });
    }
  });

  return index;
};

// Быстрый поиск с использованием hash map
const searchTickets = (index, query) => {
  if (!query) return [];

  const searchTerm = query.toLowerCase();
  const foundTickets = new Set();

  // Поиск по ID тикета
  if (index.byTicketId.has(searchTerm)) {
    foundTickets.add(index.byTicketId.get(searchTerm));
  }

  // Поиск по частичному совпадению ID
  for (const [ticketId, ticket] of index.byTicketId) {
    if (ticketId.includes(searchTerm)) {
      foundTickets.add(ticket);
    }
  }

  // Поиск по имени клиента
  for (const [name, tickets] of index.byClientName) {
    if (name.includes(searchTerm)) {
      tickets.forEach(ticket => foundTickets.add(ticket));
    }
  }

  // Поиск по телефону
  for (const [phone, tickets] of index.byClientPhone) {
    if (phone.includes(searchTerm)) {
      tickets.forEach(ticket => foundTickets.add(ticket));
    }
  }

  return Array.from(foundTickets);
};

const ChatList = ({ ticketId }) => {
  const { 
    tickets, 
    chatFilteredTickets, 
    fetchChatFilteredTickets, 
    chatSpinner, 
    isChatFiltered, 
    setIsChatFiltered, 
    workflowOptions, 
    currentChatFilters,
    accessibleGroupTitles,
    customGroupTitle,
    setCustomGroupTitle,
  } = useApp();
  const { userId } = useUser();
  const [searchParams] = useSearchParams();

  const [openFilter, setOpenFilter] = useState(false);
  const [rawSearchQuery, setRawSearchQuery] = useState("");
  const [searchQuery] = useDebouncedValue(rawSearchQuery, 300);
  const [chatFilters, setChatFilters] = useState({ action_needed: true });
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const wrapperChatItemRef = useRef(null);
  const wrapperChatHeight = useDOMElementHeight(wrapperChatItemRef);
  const [activeTab, setActiveTab] = useState("filter_ticket");
  const ticketFormRef = useRef();
  const messageFormRef = useRef();

  // Функция для создания дефолтных фильтров
  const getDefaultFilters = useCallback(() => {
    const filteredWorkflow = workflowOptions.filter((w) => !EXCLUDED_WORKFLOWS.includes(w));
    return {
      action_needed: true,
      workflow: filteredWorkflow,
      technician_id: [String(userId)],
      unseen: "true",
      last_message_author: [0]
    };
  }, [workflowOptions, userId]);

  // Функция для применения фильтров
  const applyFilters = useCallback((filters) => {
    setChatFilters(filters);
    fetchChatFilteredTickets(filters);
    setIsChatFiltered(true);
  }, [fetchChatFilteredTickets, setIsChatFiltered]);

  // Функция для сброса фильтров
  const resetFilters = useCallback(() => {
    const defaultFilters = getDefaultFilters();
    applyFilters(defaultFilters);
  }, [getDefaultFilters, applyFilters]);

  // Вспомогательные функции для работы с фильтрами
  const isEmpty = useCallback((v) =>
    v === undefined ||
    v === null ||
    v === "" ||
    (Array.isArray(v) && v.length === 0) ||
    (typeof v === "object" && Object.keys(v).length === 0)
  , []);

  const mergeFilters = useCallback((...filters) =>
    Object.fromEntries(
      Object.entries(Object.assign({}, ...filters)).filter(
        ([_, v]) => !isEmpty(v)
      )
    )
  , [isEmpty]);

  // URL синхронизация - работает автоматически, не нарушая существующую логику
  useChatUrlSync({
    chatFilters,
    isFiltered: isChatFiltered,
    rawSearchQuery,
    showMyTickets: false,
  });

  // Синхронизация group_title из URL в контекст (как в useLeadsUrlSync)
  useEffect(() => {
    const urlGroupTitle = searchParams.get("group_title");
    
    // Если в URL есть group_title и он доступен по правам, синхронизируем его
    if (
      urlGroupTitle &&
      Array.isArray(accessibleGroupTitles) &&
      accessibleGroupTitles.includes(urlGroupTitle) &&
      customGroupTitle !== urlGroupTitle
    ) {
      setCustomGroupTitle(urlGroupTitle);
    }
  }, [searchParams, accessibleGroupTitles, customGroupTitle, setCustomGroupTitle]);

  // Восстановление состояния из URL при первой загрузке (только серверные фильтры)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlIsFiltered = urlParams.get("is_filtered") === "true";

    // Восстанавливаем только серверные фильтры (НЕ локальные: search, show_my_tickets)
    // group_title управляется отдельно через эффект выше
    if (urlIsFiltered && !isChatFiltered && isInitialLoad) {
      const urlFilters = {};
      for (const [key, value] of urlParams.entries()) {
        if (key === "search" || key === "show_my_tickets" || key === "is_filtered" || key === "group_title") continue;

        if (key.endsWith("_from") || key.endsWith("_to")) {
          const baseKey = key.replace(/_from$|_to$/, "");
          if (!urlFilters[baseKey]) urlFilters[baseKey] = {};
          if (key.endsWith("_from")) urlFilters[baseKey].from = value;
          if (key.endsWith("_to")) urlFilters[baseKey].to = value;
        } else {
          const values = urlParams.getAll(key);
          urlFilters[key] = values.length > 1 ? values : values[0];
        }
      }

      if (Object.keys(urlFilters).length > 0) {
        setChatFilters(urlFilters);
        setIsChatFiltered(true);
        fetchChatFilteredTickets(urlFilters);
        setIsInitialLoad(false); // Отмечаем, что загрузка завершена
      }
    }
  }, [fetchChatFilteredTickets, isChatFiltered, setIsChatFiltered, isInitialLoad]); // Зависимости для восстановления состояния из URL

  // Синхронизируем локальные фильтры с глобальными
  useEffect(() => {
    if (isChatFiltered && Object.keys(currentChatFilters).length > 0) {
      setChatFilters(currentChatFilters);
    }
  }, [currentChatFilters, isChatFiltered]);

  // Загружаем тикеты с фильтрами по умолчанию при первой загрузке
  useEffect(() => {
    if (isInitialLoad && workflowOptions.length > 0 && !isChatFiltered && userId) {
      const defaultFilters = getDefaultFilters();
      applyFilters(defaultFilters);
      setIsInitialLoad(false);
    }
  }, [isInitialLoad, workflowOptions, isChatFiltered, userId, getDefaultFilters, applyFilters]);

  const baseTickets = useMemo(() => {
    return isChatFiltered ? chatFilteredTickets : tickets;
  }, [isChatFiltered, chatFilteredTickets, tickets]);

  // Создаем индекс для быстрого поиска
  const searchIndex = useMemo(() => {
    return createSearchIndex(baseTickets);
  }, [baseTickets]);

  const filteredTickets = useMemo(() => {
    let result = [...baseTickets];

    // Основная фильтрация делается на сервере через fetchChatFilteredTickets
    // Здесь применяем только локальный поиск по отфильтрованным тикетам

    // Поиск по запросу - ищем в тикетах, которые пришли с сервера
    if (searchQuery) {
      const searchResults = searchTickets(searchIndex, searchQuery);
      result = result.filter(ticket => searchResults.includes(ticket));
    }

    return result;
  }, [baseTickets, searchQuery, searchIndex]);

  // ВАЖНО: Сортировка происходит на бэкенде, поэтому используем filteredTickets напрямую
  // Бэкенд возвращает тикеты уже отсортированными по last_interaction_date или другому полю

  const ChatItem = useCallback(
    ({ index, style }) => (
      <ChatListItem
        chat={filteredTickets[index]}
        style={style}
        selectTicketId={ticketId}
      />
    ),
    [filteredTickets, ticketId]
  );

  return (
    <>
      <Box direction="column" w="20%">
        <Flex direction="column" gap="xs" my="xs" pl="xs" pr="xs">
          <Flex align="center" justify="space-between">
            <Flex align="center" gap={8}>
              <Title order={3}>{getLanguageByKey("Chat")}</Title>
              <Badge
                variant="filled"
                style={{ backgroundColor: "var(--crm-ui-kit-palette-link-primary)" }}
              >
                {filteredTickets.length}
              </Badge>
            </Flex>
            <ActionIcon
              variant={isChatFiltered ? "filled" : "default"}
              size="36"
              onClick={() => setOpenFilter(true)}
            >
              <LuFilter size={16} />
            </ActionIcon>
          </Flex>

          <TextInput
            placeholder={getLanguageByKey("Cauta dupa ID, Nume client, Telefon sau Email")}
            value={rawSearchQuery}
            onChange={(e) => setRawSearchQuery(e.target.value)}
          />
        </Flex>

        <Divider color="var(--crm-ui-kit-palette-border-default)" />

        <Box style={{ height: "calc(100% - 110px)", position: "relative" }} ref={wrapperChatItemRef}>
          {filteredTickets.length === 0 ? (
            <Flex h="100%" align="center" justify="center" px="md">
              <Text c="dimmed">{getLanguageByKey("Nici un lead")}</Text>
            </Flex>
          ) : (
            <FixedSizeList
              height={wrapperChatHeight}
              itemCount={filteredTickets.length}
              itemSize={CHAT_ITEM_HEIGHT}
              width="100%"
            >
              {ChatItem}
            </FixedSizeList>
          )}

          {chatSpinner && (
            <Box style={{ position: "absolute", bottom: 10, right: 10 }}>
              <Loader size="xl" color="green" />
            </Box>
          )}
        </Box>
      </Box>

      <Modal
        opened={openFilter}
        onClose={() => setOpenFilter(false)}
        title={getLanguageByKey("Filtrează tichete")}
        withCloseButton
        centered
        size="lg"
        styles={{
          content: {
            height: "700px",
            display: "flex",
            flexDirection: "column",
          },
          body: {
            flex: 1,
            overflowY: "auto",
            padding: "1rem"
          },
          title: {
            color: "var(--crm-ui-kit-palette-text-primary)"
          }
        }}
      >
        <Tabs
          h="100%"
          className="leads-modal-filter-tabs"
          defaultValue="filter_ticket"
          value={activeTab}
          onChange={setActiveTab}
          pb="48"
        >
          <Tabs.List>
            <Tabs.Tab value="filter_ticket">{getLanguageByKey("Filtru pentru Lead")}</Tabs.Tab>
            <Tabs.Tab value="filter_message">{getLanguageByKey("Filtru dupǎ mesaje")}</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="filter_ticket" pt="xs">
            <TicketFormTabs
              ref={ticketFormRef}
              initialData={chatFilters}
              loading={chatSpinner}
            />
          </Tabs.Panel>

          <Tabs.Panel value="filter_message" pt="xs">
            <MessageFilterForm
              ref={messageFormRef}
              initialData={chatFilters}
              loading={chatSpinner}
            />
          </Tabs.Panel>

          <Flex justify="end" gap="md" mt="md" pr="md">
            <Button
              variant="outline"
              onClick={() => {
                resetFilters();
                setOpenFilter(false);
              }}
            >
              {getLanguageByKey("Reset filter")}
            </Button>
            <Button variant="outline" onClick={() => setOpenFilter(false)}>
              {getLanguageByKey("Închide")}
            </Button>
            <Button
              variant="filled"
              loading={chatSpinner}
              onClick={() => {
                const ticketValues = ticketFormRef.current?.getValues?.() || {};
                const messageValues = messageFormRef.current?.getValues?.() || {};

                const combined = mergeFilters(ticketValues, messageValues);

                // Если фильтры пустые, применяем дефолтные
                if (Object.keys(combined).length === 0) {
                  resetFilters();
                } else {
                  applyFilters(combined);
                }

                setOpenFilter(false);
              }}
            >
              {getLanguageByKey("Aplică")}
            </Button>
          </Flex>
        </Tabs>
      </Modal>
    </>
  );
};

export default ChatList;
