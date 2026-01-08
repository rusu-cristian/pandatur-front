import React, { useEffect, useState } from "react";
import {
  Card,
  Text,
  Stack,
  Button,
  Group,
  Badge,
  Avatar,
  Tooltip,
  ActionIcon,
  ScrollArea,
  Loader,
  TextInput,
} from "@mantine/core";
import { IoSearch } from "react-icons/io5";
import { groupSchedules } from "../../api/groupSchedules";
import ScheduleView from "./ScheduleView";
import { useSnackbar } from "notistack";
import { FaTrash, FaEdit } from "react-icons/fa";
import { translations } from "../utils/translations";
import ModalGroup from "./ModalGroup";
import { useConfirmPopup, useGetTechniciansList } from "../../hooks";
import Can from "../CanComponent/Can";

const language = localStorage.getItem("language") || "RO";

const SchedulesGroupList = ({ reload, setInGroupView }) => {
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [editOpened, setEditOpened] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [loadingGroup, setLoadingGroup] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { enqueueSnackbar } = useSnackbar();
  const confirmDelete = useConfirmPopup({ loading: false });
  const { technicians } = useGetTechniciansList();

  const fetchData = async () => {
    try {
      const groupData = await groupSchedules.getAllGroups();

      const formattedGroups = groupData.map((group) => ({
        id: group.id,
        name: group.name,
        user_ids: group.user_ids,
        supervisor_id: group.supervisor_id,
      }));

      // Сортируем группы по имени в алфавитном порядке
      const sortedGroups = formattedGroups.sort((a, b) =>
        a.name.localeCompare(b.name)
      );

      setGroups(sortedGroups);
    } catch (err) {
      enqueueSnackbar(translations["Eroare la încărcare"][language], {
        variant: "error",
      });
    }
  };

  useEffect(() => {
    fetchData();
  }, [reload]);

  const handleGroupClick = async (group) => {
    try {
      setLoadingGroup(true);
      const usersInGroup = await groupSchedules.getTechniciansInGroup(group.id);

      const fullGroup = {
        ...group,
        user_ids: usersInGroup.map((u) => u.id),
        supervisor_id: usersInGroup.find((u) => u.is_supervisor)?.id || null,
        users: usersInGroup,
      };

      setSelectedGroup(fullGroup);
      setInGroupView?.(true);
    } catch (err) {
      enqueueSnackbar("Eroare la încărcare utilizatori grup", {
        variant: "error",
      });
    } finally {
      setLoadingGroup(false);
    }
  };

  const handleBack = () => {
    setSelectedGroup(null);
    setInGroupView?.(false);
  };

  const handleClickDelete = (group) => {
    setEditingGroup(group);
    confirmDelete(() => handleDelete(group.id));
  };

  const handleDelete = async (id) => {
    try {
      await groupSchedules.deleteGroup(id);
      fetchData();
      enqueueSnackbar(translations["Grupul a fost șters"][language], {
        variant: "success",
      });
    } catch (err) {
      enqueueSnackbar(translations["Eroare la ștergere"][language], {
        variant: "error",
      });
    }
  };

  const handleEdit = async (group) => {
    const usersInGroup = await groupSchedules.getTechniciansInGroup(group.id);

    setEditingGroup({
      ...group,
      user_ids: usersInGroup.map((u) => u.id),
      supervisor_id: usersInGroup.find((u) => u.is_supervisor)?.id || null,
    });
    setEditOpened(true);
  };

  const handleGroupUpdate = async (updatedGroup) => {
    try {
      const usersInGroup = await groupSchedules.getTechniciansInGroup(updatedGroup.id);

      const updatedSelectedGroup = {
        ...updatedGroup,
        user_ids: usersInGroup.map((u) => u.id),
      };

      setSelectedGroup(updatedSelectedGroup);
      fetchData();
    } catch (err) {
      enqueueSnackbar(translations["Eroare la actualizarea grupului"][language], {
        variant: "error",
      });
    }
  };

  if (selectedGroup) {
    return (
      <div>
        <Button size="xs" onClick={handleBack} mb="sm">
          ← {translations["Înapoi la grupuri"][language]}
        </Button>
        <ScheduleView
          groupId={selectedGroup.id}
          groupName={selectedGroup.name}
          groupUsers={selectedGroup.users}
          onGroupUpdate={handleGroupUpdate}
        />
      </div>
    );
  }

  // Фильтруем группы по поисковому запросу
  const filteredGroups = groups.filter((group) =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      {loadingGroup ? (
        <Group position="center" mt="xl">
          <Loader />
        </Group>
      ) : (
        <>
          <TextInput
            size="xs"
            placeholder={translations["Căutare grup"][language] || "Căutare grup"}
            leftSection={<IoSearch size={14} />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            mb="sm"
            style={{ maxWidth: 250 }}
          />
          <ScrollArea h="calc(85vh)" type="auto">
            <Stack spacing="xs">
              {filteredGroups.map((group) => {
              const groupUsers = technicians.filter((u) =>
                group.user_ids.includes(u.id)
              );

              return (
                <Card
                  key={group.id}
                  shadow="xs"
                  padding="sm"
                  radius="sm"
                  withBorder
                  className="group-card"
                >
                  <Group position="apart" align="start">
                    <div
                      style={{ flex: 1, cursor: "pointer" }}
                      onClick={() => handleGroupClick(group)}
                    >
                      <Group spacing="xs" mb={6}>
                        <Text size="sm" fw={600}>
                          {group.name}
                        </Text>
                        <Badge size="xs" color="blue" variant="light">
                          {translations["Pentru o săptămână"][language]}
                        </Badge>
                      </Group>

                      <Tooltip.Group openDelay={300} closeDelay={100}>
                        <Avatar.Group spacing="xs">
                          {groupUsers.slice(0, 5).map((u) => (
                            <Tooltip
                              label={
                                u.username ||
                                `${u.name || ""} ${u.surname || ""}`.trim()
                              }
                              withArrow
                              key={u.id}
                            >
                              <Avatar
                                size="sm"
                                radius="xl"
                                src={u.photo || undefined}
                                color="blue"
                              >
                                {(u.username || u.name?.[0] || "?").toUpperCase()}
                              </Avatar>
                            </Tooltip>
                          ))}
                          {groupUsers.length > 5 && (
                            <Tooltip
                              withArrow
                              label={
                                <>
                                  {groupUsers.slice(5).map((u) => (
                                    <div key={u.id}>
                                      {u.username || `${u.name} ${u.surname}`}
                                    </div>
                                  ))}
                                </>
                              }
                            >
                              <Avatar size="sm" radius="xl" color="blue">
                                +{groupUsers.length - 5}
                              </Avatar>
                            </Tooltip>
                          )}
                        </Avatar.Group>
                      </Tooltip.Group>
                    </div>

                    <Group gap="xs">
                      <Can
                        permission={{ module: "schedules", action: "edit" }}
                        context={{ responsibleId: group.supervisor_id }}
                      >
                        <ActionIcon
                          size="sm"
                          color="blue"
                          variant="light"
                          onClick={() => handleEdit(group)}
                        >
                          <FaEdit size={12} />
                        </ActionIcon>
                      </Can>

                      <Can
                        permission={{ module: "schedules", action: "delete" }}
                        context={{ responsibleId: group.supervisor_id }}
                      >
                        <ActionIcon
                          size="sm"
                          color="red"
                          variant="light"
                          onClick={() => handleClickDelete(group)}
                        >
                          <FaTrash size={12} />
                        </ActionIcon>
                      </Can>
                    </Group>
                  </Group>
                </Card>
              );
            })}
            </Stack>
          </ScrollArea>
        </>
      )}

      <ModalGroup
        opened={editOpened}
        onClose={() => setEditOpened(false)}
        onGroupCreated={fetchData}
        initialData={editingGroup}
        isEditMode
      />
    </>
  );
};

export default SchedulesGroupList;
