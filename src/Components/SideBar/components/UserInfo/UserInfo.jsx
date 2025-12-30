import PropTypes from "prop-types";
import { ConnectionIndicator } from "../ConnectionIndicator";
import "./UserInfo.css";

/**
 * User Info Component
 * Displays user information with connection status
 * Adapts to collapsed/expanded states
 */
export const UserInfo = ({ userId, surname, name, isConnected, isCollapsed }) => {
  if (isCollapsed) {
    return (
      <div className="sidebar-menu-item user-info-item">
        <div className="user-info-collapsed">
          <ConnectionIndicator isConnected={isConnected} />
        </div>
      </div>
    );
  }

  return (
    <div className="sidebar-menu-item user-info-item">
      <div className="user-info-expanded">
        <span className="user-name">
          ({userId}) {surname} {name}
        </span>
        <ConnectionIndicator isConnected={isConnected} />
      </div>
    </div>
  );
};

UserInfo.propTypes = {
  userId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  surname: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  isConnected: PropTypes.bool.isRequired,
  isCollapsed: PropTypes.bool.isRequired,
};
