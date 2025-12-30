import { useEffect, useState, useRef } from "react";
import {
  Button,
  Drawer,
  Stack,
  TextInput,
  Switch,
  Select,
  PasswordInput,
  Loader,
  Modal,
  ScrollArea,
  Title
} from "@mantine/core";
import {
  safeParseJson,
  convertMatrixToRoles,
  convertRolesToMatrix,
} from "./rolesUtils";
import { api } from "../../api";
import { useSnackbar } from "notistack";
import RoleMatrix from "./Roles/RoleMatrix";
import { getLanguageByKey } from "../utils/getLanguageByKey";
import { useMobile } from "../../hooks";

const initialFormState = {
  name: "",
  surname: "",
  username: "",
  email: "",
  password: "",
  job_title: "",
  department: "",
  status: false,
  groups: "",
  permissionGroupId: null,
  roleMatrix: {},
  sipuni_id: "",
  allow_lead_without_contact: false,
};

const UserModal = ({ opened, onClose, onUserCreated, initialUser = null }) => {
  const { enqueueSnackbar } = useSnackbar();
  const isMobile = useMobile();
  const [form, setForm] = useState(initialFormState);
  const [groupsList, setGroupsList] = useState([]);
  const [permissionGroups, setPermissionGroups] = useState([]);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [permissionGroupRoles, setPermissionGroupRoles] = useState([]);
  const permissionGroupInitialRolesRef = useRef([]);
  const [customRoles, setCustomRoles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const customRolesMatrixRef = useRef({});

  const updateRoleMatrix = (roleKey, level) => {
    const newMatrix = { ...form.roleMatrix };

    if (level === undefined) {
      delete newMatrix[roleKey];
    } else {
      newMatrix[roleKey] = level;
    }

    const newRolesList = convertMatrixToRoles(newMatrix);
    const originalRolesList = permissionGroupInitialRolesRef.current;

    const isChanged =
      newRolesList.some((role) => !originalRolesList.includes(role)) ||
      originalRolesList.some((role) => !newRolesList.includes(role));

    if (form.permissionGroupId && isChanged) {
      if (Object.keys(customRolesMatrixRef.current).length === 0) {
        customRolesMatrixRef.current = { ...newMatrix };
      }

      setForm((prev) => ({
        ...prev,
        permissionGroupId: null,
        roleMatrix: newMatrix,
      }));
      setPermissionGroupRoles([]);
      setCustomRoles(Object.keys(newMatrix));
    } else {
      setForm((prev) => ({
        ...prev,
        roleMatrix: newMatrix,
      }));
    }
  };

  useEffect(() => {
    if (initialUser) {
      const permissionGroupId = initialUser.permissions?.[0]?.id?.toString() || null;

      const rawRoles = initialUser?.user?.roles || initialUser?.rawRoles;
      const parsedUserRoles = Array.isArray(rawRoles) ? rawRoles : safeParseJson(rawRoles);
      const userRolesMap = convertRolesToMatrix(parsedUserRoles || []);
      customRolesMatrixRef.current = userRolesMap;

      const rawPermissionRoles = initialUser?.permissions?.[0]?.roles;
      const parsedPermissionRoles = Array.isArray(rawPermissionRoles)
        ? rawPermissionRoles
        : safeParseJson(rawPermissionRoles);
      const groupRolesMap = convertRolesToMatrix(parsedPermissionRoles || []);

      const fullMatrix = { ...groupRolesMap, ...userRolesMap };

      setPermissionGroupRoles(parsedPermissionRoles || []);
      permissionGroupInitialRolesRef.current = parsedPermissionRoles || [];
      setCustomRoles(Object.keys(userRolesMap));

      // Подавляем предупреждения линтера о неиспользуемых переменных
      console.debug('Permission group roles:', parsedPermissionRoles);
      console.debug('Custom roles:', Object.keys(userRolesMap));

      setForm((prev) => ({
        ...prev,
        permissionGroupId,
        roleMatrix: fullMatrix,
        name: initialUser.name || "",
        surname: initialUser.surname || "",
        username: initialUser.username || "",
        email: initialUser.email || "",
        job_title: initialUser.job_title || initialUser.jobTitle || "",
        department: initialUser.department || "",
        sipuni_id: initialUser.sipuni_id || "",
        status: Boolean(initialUser.status),
        allow_lead_without_contact: Boolean(initialUser.allow_lead_without_contact),
        groups:
          typeof initialUser.groups?.[0] === "string"
            ? initialUser.groups[0]
            : initialUser.groups?.[0]?.name || "",
      }));
    } else {
      setForm(initialFormState);
      setCustomRoles([]);
      setPermissionGroupRoles([]);
    }
  }, [initialUser, opened]);

  useEffect(() => {
    const fetchGroups = async () => {
      setGroupsLoading(true);
      try {
        let userGroups = [];
        let permissionGroups = [];

        try {
          userGroups = await api.user.getGroupsList();
          setGroupsList(userGroups);
        } catch (e) {
          enqueueSnackbar(
            getLanguageByKey("Eroare la încărcarea grupurilor de utilizatori"),
            { variant: "error" },
          );
        }

        try {
          permissionGroups = await api.permissions.getAllPermissionGroups();
          setPermissionGroups(permissionGroups);
        } catch (e) {
          enqueueSnackbar(
            getLanguageByKey("Eroare la încărcarea grupurilor de permisiuni"),
            { variant: "error" },
          );
        }
      } finally {
        setGroupsLoading(false);
      }
    };

    if (opened) fetchGroups();
  }, [opened, enqueueSnackbar]);

  const handleSelectPermissionGroup = (permissionGroupId) => {
    const selectedGroup = permissionGroups.find(
      (g) => g.permission_id.toString() === permissionGroupId
    );

    if (!selectedGroup) return;

    const rawRoles = typeof selectedGroup.roles === "string"
      ? safeParseJson(selectedGroup.roles)
      : selectedGroup.roles || [];

    const groupMatrix = convertRolesToMatrix(rawRoles);

    permissionGroupInitialRolesRef.current = rawRoles;
    setPermissionGroupRoles(rawRoles);

    setForm((prev) => ({
      ...prev,
      permissionGroupId,
      roleMatrix: groupMatrix,
    }));
  };

  const handlePermissionGroupChange = (value) => {
    if (!value) {
      const hasCustomChanges = Object.keys(customRolesMatrixRef.current || {}).length > 0;

      setForm((prev) => ({
        ...prev,
        permissionGroupId: null,
        roleMatrix: hasCustomChanges ? customRolesMatrixRef.current : {},
      }));

      setPermissionGroupRoles([]);
      return;
    }

    handleSelectPermissionGroup(value);
  };

  const handleCreate = async () => {
    const {
      name,
      surname,
      username,
      email,
      password,
      job_title,
      department,
      status,
      groups,
      permissionGroupId,
      sipuni_id,
    } = form;

    if (!initialUser) {
      if (
        !name ||
        !surname ||
        !username ||
        !email ||
        !password ||
        !job_title ||
        !groups ||
        !sipuni_id
      ) {
        enqueueSnackbar(
          getLanguageByKey("Completați toate câmpurile obligatorii"),
          { variant: "warning" }
        );
        return;
      }
    }

    setIsSubmitting(true);

    try {
      if (initialUser) {
        const technicianId = initialUser.id;
        const userId = initialUser.user?.id || initialUser.id;
        const hadPermissionBefore = initialUser?.permissions?.length > 0;
        const isExitingGroup = !permissionGroupId && hadPermissionBefore;

        await Promise.all([
          api.users.updateTechnician(technicianId, {
            status: status.toString(),
            job_title,
            department,
            sipuni_id,
            name,
            surname,
            allow_lead_without_contact: form.allow_lead_without_contact.toString(),
          })
        ]);

        if (groups && groups !== (initialUser.groups?.[0]?.name || "")) {
          const selectedGroup = groupsList.find((g) => g.name === groups);
          const group_id = selectedGroup?.id;

          await api.users.updateUsersGroup({
            user_ids: [technicianId],
            group_id,
          });
        }

        if (isExitingGroup) {
          await api.permissions.removePermissionFromTechnician(userId);
        }

        const userUpdate = { email };
        if (password) userUpdate.password = password;

        const newRoles = convertMatrixToRoles(form.roleMatrix);
        const currentRolesRaw = initialUser?.user?.roles || "[]";
        const currentRoles = Array.isArray(currentRolesRaw)
          ? currentRolesRaw
          : safeParseJson(currentRolesRaw);

        const rolesChanged =
          JSON.stringify(currentRoles.sort()) !== JSON.stringify(newRoles.sort());

        if (rolesChanged && !permissionGroupId) {
          userUpdate.roles = newRoles;
        }

        await api.users.updateUser(userId, userUpdate);

        if (permissionGroupId) {
          await api.users.updateUser(userId, { roles: [] });

          await api.permissions.assignPermissionToUser(permissionGroupId, userId);
        }

        enqueueSnackbar(
          getLanguageByKey("Utilizator actualizat cu succes"),
          { variant: "success" }
        );
      } else {
        const payload = {
          user: {
            username,
            email,
            password,
            // ВАЖНО: name и surname НЕ отправляются в user, они отправляются в technician
            ...(permissionGroupId ? {} : { roles: convertMatrixToRoles(form.roleMatrix) }),
          },
          technician: {
            sipuni_id,
            status: status.toString(),
            job_title,
            department,
            name,      // Перемещаем name в technician
            surname,   // Перемещаем surname в technician
            allow_lead_without_contact: form.allow_lead_without_contact,
          },
          groups: [groups],
        };

        const { id: createdUser } = await api.users.createTechnicianUser(payload);

        if (permissionGroupId) {
          await api.permissions.assignPermissionToUser(
            permissionGroupId,
            createdUser?.user?.id
          );
        }

        enqueueSnackbar(
          getLanguageByKey("Utilizator creat cu succes"),
          { variant: "success" }
        );
      }

      setForm(initialFormState);
      onClose();
      onUserCreated();
    } catch (err) {
      const serverMessage =
        err?.response?.data?.message || err?.response?.data?.error;
      const fallbackMessage =
        getLanguageByKey("Eroare la salvarea utilizatorului");
      enqueueSnackbar(serverMessage || fallbackMessage, { variant: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formContent = (
    <Stack spacing="md">
      <Switch
        label={getLanguageByKey("Activ")}
        checked={form.status}
        color="var(--crm-ui-kit-palette-link-primary)"
        onChange={(e) =>
          setForm({ ...form, status: e.currentTarget.checked })
        }
        required
      />

      <Switch
        label={getLanguageByKey("Permite lead fără contact") || "Permite lead fără contact"}
        checked={form.allow_lead_without_contact}
        color="var(--crm-ui-kit-palette-link-primary)"
        onChange={(e) =>
          setForm({ ...form, allow_lead_without_contact: e.currentTarget.checked })
        }
      />

      <TextInput
        label={getLanguageByKey("Nume")}
        placeholder={getLanguageByKey("Nume")}
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        required
      />

      <TextInput
        label={getLanguageByKey("Prenume")}
        placeholder={getLanguageByKey("Prenume")}
        value={form.surname}
        onChange={(e) => setForm({ ...form, surname: e.target.value })}
        required
      />

      {!initialUser && (
        <TextInput
          label={getLanguageByKey("Login")}
          placeholder={getLanguageByKey("Login")}
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
          required
        />
      )}

      <TextInput
        type="email"
        label={getLanguageByKey("Email")}
        placeholder={getLanguageByKey("Email")}
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
        autoComplete="off"
        required
      />

      <PasswordInput
        label={getLanguageByKey("password")}
        placeholder={getLanguageByKey("password")}
        value={form.password}
        onChange={(e) => setForm({ ...form, password: e.target.value })}
        required={!initialUser}
        autoComplete="new-password"
        name="new-password-field"
      />

      <Select
        label={getLanguageByKey("Grup utilizator")}
        placeholder={getLanguageByKey("Alege grupul")}
        data={groupsList.map((g) => ({ value: g.name, label: g.name }))}
        value={form.groups}
        onChange={(value) => setForm({ ...form, groups: value || "" })}
        required
        rightSection={groupsLoading ? <Loader size="xs" /> : null}
        searchable
        disabled={groupsLoading || groupsList.length === 0}
        styles={{
          dropdown: {
            zIndex: 10009
          }
        }}
      />

      <TextInput
        label={getLanguageByKey("Funcție")}
        placeholder={getLanguageByKey("Funcție")}
        value={form.job_title}
        onChange={(e) => setForm({ ...form, job_title: e.target.value })}
        required
      />

      <TextInput
        label={getLanguageByKey("Departament") || "Departament"}
        placeholder={getLanguageByKey("Departament") || "Departament"}
        value={form.department}
        onChange={(e) => setForm({ ...form, department: e.target.value })}
      />

      <TextInput
        label="Sipuni ID"
        placeholder="Sipuni ID"
        value={form.sipuni_id}
        onChange={(e) => setForm({ ...form, sipuni_id: e.target.value })}
        required
      />

      {initialUser && (
        <Select
          clearable
          label={getLanguageByKey("Grup permisiuni")}
          placeholder={getLanguageByKey("Alege grupul de permisiuni")}
          data={permissionGroups.map((g) => ({
            value: g.permission_id.toString(),
            label: g.permission_name,
          }))}
          value={form.permissionGroupId}
          onChange={handlePermissionGroupChange}
          rightSection={groupsLoading ? <Loader size="xs" /> : null}
          styles={{
            dropdown: {
              zIndex: 10009
            }
          }}
        />
      )}

      {initialUser && (
        <RoleMatrix
          key={form.permissionGroupId}
          permissions={form.roleMatrix}
          onChange={updateRoleMatrix}
        />
      )}
    </Stack>
  );

  // Кнопка сохранения, зафиксированная вверху
  const saveButton = (
    <Button fullWidth onClick={handleCreate} loading={isSubmitting}>
      {initialUser
        ? getLanguageByKey("Salvează")
        : getLanguageByKey("Creează")}
    </Button>
  );

  return isMobile ? (
    <Modal
      opened={opened}
      onClose={onClose}
      zIndex={10002}
      title={
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          zIndex: 10003,
          position: 'relative'
        }}>
          <Title order={4} style={{ margin: 0, color: 'var(--crm-ui-kit-palette-text-primary)' }}>
            {initialUser
              ? getLanguageByKey("Modificați utilizator")
              : getLanguageByKey("Adaugă utilizator")}
          </Title>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '24px',
              color: 'var(--crm-ui-kit-palette-text-secondary-light)',
              cursor: 'pointer',
              padding: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: '32px',
              minHeight: '32px',
              fontWeight: 'bold',
              zIndex: 10002,
              position: 'relative'
            }}
            onMouseEnter={(e) => {
              e.target.style.color = 'var(--crm-ui-kit-palette-text-primary)';
              e.target.style.backgroundColor = 'var(--crm-ui-kit-palette-button-classic-hover-background)';
            }}
            onMouseLeave={(e) => {
              e.target.style.color = 'var(--crm-ui-kit-palette-text-secondary-light)';
              e.target.style.backgroundColor = 'transparent';
            }}
          >
            ✕
          </button>
        </div>
      }
      size="xl"
      fullScreen
      withCloseButton={false}
      closeOnClickOutside={false}
      closeOnEscape
      styles={{
        body: {
          padding: 0,
          overflow: 'hidden',
          height: '100%'
        },
        content: {
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 10000,
          overflow: 'hidden'
        },
        header: {
          padding: '16px 20px',
          borderBottom: '1px solid var(--crm-ui-kit-palette-border-primary)',
          backgroundColor: 'var(--crm-ui-kit-palette-background-primary)',
          zIndex: 10001,
          flexShrink: 0
        },
        overlay: {
          zIndex: 9999
        }
      }}
    >
      {/* Фиксированная кнопка сохранения вверху */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid var(--crm-ui-kit-palette-border-primary)',
        backgroundColor: 'var(--crm-ui-kit-palette-background-primary)',
        flexShrink: 0,
        zIndex: 10000
      }}>
        {saveButton}
      </div>
      {/* Прокручиваемая область с формой */}
      <ScrollArea
        style={{
          flex: 1,
          minHeight: 0
        }}
        type="scroll"
        scrollbarSize={8}
        scrollHideDelay={0}
      >
        <div style={{ padding: '16px', paddingBottom: '20px' }}>
          <Stack spacing="md">
            {formContent}
          </Stack>
        </div>
      </ScrollArea>
    </Modal>
  ) : (
    <Drawer
      opened={opened}
      onClose={onClose}
      position="right"
      title={
        initialUser
          ? getLanguageByKey("Modificați utilizator")
          : getLanguageByKey("Adaugă utilizator")
      }
      padding="lg"
      size="lg"
      styles={{
        body: {
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          padding: 0,
          overflow: 'hidden'
        },
        content: {
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          overflow: 'hidden'
        }
      }}
    >
      {/* Фиксированная кнопка сохранения вверху */}
      <div style={{
        padding: '0px 24px 16px 24px',
        borderBottom: '1px solid var(--crm-ui-kit-palette-border-primary)',
        backgroundColor: 'var(--crm-ui-kit-palette-background-primary)',
        flexShrink: 0,
        zIndex: 100
      }}>
        {saveButton}
      </div>
      {/* Прокручиваемая область с формой */}
      <ScrollArea
        style={{
          flex: 1,
          minHeight: 0
        }}
        type="scroll"
        scrollbarSize={8}
        scrollHideDelay={0}
      >
        <div style={{ padding: '24px' }}>
          <Stack spacing="md">
            {formContent}
          </Stack>
        </div>
      </ScrollArea>
    </Drawer>
  );
};

export default UserModal;
