import { useState } from "react";
import { FaBars, FaSignOutAlt } from "react-icons/fa";
import { MdLightMode, MdDarkMode } from "react-icons/md";
import { api } from "@api";
import { LoadingOverlay } from "@components";
import { useLanguageToggle, useUser, useMobile, useTheme, useAuth } from "../../hooks";
import { getLanguageByKey } from "@utils";
import { useSidebarMenu } from "./hooks/useSidebarMenu";
import { LOGO_PATH } from "./constants/menuConfig";
import {
  ConnectionIndicator,
  BurgerButton,
  LanguageSelector,
  SidebarMenuItem,
  UserInfo,
  MobileHeader,
} from "./components";
import "./SideBar.css";

export const SideBar = () => {
  const { surname, name, userId } = useUser();
  const { logout: authLogout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isMobile = useMobile();
  const { setLanguage, selectedLanguage, LANGUAGE_OPTIONS, LANGUAGES } = useLanguageToggle();
  const { toggleTheme, isDark } = useTheme();

  // Use custom hook for sidebar menu logic
  const { isCollapsed, setIsCollapsed, isConnected, menuItems, isActive } = useSidebarMenu();

  const logout = async () => {
    setLoading(true);
    try {
      await api.auth.logout();
    } catch (_) {
      // Ignore error
    } finally {
      setLoading(false);
      authLogout();
    }
  };

  const handleMenuClick = () => {
    if (isMobile) {
      setMobileMenuOpen(false);
    }
  };

  return (
    <>
      {/* Mobile Header */}
      {isMobile && (
        <MobileHeader
          surname={surname}
          name={name}
          isConnected={isConnected}
          selectedLanguage={selectedLanguage}
          languages={LANGUAGES}
          languageOptions={LANGUAGE_OPTIONS}
          onLanguageChange={setLanguage}
          onLogout={logout}
          mobileMenuOpen={mobileMenuOpen}
          onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
        />
      )}

      {/* Mobile Overlay */}
      {isMobile && mobileMenuOpen && (
        <div
          className="sidebar-mobile-overlay"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`sidebar ${isCollapsed ? "collapsed" : ""} ${isMobile && mobileMenuOpen ? "mobile-open" : ""
          } ${isMobile ? "mobile" : ""}`}
      >
        <div className="sidebar-content">
          {/* Top Section */}
          <div className="sidebar-top">
            {/* Logo & Toggle */}
            {!isMobile && (
              <div
                className="sidebar-logo-section"
                onClick={() => setIsCollapsed((prev) => !prev)}
              >
                <button
                  className="sidebar-toggle-btn"
                  aria-label="Toggle sidebar"
                >
                  <FaBars size={14} />
                </button>
                {!isCollapsed && (
                  <img className="sidebar-logo" src={LOGO_PATH} alt="PANDATUR CRM" />
                )}
              </div>
            )}

            {/* Mobile User Info */}
            {isMobile && (
              <>
                <div className="sidebar-menu-item mobile-user-item">
                  <span className="menu-label">
                    {surname} {name} ({userId})
                  </span>
                  <ConnectionIndicator isConnected={isConnected} />
                </div>
                <div className="sidebar-divider" />

                {/* Mobile Theme Toggle */}
                <button
                  className="sidebar-menu-item"
                  onClick={toggleTheme}
                >
                  <span className="menu-icon">
                    {isDark ? <MdLightMode size={16} /> : <MdDarkMode size={16} />}
                  </span>
                  <span className="menu-label">{isDark ? "Light" : "Dark"}</span>
                </button>
                <div className="sidebar-divider" />
              </>
            )}

            {/* Main Menu */}
            <nav className="sidebar-menu">
              {menuItems.map((item) => (
                <SidebarMenuItem
                  key={item.id}
                  item={item}
                  isActive={isActive}
                  isCollapsed={isCollapsed}
                  onMenuClick={handleMenuClick}
                />
              ))}
            </nav>

            {/* Desktop Theme & Language */}
            {!isMobile && (
              <>
                <div className="sidebar-divider" />
                <button
                  className="sidebar-menu-item"
                  onClick={toggleTheme}
                >
                  <span className="menu-icon">
                    {isDark ? <MdLightMode size={14} /> : <MdDarkMode size={14} />}
                  </span>
                  {!isCollapsed && <span className="menu-label">{isDark ? "Light" : "Dark"}</span>}
                </button>

                <div className="sidebar-menu-item">
                  <LanguageSelector
                    isCollapsed={isCollapsed}
                    selectedLanguage={selectedLanguage}
                    languages={LANGUAGES}
                    languageOptions={LANGUAGE_OPTIONS}
                    onChange={setLanguage}
                  />
                </div>
              </>
            )}
          </div>

          {/* Bottom Section */}
          <div className="sidebar-bottom">
            {!isMobile && (
              <>
                <div className="sidebar-divider" />
                <UserInfo
                  userId={userId}
                  surname={surname}
                  name={name}
                  isConnected={isConnected}
                  isCollapsed={isCollapsed}
                />
                <div className="sidebar-divider" />
                <button
                  className="sidebar-menu-item"
                  onClick={logout}
                  aria-label={getLanguageByKey("Log Out")}
                >
                  <span className="menu-icon">
                    <FaSignOutAlt size={14} />
                  </span>
                  {!isCollapsed && <span className="menu-label">{getLanguageByKey("Log Out")}</span>}
                </button>
              </>
            )}

            {/* Mobile Logout */}
            {isMobile && (
              <button
                className="sidebar-menu-item"
                onClick={logout}
              >
                <span className="menu-icon">
                  <FaSignOutAlt size={16} />
                </span>
                <span className="menu-label">{getLanguageByKey("Log Out")}</span>
              </button>
            )}
          </div>
        </div>
      </aside>

      {loading && <LoadingOverlay />}
    </>
  );
};
