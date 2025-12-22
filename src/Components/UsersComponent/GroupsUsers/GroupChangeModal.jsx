import { Modal, Select, Button, Stack, Loader, Text } from "@mantine/core";
import { useEffect, useState } from "react";
import { api } from "../../../api";
import { translations } from "../../utils/translations";
import { useSnackbar } from "notistack";

const language = localStorage.getItem("language") || "RO";

const GroupChangeModal = ({ opened, onClose, onConfirm }) => {
  const { enqueueSnackbar } = useSnackbar();
  const [selectedGroup, setSelectedGroup] = useState("");
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchGroups = async () => {
      setLoading(true);
      try {
        const data = await api.user.getGroupsList();
        setGroups(data);
      } catch (err) {
        console.error("error fetch groups", err);
        enqueueSnackbar(
          translations["Eroare la încărcarea grupurilor de utilizatori"][language],
          { variant: "error" }
        );
      } finally {
        setLoading(false);
      }
    };

    if (opened) fetchGroups();
    if (!opened) setSelectedGroup("");
  }, [opened]);

  const handleConfirm = () => {
    if (selectedGroup) {
      onConfirm(selectedGroup);
      onClose();
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={translations["Schimbă grupul"][language]}
      centered
    >
      <Stack>
        <Select
          label={translations["Alege grupul"][language]}
          placeholder={translations["Alege grupul"][language]}
          data={groups.map((g) => ({ value: g.name, label: g.name }))}
          value={selectedGroup}
          onChange={setSelectedGroup}
          rightSection={loading ? <Loader size={16} /> : null}
          disabled={loading}
          nothingFound={translations["Nu există grupuri"][language]}
        />

        {groups.length === 0 && !loading && (
          <Text align="center" size="sm">
            {translations["Nu există grupuri"][language]}
          </Text>
        )}

        <Button
          onClick={handleConfirm}
          disabled={!selectedGroup || loading}
          loading={loading}
        >
          {translations["Confirma"][language]}
        </Button>
      </Stack>
    </Modal>
  );
};

export default GroupChangeModal;
