import { Tabs, Button, Flex } from "@mantine/core";
import { useRef, useState } from "react";
import { getLanguageByKey } from "../utils";
import { TicketFormTabs } from "../TicketFormTabs";
import { MessageFilterForm } from "./MessageFilterForm";
import { useLeadsFilters } from "@hooks";
import { hasRealFilters } from "./constants";

/**
 * Единый компонент фильтра для Leads
 * Работает одинаково для Kanban и List режимов
 * 
 * Принцип: 
 * - Форма собирает данные
 * - При submit — записываем в URL через useLeadsFilters
 * - URL — единственный источник правды
 */
export const LeadsFilter = ({
  onClose,
  loading,
  initialData = {},
}) => {
  const [activeTab, setActiveTab] = useState("filter_ticket");
  const ticketFormRef = useRef();
  const messageFormRef = useRef();

  const { updateFilters, resetFilters, groupTitleForApi } = useLeadsFilters();

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

    // Добавляем group_title если есть
    if (groupTitleForApi) {
      formValues.group_title = groupTitleForApi;
    }

    // Если фильтры пустые — сбрасываем
    if (!hasRealFilters(formValues)) {
      handleReset();
      return;
    }

    // Устанавливаем фильтры через URL
    updateFilters(formValues);
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

        {/* keepMounted={false} — рендерим только активный таб */}
        <Tabs.Panel value="filter_ticket" pt="xs" style={{ flex: 1, overflowY: "auto", minHeight: 0 }} keepMounted={false}>
          <TicketFormTabs
            ref={ticketFormRef}
            initialData={initialData}
            loading={loading}
          />
        </Tabs.Panel>

        <Tabs.Panel value="filter_message" pt="xs" style={{ flex: 1, overflowY: "auto", minHeight: 0 }} keepMounted={false}>
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

