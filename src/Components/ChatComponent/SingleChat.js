import { FaArrowLeft } from "react-icons/fa";
import React, { useEffect, useState } from "react";
import { Flex, ActionIcon, Box } from "@mantine/core";
import ChatExtraInfo from "./ChatExtraInfo";
import { ChatMessages } from "./components";
import { useApp, useClientContacts, useMessagesContext } from "@hooks";
import Can from "@components/CanComponent/Can";

const SingleChat = ({ technicians, ticketId, onClose, tasks = [] }) => {
  const { getTicketById, fetchSingleTicket, tickets } = useApp();
  const { getUserMessages, messages } = useMessagesContext();
  const [isLoadingTicket, setIsLoadingTicket] = useState(false);

  // ВАЖНО: Всегда получаем тикет из AppContext
  // Ищем в массиве tickets, чтобы компонент автоматически перерисовывался при обновлении
  // Тикет обновляется через TICKET_UPDATE и fetchSingleTicket
  const currentTicket = React.useMemo(() => {
    if (!ticketId || !tickets?.length) return null;
    const ticketIdNum = Number(ticketId);
    return tickets.find(t => t.id === ticketIdNum) || getTicketById(ticketIdNum);
  }, [ticketId, tickets, getTicketById]); // Подписываемся на tickets для автоматической перерисовки

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
  } = useClientContacts(Number(ticketId), lastMessage, currentTicket?.group_title);

  const responsibleId = currentTicket?.technician_id?.toString() ?? null;

  useEffect(() => {
    if (ticketId) {
      getUserMessages(Number(ticketId));
    }
  }, [ticketId, getUserMessages]);

  // ВАЖНО: При открытии по прямой ссылке ВСЕГДА запрашиваем актуальный тикет
  // Это гарантирует, что action_needed и другие поля будут актуальными
  // После этого тикет будет автоматически обновляться через TICKET_UPDATE от сервера
  useEffect(() => {
    if (!ticketId) return;

    const ticketIdNum = Number(ticketId);
    if (!ticketIdNum) return;

    setIsLoadingTicket(true);

    // ВСЕГДА запрашиваем актуальный тикет при открытии компонента
    // fetchSingleTicket из AppContext правильно обновит тикет во всех местах
    fetchSingleTicket(ticketIdNum)
      .finally(() => {
        setIsLoadingTicket(false);
      });
  }, [ticketId, fetchSingleTicket]);

  // Получаем unseen_count из актуального тикета
  const unseenCount = currentTicket?.unseen_count || 0;

  return (
    <div className="chat-container">
      <Box pos="absolute" left="10px" top="16px">
        <ActionIcon onClick={onClose} variant="default">
          <FaArrowLeft size="12" />
        </ActionIcon>
      </Box>

      <Flex w="70%">
        <Can permission={{ module: "chat", action: "view" }} context={{ responsibleId }}>
          <ChatMessages
            selectedClient={selectedClient}
            ticketId={ticketId ? Number(ticketId) : undefined}
            personalInfo={currentTicket}
            platformOptions={platformOptions}
            selectedPlatform={selectedPlatform}
            changePlatform={changePlatform}
            contactOptions={contactOptions}
            changeContact={changeContact}
            selectedPageId={selectedPageId}
            changePageId={changePageId}
            loading={loading || isLoadingTicket}
            technicians={technicians}
            unseenCount={unseenCount}
          />
        </Can>
      </Flex>

      <ChatExtraInfo
        selectedClient={selectedClient}
        ticketId={ticketId}
        updatedTicket={currentTicket}
        onUpdateClientData={updateClientData}
      />

    </div>
  );
};

export default SingleChat;
