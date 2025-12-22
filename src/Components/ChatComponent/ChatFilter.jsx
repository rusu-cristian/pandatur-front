import { Tabs, Button, Flex } from "@mantine/core";
import { useRef, useState } from "react";
import { getLanguageByKey } from "../utils";
import { TicketFormTabs } from "../TicketFormTabs";
import { MessageFilterForm } from "../LeadsComponent/MessageFilterForm";
import { useChatFilters } from "@hooks";

/**
 * Проверяет есть ли реальные фильтры
 */
const hasRealFilters = (filters) => {
  const { group_title, is_filtered, ...realFilters } = filters;
  return Object.values(realFilters).some(
    (v) => v !== undefined && v !== null && v !== "" &&
      !(Array.isArray(v) && v.length === 0) &&
      !(typeof v === "object" && !Array.isArray(v) && Object.keys(v).length === 0)
  );
};

/**
 * Единый компонент фильтра для Chat
 * 
 * Принцип: 
 * - Форма собирает данные
 * - При submit — записываем в URL через useChatFilters
 * - URL — единственный источник правды
 */
export const ChatFilter = ({
  onClose,
  loading,
  initialData = {},
}) => {
  const [activeTab, setActiveTab] = useState("filter_ticket");
  const ticketFormRef = useRef();
  const messageFormRef = useRef();

  const { setFilters, resetFilters, updateGroupTitle } = useChatFilters();

  // При смене группы в форме — сбрасываем фильтры (как в LeadsFilter — модал НЕ закрываем)
  const handleGroupTitleChange = (newGroupTitle) => {
    updateGroupTitle(newGroupTitle);
  };

  // Собираем значения из форм и убираем пустые
  const collectFormValues = () => {
    const ticketValues = ticketFormRef.current?.getValues?.() || {};
    const messageValues = messageFormRef.current?.getValues?.() || {};

    // Объединяем и фильтруем пустые значения
    const combined = { ...ticketValues, ...messageValues };

    return Object.fromEntries(
      Object.entries(combined).filter(([_, value]) => {
        if (value === undefined || value === null || value === "") return false;
        if (Array.isArray(value) && value.length === 0) return false;
        if (typeof value === "object" && !Array.isArray(value) && Object.keys(value).length === 0) return false;
        return true;
      })
    );
  };

  const handleSubmit = () => {
    const formValues = collectFormValues();

    // Если фильтры пустые — сбрасываем к дефолтным
    if (!hasRealFilters(formValues)) {
      handleReset();
      return;
    }

    // Полная замена фильтров (не merge!)
    // Это важно: если убрали technician_id из формы, он исчезнет из URL
    setFilters(formValues);
    onClose?.();
  };

  const handleReset = () => {
    resetFilters();
    onClose?.();
  };

  return (
    <Flex direction="column" h="100%" style={{ overflow: "hidden" }}>
      <Tabs
        style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}
        className="leads-modal-filter-tabs"
        defaultValue="filter_ticket"
        value={activeTab}
        onChange={setActiveTab}
      >
        <Tabs.List style={{ flexShrink: 0 }}>
          <Tabs.Tab value="filter_ticket">
            {getLanguageByKey("Filtru pentru Lead")}
          </Tabs.Tab>
          <Tabs.Tab value="filter_message">
            {getLanguageByKey("Filtru dupǎ mesaje")}
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="filter_ticket" pt="xs" style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
          <TicketFormTabs
            ref={ticketFormRef}
            initialData={initialData}
            loading={loading}
            onGroupTitleChange={handleGroupTitleChange}
          />
        </Tabs.Panel>

        <Tabs.Panel value="filter_message" pt="xs" style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
          <MessageFilterForm
            ref={messageFormRef}
            initialData={initialData}
            loading={loading}
          />
        </Tabs.Panel>
      </Tabs>

      {/* Футер закреплён внизу */}
      <Flex
        justify="end"
        gap="md"
        pt={16}
        pb={8}
        pr="md"
        style={{
          borderTop: "1px solid var(--mantine-color-gray-3)",
          flexShrink: 0
        }}
      >
        <Button variant="outline" onClick={handleReset}>
          {getLanguageByKey("Reset filter")}
        </Button>
        <Button variant="outline" onClick={onClose}>
          {getLanguageByKey("Închide")}
        </Button>
        <Button variant="filled" loading={loading} onClick={handleSubmit}>
          {getLanguageByKey("Aplică")}
        </Button>
      </Flex>
    </Flex>
  );
};
