import PropTypes from "prop-types";
import { FaSignOutAlt } from "react-icons/fa";
import { getLanguageByKey } from "@utils";
import { ConnectionIndicator } from "../ConnectionIndicator";
import { LanguageSelector } from "../LanguageSelector";
import { BurgerButton } from "../BurgerButton";
import { LOGO_PATH } from "../../constants/menuConfig";
import "./MobileHeader.css";

/**
 * Mobile Header Component
 * Fixed header for mobile devices with logo, user info, and menu controls
 */
export const MobileHeader = ({
  surname,
  name,
  isConnected,
  selectedLanguage,
  languages,
  languageOptions,
  onLanguageChange,
  onLogout,
  mobileMenuOpen,
  onToggleMobileMenu,
}) => {
  return (
    <div className="sidebar-mobile-header">
      <div className="mobile-header-left">
        <img className="mobile-logo" src={LOGO_PATH} alt="PANDATUR CRM" />
        <div className="mobile-user-info">
          <span className="mobile-user-name">
            {surname} {name}
          </span>
          <ConnectionIndicator isConnected={isConnected} />
        </div>
      </div>

      <div className="mobile-header-right">
        <LanguageSelector
          isCollapsed={true}
          selectedLanguage={selectedLanguage}
          languages={languages}
          languageOptions={languageOptions}
          onChange={onLanguageChange}
        />

        <button
          onClick={onLogout}
          className="mobile-logout-btn"
          title={getLanguageByKey("Log Out")}
        >
          <FaSignOutAlt size={12} />
        </button>

        <BurgerButton isOpen={mobileMenuOpen} onClick={onToggleMobileMenu} />
      </div>
    </div>
  );
};

MobileHeader.propTypes = {
  surname: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  isConnected: PropTypes.bool.isRequired,
  selectedLanguage: PropTypes.string.isRequired,
  languages: PropTypes.object.isRequired,
  languageOptions: PropTypes.array.isRequired,
  onLanguageChange: PropTypes.func.isRequired,
  onLogout: PropTypes.func.isRequired,
  mobileMenuOpen: PropTypes.bool.isRequired,
  onToggleMobileMenu: PropTypes.func.isRequired,
};
