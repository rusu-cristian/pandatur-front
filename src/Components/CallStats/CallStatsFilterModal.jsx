import { useState, useEffect, useMemo } from "react";
import { Modal, Button, Flex, Select, Group } from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import dayjs from "dayjs";
import { Spin } from "@components";
import { getLanguageByKey } from "../utils";
import { formatMultiSelectData } from "../utils/multiSelectUtils";
import { UserGroupMultiSelect } from "../ChatComponent/components/UserGroupMultiSelect/UserGroupMultiSelect";

export const CallStatsFilterModal = ({
    opened,
    onClose,
    onApply,
    initialFilters = {},
    technicians = [],
    mode = "stats",
    loading = false,
}) => {
    const formattedTechs = useMemo(() => formatMultiSelectData(technicians), [technicians]);
    const [selectedTechnicians, setSelectedTechnicians] = useState(initialFilters.user_id || []);
    const [status, setStatus] = useState(initialFilters.status || "");
    const [dateFrom, setDateFrom] = useState(initialFilters.date_from || null);
    const [dateTo, setDateTo] = useState(initialFilters.date_to || null);
    const [searchPhone, setSearchPhone] = useState(initialFilters.search || "");

    useEffect(() => {
        setSelectedTechnicians(initialFilters.user_id || []);
        setStatus(initialFilters.status || "");
        setDateFrom(initialFilters.date_from || null);
        setDateTo(initialFilters.date_to || null);
        setSearchPhone(initialFilters.search || "");
    }, [opened, initialFilters]);

    const filteredValues = useMemo(
        () => selectedTechnicians.filter(
            v => formattedTechs.some(t => t.value === v && !t.value.startsWith("__group__"))
        ),
        [selectedTechnicians, formattedTechs]
    );

    const handleApply = () => {
        const filters = {};
        if (filteredValues.length) filters.user_id = filteredValues;
        if (mode === "calls" && searchPhone.trim()) filters.search = searchPhone.trim();
        if (mode === "calls" && status) filters.status = status;

        if (dateFrom || dateTo) {
            filters.timestamp = {};
            if (dateFrom) filters.timestamp.from = dayjs(dateFrom).format("DD-MM-YYYY");
            if (dateTo) filters.timestamp.until = dayjs(dateTo).format("DD-MM-YYYY");
        }

        onApply(filters);
        onClose();
    };

    const handleReset = () => {
        setSelectedTechnicians([]);
        setStatus("");
        setDateFrom(null);
        setDateTo(null);
        setSearchPhone("");
        onApply({});
        onClose();
    };

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title={getLanguageByKey("FilterCalls")}
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
            <Flex direction="column" style={{ height: "100%" }}>
                {loading ? (
                    <Flex align="center" justify="center" style={{ flex: 1 }}>
                        <Spin />
                    </Flex>
                ) : (
                    <Flex direction="column" gap={16} style={{ flex: 1, overflowY: "auto" }}>
                        <UserGroupMultiSelect
                            label={getLanguageByKey("Users")}
                            placeholder={getLanguageByKey("SelectTechnicians")}
                            value={filteredValues}
                            onChange={setSelectedTechnicians}
                            techniciansData={formattedTechs}
                            mode="multi"
                        />

                        {mode === "calls" && (
                            <>
                                <Select
                                    label={getLanguageByKey("Status")}
                                    data={[
                                        { value: "ANSWER", label: getLanguageByKey("Answered") },
                                        { value: "NOANSWER", label: getLanguageByKey("NoAnswer") }
                                    ]}
                                    value={["ANSWER", "NOANSWER"].includes(status) ? status : ""}
                                    onChange={(val) => setStatus(val || "")}
                                    clearable
                                    searchable={false}
                                    placeholder={getLanguageByKey("SelectStatus")}
                                    size="xs"
                                />
                            </>
                        )}

                        <Flex gap={12}>
                            <DatePickerInput
                                label={getLanguageByKey("DateFrom")}
                                value={dateFrom}
                                onChange={setDateFrom}
                                placeholder="DD.MM.YYYY"
                                style={{ flex: 1 }}
                                size="xs"
                            />
                            <DatePickerInput
                                label={getLanguageByKey("DateTo")}
                                value={dateTo}
                                onChange={setDateTo}
                                placeholder="DD.MM.YYYY"
                                style={{ flex: 1 }}
                                size="xs"
                            />
                        </Flex>
                    </Flex>
                )}
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
