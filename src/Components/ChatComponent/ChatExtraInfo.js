import React, { useState, useEffect, useMemo, useCallback } from "react";
import { enqueueSnackbar } from "notistack";
import {
  Tabs,
  ScrollArea,
  Divider,
  Box,
  Button,
  Text,
  Flex,
  Loader,
} from "@mantine/core";
import { getLanguageByKey, showServerError } from "@utils";
import { api } from "../../api";
import {
  useFormTicket,
  useApp,
  useMessagesContext,
} from "@hooks";
import { PersonalData4ClientForm, Merge, Media } from "./components";
import {
  ContractForm,
  QualityControlForm,
  GeneralForm,
  TicketInfoForm,
} from "../TicketForms";
import { InvoiceTab } from "./components";
import Can from "@components/CanComponent/Can";
import { useClientContactsContext } from "../../context/ClientContactsContext";

const ChatExtraInfo = ({
  selectTicketId,
  updatedTicket,
  ticketId,
}) => {
  const { selectedClient } = useClientContactsContext();
  const [extraInfo, setExtraInfo] = useState({});
  const [isLoadingExtraInfo, setIsLoadingExtraInfo] = useState(true);
  const [isLoadingGeneral, setIsLoadingGeneral] = useState(false);
  const [isLoadingCombineLead, setIsLoadingCombineLead] = useState(false);
  const [isLoadingCombineClient, setIsLoadingClient] = useState(false);
  const [isLoadingInfoTicket, setIsLoadingInfoTicket] = useState(false);

  const { setTickets, isAdmin } = useApp();
  const { getUserMessages, mediaFiles } = useMessagesContext();

  const {
    form,
    hasErrorsTicketInfoForm,
    hasErrorsContractForm,
    hasErrorQualityControl,
  } = useFormTicket({
    groupTitle: updatedTicket?.group_title ?? extraInfo?.group_title,
  });

  // Отладка: проверяем, обновляются ли ошибки
  // console.log('Errors state:', {
  //   hasErrorsTicketInfoForm,
  //   hasErrorsContractForm,
  //   hasErrorQualityControl,
  //   formErrors: form.errors
  // });

  // Мемоизируем данные форм для предотвращения перерендера
  const formData = useMemo(() => ({
    general: updatedTicket,
    lead: extraInfo,
    contract: extraInfo,
    quality: extraInfo
  }), [updatedTicket, extraInfo]);

  const responsibleId = useMemo(() => {
    const technicianId = updatedTicket?.technician_id ?? extraInfo?.technician_id;
    return technicianId !== null && technicianId !== undefined
      ? String(technicianId)
      : null;
  }, [updatedTicket?.technician_id, extraInfo?.technician_id]);

  /**
   *
   * @param {number} mergedTicketId
   */
  const fetchTicketLight = useCallback(async (mergedTicketId) => {
    try {
      await getUserMessages(ticketId);
      setTickets((prev) => prev.filter(({ id }) => id !== mergedTicketId));
    } catch (error) {
      enqueueSnackbar(showServerError(error), { variant: "error" });
    }
  }, [getUserMessages, ticketId, setTickets]);

  const updateTicketDate = async (values) => {
    if (form.validate().hasErrors) {
      enqueueSnackbar(
        getLanguageByKey("please_complete_required_fields_for_workflow_change"),
        {
          variant: "error",
        },
      );
      return;
    }

    setIsLoadingGeneral(true);
    try {
      await api.tickets.updateById({
        id: [ticketId],
        ...values,
      });
      enqueueSnackbar(
        getLanguageByKey("Datele despre ticket au fost create cu succes"),
        {
          variant: "success",
        },
      );
    } catch (error) {
      enqueueSnackbar(showServerError(error), {
        variant: "error",
      });
    } finally {
      setIsLoadingGeneral(false);
    }
  };

  const fetchTicketExtraInfo = async (ticketId) => {
    try {
      setIsLoadingExtraInfo(true);
      const data = await api.tickets.ticket.getInfo(ticketId);

      setExtraInfo(data);
    } catch (error) {
      enqueueSnackbar(showServerError(error), { variant: "error" });
    } finally {
      setIsLoadingExtraInfo(false);
    }
  };

  /**
   *
   * @param {number} id
   * @param {() => void} resetField
   */
  const mergeClientsData = async (id, resetField) => {
    const ticketOld = ticketId;

    setIsLoadingCombineLead(true);
    try {
      await api.tickets.merge({
        ticket_old: ticketOld,
        ticket_new: id,
      });

      await fetchTicketLight(id);

      resetField();

      enqueueSnackbar(
        getLanguageByKey("Biletele au fost combinate cu succes"),
        {
          variant: "success",
        },
      );
    } catch (error) {
      enqueueSnackbar(showServerError(error), {
        variant: "error",
      });
    } finally {
      setIsLoadingCombineLead(false);
    }
  };

  const mergeData = async (id) => {
    setIsLoadingClient(true);
    try {
      await api.users.clientMerge({
        old_user_id: selectedClient.payload?.id,
        new_user_id: id,
      });

      enqueueSnackbar(
        getLanguageByKey("Utilizatorii au fost combinați cu succes"),
        {
          variant: "success",
        },
      );
    } catch (error) {
      enqueueSnackbar(showServerError(error), {
        variant: "error",
      });
    } finally {
      setIsLoadingClient(false);
    }
  };

  const saveTicketExtraDate = async (type, values) => {
    setIsLoadingInfoTicket(true);
    try {
      await api.tickets.ticket.create(type, values);
      enqueueSnackbar(
        getLanguageByKey("Datele despre ticket au fost create cu succes"),
        { variant: "success" },
      );
    } catch (error) {
      enqueueSnackbar(showServerError(error), {
        variant: "error",
      });
    } finally {
      setIsLoadingInfoTicket(false);
    }
  };

  useEffect(() => {
    if (ticketId) {
      fetchTicketExtraInfo(ticketId);
    }
  }, [ticketId]);

  // Мемоизируем обработчики для стабильности
  const handleUpdateTicketDate = useCallback(updateTicketDate, [form, ticketId]);
  const handleSaveTicketExtraDate = useCallback(saveTicketExtraDate, []);
  const handleMergeClientsData = useCallback(mergeClientsData, [ticketId, fetchTicketLight]);
  const handleMergeData = useCallback(mergeData, [selectedClient.payload?.id]);

  const handleSubmitAllForms = async () => {
    const values = form.getValues();

    if (form.validate().hasErrors) {
      enqueueSnackbar(
        getLanguageByKey("please_complete_required_fields_for_workflow_change"),
        { variant: "error" }
      );
      return;
    }

    // Если technician_id пустой (undefined, null, пустая строка, "undefined", "null"), передаем null
    // чтобы явно указать, что ответственный не установлен
    const rawTechnicianId = values.technician_id;
    const technicianId = rawTechnicianId &&
      rawTechnicianId !== "undefined" &&
      rawTechnicianId !== "null" &&
      rawTechnicianId.toString().trim()
      ? rawTechnicianId
      : null;

    const generalFields = {
      technician_id: technicianId,
      workflow: values.workflow,
      priority: values.priority,
      contact: values.contact,
      tags: values.tags,
      group_title: values.group_title,
      description: values.description,
    };

    const {
      technician_id,
      workflow,
      priority,
      contact,
      tags,
      group_title,
      description,
      name,
      surname,
      phone,
      email,
      ticket_id,
      ...extraFields
    } = values;

    try {
      setIsLoadingGeneral(true);

      await api.tickets.updateById({
        id: [ticketId],
        ...generalFields,
      });

      await api.tickets.ticket.create(ticketId, extraFields);

      // Диспатчим событие для обновления данных тикета и клиентов
      window.dispatchEvent(new CustomEvent('ticketUpdated', {
        detail: { ticketId }
      }));

      enqueueSnackbar(
        getLanguageByKey("Datele despre ticket au fost create cu succes"),
        { variant: "success" }
      );
    } catch (error) {
      enqueueSnackbar(showServerError(error), { variant: "error" });
    } finally {
      setIsLoadingGeneral(false);
    }
  };

  if (isLoadingExtraInfo) {
    return (
      <Flex h="100%" justify="center" align="center" maw="35%" w="100%" className="chat-extra-info-scroll-area">
        <Loader />
      </Flex>
    );
  }

  return (
    <ScrollArea maw="35%" w="100%" h="100%" className="chat-extra-info-scroll-area">
      <Tabs defaultValue="general" h="100%">
        <Box
          style={{
            position: "sticky",
            top: 0,
            zIndex: 10,
            backgroundColor: "var(--crm-ui-kit-palette-background-primary)",
          }}
          p="md"
        >
          <Tabs.List>
            <Tabs.Tab value="general">
              <Text fw={900} size="sm">
                {getLanguageByKey("General")}
              </Text>
            </Tabs.Tab>
            <Tabs.Tab value="lead">
              <Text
                fw={900}
                size="sm"
                truncate="end"
                data-error={hasErrorsTicketInfoForm ? "true" : undefined}
              >
                {getLanguageByKey("lead")}
              </Text>
            </Tabs.Tab>
            <Tabs.Tab value="contract">
              <Text
                fw={900}
                size="sm"
                data-error={hasErrorsContractForm ? "true" : undefined}
              >
                {getLanguageByKey("Contract")}
              </Text>
            </Tabs.Tab>
            <Tabs.Tab value="documents">
              <Text fw={900} size="sm">
                {getLanguageByKey("documents")}
              </Text>
            </Tabs.Tab>
            <Tabs.Tab value="media">
              <Text fw={900} size="sm">
                {getLanguageByKey("Media")}
              </Text>
            </Tabs.Tab>
            <Tabs.Tab value="quality_control">
              <Text
                fw={900}
                size="sm"
                data-error={hasErrorQualityControl ? "true" : undefined}
              >
                {getLanguageByKey("quality")}
              </Text>
            </Tabs.Tab>
          </Tabs.List>
          <Can permission={{ module: "leads", action: "edit" }} context={{ responsibleId }}>
            <Button
              fullWidth
              mt="md"
              loading={isLoadingGeneral || isLoadingInfoTicket}
              onClick={handleSubmitAllForms}
            >
              {getLanguageByKey("Actualizare")}
            </Button>
          </Can>
        </Box>

        <Tabs.Panel value="general">
          <Box p="md">
            <GeneralForm
              key={`general-${ticketId}-${JSON.stringify(formData.general)}`}
              data={formData.general}
              formInstance={form}
              onSubmit={handleUpdateTicketDate}
            />

            <Divider my="md" size="md" />

            <PersonalData4ClientForm
              key={`personal-${ticketId}`}
              ticketId={ticketId}
              responsibleId={responsibleId}
            />

            {isAdmin && (
              <>
                <Divider my="md" size="md" />

                <Box mt="md" bg="var(--crm-ui-kit-palette-background-primary-disabled)" p="md" style={{ borderRadius: 8 }}>
                  <Merge
                    label={getLanguageByKey("combineTickets")}
                    key={`merge-tickets-${ticketId}`}
                    buttonText={getLanguageByKey("combineTickets")}
                    loading={isLoadingCombineLead}
                    value={ticketId || ""}
                    onSubmit={(values, resetField) =>
                      handleMergeClientsData(values, resetField)
                    }
                    placeholder={getLanguageByKey("Introduceți ID lead")}
                  />
                </Box>

                <Box mt="md" bg="var(--crm-ui-kit-palette-background-primary-disabled)" p="md" style={{ borderRadius: 8 }}>
                  <Merge
                    label={getLanguageByKey("combineClient")}
                    key={`merge-clients-${selectedClient.payload?.id}`}
                    buttonText={getLanguageByKey("combineClient")}
                    loading={isLoadingCombineClient}
                    value={selectedClient.payload?.id || ""}
                    placeholder={getLanguageByKey("Introduceți ID client")}
                    onSubmit={(values) => handleMergeData(values)}
                  />
                </Box>
              </>
            )}
          </Box>
        </Tabs.Panel>

        <Tabs.Panel value="lead">
          <Box p="md">
            <TicketInfoForm
              key={`lead-${ticketId}-${JSON.stringify(formData.lead)}`}
              formInstance={form}
              data={formData.lead}
              onSubmit={(values) => handleSaveTicketExtraDate(values)}
            />
          </Box>
        </Tabs.Panel>

        <Tabs.Panel value="contract">
          <Box p="md">
            <ContractForm
              key={`contract-${ticketId}-${JSON.stringify(formData.contract)}`}
              formInstance={form}
              data={formData.contract}
              onSubmit={(values) => handleSaveTicketExtraDate(values)}
            />
          </Box>
        </Tabs.Panel>

        <Tabs.Panel value="documents">
          <Box p="md">
            <InvoiceTab extraInfo={extraInfo} clientInfo={selectedClient.payload} />
          </Box>
        </Tabs.Panel>

        <Tabs.Panel value="media" h="100%">
          <Box pb="md" pr="md" pl="md" h="100%">
            <Media messages={mediaFiles} id={ticketId} />
          </Box>
        </Tabs.Panel>

        <Tabs.Panel value="quality_control">
          <Box p="md">
            <QualityControlForm
              key={`quality-${ticketId}-${JSON.stringify(formData.quality)}`}
              formInstance={form}
              data={formData.quality}
              onSubmit={(values) => handleSaveTicketExtraDate(values)}
            />
          </Box>
        </Tabs.Panel>
      </Tabs>
    </ScrollArea >
  );
};

export default ChatExtraInfo;
