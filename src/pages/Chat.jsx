import { useState, useMemo, useEffect, useCallback, useContext } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";
import { LuInfo } from "react-icons/lu";
import { Flex, ActionIcon, Box, Drawer } from "@mantine/core";
import { useClientContacts, useMessagesContext, useChatFilters, useMobile } from "@hooks";
import "./Chat.css";
import { useGetTechniciansList } from "../hooks";
import { useTickets } from "../contexts/TicketsContext";
import { UserContext } from "../contexts/UserContext";
import { api } from "../api";
import ChatExtraInfo from "../Components/ChatComponent/ChatExtraInfo";
import ChatList from "../Components/ChatComponent/ChatList";
import { ChatMessages } from "../Components/ChatComponent/components/ChatMessages";
import Can from "@components/CanComponent/Can";
import { useTicketSync, SYNC_EVENTS, useOnTicketsMerged } from "../contexts/TicketSyncContext";
import { getLanguageByKey } from "../Components/utils";

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
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const ticketId = useMemo(() => {
    const parsed = Number(ticketIdParam);
    return Number.isNaN(parsed) ? undefined : parsed;
  }, [ticketIdParam]);

  const { technicians } = useGetTechniciansList();
  const isMobile = useMobile();
  const [isChatListVisible, setIsChatListVisible] = useState(true);

  // Mobile panel navigation: 'list' | 'messages' | 'info'
  const [activePanel, setActivePanel] = useState("list");
  const [infoDrawerOpened, setInfoDrawerOpened] = useState(false);

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

  // Обработка объединения тикетов — если текущий тикет был удалён при merge
  useOnTicketsMerged(({ deletedTicketIds, targetTicketId }) => {
    // Проверяем, был ли наш тикет удалён при merge
    if (ticketId && deletedTicketIds.includes(ticketId)) {
      // Показываем alert с информацией
      alert(`${getLanguageByKey("ticketMergedAlert")} ${targetTicketId}`);
      
      // Перенаправляем на целевой тикет, сохраняя query params
      const queryString = searchParams.toString();
      const newPath = queryString 
        ? `/chat/${targetTicketId}?${queryString}` 
        : `/chat/${targetTicketId}`;
      
      navigate(newPath, { replace: true });
    }
  });

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

  // Mobile: auto-switch to messages panel when ticket is selected
  useEffect(() => {
    if (isMobile && ticketId) {
      setActivePanel("messages");
    }
  }, [isMobile, ticketId]);

  // Mobile navigation handlers
  const handleBackToList = useCallback(() => {
    setActivePanel("list");
    navigate("/chat");
  }, [navigate]);

  const handleOpenInfo = useCallback(() => {
    setInfoDrawerOpened(true);
  }, []);

  const handleCloseInfo = useCallback(() => {
    setInfoDrawerOpened(false);
  }, []);

  // Mobile Layout
  if (isMobile) {
    return (
      <Flex h="100%" className="chat-wrapper">
        {/* ChatList Panel */}
        <div className={`chat-panel ${activePanel === "list" ? "chat-panel--active" : "chat-panel--hidden"}`}>
          <div className="chat-list-panel">
            <ChatList ticketId={ticketId} />
          </div>
        </div>

        {/* ChatMessages Panel */}
        <div className={`chat-panel ${activePanel === "messages" ? "chat-panel--active" : "chat-panel--hidden"}`}>
          <div className="chat-messages-panel">
            {/* Mobile Header with Back Button */}
            <div className="chat-mobile-header">
              <button
                className="chat-mobile-header__back"
                onClick={handleBackToList}
                type="button"
              >
                <FaArrowLeft size={16} />
              </button>
              <span className="chat-mobile-header__title">
                {currentTicket?.client_name || `#${ticketId}`}
              </span>
              <div className="chat-mobile-header__actions">
                {ticketId && (
                  <ActionIcon
                    variant="default"
                    size="md"
                    onClick={handleOpenInfo}
                    className="chat-info-btn"
                  >
                    <LuInfo size={18} />
                  </ActionIcon>
                )}
              </div>
            </div>

            {/* Messages Content */}
            <div className="chat-messages-content">
              <Can permission={{ module: "chat", action: "view" }}>
                <ChatMessages
                  ticketId={ticketId}
                  personalInfo={currentTicket}
                  technicians={technicians}
                  unseenCount={currentTicket?.unseen_count || 0}
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
            </div>
          </div>
        </div>

        {/* ChatExtraInfo as Bottom Drawer */}
        <Drawer
          opened={infoDrawerOpened}
          onClose={handleCloseInfo}
          position="bottom"
          size="85%"
          withCloseButton={false}
          styles={{
            content: {
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
            },
            body: {
              padding: 0,
              height: "100%",
            },
          }}
        >
          {ticketId && (
            <ChatExtraInfo
              selectedClient={selectedClient}
              ticketId={ticketId}
              updatedTicket={currentTicket}
              onUpdateClientData={updateClientData}
              clientsData={ticketData}
            />
          )}
        </Drawer>
      </Flex>
    );
  }

  // Desktop Layout
  return (
    <Flex h="100%" className="chat-wrapper">
      <Flex w="100%" h="100%" className="chat-container">
        {isChatListVisible && <ChatList ticketId={ticketId} />}

        <Flex pos="relative" style={{ flex: "1 1 0" }}>
          <Box pos="absolute" left="10px" top="16px" style={{ zIndex: 1 }} className="chat-toggle-list-btn">
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
