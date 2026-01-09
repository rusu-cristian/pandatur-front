import { Tabs, Flex, Button, Text } from "@mantine/core";
import { useSnackbar } from "notistack";
import { useState, useEffect } from "react";
import { getLanguageByKey, showServerError } from "../utils";
import { api } from "../../api";
import {
  ContractForm,
  BasicGeneralForm,
  TicketInfoForm,
  QualityControlForm,
} from "../TicketForms";
import { useFormTicket } from "../../hooks";

export const ManageLeadInfoTabs = ({
  onClose,
  selectedTickets,
  fetchLeads,
  id,
}) => {
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(false);
  const [ticketInfo, setTicketInfo] = useState();
  const [generalInfoLightTicket, setGeneralInfoLightTicket] = useState();

  const {
    form,
    hasErrorsTicketInfoForm,
    hasErrorsContractForm,
    hasErrorQualityControl,
  } = useFormTicket({
    groupTitle: generalInfoLightTicket?.group_title ?? ticketInfo?.group_title,
  });

  const handleSubmit = async () => {
    const validationResult = form.validate();
    if (validationResult.hasErrors) {
      // Выводим в консоль список полей с ошибками
      const fieldsWithErrors = Object.entries(validationResult.errors)
        .filter(([_, error]) => error)
        .map(([fieldName, error]) => ({ field: fieldName, error }));
      
      console.group("❌ Ошибки валидации при обновлении тикета");
      console.log("Поля, которые нужно заполнить:");
      fieldsWithErrors.forEach(({ field, error }) => {
        console.log(`  • ${field}: ${error}`);
      });
      console.log("Всего полей с ошибками:", fieldsWithErrors.length);
      console.groupEnd();

      enqueueSnackbar(
        getLanguageByKey("please_complete_required_fields_for_workflow_change"),
        { variant: "error" }
      );
      return;
    }

    setLoading(true);
    try {
      const values = form.getValues();

      const booleanFields = [
        "contract_trimis",
        "contract_semnat",
        "achitare_efectuata",
        "rezervare_confirmata",
        "contract_arhivat",
        "control",
      ];

      const stringifiedBooleans = Object.fromEntries(
        booleanFields.map((key) => [
          key,
          values[key] !== undefined ? String(values[key]) : undefined,
        ])
      );

      const payload = {
        ...values,
        ...stringifiedBooleans,
      };

      await api.tickets.updateById({
        id: id ? [id] : selectedTickets,
        ...payload,
      });

      onClose(true);

      enqueueSnackbar(
        getLanguageByKey("Datele au fost actualizate cu success"),
        { variant: "success" }
      );

      await fetchLeads();
    } catch (error) {
      enqueueSnackbar(showServerError(error), { variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const getTicketInfo = async (id) => {
      setLoading(true);
      try {
        const lightTicket = await api.tickets.ticket.getLightById(id);
        const ticketInfo = await api.tickets.ticket.getInfo(id);
        setGeneralInfoLightTicket(lightTicket);
        setTicketInfo(ticketInfo);
      } catch (error) {
        enqueueSnackbar(showServerError(error), { variant: "error" });
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      getTicketInfo(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  return (
    <Flex direction="column" h="100%" style={{ overflow: "hidden" }}>
      <Tabs 
        defaultValue="general_info" 
        style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}
      >
        <Tabs.List style={{ flexShrink: 0 }}>
          <Tabs.Tab value="general_info">
            <Text size="sm" truncate="end">
              {getLanguageByKey("Informații generale")}
            </Text>
          </Tabs.Tab>
          <Tabs.Tab value="ticket_info">
            <Text
              size="sm"
              truncate="end"
              data-error={hasErrorsTicketInfoForm ? "true" : undefined}
            >
              {getLanguageByKey("Informații despre tichet")}
            </Text>
          </Tabs.Tab>
          <Tabs.Tab value="contact">
            <Text
              size="sm"
              truncate="end"
              data-error={hasErrorsContractForm ? "true" : undefined}
            >
              {getLanguageByKey("Contract")}
            </Text>
          </Tabs.Tab>
          <Tabs.Tab value="quality_control">
            <Text
              size="sm"
              truncate="end"
              data-error={hasErrorQualityControl ? "true" : undefined}
            >
              {getLanguageByKey("Control calitate")}
            </Text>
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="general_info" pt="xs" style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
          <BasicGeneralForm data={generalInfoLightTicket} formInstance={form} />
        </Tabs.Panel>

        <Tabs.Panel value="ticket_info" pt="xs" style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
          <TicketInfoForm formInstance={form} setMinDate={new Date()} data={ticketInfo} />
        </Tabs.Panel>

        <Tabs.Panel value="contact" pt="xs" style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
          <ContractForm formInstance={form} setMinDate={new Date()} data={ticketInfo} />
        </Tabs.Panel>

        <Tabs.Panel value="quality_control" pt="xs" style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
          <QualityControlForm formInstance={form} data={ticketInfo} />
        </Tabs.Panel>
      </Tabs>

      <Flex 
        justify="flex-end" 
        gap="sm" 
        pt={16} 
        pb={8} 
        pr="md" 
        style={{ 
          borderTop: "1px solid var(--mantine-color-gray-3)",
          flexShrink: 0,
          backgroundColor: "var(--crm-ui-kit-palette-background-primary)"
        }}
      >
        <Button variant="outline" onClick={onClose}>
          {getLanguageByKey("Închide")}
        </Button>
        <Button loading={loading} onClick={handleSubmit}>
          {getLanguageByKey("Save")}
        </Button>
      </Flex>
    </Flex>
  );
};
