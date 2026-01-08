import { useSearchParams, useNavigate } from "react-router-dom";
import { BsThreeDots } from "react-icons/bs";
import { FaHeadphones } from "react-icons/fa6";
import {
  MdModeEdit,
  MdDelete,
} from "react-icons/md";
import {
  Image,
  Box,
  Card,
  Flex,
  Text,
  Divider,
  Menu,
  ActionIcon,
} from "@mantine/core";
import { parseServerDate, getLanguageByKey } from "../../utils";
import { DEFAULT_PHOTO, YYYY_MM_DD } from "../../../app-constants";
import { parseTags } from "../../../stringUtils";
import { Tag } from "../../Tag";
import Can from "../../CanComponent/Can";
import { useUser } from "../../../hooks";
import { useMemo, memo, useCallback } from "react";

const MAX_TAGS_COUNT = 2;

const renderTags = (tags) => {
  const tagList = parseTags(tags).slice(0, MAX_TAGS_COUNT);
  const isTags = tagList.some(Boolean);
  return isTags ? tagList.map((tag, index) => <Tag key={index} size="xs">{tag}</Tag>) : null;
};

export const priorityTagColors = {
  joasă: "var(--crm-ui-kit-palette-link-primary)",
  medie: "blue",
  înaltă: "yellow",
  critică: "red",
};

