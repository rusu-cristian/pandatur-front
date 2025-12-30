import PropTypes from "prop-types";
import { getLanguageByKey } from "../../../../Components/utils/getLanguageByKey";
import "./UsersSearch.css";

/**
 * Search input for users filtering
 */
export const UsersSearch = ({ value, onChange, className = "" }) => {
  return (
    <div className={`users-search ${className}`}>
      <input
        type="text"
        className="users-search-input"
        placeholder={getLanguageByKey("Căutare utilizator")}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete="off"
      />
    </div>
  );
};

UsersSearch.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  className: PropTypes.string,
};
