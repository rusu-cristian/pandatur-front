import { useState, useRef, useMemo, useCallback } from "react";
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
  Modal,
  Text,
  Loader
} from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { getLanguageByKey } from "../utils";
import { useApp, useDOMElementHeight, useChatFilters } from "../../hooks";
import { ChatListItem } from "./components";
import { ChatFilter } from "./ChatFilter";

const CHAT_ITEM_HEIGHT = 94;

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
    chatSpinner, 
    isChatFiltered, 
  } = useApp();
  
  // Единый хук для фильтров (URL как источник правды)
  const { filters, hasFilters } = useChatFilters();

  // Локальный поиск (с debounce)
  const [rawSearchQuery, setRawSearchQuery] = useState("");
  const [searchQuery] = useDebouncedValue(rawSearchQuery, 300);
  
  // Модал фильтра
  const [openFilter, setOpenFilter] = useState(false);

  // Refs для высоты списка
  const wrapperChatItemRef = useRef(null);
  const wrapperChatHeight = useDOMElementHeight(wrapperChatItemRef);

  // Базовые тикеты (отфильтрованные или все)
  const baseTickets = useMemo(() => {
    return isChatFiltered ? chatFilteredTickets : tickets;
  }, [isChatFiltered, chatFilteredTickets, tickets]);

  // Создаем индекс для быстрого поиска
  const searchIndex = useMemo(() => {
    return createSearchIndex(baseTickets);
  }, [baseTickets]);

  // Финальный список тикетов (с локальным поиском)
  const filteredTickets = useMemo(() => {
    let result = [...baseTickets];

    // Локальный поиск по отфильтрованным тикетам
    if (searchQuery) {
      const searchResults = searchTickets(searchIndex, searchQuery);
      result = result.filter(ticket => searchResults.includes(ticket));
    }

    return result;
  }, [baseTickets, searchQuery, searchIndex]);

  // Рендер элемента списка
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
              variant={hasFilters ? "filled" : "default"}
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

      {/* Модал фильтра */}
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
        <ChatFilter
          initialData={filters}
          loading={chatSpinner}
          onClose={() => setOpenFilter(false)}
        />
      </Modal>
    </>
  );
};

export default ChatList;
