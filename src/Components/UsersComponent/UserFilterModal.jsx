import { useEffect, useState, useMemo } from "react";
import { Button, Group, MultiSelect, Select, Flex, Modal } from "@mantine/core";
import { translations } from "../utils";
import { api } from "../../api";
import { useSnackbar } from "notistack";

const language = localStorage.getItem("language") || "RO";

const createEmptyFilters = () => ({
    group: [],
    role: [],
    status: null,
    functie: null,
});

const UserFilterModal = ({ opened, onClose, onApply, users }) => {
    const [filters, setFilters] = useState(() => createEmptyFilters());
    const [groupOptions, setGroupOptions] = useState([]);
    const [permissionOptions, setPermissionOptions] = useState([]);
    const { enqueueSnackbar } = useSnackbar();

    const functieOptions = useMemo(() => {
        return [...new Set(users.map((u) => u.jobTitle).filter(Boolean))];
    }, [users]);

    const statusOptions = [
        { value: "active", label: translations["Activ"][language] },
        { value: "inactive", label: translations["Inactiv"][language] },
    ];

    useEffect(() => {
        if (!opened) return;

        api.user
            .getGroupsList()
            .then((res) => {
                setGroupOptions(res.map((g) => ({ value: g.name, label: g.name })));
            })
            .catch(() => {
                enqueueSnackbar(translations["Eroare la încărcarea grupurilor"][language], {
                    variant: "error",
                });
            });

        api.permissions
            .getAllPermissionGroups()
            .then((res) => {
                setPermissionOptions(
                    res.map((p) => ({
                        value: p.permission_name,
                        label: p.permission_name,
                    }))
                );
            })
            .catch(() => {
                enqueueSnackbar(
                    translations["Eroare la încărcarea grupurilor existente"][language],
                    { variant: "error" }
                );
            });
    }, [opened, enqueueSnackbar]);

    const updateFilter = (key, value) => {
        setFilters((prev) => ({ ...prev, [key]: value }));
    };

    const resetFilters = () => {
        const nextFilters = createEmptyFilters();
        setFilters(nextFilters);
        onApply?.(nextFilters);
        onClose?.();
    };

    const applyFilters = () => {
        onApply(filters);
        onClose();
    };

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title={translations["Filtru"][language]}
            withCloseButton
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
                <Flex direction="column" gap="sm" style={{ flex: 1, overflowY: "auto", padding: "0.5rem" }}>
                    <MultiSelect
                        label={translations["Grup utilizator"][language]}
                        placeholder={translations["Alege grupul"][language]}
                        data={groupOptions}
                        value={Array.isArray(filters.group) ? filters.group : []}
                        onChange={(val) => updateFilter("group", val)}
                        clearable
                        searchable
                    />

                    <MultiSelect
                        label={translations["Grup permisiuni"][language]}
                        placeholder={translations["Alege grupul de permisiuni"][language]}
                        data={permissionOptions}
                        value={Array.isArray(filters.role) ? filters.role : []}
                        onChange={(val) => updateFilter("role", val)}
                        clearable
                        searchable
                    />

                    <Select
                        label={translations["Status"][language]}
                        placeholder={translations["Status"][language]}
                        data={statusOptions}
                        value={filters.status || null}
                        onChange={(val) => updateFilter("status", val)}
                        clearable
                        searchable
                    />

                    <Select
                        label={translations["Funcție"][language]}
                        placeholder={translations["Funcție"][language]}
                        data={functieOptions}
                        value={filters.functie || null}
                        onChange={(val) => updateFilter("functie", val)}
                        clearable
                        searchable
                    />
                </Flex>

                <Group pt={16} pb={8} justify="flex-end" style={{ borderTop: "1px solid var(--mantine-color-gray-3)", padding: "1rem 0.5rem 0.5rem" }}>
                    <Button variant="outline" onClick={resetFilters}>
                        {translations["Reset filtru"][language]}
                    </Button>
                    <Button onClick={applyFilters}>
                        {translations["Aplică"][language]}
                    </Button>
                </Group>
            </Flex>
        </Modal>
    );
};

export default UserFilterModal;
