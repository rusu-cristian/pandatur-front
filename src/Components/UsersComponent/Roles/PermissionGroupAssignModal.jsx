import { Modal, Select, Button, Stack, Loader, Text } from "@mantine/core";
import { useEffect, useState } from "react";
import { api } from "../../../api";
import { translations } from "../../utils/translations";
import { useSnackbar } from "notistack";

const language = localStorage.getItem("language") || "RO";

const PermissionGroupAssignModal = ({ opened, onClose, onConfirm }) => {
  const { enqueueSnackbar } = useSnackbar();
  const [permissionGroup, setPermissionGroup] = useState("");
  const [permissionGroups, setPermissionGroups] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleClose = () => {
    setPermissionGroup("");
    onClose();
  };

  useEffect(() => {
    const fetchPermissionGroups = async () => {
      setLoading(true);
      try {
        const data = await api.permissions.getAllPermissionGroups();
        setPermissionGroups(data);
      } catch (err) {
        enqueueSnackbar(
          translations["Eroare la încărcarea grupurilor de permisiuni"][language],
          { variant: "error" }
        );
      } finally {
        setLoading(false);
      }
    };

    if (opened) fetchPermissionGroups();
  }, [opened]);

  const handleConfirm = () => {
    if (permissionGroup) {
      onConfirm(permissionGroup);
      setPermissionGroup("");
      onClose();
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={translations["Atribuiți grupul de permisiuni"][language]}
      centered
    >
      <Stack>
        <Select
          label={translations["Alege grupul de permisiuni"][language]}
          placeholder={translations["Alege grupul de permisiuni"][language]}
          data={permissionGroups.map((g) => ({
            value: g.permission_id.toString(),
            label: g.permission_name,
          }))}
          value={permissionGroup}
          onChange={setPermissionGroup}
          rightSection={loading ? <Loader size={16} /> : null}
          disabled={loading}
        />

        {!loading && permissionGroups.length === 0 && (
          <Text align="center">
            {translations["Nu există grupuri de permisiuni"][language]}
          </Text>
        )}

        <Button
          onClick={handleConfirm}
          disabled={!permissionGroup || loading}
          loading={loading}
        >
          {translations["Confirma"][language]}
        </Button>
      </Stack>
    </Modal>
  );
};

export default PermissionGroupAssignModal;
