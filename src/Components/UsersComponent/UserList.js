import React, { useState, useMemo, useCallback } from "react";
import { DataGrid, GridActionsCellItem } from "@mui/x-data-grid";
import {
  Button,
  Typography,
  Box,
  Badge,
  ThemeProvider,
  createTheme,
} from "@mui/material";
import {
  CheckCircle as CheckCircleIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import { translations } from "../utils/translations";
import { getLanguageByKey } from "../utils/getLanguageByKey";
import { api } from "../../api";
import { useSnackbar } from "notistack";
import GroupChangeModal from "./GroupsUsers/GroupChangeModal";
import { useConfirmPopup } from "../../hooks";
import PermissionGroupAssignModal from "./Roles/PermissionGroupAssignModal";
import { useUser } from "../../hooks";
import { hasStrictPermission } from "../utils/permissions";

const language = localStorage.getItem("language") || "RO";

// безопасный extractId
const extractId = (u) =>
  u?.id?.user?.id ??
  u?.id?.id ??
  u?.id ??
  u?.user_id ??
  null;

// Базовая тема Material UI
const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#10b981",
    },
    background: {
      default: "#0f2231",
      paper: "#153043",
    },
    text: {
      primary: "#f2f2f2",
      secondary: "#7f8ba4",
    },
    divider: "#596683",
  },
  components: {
    MuiDataGrid: {
      styleOverrides: {
        root: ({ theme }) => ({
          "& .MuiDataGrid-cell": {
            borderRight: `1px solid ${theme.palette.divider}`,
            borderBottom: `1px solid ${theme.palette.divider}`,
            "&:focus": {
              outline: "none",
              border: `2px solid ${theme.palette.primary.main} !important`,
              zIndex: 1,
              position: "relative",
            },
            "&:focus-within": {
              outline: "none",
              border: `2px solid ${theme.palette.primary.main} !important`,
              zIndex: 1,
              position: "relative",
            },
          },
          "& .MuiDataGrid-columnHeader": {
            borderRight: `1px solid ${theme.palette.divider}`,
            borderBottom: `1px solid ${theme.palette.divider}`,
            "&:focus": {
              outline: "none",
              border: `2px solid ${theme.palette.primary.main} !important`,
              zIndex: 1,
              position: "relative",
            },
            "&:focus-within": {
              outline: "none",
              border: `2px solid ${theme.palette.primary.main} !important`,
              zIndex: 1,
              position: "relative",
            },
          },
        }),
      },
    },
  },
});

