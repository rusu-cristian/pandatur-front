import { useForm } from "@mantine/form";
import { useMemo } from "react";
import { Modal, Button, Flex, MultiSelect, TextInput } from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import dayjs from "dayjs";
import { getLanguageByKey } from "../utils";
import { useGetTechniciansList } from "../../hooks";
import { formatMultiSelectData } from "../utils/multiSelectUtils";
import { UserGroupMultiSelect } from "../ChatComponent/components/UserGroupMultiSelect/UserGroupMultiSelect";

const TYPE_OPTIONS = [
    "User logged-in",
    "User logged-out",
    "User created",
    "User updated",
    "User deleted",
    "Lead created",
    "Lead deleted",
    "Lead updated",
    "Lead merged",
    "Task created",
    "Task deleted",
    "Task updated",
    "Task completed",
    "Client created",
    "Client updated",
    "Message received",
    "Message sent",
    "Message 24h error",
    "Message error",
];

const EVENT_OPTIONS = [
    "User",
    "Lead",
    "Task",
    "Client",
    "Chat",
];

export const LogFilterModal = ({ opened, onClose, filters = {}, onApply }) => {
    const { technicians, loading: loadingTechnicians } = useGetTechniciansList();
    const formattedTechnicians = useMemo(() => formatMultiSelectData(technicians), [technicians]);

    const form = useForm({
        initialValues: {
            user_id: filters.user_id || [],
            user_identifier: filters.user_identifier || "",
            event: filters.event || [],
            type: filters.type || [],
            ip_address: filters.ip_address || "",
            timestamp_from: filters.timestamp_from || null,
            timestamp_to: filters.timestamp_to || null,
            data_changes_key: filters.data_changes?.key || "",
            data_changes_before: filters.data_changes?.before_value || "",
            data_changes_after: filters.data_changes?.after_value || "",
        },
    });

    const handleSubmit = (values) => {
        const attributes = {};

        if (values.user_id && values.user_id.length) attributes.user_id = values.user_id.map(Number);
        if (values.user_identifier) attributes.user_identifier = values.user_identifier;
        if (values.event.length) attributes.event = values.event;
        if (values.type.length) attributes.type = values.type;
        if (values.ip_address) attributes.ip_address = values.ip_address;
        if (values.timestamp_to || values.timestamp_to) {
            attributes.timestamp = {};
            if (values.timestamp_from)
                attributes.timestamp.from = dayjs(values.timestamp_from).format("DD-MM-YYYY");
            if (values.timestamp_to)
                attributes.timestamp.to = dayjs(values.timestamp_to).format("DD-MM-YYYY");
        }
        if (values.data_changes_key) {
            attributes.data_changes = { key: values.data_changes_key };
            if (values.data_changes_before)
                attributes.data_changes.before_value = values.data_changes_before;
            if (values.data_changes_after)
                attributes.data_changes.after_value = values.data_changes_after;
        }

        onApply && onApply(attributes);
        onClose();
    };

    const handleReset = () => {
        form.reset();
        onApply && onApply({});
        onClose();
    };

    const translatedEventOptions = EVENT_OPTIONS.map(e => ({
        value: e,
        label: getLanguageByKey(e) || e,
    }));

    const translatedTypeOptions = TYPE_OPTIONS.map(e => ({
        value: e,
        label: getLanguageByKey(e) || e,
    }));

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title={getLanguageByKey("Log filter")}
            centered
            withCloseButton
            size="lg"
            styles={{
                content: {
                    height: "700px",
                    display: "flex",
                    flexDirection: "column",
                },
                body: {
                    flex: 1,
                    overflowY: "auto",
                    padding: "1rem"
                },
                title: {
                    color: "var(--crm-ui-kit-palette-text-primary)"
                }
            }}
        >
            <form
                onSubmit={form.onSubmit(handleSubmit)}
                style={{ display: "flex", flexDirection: "column", height: "100%" }}
            >
                <Flex direction="column" gap={12} style={{ flex: 1, overflowY: "auto" }}>
                    <UserGroupMultiSelect
                        label={getLanguageByKey("Users")}
                        placeholder={getLanguageByKey("Users")}
                        value={form.values.user_id}
                        onChange={(value) => form.setFieldValue("user_id", value)}
                        techniciansData={formattedTechnicians}
                        mode="multi"
                        disabled={loadingTechnicians}
                        size="xs"
                    />
                    <MultiSelect
                        data={translatedEventOptions}
                        label={getLanguageByKey("Events")}
                        placeholder={getLanguageByKey("Select events")}
                        {...form.getInputProps("event")}
                        searchable
                        clearable
                        size="xs"
                    />
                    <MultiSelect
                        data={translatedTypeOptions}
                        label={getLanguageByKey("Types")}
                        placeholder={getLanguageByKey("Select type")}
                        {...form.getInputProps("type")}
                        searchable
                        clearable
                        size="xs"
                    />
                    <Flex gap={8} direction="row">
                        <DatePickerInput
                            label={getLanguageByKey("Date from")}
                            placeholder={getLanguageByKey("Start date")}
                            {...form.getInputProps("timestamp_from")}
                            valueFormat="DD-MM-YYYY"
                            style={{ flex: 1 }}
                            clearable
                            size="xs"
                        />
                        <DatePickerInput
                            label={getLanguageByKey("Date to")}
                            placeholder={getLanguageByKey("End date")}
                            {...form.getInputProps("timestamp_to")}
                            valueFormat="DD-MM-YYYY"
                            style={{ flex: 1 }}
                            clearable
                            size="xs"
                        />
                    </Flex>
                    <Flex gap={8}>
                        <TextInput
                            label={getLanguageByKey("Changed field (key)") || "Changed field (key)"}
                            placeholder={getLanguageByKey("Field name (example: status)") || "Field name (example: status)"}
                            {...form.getInputProps("data_changes_key")}
                            style={{ flex: 1 }}
                            size="xs"
                        />
                        <TextInput
                            label={getLanguageByKey("Before value") || "Before value"}
                            placeholder={getLanguageByKey("Old value (optional)") || "Old value (optional)"}
                            {...form.getInputProps("data_changes_before")}
                            style={{ flex: 1 }}
                            size="xs"
                        />
                        <TextInput
                            label={getLanguageByKey("After value") || "After value"}
                            placeholder={getLanguageByKey("New value (optional)") || "New value (optional)"}
                            {...form.getInputProps("data_changes_after")}
                            style={{ flex: 1 }}
                            size="xs"
                        />
                    </Flex>
                </Flex>

                <Flex
                    justify="flex-end"
                    gap={8}
                    pt={16}
                    pb={8}
                    style={{
                        borderTop: "1px solid var(--mantine-color-gray-3)",
                    }}
                >
                    <Button size="xs" variant="outline" onClick={handleReset}>
                        {getLanguageByKey("Reset")}
                    </Button>
                    <Button size="xs" type="submit">
                        {getLanguageByKey("Apply")}
                    </Button>
                </Flex>
            </form>
        </Modal>
    );
};
