import { useState, useEffect, useMemo } from "react";
import { Modal, Button, Flex, MultiSelect, TextInput, Group } from "@mantine/core";
import { getLanguageByKey } from "../utils";
import { useGetTechniciansList } from "../../hooks";
import { formatMultiSelectData } from "../utils/multiSelectUtils";
import { UserGroupMultiSelect } from "../ChatComponent/components/UserGroupMultiSelect/UserGroupMultiSelect";

const EVENT_OPTIONS = [
    { value: "Lead", label: "Lead" },
    { value: "Task", label: "Task" },
    { value: "Client", label: "Client" },
];

export const EventsFilterModal = ({
    opened,
    onClose,
    onApply,
    initialFilters = {},
    loading = false,
}) => {
    const defaultEvents = useMemo(() => ["Lead", "Task", "Client"], []);
    const { technicians = [] } = useGetTechniciansList();

    const formattedTechs = useMemo(() => formatMultiSelectData(technicians), [technicians]);

    const [event, setEvent] = useState(initialFilters.event?.length ? initialFilters.event : defaultEvents);
    const [selectedUsers, setSelectedUsers] = useState(initialFilters.user_id || []);
    const [user, setUser] = useState(initialFilters.user_identifier || "");
    const [ip, setIp] = useState(initialFilters.ip_address || "");
    const [objectId, setObjectId] = useState(initialFilters.object_id || "");

    useEffect(() => {
        setEvent(initialFilters.event?.length ? initialFilters.event : defaultEvents);
        setSelectedUsers(initialFilters.user_id || []);
        setUser(initialFilters.user_identifier || "");
        setIp(initialFilters.ip_address || "");
        setObjectId(initialFilters.object_id || "");
    }, [opened, initialFilters, defaultEvents]);

    const handleEventChange = (val) => {
        if (val.length === 0) return;
        setEvent(val);
    };

    const handleUsersChange = (val) => {
        // UserGroupMultiSelect уже обрабатывает группы, просто обновляем состояние
        setSelectedUsers(val);
    };

    const filteredUserValues = selectedUsers;

    const handleApply = () => {
        const filters = {};
        filters.event = event.length ? event : defaultEvents;
        if (filteredUserValues.length) filters.user_id = filteredUserValues;
        if (user.trim()) filters.user_identifier = user.trim();
        if (ip.trim()) filters.ip_address = ip.trim();
        if (objectId.trim()) filters["object.id"] = objectId.trim();
        onApply(filters);
        onClose();
    };

    const handleReset = () => {
        setEvent(defaultEvents);
        setSelectedUsers([]);
        setUser("");
        setIp("");
        setObjectId("");
        onApply({ event: defaultEvents });
        onClose();
    };

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title={getLanguageByKey("FilterEvents")}
            centered
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
            <Flex direction="column" style={{ height: "100%" }}>
                <Flex direction="column" gap={16} style={{ flex: 1, overflowY: "auto" }}>
                    <MultiSelect
                        label={getLanguageByKey("EventType") || "Тип события"}
                        data={EVENT_OPTIONS}
                        value={event}
                        onChange={handleEventChange}
                        searchable
                        clearable
                        size="xs"
                    />
                    <UserGroupMultiSelect
                        label={getLanguageByKey("Users")}
                        techniciansData={formattedTechs}
                        value={filteredUserValues}
                        onChange={handleUsersChange}
                        placeholder={getLanguageByKey("SelectTechnicians")}
                        mode="multi"
                        size="xs"
                    />
                    <TextInput
                        label={getLanguageByKey("IP Address")}
                        value={ip}
                        onChange={e => setIp(e.target.value)}
                        placeholder={getLanguageByKey("IP Address")}
                        size="xs"
                    />
                    <TextInput
                        label={getLanguageByKey("Object ID")}
                        value={objectId}
                        onChange={e => setObjectId(e.target.value)}
                        placeholder={getLanguageByKey("Object ID")}
                        size="xs"
                    />
                </Flex>
                <Group pt={16} pb={8} justify="flex-end" style={{ borderTop: "1px solid var(--mantine-color-gray-3)" }}>
                    <Button size="xs" variant="outline" onClick={handleReset}>
                        {getLanguageByKey("Reset")}
                    </Button>
                    <Button size="xs" onClick={handleApply}>
                        {getLanguageByKey("Apply")}
                    </Button>
                </Group>
            </Flex>
        </Modal>
    );
};
