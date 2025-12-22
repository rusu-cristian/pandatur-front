import { useState, useMemo, useEffect, useCallback, useContext } from "react";
import { useParams } from "react-router-dom";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";
import { Flex, ActionIcon, Box } from "@mantine/core";
import { useClientContacts, useMessagesContext, useChatFilters } from "@hooks";
import { useGetTechniciansList } from "../hooks";
import { useTickets } from "../contexts/TicketsContext";
import { UserContext } from "../contexts/UserContext";
import { api } from "../api";
import ChatExtraInfo from "../Components/ChatComponent/ChatExtraInfo";
import ChatList from "../Components/ChatComponent/ChatList";
import { ChatMessages } from "../Components/ChatComponent/components/ChatMessages";
import Can from "@components/CanComponent/Can";
import { useTicketSync, SYNC_EVENTS } from "../contexts/TicketSyncContext";

export const Chat = () => {
  const { getTicketByIdWithFilters } = useTickets();
  const {
    groupTitleForApi,
    accessibleGroupTitles,
    customGroupTitle,
    setCustomGroupTitle,
  } = useContext(UserContext);
  
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

  // Итоговый тикет: приоритет отдаём directTicketData (обновляется через WebSocket),
  // данные из списков используем как fallback или для дополнительных полей
  const currentTicket = useMemo(() => {
    if (!ticketFromLists && !directTicketData) return null;
    
    // directTicketData приоритетнее — он обновляется через TICKET_UPDATED
    if (directTicketData) {
      // Объединяем: directTicketData перезаписывает поля из ticketFromLists
      return ticketFromLists 
        ? { ...ticketFromLists, ...directTicketData }
        : directTicketData;
    }
    
    return ticketFromLists;
  }, [ticketFromLists, directTicketData]);

  // Загрузка данных тикета напрямую по ID
  const loadTicketDirectly = useCallback(async (id) => {
    try {
      const ticketData = await api.tickets.ticket.getLightById(id);
      if (ticketData) {
        setDirectTicketData(ticketData);

        // Если группа тикета отличается от текущей — переключаем воронку
        // Используем функциональное обновление чтобы избежать лишних зависимостей
        if (ticketData.group_title && accessibleGroupTitles.includes(ticketData.group_title)) {
          setCustomGroupTitle(prev => {
            if (ticketData.group_title !== prev) {
              localStorage.setItem("leads_last_group_title", ticketData.group_title);
              return ticketData.group_title;
            }
            return prev;
          });
        }
      }
    } catch (error) {
      console.error("Failed to load ticket:", error);
    }
  }, [accessibleGroupTitles, setCustomGroupTitle]);

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

  // Подписываемся на обновления тикетов через TicketSyncContext
  const { subscribe } = useTicketSync();

  useEffect(() => {
    if (!ticketId) return;
    
    const unsubscribe = subscribe(SYNC_EVENTS.TICKET_UPDATED, ({ ticketId: updatedId, ticket }) => {
      // Обновляем локальный state если это наш тикет
      if (updatedId === ticketId) {
        if (ticket) {
          setDirectTicketData(ticket);
        } else {
          loadTicketDirectly(ticketId);
        }
      }
    });

    return unsubscribe;
  }, [subscribe, ticketId, loadTicketDirectly]);

  // Получаем последнее сообщение по времени для автоматического выбора платформы и контакта
  // Используем reduce O(n) вместо sort O(n log n) для производительности
  const lastMessage = useMemo(() => {
    if (!messages?.length || !ticketId) return null;

    return messages.reduce((latest, msg) => {
      const platform = msg.platform?.toLowerCase();
      // Пропускаем сообщения не из текущего тикета и sipuni/mail
      if (msg.ticket_id !== ticketId || platform === 'sipuni' || platform === 'mail') {
        return latest;
      }
      
      if (!latest) return msg;
      
      const msgTime = new Date(msg.time_sent || msg.created_at || 0);
      const latestTime = new Date(latest.time_sent || latest.created_at || 0);
      return msgTime > latestTime ? msg : latest;
    }, null);
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

        {ticketId && (
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
