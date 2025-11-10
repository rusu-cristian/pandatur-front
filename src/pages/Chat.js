import React, { useState, useMemo, useEffect } from "react";
import { useParams } from "react-router-dom";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";
import { Flex, ActionIcon, Box } from "@mantine/core";
import { useApp, useClientContacts, useMessagesContext } from "@hooks";
import { useGetTechniciansList } from "../hooks";
import ChatExtraInfo from "../Components/ChatComponent/ChatExtraInfo";
import ChatList from "../Components/ChatComponent/ChatList";
import { ChatMessages } from "../Components/ChatComponent/components/ChatMessages";
import Can from "@components/CanComponent/Can";

export const Chat = () => {
  const {
    isChatFiltered,
    getTicketByIdWithFilters,
    fetchSingleTicket,
    groupTitleForApi,
    accessibleGroupTitles,
    customGroupTitle,
    setCustomGroupTitle,
  } = useApp();
  const { messages } = useMessagesContext();
  const { ticketId: ticketIdParam } = useParams();
  const ticketId = useMemo(() => {
    const parsed = Number(ticketIdParam);
    return Number.isNaN(parsed) ? undefined : parsed;
  }, [ticketIdParam]);

  const { technicians } = useGetTechniciansList();
  const [isChatListVisible, setIsChatListVisible] = useState(true);

  const currentTicket = useMemo(() => {
    // Используем новую функцию для получения тикета с учетом фильтров
    return getTicketByIdWithFilters(ticketId, isChatFiltered);
  }, [ticketId, isChatFiltered, getTicketByIdWithFilters]);

  // Автоматическое переключение воронки при открытии тикета по прямой ссылке
  useEffect(() => {
    if (!ticketId) return;

    const loadTicketGroup = async () => {
      try {
        const { api } = await import("../api");
        const ticketData = await api.tickets.ticket.getLightById(ticketId);
        if (ticketData?.group_title && accessibleGroupTitles.includes(ticketData.group_title)) {
          // Если группа тикета отличается от текущей, переключаем воронку
          if (ticketData.group_title !== groupTitleForApi && ticketData.group_title !== customGroupTitle) {
            setCustomGroupTitle(ticketData.group_title);
            localStorage.setItem("leads_last_group_title", ticketData.group_title);
          }
        }
      } catch (error) {
        console.error("Failed to load ticket group:", error);
      }
    };

    loadTicketGroup();
  }, [ticketId, accessibleGroupTitles, groupTitleForApi, customGroupTitle, setCustomGroupTitle]);

  // ВАЖНО: При изменении group_title или открытии по прямой ссылке
  // запрашиваем актуальный тикет из новой группы
  useEffect(() => {
    if (!ticketId) return;

    const ticketIdNum = Number(ticketId);
    if (!ticketIdNum) return;

    // Запрашиваем актуальный тикет при изменении группы
    // fetchSingleTicket из AppContext правильно обновит тикет
    fetchSingleTicket(ticketIdNum);
  }, [ticketId, fetchSingleTicket, groupTitleForApi]);

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

  const {
    selectedClient,
    updateClientData,
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
            />
          </Can>
        </Flex>

        {!isNaN(ticketId) && (

          <ChatExtraInfo
            selectedClient={selectedClient}
            ticketId={ticketId}
            updatedTicket={currentTicket}
            onUpdateClientData={updateClientData}
          />
        )}
      </Flex>
    </Flex>
  );
};
