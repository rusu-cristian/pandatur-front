import { FaArrowLeft } from "react-icons/fa";
import React, { useEffect, useState } from "react";
import { Flex, ActionIcon, Box } from "@mantine/core";
import ChatExtraInfo from "./ChatExtraInfo";
import { ChatMessages } from "./components";
import { useApp, useMessagesContext } from "@hooks";
import Can from "@components/CanComponent/Can";
import { ClientContactsProvider } from "../../context/ClientContactsContext";

const SingleChat = ({ technicians, ticketId, onClose, tasks = [] }) => {
  const { getTicketById, fetchSingleTicket, tickets } = useApp();
  const { getUserMessages, messages } = useMessagesContext();
  const [isLoadingTicket, setIsLoadingTicket] = useState(false);
  const [loadedTicket, setLoadedTicket] = useState(null);

  // ВАЖНО: Всегда получаем тикет из AppContext
  // Ищем в массиве tickets, чтобы компонент автоматически перерисовывался при обновлении
  // Тикет обновляется через TICKET_UPDATE и fetchSingleTicket
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
    if (!ticketId) {
      setLoadedTicket(null);
      return;
    }

    const ticketIdNum = Number(ticketId);
    if (!ticketIdNum) {
      setLoadedTicket(null);
      return;
    }

    setIsLoadingTicket(true);
    setLoadedTicket(null);

    // ВСЕГДА запрашиваем актуальный тикет при открытии компонента
    // Сохраняем результат запроса для заполнения формы
    fetchSingleTicket(ticketIdNum)
      .then((ticket) => {
        // Сохраняем загруженный тикет для использования в форме
        if (ticket) {
          setLoadedTicket(ticket);
        }
      })
      .finally(() => {
        setIsLoadingTicket(false);
      });
  }, [ticketId, fetchSingleTicket]);

  // Получаем unseen_count из актуального тикета
  const unseenCount = currentTicket?.unseen_count || 0;

  return (
    <ClientContactsProvider ticketId={Number(ticketId)} lastMessage={lastMessage} groupTitle={currentTicket?.group_title}>
      <div className="chat-container">
        <Box pos="absolute" left="10px" top="16px">
          <ActionIcon onClick={onClose} variant="default">
            <FaArrowLeft size="12" />
          </ActionIcon>
        </Box>

        <Flex w="70%">
          <Can permission={{ module: "chat", action: "view" }} context={{ responsibleId }}>
            <ChatMessages
              ticketId={ticketId ? Number(ticketId) : undefined}
              personalInfo={currentTicket}
              technicians={technicians}
              unseenCount={unseenCount}
            />
          </Can>
        </Flex>

        <ChatExtraInfo
          ticketId={ticketId}
          updatedTicket={currentTicket}
        />

      </div>
    </ClientContactsProvider>
  );
};

export default SingleChat;
