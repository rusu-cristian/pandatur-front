import { memo, useCallback } from 'react';
import { Flex, Box } from '@mantine/core';
import { MobileChatHeader } from '../MobileChatHeader';
import { MOBILE_CHAT_VIEWS } from '../../constants/mobileViews';
import './MobileChatLayout.css';

/**
 * Mobile layout component for Chat page
 * Implements stack navigation pattern:
 * LIST -> MESSAGES -> INFO
 */
export const MobileChatLayout = memo(({
  // Navigation
  mobileView,
  onBack,
  onInfoClick,
  onSelectTicket,

  // Data
  ticketId,
  currentTicket,
  ticketsCount,

  // Components to render
  renderChatList,
  renderChatMessages,
  renderChatExtraInfo,
}) => {
  // Handle ticket selection from list
  const handleTicketSelect = useCallback((id) => {
    onSelectTicket?.(id);
  }, [onSelectTicket]);

  return (
    <Flex
      direction="column"
      h="100%"
      className="mobile-chat-layout"
    >
      <MobileChatHeader
        mobileView={mobileView}
        currentTicket={currentTicket}
        onBack={onBack}
        onInfoClick={onInfoClick}
        ticketsCount={ticketsCount}
      />

      <Box className="mobile-chat-content">
        {/* List View */}
        {mobileView === MOBILE_CHAT_VIEWS.LIST && (
          <Box className="mobile-view mobile-view-list">
            {renderChatList?.({ onSelectTicket: handleTicketSelect })}
          </Box>
        )}

        {/* Messages View */}
        {mobileView === MOBILE_CHAT_VIEWS.MESSAGES && (
          <Box className="mobile-view mobile-view-messages">
            {renderChatMessages?.()}
          </Box>
        )}

        {/* Info View */}
        {mobileView === MOBILE_CHAT_VIEWS.INFO && (
          <Box className="mobile-view mobile-view-info">
            {renderChatExtraInfo?.()}
          </Box>
        )}
      </Box>
    </Flex>
  );
});

MobileChatLayout.displayName = 'MobileChatLayout';