export const TicketCard = memo(({
  ticket,
  onEditTicket,
  technicianList,
  onDeleteTicket,
  technician,
}) => {
  const { user } = useUser();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const responsibleId = String(ticket.technician_id || "");
  const isMyTicket = user?.id && String(user.id) === responsibleId;

  // URL с сохранением фильтров
  const ticketUrl = useMemo(() => {
    const queryString = searchParams.toString();
    return queryString ? `/leads/${ticket.id}?${queryString}` : `/leads/${ticket.id}`;
  }, [ticket.id, searchParams]);

  // Progressive Enhancement: обычный клик = SPA, Cmd+Click = новая вкладка
  const handleCardClick = useCallback((e) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey) {
      return; // Браузер откроет в новой вкладке
    }
    e.preventDefault();
    navigate(ticketUrl);
  }, [navigate, ticketUrl]);

  // Фото берётся напрямую из тикета
  const photoUrl = useMemo(() => {
    return ticket?.photo_url || DEFAULT_PHOTO;
  }, [ticket?.photo_url]);

  // Мемоизируем превью последнего сообщения
  const lastMessagePreview = useMemo(() => {
    if (!ticket.last_message) return "";
    const messageType = ticket.last_message_type;

    if (messageType === "email") {
      return `📧 ${getLanguageByKey("Email")}`;
    }

    if (messageType === "call") {
      return `📞 ${getLanguageByKey("call")}`;
    }

    if (messageType === "audio") {
      return `🎵 ${getLanguageByKey("Audio")}`;
    }

    if (messageType === "image") {
      return `🖼️ ${getLanguageByKey("Image")}`;
    }

    if (messageType === "video") {
      return `🎥 ${getLanguageByKey("Video")}`;
    }

    if (messageType === "file") {
      return `📄 ${getLanguageByKey("File")}`;
    }

    if (messageType === "ig_reel") {
      return `📱 ${getLanguageByKey("Instagram Reel")}`;
    }

    if (messageType === "share") {
      return `🔗 ${getLanguageByKey("Shared Content")}`;
    }

    // Для текстовых сообщений и URL показываем содержимое
    return ticket.last_message;
  }, [ticket.last_message, ticket.last_message_type]);

  // Мемоизируем теги
  const renderedTags = useMemo(() => {
    return renderTags(ticket.tags);
  }, [ticket.tags]);

  const clientLabel = getLanguageByKey("Client") || "Client";

  // Определяем, является ли последнее сообщение от клиента
  // Сравниваем last_message_sender_id с last_message_client_id
  const isClientLastMessage = useMemo(() => {
    if (!ticket.last_message) return false;

    const senderId = ticket.last_message_sender_id;
    const clientId = ticket.last_message_client_id;

    // Если sender_id совпадает с client_id — сообщение от клиента
    if (senderId && clientId && Number(senderId) === Number(clientId)) {
      return true;
    }

    return false;
  }, [ticket.last_message, ticket.last_message_sender_id, ticket.last_message_client_id]);

  return (
    <a href={ticketUrl} onClick={handleCardClick} style={{ textDecoration: 'none' }}>
      <Card
        withBorder
        radius="sm"
        pos="relative"
        p="12px"
        className={isMyTicket ? "ticket-card-my-ticket" : ""}
        style={{
          color: "var(--crm-ui-kit-palette-text-primary)",
          transition: "background-color 0.2s ease, border-color 0.2s ease"
        }}
      >
        <Box
          w="8"
          h="100%"
          pos="absolute"
          top="0"
          left="0"
          bg={priorityTagColors[ticket.priority] || "gray"}
        />

        <Can permission={{ module: "leads", action: "edit" }} context={{ responsibleId }}>
          {(canEdit) => (
            <Can permission={{ module: "leads", action: "delete" }} context={{ responsibleId }}>
              {(canDelete) => {
                if (!canEdit && !canDelete) return null;

                return (
                  <div
                    style={{
                      position: "absolute",
                      right: "6px",
                      top: "6px",
                      zIndex: 10,
                      pointerEvents: "auto"
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                  >
                    <Menu>
                      <Menu.Target>
                        <ActionIcon
                          variant="default"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                        >
                          <BsThreeDots />
                        </ActionIcon>
                      </Menu.Target>

                      <Menu.Dropdown>
                        {canEdit && (
                          <Menu.Item
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              onEditTicket(ticket);
                            }}
                            leftSection={<MdModeEdit />}
                          >
                            {getLanguageByKey("edit")}
                          </Menu.Item>
                        )}

                        {canEdit && canDelete && <Divider />}

                        {canDelete && (
                          <Menu.Item
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              onDeleteTicket(ticket.id);
                            }}
                            color="red"
                            leftSection={<MdDelete />}
                          >
                            {getLanguageByKey("delete")}
                          </Menu.Item>
                        )}
                      </Menu.Dropdown>
                    </Menu>
                  </div>
                );
              }}
            </Can>
          )}
        </Can>

        <Box p={2} pos="relative">
          {/* Фото и основная информация */}
          <Flex align="flex-start" gap="6">
            <Box w="32" h="32" style={{ flexShrink: 0, borderRadius: '50%', overflow: 'hidden' }}>
              <Image
                src={photoUrl}
                fallbackSrc={DEFAULT_PHOTO}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </Box>

            <Box style={{ flex: 1, minWidth: 0 }}>
              {/* Contact (имя тикета) и номер */}
              <Flex align="center" gap="4">
                {ticket.contact && (
                  <Text
                    fw="600"
                    c="var(--crm-ui-kit-palette-text-primary)"
                    size="xs"
                    style={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      fontSize: '12px'
                    }}
                  >
                    {ticket.contact}
                  </Text>
                )}
                <Text
                  size="xs"
                  c="var(--crm-ui-kit-palette-text-secondary-light)"
                  style={{
                    fontSize: '10px',
                    flexShrink: 0
                  }}
                >
                  #{ticket.id}
                </Text>
              </Flex>

              {/* Дата создания под именем тикета */}
              <Text
                size="xs"
                c="var(--crm-ui-kit-palette-text-secondary-dark)"
                style={{ fontSize: '11px', marginTop: '1px' }}
              >
                {parseServerDate(ticket.creation_date)?.format(YYYY_MM_DD)}
              </Text>

              {/* Информация о контракте */}
              {(ticket.contract_date || ticket.contract_number) && (
                <Flex align="center" gap="6" style={{ marginTop: '2px' }}>
                  {ticket.contract_number && (
                    <Text
                      size="xs"
                      c="var(--crm-ui-kit-palette-text-primary)"
                      fw={500}
                      style={{ fontSize: '10px' }}
                    >
                      {getLanguageByKey("Contract") || "Contract"}: {ticket.contract_number}
                    </Text>
                  )}
                  {ticket.contract_date && (
                    <Text
                      size="xs"
                      c="var(--crm-ui-kit-palette-text-secondary-dark)"
                      style={{ fontSize: '10px' }}
                    >
                      {parseServerDate(ticket.contract_date)?.format(YYYY_MM_DD)}
                    </Text>
                  )}
                </Flex>
              )}
            </Box>
          </Flex>

          {/* Last messages */}
          {ticket.last_message && (
            <Text
              pt="2px"
              size="xs"
              c={
                isClientLastMessage
                  ? "var(--crm-ui-kit-palette-message-client-text-color)"
                  : "var(--crm-ui-kit-palette-message-manager-text-color)"
              }
              style={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                lineHeight: '1.3',
                fontSize: '11px',
                fontWeight: isClientLastMessage ? '700' : '300',
                letterSpacing: "0.3px",
                textAlign: isClientLastMessage ? 'left' : 'right',
              }}
            >
              {isClientLastMessage && (
                <span
                  style={{
                    color: '#2e7d32',
                    fontWeight: 700,
                    marginRight: '3px'
                  }}
                >
                  {clientLabel}:
                </span>
              )}
              {lastMessagePreview}
            </Text>
          )}

          {/* Tags */}
          {ticket.tags && (
            <Flex gap="3" wrap="wrap" style={{ marginTop: '2px' }}>
              {renderedTags}
            </Flex>
          )}

          {/* Ответственный и Task в одной строке */}
          <Flex justify="space-between" align="center">
            {/* Ответственный (Responsabil lead) */}
            {technician?.label ? (
              <Flex align="center" gap="3">
                <FaHeadphones size={10} color="var(--crm-ui-kit-palette-text-secondary-light)" />
                <Text
                  size="xs"
                  c="var(--crm-ui-kit-palette-text-primary)"
                  fw={600}
                  style={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    fontSize: '10px'
                  }}
                >
                  {technician.label}
                </Text>
              </Flex>
            ) : (
              <Box />
            )}

            {/* Task count */}
            {(() => {
              const taskCount = ticket.task_count || 0;
              const tasksStatus = ticket.tasks_status || 'none';

              const getTaskColor = () => {
                switch (tasksStatus) {
                  case 'none':
                    return '#FF9800';
                  case 'overdue':
                    return '#F44336';
                  case 'today':
                    return '#388E3C';
                  case 'upcoming':
                    return '#0288D1';
                  default:
                    return 'var(--crm-ui-kit-palette-text-secondary-light)';
                }
              };

              const taskColor = getTaskColor();
              const hasTasks = taskCount > 0;

              return (
                <text
                  style={{
                    fontSize: '11px',
                    fontWeight: '600',
                    color: taskColor,
                    backgroundColor: 'transparent',
                    padding: hasTasks ? '1px 4px' : '0',
                    borderRadius: hasTasks ? '3px' : '0'
                  }}
                >
                  {hasTasks ? `${taskCount} tasks` : 'No tasks'}
                </text>
              );
            })()}
          </Flex>
        </Box>
      </Card>
    </a>
  );
});
