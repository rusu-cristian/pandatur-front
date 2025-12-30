import { useEffect, useState, useMemo } from "react";
import { useSnackbar } from "notistack";
import { Button, Modal, MultiSelect, Select } from "../UI";
import { translations } from "../utils";
import { api } from "../../api";
import "./UserFilterModal.css";

const language = localStorage.getItem("language") || "RO";

const createEmptyFilters = () => ({
  group: [],
  role: [],
  status: null,
  functie: null,
});

/**
 * User Filter Modal (Refactored)
 * Uses custom UI components instead of Mantine
 */
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
    <Modal opened={opened} onClose={onClose} title={translations["Filtru"][language]} size="md" centered>
      <div className="user-filter-modal">
        <div className="user-filter-content">
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
        </div>

        <div className="user-filter-footer">
          <Button variant="outline" onClick={resetFilters}>
            {translations["Reset filtru"][language]}
          </Button>
          <Button onClick={applyFilters}>
            {translations["Aplică"][language]}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default UserFilterModal;
