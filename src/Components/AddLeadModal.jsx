import {
  Flex,
  TextInput,
  NumberInput,
  Select,
  Textarea,
  TagsInput,
  Button
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import { useEffect, useContext } from "react";
import { useSnackbar } from "notistack";
import { getLanguageByKey, showServerError } from "@utils";
import { priorityOptions, groupTitleOptions } from "../FormOptions";
import { api } from "@api";
import { useUser } from "@hooks";
import { UserContext } from "../contexts/UserContext";
import { useNavigate } from "react-router-dom";

export const AddLeadModal = ({
  open,
  onClose,
  selectedGroupTitle,
  fetchTickets,
}) => {
  const { userId } = useUser();
  const { enqueueSnackbar } = useSnackbar();
  const [loading, handlers] = useDisclosure(false);
  const { workflowOptions, groupTitleForApi } = useContext(UserContext);
  const navigate = useNavigate();

  const form = useForm({
    mode: "uncontrolled",
    validate: (values) => {
      const errors = {};
      const isContract = values.workflow === "Contract încheiat";

      if (!values.workflow) {
        errors.workflow = getLanguageByKey("fileIsMandatory");
      }

      if (isContract) {
        if (!values.name || values.name.length < 3) {
          errors.name = getLanguageByKey("mustBeAtLeast3Characters");
        }
        if (!values.surname || values.surname.length < 3) {
          errors.surname = getLanguageByKey("mustBeAtLeast3Characters");
        }
      }

      return errors;
    },
  });

  const createTicket = async (values) => {
    handlers.open();
    try {
      const response = await api.tickets.createTickets({
        ...values,
        technician_id: userId,
      });

      form.reset();
      await fetchTickets();
      onClose();
      if (response?.ticket_id) {
        navigate(`/leads/${response.ticket_id}`);
      }
    } catch (e) {
      enqueueSnackbar(showServerError(e), { variant: "error" });
    } finally {
      handlers.close();
    }
  };

  useEffect(() => {
    if (selectedGroupTitle) {
      form.setFieldValue("group_title", selectedGroupTitle);
    } else {
      form.setFieldValue("group_title", groupTitleForApi);
    }
  }, [selectedGroupTitle, groupTitleForApi]);

  return (
    <form onSubmit={form.onSubmit(createTicket)}>
      <Flex gap="md">
        <TextInput
          w="100%"
          label={getLanguageByKey("Nume")}
          placeholder={getLanguageByKey("Nume")}
          key={form.key("name")}
          {...form.getInputProps("name")}
        />
        <TextInput
          w="100%"
          label={getLanguageByKey("Prenume")}
          placeholder={getLanguageByKey("Prenume")}
          key={form.key("surname")}
          {...form.getInputProps("surname")}
        />
      </Flex>

      <Flex gap="md">
        <TextInput
          type="email"
          w="100%"
          label={getLanguageByKey("Email")}
          placeholder={getLanguageByKey("Email")}
          key={form.key("email")}
          {...form.getInputProps("email")}
        />
        <NumberInput
          hideControls
          w="100%"
          label={getLanguageByKey("Telefon")}
          placeholder={getLanguageByKey("Telefon")}
          key={form.key("phone")}
          {...form.getInputProps("phone")}
        />
      </Flex>

      <Flex gap="md">
        <TextInput
          w="100%"
          label={getLanguageByKey("Contact")}
          placeholder={getLanguageByKey("Contact")}
          key={form.key("contact")}
          {...form.getInputProps("contact")}
        />

        <Select
          disabled
          value={form.values.group_title || selectedGroupTitle || groupTitleForApi}
          placeholder={getLanguageByKey("selectGroup")}
          w="100%"
          label={getLanguageByKey("Grup")}
          data={groupTitleOptions}
          key={form.key("group_title")}
          onChange={(value) => form.setFieldValue("group_title", value)}
        />
      </Flex>

      <Flex gap="md">
        <Select
          data={priorityOptions}
          w="100%"
          label={getLanguageByKey("Prioritate")}
          placeholder={getLanguageByKey("Selectează prioritate")}
          key={form.key("priority")}
          {...form.getInputProps("priority")}
          disabled
        />

        <Select
          w="100%"
          label={getLanguageByKey("Workflow")}
          placeholder={getLanguageByKey("Selectează flux de lucru")}
          data={workflowOptions.map((step, index) => ({ 
            value: step, 
            label: step,
            disabled: index !== 0 
          }))}
          key={form.key("workflow")}
          {...form.getInputProps("workflow")}
        />
      </Flex>

      <TagsInput
        label={getLanguageByKey("tags")}
        placeholder={getLanguageByKey("tags")}
        clearable
        key={form.key("tags")}
        {...form.getInputProps("tags")}
      />

      <Textarea
        autosize
        minRows={4}
        label={getLanguageByKey("Descriere")}
        placeholder={getLanguageByKey("Descriere")}
        key={form.key("description")}
        {...form.getInputProps("description")}
      />

      <Flex justify="end" mt="md" gap="md">
        <Button onClick={onClose} variant="outline">
          {getLanguageByKey("Anulează")}
        </Button>
        <Button loading={loading} type="submit">
          {getLanguageByKey("Creează")}
        </Button>
      </Flex>
    </form>
  );
};
