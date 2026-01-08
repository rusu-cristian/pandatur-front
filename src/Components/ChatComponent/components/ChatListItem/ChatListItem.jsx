import { Box, Flex, Image, Text, Badge, Menu, ActionIcon, Divider } from "@mantine/core";
import { useMemo, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { HiSpeakerWave } from "react-icons/hi2";
import { FaFingerprint } from "react-icons/fa6";
import { IoIosVideocam } from "react-icons/io";
import { IoCall } from "react-icons/io5";
import { FiLink2 } from "react-icons/fi";
import { TbPhoto } from "react-icons/tb";
import { GrAttachment } from "react-icons/gr";
import { FaEnvelope } from "react-icons/fa";
import { BsThreeDots } from "react-icons/bs";
import { IoCheckmarkDone } from "react-icons/io5";
import { MdPendingActions } from "react-icons/md";
import { DEFAULT_PHOTO, HH_mm, MEDIA_TYPE, TYPE_SOCKET_EVENTS } from "@app-constants";
import { parseServerDate, getLanguageByKey } from "@utils";
import { useSocket, useUser } from "@hooks";
import { useTickets } from "../../../../contexts/TicketsContext";
import { api } from "../../../../api";
import "./ChatListItem.css";

/**
 * Компонент ссылки с Progressive Enhancement
 * - Обычный клик → SPA навигация с сохранением query params
 * - Cmd/Ctrl+Click → открывает в новой вкладке с полным URL
 */
const ChatLink = ({ to, children, className, style }) => {
  const navigate = useNavigate();
  
  const handleClick = useCallback((e) => {
    // Разрешаем открытие в новой вкладке (Cmd/Ctrl + Click)
    if (e.metaKey || e.ctrlKey || e.shiftKey) {
      return; // Браузер откроет ссылку в новой вкладке
    }
    
    e.preventDefault();
    navigate(to);
  }, [navigate, to]);

  return (
    <a href={to} onClick={handleClick} className={className} style={style}>
      {children}
    </a>
  );
};

const MESSAGE_INDICATOR = {
  [MEDIA_TYPE.IMAGE]: (
    <Flex c="dimmed" align="center" gap="4">
      <TbPhoto size={12} />
      <Text h="16px" size="xs">
        {getLanguageByKey("photo")}
      </Text>
    </Flex>
  ),
  [MEDIA_TYPE.VIDEO]: (
    <Flex c="dimmed" align="center" gap="4">
      <IoIosVideocam size={12} />
      <Text h="16px" size="xs">
        {getLanguageByKey("video")}
      </Text>
    </Flex>
  ),
  [MEDIA_TYPE.AUDIO]: (
    <Flex c="dimmed" align="center" gap="4">
      <HiSpeakerWave size={12} />
      <Text h="16px" size="xs">
        {getLanguageByKey("audio")}
      </Text>
    </Flex>
  ),
  [MEDIA_TYPE.FILE]: (
    <Flex c="dimmed" align="center" gap="4">
      <GrAttachment size={12} />
      <Text h="16px" size="xs">
        {getLanguageByKey("file")}
      </Text>
    </Flex>
  ),
  [MEDIA_TYPE.URL]: (
    <Flex c="dimmed" align="center" gap="4">
      <FiLink2 size={12} />
      <Text h="16px" size="xs">
        {getLanguageByKey("link")}
      </Text>
    </Flex>
  ),
  [MEDIA_TYPE.CALL]: (
    <Flex c="dimmed" align="center" gap="4">
      <IoCall size={12} />
      <Text h="16px" size="xs" c="white" fw={900}>
        {getLanguageByKey("call")}
      </Text>
    </Flex>
  ),
  [MEDIA_TYPE.EMAIL]: (
    <Flex c="dimmed" align="center" gap="4">
      <FaEnvelope size={12} />
      <Text h="16px" size="xs" c="white" fw={900}>
        {getLanguageByKey("email")}
      </Text>
    </Flex>
  ),
};

export const ChatListItem = ({ chat, style, selectTicketId }) => {
  const formatDate = parseServerDate(chat.time_sent);
  const [searchParams] = useSearchParams();
  
  const { userId } = useUser();
  const { socketRef } = useSocket();
  const { markMessagesAsRead, getTicketById } = useTickets();
  
  // Строим URL с сохранением query params (фильтров)
  const chatUrl = useMemo(() => {
    const queryString = searchParams.toString();
    return queryString ? `/chat/${chat.id}?${queryString}` : `/chat/${chat.id}`;
  }, [chat.id, searchParams]);

  // Получаем actionNeeded всегда из AppContext
  const currentTicket = getTicketById(chat.id);
  const actionNeeded = currentTicket ? Boolean(currentTicket.action_needed) : false;

  // actionNeeded всегда берется из AppContext через getTicketById

  // Фото берётся напрямую из тикета (проверяем на пустую строку)
  const userPhoto = chat?.photo_url && chat.photo_url.trim() !== "" ? chat.photo_url : null;

  // Определяем, является ли последнее сообщение от клиента
  // Сравниваем last_message_sender_id с last_message_client_id
  const isClientLastMessage = useMemo(() => {
    if (!chat.last_message) return false;

    const senderId = chat.last_message_sender_id;
    const clientId = chat.last_message_client_id;

    // Если sender_id совпадает с client_id — сообщение от клиента
    if (senderId && clientId && Number(senderId) === Number(clientId)) {
      return true;
    }

    return false;
  }, [chat.last_message, chat.last_message_sender_id, chat.last_message_client_id]);

  const lastMessageAuthorClass = isClientLastMessage ? "client-message" : "manager-message";

  // Обработчик для пометки чата как прочитанного
  // ВАЖНО: НЕ меняет action_needed - только читает сообщения
  const handleMarkAsRead = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!chat.id) return;

    try {
      // Отправляем CONNECT через сокет
      if (socketRef?.current?.readyState === WebSocket.OPEN) {
        const connectPayload = {
          type: TYPE_SOCKET_EVENTS.CONNECT,
          data: { ticket_id: [chat.id] },
        };
        socketRef.current.send(JSON.stringify(connectPayload));
      }

      // Отправляем seen через API (вместо WebSocket)
      await api.messages.send.markSeen({ 
        ticket_id: chat.id, 
        user_id: userId 
      });
      
      // Локально обновляем UI
      markMessagesAsRead(chat.id, chat.unseen_count || 0);
      
      // НЕ меняем action_needed - только читаем чат
    } catch (error) {
      // Failed to mark chat as read
    }
  };

  // Обработчик для переключения флага "Не нужна акция"
  const handleToggleActionNeeded = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!chat.id) return;

    try {
      const newValue = !actionNeeded;
      await api.tickets.updateById({
        id: chat.id,
        action_needed: newValue ? "true" : "false",
      });
      // НЕ меняем локальное состояние - ждем TICKET_UPDATE от сервера
      
      // Отправляем CONNECT через сокет
      if (socketRef?.current?.readyState === WebSocket.OPEN) {
        const connectPayload = {
          type: TYPE_SOCKET_EVENTS.CONNECT,
          data: { ticket_id: [chat.id] },
        };
        socketRef.current.send(JSON.stringify(connectPayload));
      }
      
      // Отправляем seen через API (вместо WebSocket)
      await api.messages.send.markSeen({ 
        ticket_id: chat.id, 
        user_id: userId 
      });
      
      // Локально обновляем UI
      markMessagesAsRead(chat.id, chat.unseen_count);
    } catch (error) {
      // Failed to update action_needed
    }
  };

  return (
    <div
      style={{
        ...style,
      }}
    >
      <ChatLink to={chatUrl} style={{ textDecoration: 'none', color: 'inherit' }}>
        <Box
          py="9px"
          pr="8px"
          pl="8px"
          key={chat.id}
          className={`chat-item ${lastMessageAuthorClass} ${
            chat.id === selectTicketId ? "active" : ""
          } pointer`}
          data-ticket-id={chat.id}
          pos="relative"
          style={{ borderBottom: "1px solid var(--crm-ui-kit-palette-border-default)" }}
        >
          {/* Индикатор непрочитанных сообщений */}
          {chat.unseen_count > 0 && (
            <Box pos="absolute" right="4px" className="right">
              <Badge size="xs" bg="red" circle className="right-count">
                {chat.unseen_count}
              </Badge>
            </Box>
          )}

          <Flex gap="8" align="center" w="100%">
            <Image
              w={32}
              h={32}
              radius="50%"
              src={userPhoto}
              fallbackSrc={DEFAULT_PHOTO}
            />

            <Box w="75%">
              <Flex align="center" gap="4">
                <Text size="xs" truncate>{chat.contact || "-"}</Text>

                {/* Меню с тремя точками рядом с именем */}
                <Menu position="bottom-start" withinPortal>
                  <Menu.Target>
                    <ActionIcon
                      variant="subtle"
                      color="gray"
                      size="xs"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                    >
                      <BsThreeDots size={12} />
                    </ActionIcon>
                  </Menu.Target>

                  <Menu.Dropdown>
                    <Menu.Item
                      leftSection={<IoCheckmarkDone size={14} />}
                      onClick={handleMarkAsRead}
                    >
                      {getLanguageByKey("closedChat")}
                    </Menu.Item>
                    <Menu.Item
                      leftSection={<MdPendingActions size={14} />}
                      onClick={handleToggleActionNeeded}
                      color={actionNeeded ? "orange" : "gray"}
                    >
                      {getLanguageByKey("NeedAnswer")}
                    </Menu.Item>
                  </Menu.Dropdown>
                </Menu>
              </Flex>

              <Flex gap="8">
                <Flex align="center" gap="2">
                  <FaFingerprint size={10} />
                  <Text size="xs">{chat.id || "-"}</Text>
                </Flex>
              </Flex>
            </Box>
          </Flex>

          <Flex justify="space-between" gap="4" align="center">
            <Box mt="2px" w="60%">
              {MESSAGE_INDICATOR[chat.last_message_type] || (
                <Text
                  h="16px"
                  size="xs"
                  truncate
                  fw={isClientLastMessage ? 900 : 400}
                  c={
                    isClientLastMessage
                      ? "var(--crm-ui-kit-palette-chat-list-client-text-color)"
                      : "var(--crm-ui-kit-palette-chat-list-manager-text-color)"
                  }
                >
                  {chat.last_message}
                </Text>
              )}
            </Box>
            <Text size="xs" c="dimmed">
              {formatDate ? formatDate.format("DD.MM.YYYY")
                : null}
            </Text>
            <Text size="xs" c="dimmed">
              {formatDate ? formatDate.format(HH_mm)
                : null}
            </Text>
          </Flex>
        </Box>
      </ChatLink>
    </div>
  );
};
