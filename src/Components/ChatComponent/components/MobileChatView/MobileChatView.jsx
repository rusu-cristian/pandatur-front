import { useState, useEffect, useCallback, useMemo } from "react";
import { Flex, Box, Paper, UnstyledButton, Text, Badge } from "@mantine/core";
import { FaList, FaComments, FaInfoCircle, FaArrowLeft } from "react-icons/fa";
import { getLanguageByKey } from "@utils";
import ChatList from "../../ChatList";
import { ChatMessages } from "../ChatMessages";
import ChatExtraInfo from "../../ChatExtraInfo";
import "./MobileChatView.css";

// Типы вкладок для навигации
const TABS = {
  LIST: "list",
  CHAT: "chat",
  INFO: "info",
};

/**
 * Мобильная версия чата с bottom navigation
 * Паттерн: Full Screen Views + Bottom Tabs (как в Telegram/WhatsApp)
 */
export const MobileChatView = ({
  ticketId,
  currentTicket,
  technicians,
  // Props из useClientContacts
  platformOptions,
  selectedPlatform,
  changePlatform,
  contactOptions,
  changeContact,
  selectedClient,
  selectedPageId,
  changePageId,
  clientContactsLoading,
  updateClientData,
  ticketData,
}) => {
  // Активная вкладка — по умолчанию список чатов
  const [activeTab, setActiveTab] = useState(TABS.LIST);
  
  // Запоминаем предыдущий ticketId для отслеживания выбора нового чата
  const [prevTicketId, setPrevTicketId] = useState(ticketId);

  // Автоматически переключаемся на чат при выборе тикета
  useEffect(() => {
    if (ticketId && ticketId !== prevTicketId) {
      setActiveTab(TABS.CHAT);
      setPrevTicketId(ticketId);
    }
  }, [ticketId, prevTicketId]);

  // Сброс на список при очистке ticketId
  useEffect(() => {
    if (!ticketId && prevTicketId) {
      setActiveTab(TABS.LIST);
      setPrevTicketId(null);
    }
  }, [ticketId, prevTicketId]);

  // Обработчик возврата к списку
  const handleBackToList = useCallback(() => {
    setActiveTab(TABS.LIST);
  }, []);

  // Конфигурация табов
  const tabs = useMemo(() => [
    {
      id: TABS.LIST,
      icon: FaList,
      label: getLanguageByKey("Chat"),
    },
    {
      id: TABS.CHAT,
      icon: FaComments,
      label: getLanguageByKey("messages"),
      disabled: !ticketId,
    },
    {
      id: TABS.INFO,
      icon: FaInfoCircle,
      label: getLanguageByKey("info"),
      disabled: !ticketId,
    },
  ], [ticketId]);

  // Рендер контента в зависимости от активной вкладки
  const renderContent = () => {
    switch (activeTab) {
      case TABS.LIST:
        return (
          <Box className="mobile-chat-screen">
            <ChatList ticketId={ticketId} isMobile />
          </Box>
        );

      case TABS.CHAT:
        return (
          <Box className="mobile-chat-screen">
            {/* Заголовок с кнопкой назад */}
            <Paper className="mobile-chat-header" p="xs">
              <Flex align="center" gap="sm">
                <UnstyledButton onClick={handleBackToList} className="mobile-back-button">
                  <FaArrowLeft size={20} />
                </UnstyledButton>
                <Box style={{ flex: 1, minWidth: 0 }}>
                  <Text size="sm" fw={600} truncate>
                    {currentTicket?.client_name || `#${ticketId}`}
                  </Text>
                  {currentTicket?.workflow && (
                    <Text size="xs" c="dimmed" truncate>
                      {currentTicket.workflow}
                    </Text>
                  )}
                </Box>
                {currentTicket?.unseen_count > 0 && (
                  <Badge size="sm" color="red">
                    {currentTicket.unseen_count}
                  </Badge>
                )}
              </Flex>
            </Paper>

            {/* Область сообщений */}
            <Box className="mobile-messages-area">
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
                isMobile
              />
            </Box>
          </Box>
        );

      case TABS.INFO:
        return (
          <Box className="mobile-chat-screen">
            {/* Заголовок */}
            <Paper className="mobile-chat-header" p="xs">
              <Flex align="center" gap="sm">
                <UnstyledButton onClick={() => setActiveTab(TABS.CHAT)} className="mobile-back-button">
                  <FaArrowLeft size={20} />
                </UnstyledButton>
                <Text size="sm" fw={600}>
                  {getLanguageByKey("info")} #{ticketId}
                </Text>
              </Flex>
            </Paper>

            {/* Детальная информация */}
            <Box className="mobile-info-area">
              <ChatExtraInfo
                selectedClient={selectedClient}
                ticketId={ticketId}
                updatedTicket={currentTicket}
                onUpdateClientData={updateClientData}
                clientsData={ticketData}
                isMobile
              />
            </Box>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Flex direction="column" className="mobile-chat-container">
      {/* Основной контент */}
      <Box className="mobile-chat-content">
        {renderContent()}
      </Box>

      {/* Bottom Navigation */}
      <Paper className="mobile-bottom-nav" shadow="md">
        <Flex>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const isDisabled = tab.disabled;

            return (
              <UnstyledButton
                key={tab.id}
                className={`mobile-nav-tab ${isActive ? "active" : ""} ${isDisabled ? "disabled" : ""}`}
                onClick={() => !isDisabled && setActiveTab(tab.id)}
                disabled={isDisabled}
              >
                <Icon
                  size={22}
                  style={{
                    opacity: isActive ? 1 : 0.7,
                  }}
                />
                <Text size="xs" mt={2}>
                  {tab.label}
                </Text>
              </UnstyledButton>
            );
          })}
        </Flex>
      </Paper>
    </Flex>
  );
};

export default MobileChatView;

