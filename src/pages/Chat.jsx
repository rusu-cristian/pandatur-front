import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";
import { Flex, ActionIcon, Box } from "@mantine/core";
import { useApp, useClientContacts, useMessagesContext, useChatFilters } from "@hooks";
import { useGetTechniciansList } from "../hooks";
import { api } from "../api";
import ChatExtraInfo from "../Components/ChatComponent/ChatExtraInfo";
import ChatList from "../Components/ChatComponent/ChatList";
import { ChatMessages } from "../Components/ChatComponent/components/ChatMessages";
import Can from "@components/CanComponent/Can";

export const Chat = () => {
  const {
    getTicketByIdWithFilters,
    groupTitleForApi,
    accessibleGroupTitles,
    customGroupTitle,
    setCustomGroupTitle,
  } = useApp();
  
  // URL — единственный источник правды для фильтров
  const { isFiltered } = useChatFilters();
  
  const { messages } = useMessagesContext();
  const { ticketId: ticketIdParam } = useParams();
  const ticketId = useMemo(() => {
    const parsed = Number(ticketIdParam);
    return Number.isNaN(parsed) ? undefined : parsed;
  }, [ticketIdParam]);

  const { technicians } = useGetTechniciansList();
  const [isChatListVisible, setIsChatListVisible] = useState(true);

  // Локальный state для хранения данных тикета напрямую
  // Нужен когда тикет открыт по прямой ссылке с фильтрами,
  // но сам тикет не соответствует этим фильтрам
  const [directTicketData, setDirectTicketData] = useState(null);

  // Тикет из списков (если он там есть)
  const ticketFromLists = useMemo(() => {
    return getTicketByIdWithFilters(ticketId, isFiltered);
  }, [ticketId, isFiltered, getTicketByIdWithFilters]);

  // Итоговый тикет: приоритет отдаём данным из списков,
  // но если там нет — используем напрямую загруженные данные
  const currentTicket = ticketFromLists || directTicketData;

  // Загрузка данных тикета напрямую по ID
  const loadTicketDirectly = useCallback(async (id) => {
    try {
      const ticketData = await api.tickets.ticket.getLightById(id);
      if (ticketData) {
        setDirectTicketData(ticketData);

        // Если группа тикета отличается от текущей — переключаем воронку
        if (ticketData.group_title && accessibleGroupTitles.includes(ticketData.group_title)) {
          if (ticketData.group_title !== groupTitleForApi && ticketData.group_title !== customGroupTitle) {
            setCustomGroupTitle(ticketData.group_title);
            localStorage.setItem("leads_last_group_title", ticketData.group_title);
          }
        }
      }
    } catch (error) {
      console.error("Failed to load ticket:", error);
    }
  }, [accessibleGroupTitles, groupTitleForApi, customGroupTitle, setCustomGroupTitle]);

  // Загружаем тикет напрямую при открытии страницы или смене ticketId
  useEffect(() => {
    if (!ticketId) {
      setDirectTicketData(null);
      return;
    }

    // Загружаем тикет напрямую, чтобы данные были доступны
    // даже если тикет не соответствует текущим фильтрам
    loadTicketDirectly(ticketId);
  }, [ticketId, loadTicketDirectly]);

  // Слушаем событие ticketUpdated для обновления данных
  useEffect(() => {
    const handleTicketUpdated = (event) => {
      const { ticketId: updatedId, ticket } = event.detail || {};

      // Обновляем локальный state если это наш тикет
      if (updatedId === ticketId) {
        if (ticket) {
          // Если в событии есть данные тикета — используем их
          setDirectTicketData(ticket);
        } else {
          // Иначе перезапрашиваем с сервера
          loadTicketDirectly(ticketId);
        }
      }
    };

    window.addEventListener("ticketUpdated", handleTicketUpdated);
    return () => window.removeEventListener("ticketUpdated", handleTicketUpdated);
  }, [ticketId, loadTicketDirectly]);

  // Получаем последнее сообщение по времени для автоматического выбора платформы и контакта
  const lastMessage = useMemo(() => {
    if (!messages || messages.length === 0 || !ticketId) {
      return null;
    }

    // Фильтруем сообщения только для текущего тикета и исключаем sipuni/mail
    const currentTicketMessages = messages.filter(msg => {
      const platform = msg.platform?.toLowerCase();
      return msg.ticket_id === ticketId && platform !== 'sipuni' && platform !== 'mail';
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

  // Получаем ВСЕ данные из хука, чтобы передать их вниз через props
  // и избежать повторного вызова хука в дочерних компонентах
  const {
    platformOptions,
    selectedPlatform,
    changePlatform,
    contactOptions,
    changeContact,
    selectedClient,
    selectedPageId,
    changePageId,
    loading: clientContactsLoading,
    updateClientData,
    ticketData, // Сырые данные от API для PersonalData4ClientForm
  } = useClientContacts(ticketId, lastMessage, currentTicket?.group_title);

  const responsibleId = currentTicket?.technician_id?.toString() ?? null;

  return (
    <Flex h="100%" className="chat-wrapper">
      <Flex w="100%" h="100%" className="chat-container">
        {isChatListVisible && <ChatList ticketId={ticketId} />}

        <Flex pos="relative" style={{ flex: "1 1 0" }}>
          <Box pos="absolute" left="10px" top="16px" style={{ zIndex: 1 }}>
            <ActionIcon
              variant="default"
              onClick={() => setIsChatListVisible((prev) => !prev)}
            >
              {isChatListVisible ? (
                <FaArrowLeft size="12" />
              ) : (
                <FaArrowRight size="12" />
              )}
            </ActionIcon>
          </Box>
          <Can permission={{ module: "chat", action: "view" }}>
            <ChatMessages
              ticketId={ticketId}
              personalInfo={currentTicket}
              technicians={technicians}
              unseenCount={currentTicket?.unseen_count || 0}
              // Передаем данные из useClientContacts чтобы избежать повторного вызова хука
              platformOptions={platformOptions}
              selectedPlatform={selectedPlatform}
              changePlatform={changePlatform}
              contactOptions={contactOptions}
              changeContact={changeContact}
              selectedClient={selectedClient}
              selectedPageId={selectedPageId}
              changePageId={changePageId}
              clientContactsLoading={clientContactsLoading}
            />
          </Can>
        </Flex>

        {!isNaN(ticketId) && (

          <ChatExtraInfo
            selectedClient={selectedClient}
            ticketId={ticketId}
            updatedTicket={currentTicket}
            onUpdateClientData={updateClientData}
            clientsData={ticketData} // Передаем данные из useClientContacts
          />
        )}
      </Flex>
    </Flex>
  );
};
