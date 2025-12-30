import { useState } from "react";
import { useUser, useMobile } from "@hooks";
import { hasStrictPermission } from "../../Components/utils/permissions";
import { useUsersData } from "./hooks/useUsersData";
import { UsersToolbar } from "./components";
import UserModal from "../../Components/UsersComponent/UserModal";
import UserList from "../../Components/UsersComponent/UserList";
import EditGroupsListModal from "../../Components/UsersComponent/GroupsUsers/EditGroupsListModal";
import CreatePermissionGroupModal from "../../Components/UsersComponent/Roles/CreatePermissionGroupModal";
import UserFilterModal from "../../Components/UsersComponent/UserFilterModal";
import "./Users.css";

/**
 * Users Page (Refactored)
 * Senior React best practices:
 * - Custom hook for business logic (useUsersData)
 * - Component composition (UsersToolbar)
 * - No Mantine dependencies (custom UI components)
 * - Proper separation of concerns
 * - PropTypes for all components
 */
export const Users = () => {
  const { userRoles } = useUser();
  const isMobile = useMobile();

  // Permissions
  const canCreateUser = hasStrictPermission(userRoles, "USERS", "CREATE", "ALLOWED");
  const canEdit = hasStrictPermission(userRoles, "USERS", "EDIT", "ALLOWED");

  // Data management via custom hook
  const {
    users,
    allUsers,
    loading,
    search,
    setSearch,
    filters,
    setFilters,
    hasActiveFilters,
    loadUsers,
  } = useUsersData();

  // Modal state
  const [editUser, setEditUser] = useState(null);
  const [modals, setModals] = useState({
    user: false,
    groups: false,
    permissions: false,
    filter: false,
  });

  // Modal handlers
  const handleOpenUserModal = (user = null) => {
    setEditUser(user);
    setModals((m) => ({ ...m, user: true }));
  };

  const handleCloseUserModal = () => {
    setModals((m) => ({ ...m, user: false }));
    setEditUser(null);
  };

  return (
    <div className="users-page">
      {/* Toolbar with header, search, and actions */}
      <UsersToolbar
        count={users.length}
        search={search}
        onSearchChange={setSearch}
        hasActiveFilters={hasActiveFilters}
        canEdit={canEdit}
        canCreateUser={canCreateUser}
        onFilterClick={() => setModals((m) => ({ ...m, filter: true }))}
        onEditGroupsClick={() => setModals((m) => ({ ...m, groups: true }))}
        onEditRolesClick={() => setModals((m) => ({ ...m, permissions: true }))}
        onAddUserClick={() => handleOpenUserModal()}
        isMobile={isMobile}
      />

      {/* Users table */}
      <div className="users-content">
        <UserList
          users={users}
          loading={loading}
          fetchUsers={loadUsers}
          openEditUser={handleOpenUserModal}
        />
      </div>

      {/* Modals */}
      <UserModal
        opened={modals.user}
        onClose={handleCloseUserModal}
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
        users={allUsers}
        onApply={setFilters}
      />
    </div>
  );
};
