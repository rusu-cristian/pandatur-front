import {
  useRef,
  useImperativeHandle,
  forwardRef,
} from "react";
import { Tabs, Flex, ScrollArea } from "@mantine/core";
import { getLanguageByKey } from "../utils";
import {
  TicketInfoFormFilter,
  ContractFormFilter,
  QualityControlFormFilter,
  BasicGeneralFormFilter,
} from "./components";
import "./TicketFormTabs.css";

export const TicketFormTabs = forwardRef(
  (
    {
      onClose,
      loading,
      initialData,
      orientation = "vertical",
      onGroupTitleChange, // Callback при смене группы (для Chat)
    },
    ref
  ) => {
    const generalRef = useRef();
    const ticketInfoRef = useRef();
    const contractRef = useRef();
    const qualityRef = useRef();

    useImperativeHandle(ref, () => ({
      getValues: () => ({
        ...(generalRef.current?.getValues?.() || {}),
        ...(ticketInfoRef.current?.getValues?.() || {}),
        ...(contractRef.current?.getValues?.() || {}),
        ...(qualityRef.current?.getValues?.() || {}),
      }),
    }));

    return (
      <Tabs
        h="100%"
        defaultValue="filter_general_info"
        orientation={orientation}
        className="leads-modal-filter-tabs"
      >
        <Tabs.List>
          <Tabs.Tab value="filter_general_info">
            {getLanguageByKey("Informații generale")}
          </Tabs.Tab>
          <Tabs.Tab value="filter_ticket_info">
            {getLanguageByKey("Informații despre tichet")}
          </Tabs.Tab>
          <Tabs.Tab value="filter_contract">
            {getLanguageByKey("Contract")}
          </Tabs.Tab>
          <Tabs.Tab value="filter_quality_control">
            {getLanguageByKey("Control calitate")}
          </Tabs.Tab>
        </Tabs.List>

        {/* keepMounted — форма остаётся в DOM, чтобы изменения не терялись при переключении табов */}
        <Tabs.Panel value="filter_general_info" pl="lg">
          <Flex direction="column" justify="space-between" h="100%">
            <BasicGeneralFormFilter
              ref={generalRef}
              data={initialData}
              loading={loading}
              onClose={onClose}
              onGroupTitleChange={onGroupTitleChange}
            />
          </Flex>
        </Tabs.Panel>

        <Tabs.Panel value="filter_ticket_info" pl="lg">
          <ScrollArea h="100%">
            <TicketInfoFormFilter
              ref={ticketInfoRef}
              data={initialData}
              hideDisabledInput
            />
          </ScrollArea>
        </Tabs.Panel>

        <Tabs.Panel value="filter_contract" pl="lg">
          <ScrollArea h="100%">
            <ContractFormFilter
              ref={contractRef}
              data={initialData}
              hideDisabledInput
            />
          </ScrollArea>
        </Tabs.Panel>

        <Tabs.Panel value="filter_quality_control" pl="lg">
          <Flex direction="column" justify="space-between" h="100%">
            <QualityControlFormFilter
              ref={qualityRef}
              data={initialData}
            />
          </Flex>
        </Tabs.Panel>
      </Tabs>
    );
  }
);
