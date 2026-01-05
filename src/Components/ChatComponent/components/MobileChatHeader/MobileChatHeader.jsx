import { memo } from 'react';
import { Flex, ActionIcon, Text, Badge } from '@mantine/core';
import { FaArrowLeft, FaInfoCircle } from 'react-icons/fa';
import { getLanguageByKey } from '../../../utils';
import { MOBILE_CHAT_VIEWS } from '../../constants/mobileViews';
import './MobileChatHeader.css';

/**
 * Mobile header component with back navigation and info button
 */
export const MobileChatHeader = memo(({
  mobileView,
  currentTicket,
  onBack,
  onInfoClick,
  ticketsCount = 0,
}) => {
  // Get title based on current view
  const getTitle = () => {
    switch (mobileView) {
      case MOBILE_CHAT_VIEWS.LIST:
        return getLanguageByKey('Chat');
      case MOBILE_CHAT_VIEWS.INFO:
        return getLanguageByKey('ticket_info');
      case MOBILE_CHAT_VIEWS.MESSAGES:
      default:
        if (currentTicket) {
          // Show client name or ticket ID
          const clientName = currentTicket.client_name ||
            currentTicket.name ||
            `#${currentTicket.id}`;
          return clientName;
        }
        return getLanguageByKey('Chat');
    }
  };

  // Show back button except on list view
  const showBackButton = mobileView !== MOBILE_CHAT_VIEWS.LIST;

  // Show info button only on messages view with a ticket
  const showInfoButton = mobileView === MOBILE_CHAT_VIEWS.MESSAGES && currentTicket;

  return (
    <Flex
      className="mobile-chat-header"
      align="center"
      justify="space-between"
      px="md"
      py="sm"
    >
      <Flex align="center" gap="sm" style={{ flex: 1, minWidth: 0 }}>
        {showBackButton && (
          <ActionIcon
            variant="subtle"
            size="lg"
            onClick={onBack}
            aria-label={getLanguageByKey('back')}
          >
            <FaArrowLeft size={18} />
          </ActionIcon>
        )}

        <Text
          fw={600}
          size="lg"
          truncate
          style={{ flex: 1 }}
        >
          {getTitle()}
        </Text>

        {mobileView === MOBILE_CHAT_VIEWS.LIST && ticketsCount > 0 && (
          <Badge
            variant="filled"
            style={{ backgroundColor: 'var(--crm-ui-kit-palette-link-primary)' }}
          >
            {ticketsCount}
          </Badge>
        )}
      </Flex>

      {showInfoButton && (
        <ActionIcon
          variant="subtle"
          size="lg"
          onClick={onInfoClick}
          aria-label={getLanguageByKey('ticket_info')}
        >
          <FaInfoCircle size={20} />
        </ActionIcon>
      )}
    </Flex>
  );
});

MobileChatHeader.displayName = 'MobileChatHeader';
