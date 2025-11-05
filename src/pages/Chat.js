import React, { useState, useMemo } from "react";
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
  const { tickets, isChatFiltered, getTicketByIdWithFilters } = useApp();
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


        <Can
          permission={{ module: "chat", action: "edit" }}
          context={{ responsibleId }}
        >
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

            <ChatMessages
              ticketId={ticketId}
              personalInfo={currentTicket}
              technicians={technicians}
              unseenCount={currentTicket?.unseen_count || 0}
            />
          </Flex>
        </Can>

        {!isNaN(ticketId) && (
          <Can
            permission={{ module: "chat", action: "edit" }}
            context={{ responsibleId }}
          >
            <ChatExtraInfo
              selectedClient={selectedClient}
              ticketId={ticketId}
              updatedTicket={currentTicket}
              onUpdateClientData={updateClientData}
            />
          </Can>
        )}
      </Flex>
    </Flex>
  );
};
