import { NavLink } from "react-router-dom";
import PropTypes from "prop-types";
import { getLanguageByKey } from "@utils";
import Can from "../../../CanComponent/Can";
import "./SidebarMenuItem.css";

/**
 * Sidebar Menu Item Component
 * Renders a single menu item with icon, label, and optional badge
 * Supports permission-based rendering with Can component
 */
export const SidebarMenuItem = ({
  item,
  isActive,
  isCollapsed,
  onMenuClick,
}) => {
  const IconComponent = item.icon;
  const label = getLanguageByKey(item.labelKey);

  const menuItemContent = (
    <NavLink
      to={item.path}
      className={({ isActive: linkActive }) =>
        `sidebar-menu-item ${linkActive || isActive(item.id) ? "active" : ""}`
      }
      onClick={onMenuClick}
    >
      <span className="menu-icon">
        <IconComponent size={item.iconSize} />
      </span>
      {!isCollapsed && (
        <>
          <span className="menu-label">
            {label}
            {item.suffix}
          </span>
          {item.badge && <span className="menu-badge">{item.badge}</span>}
        </>
      )}
    </NavLink>
  );

  // If item requires permission check via Can component
  if (item.canModule && item.canAction) {
    return (
      <Can
        permission={{ module: item.canModule, action: item.canAction }}
        skipContextCheck
      >
        {menuItemContent}
      </Can>
    );
  }

  // Render only if permission check passes
  return item.permission() ? menuItemContent : null;
};

SidebarMenuItem.propTypes = {
  item: PropTypes.shape({
    id: PropTypes.string.isRequired,
    path: PropTypes.string.isRequired,
    icon: PropTypes.elementType.isRequired,
    iconSize: PropTypes.number.isRequired,
    labelKey: PropTypes.string.isRequired,
    suffix: PropTypes.string,
    badge: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    permission: PropTypes.func,
    canModule: PropTypes.string,
    canAction: PropTypes.string,
  }).isRequired,
  isActive: PropTypes.func.isRequired,
  isCollapsed: PropTypes.bool.isRequired,
  onMenuClick: PropTypes.func.isRequired,
};
