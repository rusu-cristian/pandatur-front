import { Tabs, Flex, Button } from "@mantine/core";
import { getLanguageByKey } from "../utils";
import { TicketFormTabs } from "../TicketFormTabs";
import { MessageFilterForm } from "./MessageFilterForm";
import { useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { prepareFiltersForUrl } from "../utils/parseFiltersFromUrl";

export const LeadsTableFilter = ({
  onClose,
  loading,
  initialData,
  onSubmitTicket,
  onResetFilters,
  groupTitleForApi,
}) => {
  const [activeTab, setActiveTab] = useState("filter_ticket");
  const [, setSearchParams] = useSearchParams();
  const ticketFormRef = useRef();
  const messageFormRef = useRef();

  const isEmpty = (v) =>
    v === undefined ||
    v === null ||
    v === "" ||
    (Array.isArray(v) && v.length === 0) ||
    (typeof v === "object" && Object.keys(v).length === 0);

  const mergeFilters = (...filters) =>
    Object.fromEntries(
      Object.entries(Object.assign({}, ...filters)).filter(
        ([_, v]) => !isEmpty(v)
      )
    );

  const handleSubmit = () => {
    const ticketValues = ticketFormRef.current?.getValues?.() || {};
    const messageValues = messageFormRef.current?.getValues?.() || {};

    const combinedFilters = mergeFilters(
      ticketValues,
      messageValues,
      groupTitleForApi ? { group_title: groupTitleForApi } : {}
    );

    const urlParams = prepareFiltersForUrl({
      ...combinedFilters,
      type: "hard",
      view: "list",
    });

    setSearchParams(urlParams, { replace: true });
    onClose?.();
  };

  const handleReset = () => {
    // Сохраняем только view и group_title (если есть), остальные фильтры удаляем
    setSearchParams((prev) => {
      const newParams = new URLSearchParams();
      newParams.set("view", "list");
      
      const groupTitle = prev.get("group_title");
      if (groupTitle) {
        newParams.set("group_title", groupTitle);
      }
      
      return newParams;
    }, { replace: true });
    
    onResetFilters?.();
    onClose?.();
  };

  return (
    <Flex direction="column" h="100%">
      <Tabs
        style={{ flex: 1, display: "flex", flexDirection: "column" }}
        className="leads-modal-filter-tabs"
        defaultValue="filter_ticket"
        value={activeTab}
        onChange={setActiveTab}
      >
        <Tabs.List>
          <Tabs.Tab value="filter_ticket">
            {getLanguageByKey("Filtru pentru Lead")}
          </Tabs.Tab>
          <Tabs.Tab value="filter_message">
            {getLanguageByKey("Filtru dupǎ mesaje")}
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="filter_ticket" pt="xs" style={{ flex: 1, overflowY: "auto" }}>
          <TicketFormTabs
            ref={ticketFormRef}
            initialData={initialData}
            loading={loading}
          />
        </Tabs.Panel>

        <Tabs.Panel value="filter_message" pt="xs" style={{ flex: 1, overflowY: "auto" }}>
          <MessageFilterForm
            ref={messageFormRef}
            initialData={initialData}
            loading={loading}
          />
        </Tabs.Panel>
      </Tabs>

      <Flex justify="end" gap="md" pt={16} pb={8} pr="md" style={{ borderTop: "1px solid var(--mantine-color-gray-3)" }}>
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
