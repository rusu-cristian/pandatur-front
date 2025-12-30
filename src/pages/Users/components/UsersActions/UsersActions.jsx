import PropTypes from "prop-types";
import { IoMdAdd } from "react-icons/io";
import { LuFilter } from "react-icons/lu";
import { BsThreeDots } from "react-icons/bs";
import { Button, ActionButton, Dropdown, DropdownItem } from "../../../../Components/UI";
import { getLanguageByKey } from "../../../../Components/utils/getLanguageByKey";
import "./UsersActions.css";

/**
 * Users Actions component
 * Contains filter button, menu, and add user button
 */
export const UsersActions = ({
  hasActiveFilters,
  canEdit,
  canCreateUser,
  onFilterClick,
  onEditGroupsClick,
  onEditRolesClick,
  onAddUserClick,
}) => {
  return (
    <div className="users-actions">
      {/* Menu (three dots) - first position */}
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

      {/* Add user button */}
      {canCreateUser && (
        <Button leftIcon={<IoMdAdd size={14} />} onClick={onAddUserClick} size="md">
          {getLanguageByKey("Adaugă utilizator")}
        </Button>
      )}
    </div>
  );
};

UsersActions.propTypes = {
  hasActiveFilters: PropTypes.bool.isRequired,
  canEdit: PropTypes.bool.isRequired,
  canCreateUser: PropTypes.bool.isRequired,
  onFilterClick: PropTypes.func.isRequired,
  onEditGroupsClick: PropTypes.func.isRequired,
  onEditRolesClick: PropTypes.func.isRequired,
  onAddUserClick: PropTypes.func.isRequired,
};
