import { useState, useContext, useMemo } from "react";
import { useLocation, Link } from "react-router-dom";
import { Sidebar as BaseSideBar, Menu, MenuItem } from "react-pro-sidebar";
import {
  FaChartBar,
  FaTasks,
  FaComments,
  FaClipboardList,
  FaSignOutAlt,
  FaCalendar,
  FaHistory,
  FaChartPie,
  FaSync,
  FaMoneyBillWave
} from "react-icons/fa";
import { FaUsers, FaBars } from "react-icons/fa6";
import { MdLightMode, MdDarkMode } from "react-icons/md";
import { Badge, Flex, Divider, Select, Burger } from "@mantine/core";
import { api } from "@api";
import { LoadingOverlay } from "@components";
import { useLanguageToggle, useUser, useMobile, useTheme, useAuth } from "../../hooks";
import { getLanguageByKey } from "@utils";
import Can from "../CanComponent/Can";
import "./SideBar.css";
import { safeParseJson } from "../UsersComponent/rolesUtils";
import { convertRolesToMatrix } from "../UsersComponent/rolesUtils";
import { hasRouteAccess, hasStrictPermission } from "../utils/permissions";
import { groupTitleOptions } from "../../FormOptions/GroupTitleOptions";
// Специализированные контексты (оптимизация ре-рендеров)
import { useUI } from "../../contexts/UIContext";
import { useTickets } from "../../contexts/TicketsContext";
import { UserContext } from "../../contexts/UserContext";
import { SocketContext } from "../../contexts/SocketContext";

const LOGO = "/logo.svg";

const ConnectionIndicator = ({ isConnected }) => {
  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      <span
        className={`connection-indicator ${isConnected ? 'connected' : 'disconnected'}`}
        title={isConnected ? 'Подключен к сокету' : 'Нет подключения'}
      />
      {!isConnected && (
        <button
          onClick={handleReload}
          className="reconnect-button"
          title="Перезагрузить страницу"
        >
          <FaSync size={30} />
        </button>
      )}
    </div>
  );
};

