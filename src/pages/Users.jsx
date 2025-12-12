import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Container,
  TextInput,
  Button,
  Menu,
  ActionIcon,
  Text,
  Badge,
  Stack,
  Flex,
} from "@mantine/core";
import { IoMdAdd } from "react-icons/io";
import { LuFilter } from "react-icons/lu";
import { BsThreeDots } from "react-icons/bs";
import { useSnackbar } from "notistack";
import { api } from "@api";
import { getLanguageByKey } from "../Components/utils/getLanguageByKey";
import { PageHeader } from "@components";
import UserModal from "../Components/UsersComponent/UserModal";
import UserList from "../Components/UsersComponent/UserList";
import EditGroupsListModal from "../Components/UsersComponent/GroupsUsers/EditGroupsListModal";
import CreatePermissionGroupModal from "../Components/UsersComponent/Roles/CreatePermissionGroupModal";
import UserFilterModal from "../Components/UsersComponent/UserFilterModal";
import { useUser, useMobile } from "@hooks";
import { hasStrictPermission } from "../Components/utils/permissions";

export const Users = () => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const { userRoles } = useUser();
  const isMobile = useMobile();
  const canCreateUser = hasStrictPermission(userRoles, "USERS", "CREATE", "ALLOWED");
  const canEdit = hasStrictPermission(userRoles, "USERS", "EDIT", "ALLOWED");

  const [editUser, setEditUser] = useState(null);
  const [modals, setModals] = useState({
    user: false,
    groups: false,
    permissions: false,
    filter: false,
  });

  const [filters, setFilters] = useState({});
  const { enqueueSnackbar } = useSnackbar();

  const hasActiveFilters =
    (filters.group?.length || 0) > 0 ||
    (filters.role?.length || 0) > 0 ||
    !!filters.status ||
    !!filters.functie ||
    !!filters.department;

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.users.getTechnicianList();

      const normalized = response.map((item) => {
        const user = item.user || {};

        return {
          id: item.id,
          name: item.name || "-",
          surname: item.surname || "-",
          username: user.username || "-",
          email: user.email || "-",
          groups: item.groups || [],
          jobTitle: item.job_title,
          department: item.department,
          status: item.status,
          permissions: item.permissions || [],
          rawRoles: user.roles || "[]",
          sipuni_id: item.sipuni_id,
          scheduleGroups: item.scheduleGroups || [],
          import_success: item.import_success,
          imported: item.imported,
          email_confirmed: user.email_confirmed,
        };
      });

      setUsers(normalized);
    } catch (err) {
      enqueueSnackbar(
        getLanguageByKey("Eroare la încărcarea utilizatorilor"),
        { variant: "error" }
      );
    } finally {
      setLoading(false);
    }
  }, [enqueueSnackbar]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const filtered = useMemo(() => {
    const term = search.toLowerCase().trim();
    const searchWords = term.split(/\s+/).filter(word => word.length > 0);
    const filtersSafe = {
      group: filters.group || [],
      role: filters.role || [],
      status: filters.status || null,
      functie: filters.functie || null,
      department: filters.department || null,
    };

    return users.filter((user) => {
      let matchesSearch;
      
      // Если поисковый запрос пустой, показываем всех пользователей
      if (!term) {
        matchesSearch = true;
      } else {
        // Создаем комбинированную строку из всех полей пользователя
        const userFullText = [
          user.name || "",
          user.surname || "",
          user.username || "",
          user.email || "",
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        // Если поиск состоит из нескольких слов, проверяем что все слова найдены
        if (searchWords.length > 1) {
          matchesSearch = searchWords.every(word => userFullText.includes(word));
        } else {
          // Для одного слова ищем в любом поле
          matchesSearch = userFullText.includes(term);
        }
      }

      const matchesGroup =
        filtersSafe.group.length === 0 ||
        user.groups.some((g) => filtersSafe.group.includes(g.name));

      const matchesRole =
        filtersSafe.role.length === 0 ||
        user.permissions.some((p) => filtersSafe.role.includes(p.name));

      const matchesStatus =
        !filtersSafe.status ||
        (filtersSafe.status === "active" && user.status) ||
        (filtersSafe.status === "inactive" && !user.status);

      const matchesJob =
        !filtersSafe.functie || user.jobTitle === filtersSafe.functie;

      const matchesDepartment =
        !filtersSafe.department || user.department === filtersSafe.department;

      return (
        matchesSearch &&
        matchesGroup &&
        matchesRole &&
        matchesStatus &&
        matchesJob &&
        matchesDepartment
      );
    });
  }, [users, search, filters]);

  return (
    <Container 
      size="xxl" 
      style={{ 
        height: "100%",
        padding: "20px",
        paddingTop: isMobile ? "80px" : "20px"
      }}
    >
      {isMobile ? (
        <Stack gap="md" mb="md">
          {/* Первый ряд: Заголовок, счетчик, три точки, фильтр */}
          <Flex align="center" justify="space-between" w="100%">
            <Flex align="center" gap="8">
              <Text fw={700} size="lg">
                {getLanguageByKey("Utilizatori")}
              </Text>
              <Badge size="md" bg="#0f824c">
                {filtered.length}
              </Badge>
            </Flex>
            <Flex align="center" gap="sm">
              {canEdit && (
                <Menu shadow="md" width={200}>
                  <Menu.Target>
                    <ActionIcon size="md" variant="default">
                      <BsThreeDots />
                    </ActionIcon>
                  </Menu.Target>
                  <Menu.Dropdown>
                    <Menu.Item onClick={() => setModals((m) => ({ ...m, groups: true }))}>
                      {getLanguageByKey("Editează grupurile")}
                    </Menu.Item>
                    <Menu.Item onClick={() => setModals((m) => ({ ...m, permissions: true }))}>
                      {getLanguageByKey("Editează rolurile")}
                    </Menu.Item>
                  </Menu.Dropdown>
                </Menu>
              )}
              <ActionIcon
                onClick={() => setModals((m) => ({ ...m, filter: true }))}
                variant={hasActiveFilters ? "filled" : "default"}
                color={hasActiveFilters ? "custom" : "gray"}
                size="md"
              >
                <LuFilter size={16} />
              </ActionIcon>
            </Flex>
          </Flex>

          {/* Второй ряд: Поиск */}
          <TextInput
            placeholder={getLanguageByKey("Căutare utilizator")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            w="100%"
            autoComplete="off"
          />

          {/* Третий ряд: Кнопка добавления */}
          {canCreateUser && (
            <Button
              leftSection={<IoMdAdd size={16} />}
              onClick={() => {
                setEditUser(null);
                setModals((m) => ({ ...m, user: true }));
              }}
              w="100%"
            >
              {getLanguageByKey("Adaugă utilizator")}
            </Button>
          )}
        </Stack>
      ) : (
        <PageHeader
          title={getLanguageByKey("Utilizatori")}
          count={filtered.length}
          extraInfo={
            <>
              {canEdit && (
                <Menu shadow="md" width={200}>
                  <Menu.Target>
                    <ActionIcon size="lg" variant="default">
                      <BsThreeDots />
                    </ActionIcon>
                  </Menu.Target>
                  <Menu.Dropdown>
                    <Menu.Item onClick={() => setModals((m) => ({ ...m, groups: true }))}>
                      {getLanguageByKey("Editează grupurile")}
                    </Menu.Item>
                    <Menu.Item onClick={() => setModals((m) => ({ ...m, permissions: true }))}>
                      {getLanguageByKey("Editează rolurile")}
                    </Menu.Item>
                  </Menu.Dropdown>
                </Menu>
              )}
              <ActionIcon
                onClick={() => setModals((m) => ({ ...m, filter: true }))}
                variant={hasActiveFilters ? "filled" : "default"}
                color={hasActiveFilters ? "custom" : "gray"}
                size="36"
              >
                <LuFilter size={16} />
              </ActionIcon>

              <TextInput
                placeholder={getLanguageByKey("Căutare utilizator")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="min-w-300"
                autoComplete="off"
              />

              {canCreateUser && (
                <Button
                  leftSection={<IoMdAdd size={16} />}
                  onClick={() => {
                    setEditUser(null);
                    setModals((m) => ({ ...m, user: true }));
                  }}
                >
                  {getLanguageByKey("Adaugă utilizator")}
                </Button>
              )}
            </>
          }
        />
      )}

      <UserList
        users={filtered}
        loading={loading}
        fetchUsers={loadUsers}
        openEditUser={(user) => {
          setEditUser(user);
          setModals((m) => ({ ...m, user: true }));
        }}
      />

      <UserModal
        opened={modals.user}
        onClose={() => {
          setModals((m) => ({ ...m, user: false }));
          setEditUser(null);
        }}
        initialUser={editUser}
        onUserCreated={loadUsers}
      />

      <EditGroupsListModal
        opened={modals.groups}
        onClose={() => setModals((m) => ({ ...m, groups: false }))}
      />

      <CreatePermissionGroupModal
        opened={modals.permissions}
        onClose={() => setModals((m) => ({ ...m, permissions: false }))}
      />

      <UserFilterModal
        opened={modals.filter}
        onClose={() => setModals((m) => ({ ...m, filter: false }))}
        users={users}
        onApply={setFilters}
      />
    </Container>
  );
};
