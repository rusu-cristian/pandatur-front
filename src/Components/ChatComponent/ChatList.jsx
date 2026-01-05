import { useState, useRef, useCallback, useEffect, useTransition } from "react";
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
import { useDOMElementHeight, useChatFilters, useUser, useChatTicketsQuery } from "../../hooks";
import { ChatListItem } from "./components";
import { ChatFilter } from "./ChatFilter";
import { prepareFiltersForUrl } from "../utils/parseFiltersFromUrl";

const CHAT_ITEM_HEIGHT = 94;

const ChatList = ({ ticketId, isMobile = false }) => {
  const navigate = useNavigate();
  const { ticketId: ticketIdFromUrl } = useParams();
  const { userId } = useUser();
  
  // React Query хук для тикетов (заменяет fetchChatFilteredTickets из AppContext)
  const { 
    tickets: displayedTickets,
    isLoading,
    isFetching,
    hasFilters,
    isFiltered,
    groupTitleForApi,
    filters,
  } = useChatTicketsQuery();
  
  // Хук для управления фильтрами (URL — источник правды)
  const { defaultFilters, workflowOptions } = useChatFilters();
  
  // Ref для отслеживания инициализации
  const isInitializedRef = useRef(false);
  
  // Эффект для применения дефолтных фильтров при первой загрузке
  useEffect(() => {
    if (!groupTitleForApi || !workflowOptions.length || !userId) return;

    // Если нет фильтров в URL и ещё не инициализировались — применяем дефолтные
    if (!isFiltered && !isInitializedRef.current) {
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
    isFiltered,
    groupTitleForApi,
    workflowOptions,
    userId,
    defaultFilters,
    navigate,
    ticketIdFromUrl,
  ]);

  // Локальный поиск (заглушка — логика будет добавлена позже)
  const [searchQuery, setSearchQuery] = useState("");
  
  // Модал фильтра
  const [openFilter, setOpenFilter] = useState(false);
  
  // startTransition для не-срочных обновлений UI (открытие тяжёлой модалки фильтра)
  const [, startTransition] = useTransition();

  // Refs для высоты списка
  const wrapperChatItemRef = useRef(null);
  const wrapperChatHeight = useDOMElementHeight(wrapperChatItemRef);

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
      <Box 
        direction="column" 
        w={isMobile ? "100%" : "20%"}
        style={isMobile ? { height: "100%", display: "flex", flexDirection: "column" } : {}}
        className={isMobile ? "mobile-chat-list-wrapper" : ""}
      >
        <Flex direction="column" gap="xs" my="xs" pl="xs" pr="xs" style={isMobile ? { flexShrink: 0 } : {}}>
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
            {/* Кнопка фильтра — onMouseDown для мгновенного отклика */}
            <ActionIcon
              variant={hasFilters ? "filled" : "default"}
              size="36"
              onMouseDown={() => startTransition(() => setOpenFilter(true))}
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

        <Divider color="var(--crm-ui-kit-palette-border-default)" style={isMobile ? { flexShrink: 0 } : {}} />

        <Box 
          style={isMobile 
            ? { flex: 1, minHeight: 0, position: "relative" } 
            : { height: "calc(100% - 110px)", position: "relative" }
          } 
          ref={wrapperChatItemRef}
        >
          {isLoading ? (
            <Flex h="100%" align="center" justify="center">
              <Loader size="xl" color="green" />
            </Flex>
          ) : displayedTickets.length === 0 ? (
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

          {/* Индикатор фоновой загрузки (refetch) */}
          {isFetching && !isLoading && (
            <Box style={{ position: "absolute", bottom: 10, right: 10 }}>
              <Loader size="sm" color="green" />
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
          loading={isFetching}
          onClose={() => setOpenFilter(false)}
        />
      </Modal>
    </>
  );
};

export default ChatList;