export const SideBar = () => {
  const location = useLocation();
  
  // Специализированные хуки (каждый подписывается только на свой контекст)
  const { isCollapsed, setIsCollapsed } = useUI();    // UI состояние
  const { unreadCount } = useTickets();                // Только счётчик
  
  const { surname, name, userId, userRoles } = useUser();
  const { logout: authLogout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isMobile = useMobile();
  const { setLanguage, selectedLanguage, LANGUAGE_OPTIONS, LANGUAGES } = useLanguageToggle();
  const { toggleTheme, isDark } = useTheme();

  // Данные пользователя и сокет
  const { customGroupTitle, groupTitleForApi } = useContext(UserContext);
  const { isConnected } = useContext(SocketContext);
  const currentGroupTitle = customGroupTitle || groupTitleForApi;
  const currentGroupTitleLabel = useMemo(() => {
    if (!currentGroupTitle) return null;
    const option = groupTitleOptions.find((opt) => opt.value === currentGroupTitle);
    return option?.label || currentGroupTitle;
  }, [currentGroupTitle]);

  const isActive = (page) => {
    if (page === "chat") return location.pathname.startsWith("/chat");
    if (page === "analytics") return location.pathname.startsWith("/analytics");
    return location.pathname === `/${page}`;
  };

  // Logout с оповещением App.jsx через authEvents
  const logout = async () => {
    setLoading(true);
    try {
      await api.auth.logout();
    } catch (_) {
      // Игнорируем ошибку API — всё равно разлогиниваем
    } finally {
      setLoading(false);
      authLogout(); // Очищает куки, оповещает App.jsx и делает редирект
    }
  };

  const handleMenuClick = () => {
    if (isMobile) {
      setMobileMenuOpen(false);
    }
  };

  const renderLanguageOption = ({ option }) => (
    <Flex align="center" gap="8">
      <img
        src={option.icon}
        alt={`${option.label} flag`}
        style={{ width: 20, height: 14, objectFit: "cover", borderRadius: 2 }}
      />
      <span>{option.label}</span>
    </Flex>
  );

  const selectedLanguageIcon = LANGUAGES[selectedLanguage]?.icon;

  return (
    <>
      {/* Мобильная верхняя панель */}
      {isMobile && (
        <div className="mobile-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img className="logo" src={LOGO} alt="PANDATUR CRM" />
            <div style={{ fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, flex: 1 }}>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {surname} {name}
              </span>
              <ConnectionIndicator isConnected={isConnected} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Select
              value={selectedLanguage}
              onChange={setLanguage}
              data={LANGUAGE_OPTIONS}
              size="xs"
              w={80}
              leftSection={
                selectedLanguageIcon ? (
                  <img
                    src={selectedLanguageIcon}
                    alt={`${selectedLanguage} flag`}
                    style={{ width: 16, height: 12, objectFit: "cover", borderRadius: 2 }}
                  />
                ) : null
              }
              renderOption={renderLanguageOption}
              styles={{
                input: {
                  backgroundColor: "transparent",
                  color: "var(--crm-ui-kit-palette-sidebar-text)",
                  border: "1px solid transparent",
                  fontSize: "12px"
                },
                dropdown: {
                  backgroundColor: "var(--crm-ui-kit-palette-background-primary)",
                  color: "var(--crm-ui-kit-palette-text-primary)",
                },
              }}
            />
            <button
              onClick={logout}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--crm-ui-kit-palette-sidebar-text)',
                cursor: 'pointer',
                padding: '8px',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '12px'
              }}
              title={getLanguageByKey("Log Out")}
            >
              <FaSignOutAlt size={14} />
            </button>
            <Burger
              opened={mobileMenuOpen}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              color="var(--crm-ui-kit-palette-sidebar-text)"
              size="sm"
              className="burger"
            />
          </div>
        </div>
      )}

      {/* Оверлей для мобильного меню */}
      {isMobile && mobileMenuOpen && (
        <div
          className="mobile-overlay"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <BaseSideBar
        collapsed={isMobile ? false : isCollapsed}
        width="var(--sidebar-width-expanded)"
        collapsedWidth="var(--sidebar-width-collapsed)"
        className={isMobile && mobileMenuOpen ? 'mobile-open' : ''}
      >
        <Menu>
          {/* Информация о пользователе в мобильном меню */}
          {isMobile && (
            <>
              <MenuItem>
                <div style={{ display: 'flex', alignItems: 'center', aligntext: 'center', gap: '8px', minWidth: 0 }}>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {surname} {name} ({userId})
                  </span>
                  <ConnectionIndicator isConnected={isConnected} />
                </div>
              </MenuItem>
              <Divider />

              {/* Переключатель темы для мобильных */}
              <MenuItem
                icon={isDark ? <MdLightMode /> : <MdDarkMode />}
                onClick={toggleTheme}
              >
                {isDark ? "Light" : "Dark"}
              </MenuItem>
              <Divider />
            </>
          )}

          {!isMobile && (
            <MenuItem
              suffix={<FaBars />}
              onClick={() => setIsCollapsed((prev) => !prev)}
              className="logo-menu"
              icon={isCollapsed && <FaBars />}
            >
              {!isCollapsed && (
                <Flex ml="8px">
                  <img width="80px" height="100%" src={LOGO} alt="PANDATUR CRM" />
                </Flex>
              )}
            </MenuItem>
          )}

          {hasStrictPermission(userRoles, "USERS", "VIEW") && (
            <MenuItem
              active={isActive("users")}
              icon={<FaUsers size={24} />}
              component={<Link to="/users" onClick={handleMenuClick} />}
            >
              {getLanguageByKey("Users")}
            </MenuItem>
          )}

          {hasStrictPermission(userRoles, "DASHBOARD", "VIEW") && (
            <MenuItem
              active={isActive("dashboard")}
              icon={<FaChartPie size={24} />}
              component={<Link to="/dashboard" onClick={handleMenuClick} />}
            >
              {getLanguageByKey("Dashboard")}
            </MenuItem>
          )}

          <Can permission={{ module: "leads", action: "view" }} skipContextCheck>
            <MenuItem
              active={isActive("leads")}
              icon={<FaClipboardList size={24} />}
              component={<Link to="/leads" onClick={handleMenuClick} />}
            >
              {getLanguageByKey("Leads")} {currentGroupTitleLabel && `(${currentGroupTitleLabel})`}
            </MenuItem>
          </Can>

          <Can permission={{ module: "chat", action: "view" }} skipContextCheck>
            <MenuItem
              suffix={unreadCount > 0 && <Badge bg="red">{unreadCount}</Badge>}
              active={isActive("chat")}
              icon={<FaComments size={24} />}
              component={<Link to="/chat" onClick={handleMenuClick} />}
            >
              {getLanguageByKey("Chat")}
            </MenuItem>
          </Can>

          {hasRouteAccess(convertRolesToMatrix(safeParseJson(userRoles)), "TASK", "VIEW") && (
            <MenuItem
              active={isActive("tasks")}
              icon={<FaTasks />}
              component={<Link to="/tasks" onClick={handleMenuClick} />}
            >
              {getLanguageByKey("Taskuri")}
            </MenuItem>
          )}

          {hasStrictPermission(userRoles, "SCHEDULES", "VIEW") && (
            <MenuItem
              active={isActive("schedules")}
              icon={<FaCalendar size={24} />}
              component={<Link to="/schedules" onClick={handleMenuClick} />}
            >
              {getLanguageByKey("schedules")}
            </MenuItem>
          )}

          {hasStrictPermission(userRoles, "ANALYTICS", "VIEW") && (
            <MenuItem
              active={isActive("analytics")}
              icon={<FaChartBar size={24} />}
              component={<Link to="/analytics" onClick={handleMenuClick} />}
            >
              {getLanguageByKey("Analytics")}
            </MenuItem>
          )}

          {hasStrictPermission(userRoles, "SALES", "VIEW") && (
            <MenuItem
              active={isActive("sales")}
              icon={<FaMoneyBillWave size={24} />}
              component={<Link to="/sales" onClick={handleMenuClick} />}
            >
              {getLanguageByKey("Sales")}
            </MenuItem>
          )}

          {hasStrictPermission(userRoles, "LOGS", "VIEW") && (
            <MenuItem
              active={isActive("logs")}
              icon={<FaHistory size={24} />}
              component={<Link to="/logs" onClick={handleMenuClick} />}
            >
              {getLanguageByKey("logs")}
            </MenuItem>
          )}

          {!isMobile && (
            <>
              {/* Переключатель темы */}
              <MenuItem
                icon={isDark ? <MdLightMode size={24} /> : <MdDarkMode size={24} />}
                onClick={toggleTheme}
              >
                {isDark ? "Light" : "Dark"}
              </MenuItem>

              {/* Переключатель языка */}
              <MenuItem>
                {isCollapsed ? (
                  <div
                    style={{ textAlign: "center", fontSize: "20px", cursor: "pointer" }}
                    onClick={() => {
                      const nextLanguage = selectedLanguage === "RO" ? "RU" : selectedLanguage === "RU" ? "EN" : "RO";
                      setLanguage(nextLanguage);
                    }}
                    title={selectedLanguage}
                  >
                    {selectedLanguageIcon ? (
                      <img
                        src={selectedLanguageIcon}
                        alt={`${selectedLanguage} flag`}
                        style={{ width: 24, height: 16, objectFit: "cover", borderRadius: 2 }}
                      />
                    ) : null}
                  </div>
                ) : (
                  <Select
                    value={selectedLanguage}
                    onChange={setLanguage}
                    data={LANGUAGE_OPTIONS}
                    leftSection={
                      selectedLanguageIcon ? (
                        <img
                          src={selectedLanguageIcon}
                          alt={`${selectedLanguage} flag`}
                          style={{ width: 18, height: 12, objectFit: "cover", borderRadius: 2 }}
                        />
                      ) : null
                    }
                    renderOption={renderLanguageOption}
                    styles={{
                      input: {
                        backgroundColor: "transparent",
                        color: "var(--crm-ui-kit-palette-sidebar-text)",
                        border: "1px solid transparent",
                      },
                      dropdown: {
                        backgroundColor: "var(--crm-ui-kit-palette-background-primary)",
                        color: "var(--crm-ui-kit-palette-text-primary)",
                      },
                    }}
                  />
                )}
              </MenuItem>
            </>
          )}
        </Menu>

        <Menu>
          {/* Информация о пользователе на десктопе */}
          {!isMobile && (
            <>
              <MenuItem>
                {isCollapsed ? (
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <ConnectionIndicator isConnected={isConnected} />
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      ({userId}) {surname} {name}
                    </span>
                    <ConnectionIndicator isConnected={isConnected} />
                  </div>
                )}
              </MenuItem>
              <Divider />
              <MenuItem icon={<FaSignOutAlt />} onClick={logout}>
                {getLanguageByKey("Log Out")}
              </MenuItem>
            </>
          )}

          {/* Кнопка logout в мобильном меню */}
          {isMobile && (
            <MenuItem icon={<FaSignOutAlt />} onClick={logout}>
              {getLanguageByKey("Log Out")}
            </MenuItem>
          )}
        </Menu>
      </BaseSideBar>

      {loading && <LoadingOverlay />}
    </>
  );
};
