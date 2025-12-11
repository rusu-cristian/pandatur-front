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
import "./ChatMessages.css";

const getSendedMessage = (msj, currentMsj, statusMessage, errorMessage = null) => {
  // Проверяем точное совпадение по ключевым полям
  const isExactMatch = msj.sender_id === currentMsj.sender_id &&
    msj.message === currentMsj.message &&
    msj.time_sent === currentMsj.time_sent &&
    msj.ticket_id === currentMsj.ticket_id;

  if (isExactMatch) {
    return { 
      ...msj, 
      messageStatus: statusMessage,
      // Добавляем error_message только если есть ошибка
      ...(errorMessage && { error_message: errorMessage })
    };
  }

  // Fallback: ищем PENDING сообщение от того же пользователя в том же тикете
  const isPendingMatch = msj.sender_id === currentMsj.sender_id &&
    msj.ticket_id === currentMsj.ticket_id &&
    msj.messageStatus === MESSAGES_STATUS.PENDING;

  if (isPendingMatch) {
    return { 
      ...msj, 
      messageStatus: statusMessage,
      ...(errorMessage && { error_message: errorMessage })
    };
  }

  return msj;
};

export const ChatMessages = ({
  ticketId,
  personalInfo,
  technicians,
  unseenCount = 0,
  // Props из useClientContacts (передаются из Chat.js чтобы избежать повторного вызова хука)
  platformOptions,
  selectedPlatform,
  changePlatform,
  contactOptions,
  changeContact,
  selectedClient,
  selectedPageId,
  changePageId,
  clientContactsLoading,
}) => {
  const { userId } = useUser();

  const {
    setMessages,
    getUserMessages,
    loadMoreMessages,
    loading: messagesLoading,
    messages,
    notes: apiNotesFromCtx = [],
    hasMoreMessages,
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
        from_reference: metadataMsj.from_reference ?? metadataMsj.page_id ?? null,
        to_reference: metadataMsj.to_reference ?? metadataMsj.contact_value ?? null,
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
          // Если статус не success - извлекаем сообщение об ошибке из ответа сервера
          const errorMessage = response?.message || response?.error || getLanguageByKey("message_send_failed");
          setMessages((prev) =>
            prev.map((msj) => getSendedMessage(msj, normalizedMessage, MESSAGES_STATUS.ERROR, errorMessage))
          );
        }
      } catch (error) {
        // При ошибке API - извлекаем сообщение из объекта ошибки
        const errorMessage = error?.response?.data?.message || error?.message || getLanguageByKey("message_send_failed");
        setMessages((prev) =>
          prev.map((msj) => getSendedMessage(msj, normalizedMessage, MESSAGES_STATUS.ERROR, errorMessage))
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
            hasMoreMessages={hasMoreMessages}
            onLoadMore={() => loadMoreMessages(Number(ticketId))}
            loadingMore={messagesLoading}
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
              ticketId={ticketId}
              unseenCount={unseenCount}
              personalInfo={personalInfo}
              onCreateTask={() => setCreatingTask(true)}
              onToggleNoteComposer={handleToggleNoteComposer}
              onSendMessage={(value) => {
                // Все проверки теперь выполняются в ChatInput.buildBasePayload()
                // Здесь просто передаем данные в sendMessage
                sendMessage({
                  ...value,
                  time_sent: dayjs().format(YYYY_MM_DD_HH_mm_ss),
                  messageStatus: MESSAGES_STATUS.PENDING,
                });
              }}
              // Передаем данные из useClientContacts (вызван в Chat.js)
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
          </div>
        </>
      )}
    </Flex>
  );
};
