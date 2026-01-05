import { useState, useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MOBILE_CHAT_VIEWS } from '../constants/mobileViews';

/**
 * Hook for managing mobile chat navigation (stack-based)
 *
 * Flow:
 * - LIST: Shows chat list (default when no ticketId)
 * - MESSAGES: Shows chat messages (default when ticketId exists)
 * - INFO: Shows ticket extra info
 *
 * @param {number|undefined} ticketId - Current ticket ID from URL
 * @returns {Object} Mobile navigation state and methods
 */
export const useChatMobileNavigation = (ticketId) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Determine initial view based on ticketId
  const getInitialView = useCallback(() => {
    return ticketId ? MOBILE_CHAT_VIEWS.MESSAGES : MOBILE_CHAT_VIEWS.LIST;
  }, [ticketId]);

  const [mobileView, setMobileView] = useState(getInitialView);

  // Sync view with ticketId changes
  useEffect(() => {
    if (ticketId) {
      // When ticket is selected, show messages
      setMobileView(MOBILE_CHAT_VIEWS.MESSAGES);
    } else {
      // When no ticket, show list
      setMobileView(MOBILE_CHAT_VIEWS.LIST);
    }
  }, [ticketId]);

  /**
   * Navigate to chat list
   */
  const goToList = useCallback(() => {
    setMobileView(MOBILE_CHAT_VIEWS.LIST);
    // Clear ticketId from URL but keep filters
    const queryString = searchParams.toString();
    const newPath = queryString ? `/chat?${queryString}` : '/chat';
    navigate(newPath, { replace: true });
  }, [navigate, searchParams]);

  /**
   * Navigate to chat messages for a specific ticket
   * @param {number} id - Ticket ID
   */
  const goToMessages = useCallback((id) => {
    setMobileView(MOBILE_CHAT_VIEWS.MESSAGES);
    const queryString = searchParams.toString();
    const newPath = queryString ? `/chat/${id}?${queryString}` : `/chat/${id}`;
    navigate(newPath);
  }, [navigate, searchParams]);

  /**
   * Navigate to ticket info panel
   */
  const goToInfo = useCallback(() => {
    setMobileView(MOBILE_CHAT_VIEWS.INFO);
  }, []);

  /**
   * Go back from current view
   * INFO -> MESSAGES -> LIST
   */
  const goBack = useCallback(() => {
    switch (mobileView) {
      case MOBILE_CHAT_VIEWS.INFO:
        setMobileView(MOBILE_CHAT_VIEWS.MESSAGES);
        break;
      case MOBILE_CHAT_VIEWS.MESSAGES:
        goToList();
        break;
      default:
        break;
    }
  }, [mobileView, goToList]);

  return {
    mobileView,
    setMobileView,
    goToList,
    goToMessages,
    goToInfo,
    goBack,
    isListView: mobileView === MOBILE_CHAT_VIEWS.LIST,
    isMessagesView: mobileView === MOBILE_CHAT_VIEWS.MESSAGES,
    isInfoView: mobileView === MOBILE_CHAT_VIEWS.INFO,
  };
};
