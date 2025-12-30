import PropTypes from "prop-types";
import { IoMdAdd } from "react-icons/io";
import { LuFilter } from "react-icons/lu";
import { BsThreeDots } from "react-icons/bs";
import { Button, ActionButton, Dropdown, DropdownItem } from "../../../../Components/UI";
import { getLanguageByKey } from "../../../../Components/utils/getLanguageByKey";
import { UsersHeader } from "../UsersHeader";
import { UsersSearch } from "../UsersSearch";
import "./UsersToolbar.css";

/**
 * Users Toolbar component
 * Combines header, search, and actions
 * Responsive for desktop and mobile
 */
export const UsersToolbar = ({
  count,
  search,
  onSearchChange,
  hasActiveFilters,
  canEdit,
  canCreateUser,
  onFilterClick,
  onEditGroupsClick,
  onEditRolesClick,
  onAddUserClick,
  isMobile,
}) => {
  if (isMobile) {
    return (
      <div className="users-toolbar users-toolbar-mobile">
        {/* Row 1: Header and actions icons */}
        <div className="users-toolbar-row">
          <UsersHeader count={count} />
          <div className="users-actions-mobile">
            {/* Menu */}
            {canEdit && (
              <Dropdown
                trigger={
                  <ActionButton size="md" variant="default">
                    <BsThreeDots size={14} />
                  </ActionButton>
                }
                width={200}
              >
                {({ onItemClick }) => (
                  <>
                    <DropdownItem onClick={() => onItemClick(onEditGroupsClick)}>
                      {getLanguageByKey("Editează grupurile")}
                    </DropdownItem>
                    <DropdownItem onClick={() => onItemClick(onEditRolesClick)}>
                      {getLanguageByKey("Editează rolurile")}
                    </DropdownItem>
                  </>
                )}
              </Dropdown>
            )}

            {/* Filter */}
            <ActionButton
              onClick={onFilterClick}
              variant={hasActiveFilters ? "filled" : "default"}
              active={hasActiveFilters}
              size="md"
              title={getLanguageByKey("Filtru")}
            >
              <LuFilter size={14} />
            </ActionButton>
          </div>
        </div>

        {/* Row 2: Search */}
        <UsersSearch value={search} onChange={onSearchChange} />

        {/* Row 3: Add button */}
        {canCreateUser && (
          <Button leftIcon={<IoMdAdd size={14} />} onClick={onAddUserClick} size="md" fullWidth>
            {getLanguageByKey("Adaugă utilizator")}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="users-toolbar users-toolbar-desktop">
      <UsersHeader count={count} />
      <div className="users-toolbar-right">
        <div className="users-actions-group">
          {/* Menu (three dots) */}
          {canEdit && (
            <Dropdown
              trigger={
                <ActionButton size="md" variant="default">
                  <BsThreeDots size={14} />
                </ActionButton>
              }
              width={200}
            >
              {({ onItemClick }) => (
                <>
                  <DropdownItem onClick={() => onItemClick(onEditGroupsClick)}>
                    {getLanguageByKey("Editează grupurile")}
                  </DropdownItem>
                  <DropdownItem onClick={() => onItemClick(onEditRolesClick)}>
                    {getLanguageByKey("Editează rolurile")}
                  </DropdownItem>
                </>
              )}
            </Dropdown>
          )}

          {/* Filter button */}
          <ActionButton
            onClick={onFilterClick}
            variant={hasActiveFilters ? "filled" : "default"}
            active={hasActiveFilters}
            size="md"
            title={getLanguageByKey("Filtru")}
          >
            <LuFilter size={14} />
          </ActionButton>
        </div>

        <div className="users-search-group">
          {/* Search */}
          <UsersSearch value={search} onChange={onSearchChange} className="users-search-desktop" />

          {/* Add user button */}
          {canCreateUser && (
            <Button leftIcon={<IoMdAdd size={14} />} onClick={onAddUserClick} size="md">
              {getLanguageByKey("Adaugă utilizator")}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

UsersToolbar.propTypes = {
  count: PropTypes.number.isRequired,
  search: PropTypes.string.isRequired,
  onSearchChange: PropTypes.func.isRequired,
  hasActiveFilters: PropTypes.bool.isRequired,
  canEdit: PropTypes.bool.isRequired,
  canCreateUser: PropTypes.bool.isRequired,
  onFilterClick: PropTypes.func.isRequired,
  onEditGroupsClick: PropTypes.func.isRequired,
  onEditRolesClick: PropTypes.func.isRequired,
  onAddUserClick: PropTypes.func.isRequired,
  isMobile: PropTypes.bool.isRequired,
};
