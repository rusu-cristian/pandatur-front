import { FaArrowLeft, FaLock } from "react-icons/fa";
import React, { useEffect, useState, useRef, useContext, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Flex, ActionIcon, Box, Text, Center, Stack } from "@mantine/core";
import ChatExtraInfo from "./ChatExtraInfo";
import { ChatMessages } from "./components";
import { useClientContacts, useMessagesContext } from "@hooks";
import { useTickets } from "../../contexts/TicketsContext";
import { useTicketSync, SYNC_EVENTS } from "../../contexts/TicketSyncContext";
import { UserContext } from "../../contexts/UserContext";
import { Spin } from "@components";
import Can from "@components/CanComponent/Can";
import { getLanguageByKey } from "../utils/getLanguageByKey";

const SingleChat = ({ technicians, ticketId, onClose }) => {
  const { getTicketById, fetchSingleTicket, tickets } = useTickets();
  const { messages, clearAll: clearMessages } = useMessagesContext();
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    accessibleGroupTitles,
    groupTitleForApi,
    customGroupTitle,
    setCustomGroupTitle,
  } = useContext(UserContext);
  const [isLoadingTicket, setIsLoadingTicket] = useState(false);
  const [loadedTicket, setLoadedTicket] = useState(null);
  
  // Ref для предотвращения дублирования запросов
  const fetchingRef = useRef(false);
  const fetchSingleTicketRef = useRef(fetchSingleTicket);
  fetchSingleTicketRef.current = fetchSingleTicket;
  
  // Очищаем память при размонтировании компонента (закрытие тикета)
  useEffect(() => {
    return () => {
      // Освобождаем память сразу при закрытии
      if (clearMessages) {
        clearMessages();
      }
      setLoadedTicket(null);
    };
  }, [clearMessages]);

  // Получаем тикет из TicketsContext
  // Ищем в массиве tickets, чтобы компонент автоматически перерисовывался при обновлении
  // Тикет обновляется через WebSocket (TICKET_UPDATE) и fetchSingleTicket
  const currentTicket = React.useMemo(() => {
    if (!ticketId) return null;
    const ticketIdNum = Number(ticketId);
    
    // Сначала используем загруженный тикет
    if (loadedTicket && loadedTicket.id === ticketIdNum) {
      return loadedTicket;
    }
    
    // Затем ищем в массиве tickets
    const ticketFromArray = tickets?.find(t => t.id === ticketIdNum);
    if (ticketFromArray) return ticketFromArray;
    
    // Затем ищем через getTicketById (hash map)
    return getTicketById(ticketIdNum);
  }, [ticketId, tickets, getTicketById, loadedTicket]);

  // Получаем последнее сообщение по времени для автоматического выбора платформы и контакта
  const lastMessage = React.useMemo(() => {
    if (!messages || messages.length === 0 || !ticketId) {

      return null;
    }

    // Фильтруем сообщения только для текущего тикета и исключаем sipuni/mail
    const currentTicketId = Number(ticketId);
    const currentTicketMessages = messages.filter(msg => {
      const platform = msg.platform?.toLowerCase();
      return msg.ticket_id === currentTicketId && platform !== 'sipuni' && platform !== 'mail';
    });

    if (currentTicketMessages.length === 0) {
      return null;
    }

    // Сортируем по времени и берем последнее
    const sortedMessages = [...currentTicketMessages].sort((a, b) => {
      const timeA = new Date(a.time_sent || a.created_at || 0);
      const timeB = new Date(b.time_sent || b.created_at || 0);
      return timeB - timeA; // От новых к старым
    });

    const lastMsg = sortedMessages[0];

    return lastMsg;
  }, [messages, ticketId]);

  // Проверяем доступ к группе тикета (для раннего выхода)
  const hasAccessToTicket = useMemo(() => {
    if (!loadedTicket?.group_title) return null; // Ещё не знаем
    return accessibleGroupTitles.includes(loadedTicket.group_title);
  }, [loadedTicket?.group_title, accessibleGroupTitles]);

  // useClientContacts загружает ticket-info — вызываем ТОЛЬКО если есть доступ
  // Передаём null если нет доступа — хук не будет делать запрос
  const {
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
    ticketData,
  } = useClientContacts(
    hasAccessToTicket ? Number(ticketId) : null, // НЕ загружаем если нет доступа
    lastMessage,
    currentTicket?.group_title
  );

  // НЕ вызываем getUserMessages здесь — ChatMessages сам загружает сообщения

  // Загружаем актуальный тикет при открытии
  useEffect(() => {
    if (!ticketId) {
      setLoadedTicket(null);
      return;
    }

    const ticketIdNum = Number(ticketId);
    if (!ticketIdNum) {
      setLoadedTicket(null);
      return;
    }

    // Предотвращаем дублирование запросов
    if (fetchingRef.current) return;
    fetchingRef.current = true;

    setIsLoadingTicket(true);

    fetchSingleTicketRef.current(ticketIdNum)
      .then((ticket) => {
        if (ticket) {
          setLoadedTicket(ticket);
        }
      })
      .finally(() => {
        setIsLoadingTicket(false);
        fetchingRef.current = false;
      });
  }, [ticketId]); // Убрали fetchSingleTicket из зависимостей

  // Подписываемся на WebSocket обновления тикета
  const { subscribe } = useTicketSync();
  const ticketIdRef = useRef(ticketId);
  ticketIdRef.current = ticketId;

  useEffect(() => {
    const unsubscribe = subscribe(SYNC_EVENTS.TICKET_UPDATED, ({ ticketId: updatedId, ticket }) => {
      // Обновляем локальный state если это наш тикет
      if (updatedId === Number(ticketIdRef.current) && ticket) {
        // Обновляем только если данные пришли в событии
        // НЕ перезапрашиваем — это избыточно, данные уже в TicketsContext
        setLoadedTicket(ticket);
      }
    });

    return unsubscribe;
  }, [subscribe]);

  // Переключаем группу если тикет из другой группы И есть доступ
  // ВАЖНО: также обновляем URL, чтобы избежать конфликта с syncGroupTitleFromUrl в Leads
  useEffect(() => {
    if (!loadedTicket?.group_title || !hasAccessToTicket) return;
    
    const ticketGroup = loadedTicket.group_title;
    if (ticketGroup !== groupTitleForApi && ticketGroup !== customGroupTitle) {
      // 1. Обновляем контекст
      setCustomGroupTitle(ticketGroup);
      localStorage.setItem("leads_last_group_title", ticketGroup);
      
      // 2. Обновляем URL чтобы syncGroupTitleFromUrl не конфликтовал
      // Без этого syncGroupTitleFromUrl пытается вернуть старую группу из URL → бесконечный цикл
      setSearchParams((prev) => {
        const newParams = new URLSearchParams(prev);
        newParams.set("group_title", ticketGroup);
        return newParams;
      }, { replace: true });
    }
  }, [loadedTicket?.group_title, hasAccessToTicket, groupTitleForApi, customGroupTitle, setCustomGroupTitle, setSearchParams]);

  // Получаем unseen_count из актуального тикета
  const unseenCount = currentTicket?.unseen_count || 0;

  // Показываем спиннер пока загружается тикет
  if (isLoadingTicket || hasAccessToTicket === null) {
    return (
      <div className="chat-container">
        <Box pos="absolute" left="10px" top="16px">
          <ActionIcon onClick={onClose} variant="default">
            <FaArrowLeft size="12" />
          </ActionIcon>
        </Box>
        <Center h="100%" w="100%">
          {/* <Spin /> */}
        </Center>
      </div>
    );
  }

  // Показываем "Нет доступа" если пользователь не имеет прав на эту группу
  if (!hasAccessToTicket) {
    return (
      <div className="chat-container">
        <Box pos="absolute" left="10px" top="16px">
          <ActionIcon onClick={onClose} variant="default">
            <FaArrowLeft size="12" />
          </ActionIcon>
        </Box>
        <Center h="100%" w="100%">
          <Stack align="center" gap="md">
            <FaLock size={48} color="var(--crm-ui-kit-palette-text-secondary)" />
            <Text size="lg" fw={500} c="dimmed">
            {getLanguageByKey("noAccesTicket")}
            </Text>
          </Stack>
        </Center>
      </div>
    );
  }

  return (
    <div className="chat-container">
      <Box pos="absolute" left="10px" top="16px">
        <ActionIcon onClick={onClose} variant="default">
          <FaArrowLeft size="12" />
        </ActionIcon>
      </Box>

      <Flex w="70%">
        <Can permission={{ module: "chat", action: "view" }} context={{ responsibleId: currentTicket?.technician_id?.toString() ?? null }}>
          <ChatMessages
            ticketId={ticketId ? Number(ticketId) : undefined}
            personalInfo={currentTicket}
            technicians={technicians}
            unseenCount={unseenCount}
            // Props из useClientContacts (передаются чтобы избежать повторного вызова хука в ChatInput)
            platformOptions={platformOptions}
            selectedPlatform={selectedPlatform}
            changePlatform={changePlatform}
            contactOptions={contactOptions}
            changeContact={changeContact}
            selectedClient={selectedClient}
            selectedPageId={selectedPageId}
            changePageId={changePageId}
            clientContactsLoading={loading}
          />
        </Can>
      </Flex>

      <ChatExtraInfo
        selectedClient={selectedClient}
        ticketId={ticketId}
        updatedTicket={currentTicket}
        onUpdateClientData={updateClientData}
        clientsData={ticketData}
      />

    </div>
  );
};

export default SingleChat;
