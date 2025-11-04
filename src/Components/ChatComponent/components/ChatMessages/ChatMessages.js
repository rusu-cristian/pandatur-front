import { useState, useEffect, useRef, useCallback } from "react";
import { Flex, Text, Paper } from "@mantine/core";
import dayjs from "dayjs";
import { useUser, useMessagesContext } from "@hooks";
import { api } from "@api";
import { getLanguageByKey, MESSAGES_STATUS } from "@utils";
import { Spin } from "@components";
import { YYYY_MM_DD_HH_mm_ss } from "@app-constants";
import { ChatInput } from "../ChatInput";
import TaskListOverlay from "../../../Task/TaskListOverlay";
import { GroupedMessages } from "../GroupedMessages";
import { InlineNoteComposer } from "../../../InlineNoteComposer";
import { TicketParticipants } from "../../../TicketParticipants";
import { getPageIdByPlatformAndGroup } from "../../../../constants/webhookPagesConfig";
import "./ChatMessages.css";

const getSendedMessage = (msj, currentMsj, statusMessage) => {
  // Проверяем точное совпадение по ключевым полям
  const isExactMatch = msj.sender_id === currentMsj.sender_id &&
    msj.message === currentMsj.message &&
    msj.time_sent === currentMsj.time_sent &&
    msj.ticket_id === currentMsj.ticket_id;

  if (isExactMatch) {
    return { ...msj, messageStatus: statusMessage };
  }

  // Fallback: ищем PENDING сообщение от того же пользователя в том же тикете
  const isPendingMatch = msj.sender_id === currentMsj.sender_id &&
    msj.ticket_id === currentMsj.ticket_id &&
    msj.messageStatus === MESSAGES_STATUS.PENDING;

  if (isPendingMatch) {
    return { ...msj, messageStatus: statusMessage };
  }

  return msj;
};

