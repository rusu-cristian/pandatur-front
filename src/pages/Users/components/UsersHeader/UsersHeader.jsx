import PropTypes from "prop-types";
import { getLanguageByKey } from "../../../../Components/utils/getLanguageByKey";
import "./UsersHeader.css";

/**
 * Users page header with title and count badge
 */
export const UsersHeader = ({ count }) => {
  return (
    <div className="users-header">
      <h1 className="users-title">{getLanguageByKey("Utilizatori")}</h1>
      <span className="users-count-badge">{count}</span>
    </div>
  );
};

UsersHeader.propTypes = {
  count: PropTypes.number.isRequired,
};