const UserList = ({
  users = [],
  loading,
  fetchUsers = () => { },
  openEditUser = () => { },
}) => {
  const { enqueueSnackbar } = useSnackbar();
  // MUI v8 требует формат { type: 'include', ids: Set }
  const [rowSelectionModel, setRowSelectionModel] = useState({
    type: "include",
    ids: new Set(),
  });
  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const [permissionModalOpen, setPermissionModalOpen] = useState(false);
  const { userRoles } = useUser();

  const canDelete = hasStrictPermission(
    userRoles,
    "USERS",
    "DELETE",
    "ALLOWED"
  );
  const canEdit = hasStrictPermission(
    userRoles,
    "USERS",
    "EDIT",
    "ALLOWED"
  );

  // Получаем массив для обратной совместимости с остальным кодом
  const selectedIds = Array.from(rowSelectionModel.ids);

  const handleRowSelectionModelChange = (newSelection) => {
    // MUI v8 отдаёт объект { type: 'include', ids: Set }
    setRowSelectionModel(newSelection);
  };

  const toggleUserStatus = useCallback(
    async (id, currentStatus) => {
      try {
        const newStatus = (!currentStatus).toString();
        await api.users.updateTechnician(id, { status: newStatus });
        fetchUsers();
        enqueueSnackbar(
          currentStatus
            ? getLanguageByKey("Utilizator dezactivat")
            : getLanguageByKey("Utilizator activat"),
          { variant: "success" }
        );
      } catch (err) {
        enqueueSnackbar(
          getLanguageByKey("Eroare la actualizarea statusului"),
          { variant: "error" }
        );
      }
    },
    [fetchUsers, enqueueSnackbar]
  );

  const handleToggleStatusSelected = async () => {
    try {
      const payload = {
        users: selectedIds
          .map((id) => {
            const user = users.find((u) => extractId(u) === id);
            if (!user) return null;
            const newStatus = (!user.status).toString();
            return { id, status: newStatus };
          })
          .filter(Boolean),
      };

      if (!payload.users.length) return;

      await api.users.updateMultipleTechnicians(payload);
      enqueueSnackbar(getLanguageByKey("Statuturi actualizate"), {
        variant: "success",
      });
      fetchUsers();
      setRowSelectionModel({ type: "include", ids: new Set() });
    } catch (err) {
      enqueueSnackbar(
        getLanguageByKey("Eroare la schimbarea statusului"),
        { variant: "error" }
      );
    }
  };

  const confirmDeleteUsers = useConfirmPopup({
    subTitle:
      selectedIds.length > 1
        ? translations["Sigur doriți să ștergeți utilizatorii selectați?"][
        language
        ]
        : getLanguageByKey("Sigur doriți să ștergeți utilizatorul?"),
    loading: false,
  });

  const handleDeleteUsersWithConfirm = useCallback(
    (userIds) => {
      if (!userIds?.length) return;

      confirmDeleteUsers(async () => {
        try {
          await api.users.deleteMultipleUsers({ user_ids: userIds });
          enqueueSnackbar(getLanguageByKey("Utilizator șters"), {
            variant: "success",
          });
          fetchUsers();
          if (userIds.length > 1)
            setRowSelectionModel({ type: "include", ids: new Set() });
        } catch (err) {
          enqueueSnackbar(getLanguageByKey("Eroare la ștergere"), {
            variant: "error",
          });
        }
      });
    },
    [confirmDeleteUsers, fetchUsers, enqueueSnackbar]
  );

  const handleChangeGroup = async (groupName) => {
    try {
      const allGroups = await api.user.getGroupsList();
      const selectedGroup = allGroups.find((g) => g.name === groupName);

      if (!selectedGroup) {
        enqueueSnackbar(getLanguageByKey("Grupul nu a fost găsit"), {
          variant: "error",
        });
        return;
      }

      await api.users.updateUsersGroup({
        group_id: selectedGroup.id,
        user_ids: selectedIds,
      });

      enqueueSnackbar(getLanguageByKey("Grup actualizat"), {
        variant: "success",
      });

      fetchUsers();
      setRowSelectionModel({ type: "include", ids: new Set() });
    } catch (err) {
      enqueueSnackbar(
        getLanguageByKey("Eroare la actualizarea grupului"),
        { variant: "error" }
      );
    }
  };

  const handleAssignPermissionGroup = async (permissionGroupId) => {
    try {
      await api.permissions.batchAssignPermissionGroup(
        permissionGroupId,
        selectedIds
      );
      enqueueSnackbar(getLanguageByKey("Grup de permisiuni atribuit"), {
        variant: "success",
      });
      fetchUsers();
      setRowSelectionModel({ type: "include", ids: new Set() });
    } catch (err) {
      enqueueSnackbar(
        getLanguageByKey("Eroare la atribuirea grupului"),
        { variant: "error" }
      );
    }
  };


  const columns = useMemo(() => {
    const baseColumns = [
      {
        field: "id",
        headerName: getLanguageByKey("ID"),
        width: 110,
        align: "center",
        headerAlign: "center",
        // MUI DataGrid автоматически использует row.id (служебное поле)
        // Оно совпадает с нашим user.id, поэтому значение отображается автоматически
      },
      {
        field: "name",
        headerName: getLanguageByKey("Nume"),
        width: 200,
        align: "center",
        headerAlign: "center",
      },
      {
        field: "surname",
        headerName: getLanguageByKey("Prenume"),
        width: 200,
        align: "center",
        headerAlign: "center",
      },
      {
        field: "email",
        headerName: getLanguageByKey("Email"),
        width: 297,
        align: "center",
        headerAlign: "center",
        renderCell: (params) => {
          if (!params) return "—";
          return (
            <div
              style={{
                wordBreak: "break-word",
                width: "100%",
                textAlign: "center",
              }}
            >
              {params.value || "—"}
            </div>
          );
        },
      },
      {
        field: "groupsDisplay",
        headerName: getLanguageByKey("Grup utilizator"),
        width: 250,
        align: "center",
        headerAlign: "center",
        renderCell: (params) => (
          <Box
            sx={{
              width: "100%",
              height: "100%",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Typography variant="body2" sx={{ color: "text.primary" }}>
              {params.value}
            </Typography>
          </Box>
        ),
      },
      {
        field: "permissionsDisplay",
        headerName: getLanguageByKey("Grup permisiuni"),
        width: 250,
        align: "center",
        headerAlign: "center",
        renderCell: (params) => (
          <Box
            sx={{
              width: "100%",
              height: "100%",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Typography variant="body2" sx={{ color: "text.primary" }}>
              {params.value}
            </Typography>
          </Box>
        ),
      },
      {
        field: "jobTitleDisplay",
        headerName: getLanguageByKey("Funcție"),
        width: 350,
        align: "center",
        headerAlign: "center",
        renderCell: (params) => (
          <Box
            sx={{
              width: "100%",
              height: "100%",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Typography variant="body2" sx={{ color: "text.primary" }}>
              {params.value}
            </Typography>
          </Box>
        ),
      },
      {
        field: "departmentDisplay",
        headerName:
          translations["Departament"]?.[language] || "Departament",
        width: 250,
        align: "center",
        headerAlign: "center",
        renderCell: (params) => (
          <Box
            sx={{
              width: "100%",
              height: "100%",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Typography variant="body2" sx={{ color: "text.primary" }}>
              {params.value}
            </Typography>
          </Box>
        ),
      },
      {
        field: "status",
        headerName: getLanguageByKey("Status"),
        width: 110,
        align: "center",
        headerAlign: "center",
        renderCell: (params) => {
          if (!params) return "—";
          return (
            <Badge
              color={params.value ? "success" : "error"}
              variant="dot"
              sx={{
                "& .MuiBadge-badge": {
                  position: "static",
                  transform: "none",
                  bgcolor: params.value ? "primary.main" : "error.main",
                },
              }}
            >
              <Typography variant="body2" sx={{ color: "text.primary" }}>
                {params.value
                  ? getLanguageByKey("Activ")
                  : getLanguageByKey("Inactiv")}
              </Typography>
            </Badge>
          );
        },
      },
      {
        field: "sipuni_id",
        headerName: "Sipuni ID",
        width: 100,
        align: "center",
        headerAlign: "center",
        renderCell: (params) => {
          <Box
            sx={{
              width: "100%",
              height: "100%",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Typography variant="body2" sx={{ color: "text.primary" }}>
              {params.value || "—"}
            </Typography>
          </Box>
        },
      },
    ];

    if (canEdit || canDelete) {
      baseColumns.push({
        field: "actions",
        type: "actions",
        headerName: getLanguageByKey("Acțiune"),
        width: 100,
        align: "center",
        headerAlign: "center",
        getActions: (params) => {
          if (!params?.row) return [];
          const row = params.row;
          const rowId = extractId(row);
          if (!rowId) return [];

          const actions = [];

          if (canEdit) {
            actions.push(
              <GridActionsCellItem
                key="toggle-status"
                icon={<CheckCircleIcon fontSize="small" />}
                label={
                  row.status
                    ? getLanguageByKey("Dezactivați")
                    : getLanguageByKey("Activați")
                }
                onClick={() => toggleUserStatus(rowId, row.status)}
                showInMenu
              />
            );
            actions.push(
              <GridActionsCellItem
                key="edit"
                icon={<EditIcon fontSize="small" />}
                label={getLanguageByKey("Modificați")}
                onClick={() => openEditUser(row)}
                showInMenu
              />
            );
          }

          if (canDelete) {
            actions.push(
              <GridActionsCellItem
                key="delete"
                icon={<DeleteIcon fontSize="small" />}
                label={getLanguageByKey("Ștergeți")}
                onClick={() => handleDeleteUsersWithConfirm([rowId])}
                showInMenu
                sx={{ color: "error.main" }}
              />
            );
          }

          return actions;
        },
      });
    }

    return baseColumns;
  }, [
    canEdit,
    canDelete,
    handleDeleteUsersWithConfirm,
    openEditUser,
    toggleUserStatus,
  ]);

  return (
    <>
      {selectedIds.length > 0 && (
        <Box
          sx={{
            mb: 2,
            display: "flex",
            gap: 1,
            flexWrap: "wrap",
          }}
        >
          {canEdit && (
            <Button
              variant="outlined"
              onClick={handleToggleStatusSelected}
              size="medium"
              sx={{
                borderColor: "var(--crm-ui-kit-palette-link-primary)",
                color: "var(--crm-ui-kit-palette-link-primary)",
                "&:hover": {
                  borderColor:
                    "var(--crm-ui-kit-palette-link-hover-primary)",
                  backgroundColor:
                    "var(--crm-ui-kit-palette-button-classic-hover-background)",
                },
              }}
            >
              {getLanguageByKey("Schimbǎ status")}
            </Button>
          )}

          {canEdit && (
            <Button
              variant="contained"
              onClick={() => setGroupModalOpen(true)}
              size="medium"
              sx={{
                backgroundColor: "var(--crm-ui-kit-palette-link-primary)",
                color: "#fff",
                "&:hover": {
                  backgroundColor:
                    "var(--crm-ui-kit-palette-link-hover-primary)",
                },
              }}
            >
              {getLanguageByKey("Schimbă grupul")}
            </Button>
          )}

          {canEdit && (
            <Button
              variant="contained"
              onClick={() => setPermissionModalOpen(true)}
              size="medium"
              sx={{
                backgroundColor: "var(--crm-ui-kit-palette-link-primary)",
                color: "#fff",
                "&:hover": {
                  backgroundColor:
                    "var(--crm-ui-kit-palette-link-hover-primary)",
                },
              }}
            >
              {getLanguageByKey("Schimbǎ grup de permisiuni")}
            </Button>
          )}

          {canDelete && (
            <Button
              variant="contained"
              onClick={() => handleDeleteUsersWithConfirm(selectedIds)}
              size="medium"
              sx={{
                backgroundColor: "#ef4444",
                color: "#fff",
                "&:hover": {
                  backgroundColor: "#dc2626",
                },
              }}
            >
              {getLanguageByKey("Șterge")}
            </Button>
          )}
        </Box>
      )}

      <GroupChangeModal
        opened={groupModalOpen}
        onClose={() => setGroupModalOpen(false)}
        onConfirm={handleChangeGroup}
      />

      <PermissionGroupAssignModal
        opened={permissionModalOpen}
        onClose={() => setPermissionModalOpen(false)}
        onConfirm={handleAssignPermissionGroup}
      />

      <ThemeProvider theme={darkTheme}>
        <div style={{ height: "calc(120vh)", width: "100%" }}>
          <DataGrid
            rows={users.map((user, idx) => {
              // После нормализации в Users.js id уже на верхнем уровне
              const safeId = extractId(user) ?? user.id ?? `tmp-${idx}`;

              // Вычисляем отображаемые значения для сложных полей
              const groupsDisplay = Array.isArray(user.groups) && user.groups.length > 0
                ? user.groups
                  .map((g) => (typeof g === "string" ? g : g?.name))
                  .filter(Boolean)
                  .join(", ")
                : "—";

              const permissionsDisplay = Array.isArray(user.permissions) && user.permissions[0]?.name
                ? user.permissions[0].name
                : "—";

              return {
                ...user,
                id: safeId,
                groupsDisplay,
                permissionsDisplay,
                jobTitleDisplay: user.jobTitle || "—",
                departmentDisplay: user.department || "—",
              };
            })}
            columns={columns}
            loading={loading}
            checkboxSelection={canEdit || canDelete}
            disableRowSelectionOnClick
            disableRowSelectionExcludeModel
            rowSelectionModel={rowSelectionModel}
            onRowSelectionModelChange={handleRowSelectionModelChange}
            onRowDoubleClick={(params) => {
              if (canEdit && params?.row) {
                openEditUser(params.row);
              }
            }}
            disableCellSelection
            paginationMode="client"
            pageSizeOptions={[25, 50, 100]}
            initialState={{
              pagination: {
                paginationModel: {
                  pageSize: 100,
                },
              },
            }}
          />
        </div>
      </ThemeProvider>
    </>
  );
};

export default UserList;
