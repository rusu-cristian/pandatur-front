import { memo } from "react";
import { Modal } from "@mantine/core";
import { ChatModal } from "../ChatComponent/ChatModal";
import SingleChat from "@components/ChatComponent/SingleChat";
import { AddLeadModal } from "@components";
import { ManageLeadInfoTabs } from "./ManageLeadInfoTabs";
import { LeadsFilter } from "./LeadsFilter";
import { getLanguageByKey } from "../utils";

// Общие стили для модалок
const MODAL_STYLES = {
  content: { height: "700px", display: "flex", flexDirection: "column" },
  body: { flex: 1, overflowY: "auto", padding: "1rem" },
  title: { color: "var(--crm-ui-kit-palette-text-primary)" }
};

/**
 * Модалки страницы Leads
 * 
 * Содержит:
 * - ChatModal — чат с клиентом
 * - AddLeadModal — создание нового лида
 * - FilterModal — фильтрация
 * - EditModal — редактирование лидов
 */
export const LeadsModals = memo(({
  // Чат
  isChatOpen,
  ticketId,
  technicians,
  onChatClose,
  
  // Создание
  isAddModalOpen,
  groupTitleForApi,
  onAddModalClose,
  onAddSuccess,
  
  // Фильтр
  isFilterModalOpen,
  filters,
  isLoading,
  onFilterModalClose,
  
  // Редактирование
  isEditModalOpen,
  selectedTickets,
  currentTicketId,
  onEditModalClose,
  onEditSuccess,
}) => {
  return (
    <>
      {/* ЧАТ */}
      <ChatModal opened={isChatOpen && !!ticketId} onClose={onChatClose}>
        <SingleChat ticketId={ticketId} onClose={onChatClose} technicians={technicians} />
      </ChatModal>

      {/* МОДАЛ СОЗДАНИЯ */}
      <Modal
        opened={isAddModalOpen}
        onClose={onAddModalClose}
        title={getLanguageByKey("Adaugă lead")}
        withCloseButton
        centered
        size="lg"
      >
        <AddLeadModal
          open
          onClose={onAddModalClose}
          selectedGroupTitle={groupTitleForApi}
          fetchTickets={onAddSuccess}
        />
      </Modal>

      {/* МОДАЛ ФИЛЬТРА */}
      <Modal
        opened={isFilterModalOpen}
        onClose={onFilterModalClose}
        title={getLanguageByKey("Filtrează tichete")}
        withCloseButton
        centered
        size="lg"
        styles={MODAL_STYLES}
      >
        <LeadsFilter
          initialData={filters}
          loading={isLoading}
          onClose={onFilterModalClose}
        />
      </Modal>

      {/* МОДАЛ РЕДАКТИРОВАНИЯ */}
      <Modal
        opened={isEditModalOpen}
        onClose={onEditModalClose}
        title={getLanguageByKey("Editarea tichetelor în grup")}
        withCloseButton
        centered
        size="lg"
        styles={MODAL_STYLES}
      >
        <ManageLeadInfoTabs
          onClose={onEditModalClose}
          selectedTickets={selectedTickets}
          fetchLeads={onEditSuccess}
          id={selectedTickets.length === 1 ? selectedTickets[0] : currentTicketId}
        />
      </Modal>
    </>
  );
});

LeadsModals.displayName = "LeadsModals";

