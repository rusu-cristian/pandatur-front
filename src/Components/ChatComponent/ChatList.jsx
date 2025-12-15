import { useState, useRef, useMemo, useCallback, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
import { getLanguageByKey } from "../utils";
import { useApp, useDOMElementHeight, useChatFilters, useUser } from "../../hooks";
import { ChatListItem } from "./components";
import { ChatFilter } from "./ChatFilter";
import { prepareFiltersForUrl } from "../utils/parseFiltersFromUrl";

const CHAT_ITEM_HEIGHT = 94;

const ChatList = ({ ticketId }) => {
  const navigate = useNavigate();
  const { ticketId: ticketIdFromUrl } = useParams();
  
  const { 
    tickets, 
    chatFilteredTickets, 
    chatSpinner, 
    isChatFiltered,
    fetchChatFilteredTickets,
    setIsChatFiltered,
    groupTitleForApi,
    workflowOptions,
  } = useApp();
  
  const { userId } = useUser();
  
  // Единый хук для фильтров (URL как источник правды)
  const { filters, hasFilters, isFiltered, defaultFilters } = useChatFilters();
  
  // Ref для отслеживания загрузки (предотвращает дублирование)
  const lastFiltersRef = useRef(null);
  const isInitializedRef = useRef(false);
  
  // === ЭФФЕКТ ЗАГРУЗКИ ТИКЕТОВ ===
  // (перенесён из useChatFilters, чтобы не срабатывал при открытии ChatFilter)
  useEffect(() => {
    if (!groupTitleForApi || !workflowOptions.length || !userId) return;

    const filtersKey = JSON.stringify({ filters, groupTitleForApi, isFiltered });
    if (lastFiltersRef.current === filtersKey) return;
    lastFiltersRef.current = filtersKey;

    if (isFiltered && hasFilters) {
      // Есть фильтры — загружаем отфильтрованные тикеты
      fetchChatFilteredTickets(filters);
      setIsChatFiltered(true);
    } else if (!isInitializedRef.current) {
      // Первая загрузка без фильтров в URL — применяем дефолтные
      isInitializedRef.current = true;
      const urlParams = prepareFiltersForUrl({
        ...defaultFilters,
        is_filtered: "true",
        ...(groupTitleForApi ? { group_title: groupTitleForApi } : {}),
      });
      const basePath = ticketIdFromUrl ? `/chat/${ticketIdFromUrl}` : "/chat";
      navigate(`${basePath}?${urlParams.toString()}`, { replace: true });
    }
  }, [
    filters,
    hasFilters,
    isFiltered,
    groupTitleForApi,
    workflowOptions,
    userId,
    fetchChatFilteredTickets,
    setIsChatFiltered,
    defaultFilters,
    navigate,
    ticketIdFromUrl,
  ]);

  // Локальный поиск (заглушка — логика будет добавлена позже)
  const [searchQuery, setSearchQuery] = useState("");
  
  // Модал фильтра
  const [openFilter, setOpenFilter] = useState(false);

  // Refs для высоты списка
  const wrapperChatItemRef = useRef(null);
  const wrapperChatHeight = useDOMElementHeight(wrapperChatItemRef);

  // Список тикетов для отображения
  const displayedTickets = useMemo(() => {
    return isChatFiltered ? chatFilteredTickets : tickets;
  }, [isChatFiltered, chatFilteredTickets, tickets]);

  // Рендер элемента списка
  const ChatItem = useCallback(
    ({ index, style }) => (
      <ChatListItem
        chat={displayedTickets[index]}
        style={style}
        selectTicketId={ticketId}
      />
    ),
    [displayedTickets, ticketId]
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
                {displayedTickets.length}
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
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </Flex>

        <Divider color="var(--crm-ui-kit-palette-border-default)" />

        <Box style={{ height: "calc(100% - 110px)", position: "relative" }} ref={wrapperChatItemRef}>
          {displayedTickets.length === 0 ? (
            <Flex h="100%" align="center" justify="center" px="md">
              <Text c="dimmed">{getLanguageByKey("Nici un lead")}</Text>
            </Flex>
          ) : (
            <FixedSizeList
              height={wrapperChatHeight}
              itemCount={displayedTickets.length}
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