export const ChatMessages = ({
  ticketId,
  selectedClient,
  personalInfo,
  platformOptions,
  selectedPlatform,
  changePlatform,
  contactOptions,
  changeContact,
  selectedPageId,
  changePageId,
  loading,
  technicians,
  unseenCount = 0,
}) => {
  const { userId } = useUser();

  const {
    setMessages,
    getUserMessages,
    loading: messagesLoading,
    messages,
    notes: apiNotesFromCtx = [],
  } = useMessagesContext();

  const messageContainerRef = useRef(null);
  const contentRef = useRef(null);
  const [isUserAtBottom, setIsUserAtBottom] = useState(true);
  const [creatingTask, setCreatingTask] = useState(false);

  const [noteMode, setNoteMode] = useState(false);
  const [noteSaving, setNoteSaving] = useState(false);

  const sendMessage = useCallback(
    async (metadataMsj) => {
      const normalizedMessage = {
        ...metadataMsj,
        message: metadataMsj.message || metadataMsj.message_text,
        seenAt: false,
      };

      // Сразу добавляем сообщение с PENDING статусом
      setMessages((prev) => [...prev, normalizedMessage]);

      try {
        let apiUrl = api.messages.send.create;
        const normalizedPlatform = metadataMsj.platform?.toUpperCase?.();

        if (normalizedPlatform === "TELEGRAM") apiUrl = api.messages.send.telegram;
        else if (normalizedPlatform === "VIBER") apiUrl = api.messages.send.viber;
        else if (normalizedPlatform === "VIBER-BOT") apiUrl = api.messages.send.viber_bot;
        else if (normalizedPlatform === "WHATSAPP") apiUrl = api.messages.send.whatsapp;

        // Отправляем на сервер
        const response = await apiUrl(metadataMsj);

        // Проверяем статус ответа сервера
        const isSuccess = response?.status === "success" || response?.status === "ok";

        if (isSuccess) {
          // Обновляем статус на SUCCESS
          setMessages((prev) =>
            prev.map((msj) => getSendedMessage(msj, normalizedMessage, MESSAGES_STATUS.SUCCESS))
          );
        } else {
          // Если статус не success, оставляем PENDING или ставим ERROR
          setMessages((prev) =>
            prev.map((msj) => getSendedMessage(msj, normalizedMessage, MESSAGES_STATUS.ERROR))
          );
        }
      } catch (error) {
        // Error sending message
        // При ошибке API обновляем статус на ERROR
        setMessages((prev) =>
          prev.map((msj) => getSendedMessage(msj, normalizedMessage, MESSAGES_STATUS.ERROR))
        );
      }
    },
    [setMessages]
  );

  const handleScroll = useCallback(() => {
    const el = messageContainerRef.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    setIsUserAtBottom(scrollHeight - scrollTop <= clientHeight + 50);
  }, []);

  useEffect(() => {
    if (isUserAtBottom && messageContainerRef.current) {
      messageContainerRef.current.scrollTo({
        top: messageContainerRef.current.scrollHeight,
      });
    }
  }, [messages, ticketId, apiNotesFromCtx, isUserAtBottom]);

  useEffect(() => {
    const container = messageContainerRef.current;
    const contentEl = contentRef.current;
    if (!container || !contentEl) return;

    const ro = new ResizeObserver(() => {
      if (isUserAtBottom) {
        container.scrollTo({ top: container.scrollHeight });
      }
    });

    ro.observe(contentEl);
    return () => ro.disconnect();
  }, [isUserAtBottom]);

  useEffect(() => {
    const el = messageContainerRef.current;
    if (!el) return;
    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  useEffect(() => {
    if (!ticketId) return;
    getUserMessages(Number(ticketId));
    setNoteMode(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketId]);

  const renderMessagesContent = () => {
    if (messages.error) {
      return (
        <Flex h="100%" align="center" justify="center">
          <Text size="lg" c="red">{getLanguageByKey("loadMessagesError")}</Text>
        </Flex>
      );
    }
    if (messagesLoading) {
      return (
        <Flex h="100%" align="center" justify="center">
          <Spin />
        </Flex>
      );
    }

    if (ticketId) {
      return (
        <div ref={contentRef}>
          <GroupedMessages
            personalInfo={personalInfo}
            ticketId={ticketId}
            technicians={technicians}
            apiNotes={apiNotesFromCtx}
          />
        </div>
      );
    }

    return (
      <Flex h="100%" align="center" justify="center">
        <Text size="lg" c="dimmed">{getLanguageByKey("Alege lead")}</Text>
      </Flex>
    );
  };

  const handleToggleNoteComposer = useCallback(() => {
    setNoteMode((v) => !v);
  }, []);

  return (
    <Flex w="100%" h="100%" direction="column" className="chat-area">
      {ticketId && (
        <Paper p="8" style={{ margin: "12px 0px 12px 42px", flexShrink: 0 }}>
          <TicketParticipants ticketId={ticketId} currentUserId={Number(userId)} />
        </Paper>
      )}

      <Flex
        p="16"
        direction="column"
        className="chat-messages"
        ref={messageContainerRef}
        style={{ flex: 1, overflow: 'auto' }}
      >
        {renderMessagesContent()}
      </Flex>

      {ticketId && !messagesLoading && (
        <>
          {noteMode && (
            <div style={{ padding: 16, flexShrink: 0 }}>
              <InlineNoteComposer
                ticketId={ticketId}
                technicianId={Number(userId)}
                loading={noteSaving}
                onCancel={() => setNoteMode(false)}
                onSave={async () => {
                  setNoteSaving(true);
                  try {
                    await getUserMessages(Number(ticketId));
                    setNoteMode(false);
                  } finally {
                    setNoteSaving(false);
                  }
                }}
              />
            </div>
          )}

          <TaskListOverlay
            ticketId={ticketId}
            creatingTask={creatingTask}
            setCreatingTask={setCreatingTask}
          />

          <div style={{ flexShrink: 0 }}>
            <ChatInput
              loading={loading}
              id={ticketId}
              platformOptions={platformOptions}
              selectedPlatform={selectedPlatform}
              changePlatform={changePlatform}
              contactOptions={contactOptions}
              changeContact={changeContact}
              selectedPageId={selectedPageId}
              changePageId={changePageId}
              ticketId={ticketId}
              unseenCount={unseenCount}
              currentClient={selectedClient}
              personalInfo={personalInfo}
              onCreateTask={() => setCreatingTask(true)}
              onToggleNoteComposer={handleToggleNoteComposer}
              onSendMessage={(value) => {
                if (!selectedClient.payload) return;
                
                // Получаем page_id из конфигурации по платформе и group_title тикета
                // Если group_title это массив, берем первое значение
                const groupTitle = Array.isArray(personalInfo?.group_title) 
                  ? personalInfo.group_title[0] 
                  : personalInfo?.group_title;
                
                const pandaPageId = getPageIdByPlatformAndGroup(
                  selectedClient.payload.platform,
                  groupTitle
                );
                
                sendMessage({
                  sender_id: Number(userId),
                  client_id: selectedClient.payload.client_id,
                  platform: selectedClient.payload.platform,
                  page_id: pandaPageId, // page_id Panda из конфигурации
                  contact_value: selectedClient.payload.contact_value, // ID клиента (куда отправляем)
                  ticket_id: ticketId,
                  time_sent: dayjs().format(YYYY_MM_DD_HH_mm_ss),
                  messageStatus: MESSAGES_STATUS.PENDING,
                  ...value,
                });
              }}
            />
          </div>
        </>
      )}
    </Flex>
  );
};
