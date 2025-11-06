import React, { createContext, useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { enqueueSnackbar } from "notistack";
import Cookies from "js-cookie";
import { api } from "../api";
import {
  workflowOptionsByGroupTitle,
  workflowOptionsLimitedByGroupTitle,
  userGroupsToGroupTitle,
  TikTokworkflowOptionsByGroupTitle
} from "../Components/utils/workflowUtils";
import { showServerError, getLanguageByKey } from "../Components/utils";
import { LoadingOverlay } from "../Components";

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const navigate = useNavigate();
  const [authLoading, setAuthLoading] = useState(true);
  const authCheckedRef = useRef(false); // Флаг для отслеживания, была ли проверка авторизации
  const [userId, setUserId] = useState(() => {
    const savedUserId = localStorage.getItem("user_id");
    return savedUserId ? Number(savedUserId) : null;
  });

  const [name, setName] = useState(() => localStorage.getItem("user_name") || null);
  const [surname, setSurname] = useState(() => localStorage.getItem("user_surname") || null);
  const [userRoles, setUserRoles] = useState(() => {
    const saved = localStorage.getItem("user_roles");
    return saved ? JSON.parse(saved) : [];
  });
  const [userGroups, setUserGroups] = useState([]);
  const [technician, setTechnician] = useState(null);
  const [isLoadingRoles, setIsLoadingRoles] = useState(true);

  const [customGroupTitle, setCustomGroupTitle] = useState(null);

  const teamUserIds = useMemo(() => {
    const groups = userGroups || [];
    const all = groups
      .filter((group) => group.users?.includes(technician?.id))
      .flatMap((group) => group.users || []);
    return new Set(all.map(String));
  }, [userGroups, technician?.id]);

  const isSameTeam = (responsibleId) => {
    if (!responsibleId) return false;
    return teamUserIds.has(String(responsibleId));
  };

  const isAdmin = useMemo(
    () => userGroups.some((g) =>
      ["Admin", "IT dep.", "Quality Department"].includes(g.name)
    ),
    [userGroups]
  );

  const accessibleGroupTitles = useMemo(() => {
    const titles = userGroups.flatMap((group) => userGroupsToGroupTitle[group.name] || []);
    return [...new Set(titles)];
  }, [userGroups]);

  const groupTitleForApi = useMemo(
    () => customGroupTitle || accessibleGroupTitles[0] || null,
    [customGroupTitle, accessibleGroupTitles]
  );

  const workflowOptions = useMemo(() => {
    if (!groupTitleForApi) return [];
    if (isAdmin) return workflowOptionsByGroupTitle[groupTitleForApi] || [];
    
    // Проверка на TikTok Manager
    const isTikTokManager = userGroups.some((g) => g.name === "TikTok Manager");
    if (isTikTokManager) return TikTokworkflowOptionsByGroupTitle[groupTitleForApi] || [];
    
    return workflowOptionsLimitedByGroupTitle[groupTitleForApi] || [];
  }, [groupTitleForApi, isAdmin, userGroups]);

  // Функция для выхода
  const handleLogout = useCallback(() => {
    Cookies.remove("jwt");
    setUserId(null);
    setName(null);
    setSurname(null);
  }, []);

  // Сохраняем стабильные ссылки на функции для использования в checkAuth
  const navigateRef = useRef(navigate);
  const handleLogoutRef = useRef(handleLogout);
  const enqueueSnackbarRef = useRef(enqueueSnackbar);
  
  // Обновляем ссылки при изменении
  navigateRef.current = navigate;
  handleLogoutRef.current = handleLogout;
  enqueueSnackbarRef.current = enqueueSnackbar;

  // Проверка авторизации: получаем данные пользователя и роли
  // Используем useRef для хранения функции без зависимостей, чтобы избежать циклов
  const checkAuthRef = useRef();
  checkAuthRef.current = async () => {
    try {
      const data = await api.auth.roles();

      // Проверяем роль пользователя
      if (data.roles && data.roles.includes("ROLE_USER")) {
        handleLogoutRef.current();
        navigateRef.current("/auth");
        enqueueSnackbarRef.current(getLanguageByKey("accessDenied"), { variant: "error" });
        return;
      }

      setUserId(data.user_id);
      setName(data.username || "");
      setSurname(data.surname || "");

      // Получаем актуальные pathname и search напрямую из location (без зависимостей)
      const currentLocation = window.location;
      const currentPathname = currentLocation.pathname;
      const currentSearch = currentLocation.search;

      // если уже на странице авторизации — перенаправляем на /leads
      if (currentPathname === "/auth") {
        navigateRef.current("/leads", { replace: true });
        setAuthLoading(false);
        return;
      }

      // остаёмся на текущем пути с сохранением query-параметров
      // Используем replace: true чтобы не создавать новую запись в истории
      navigateRef.current(`${currentPathname}${currentSearch}`, { replace: true });
      setAuthLoading(false);
    } catch (error) {
      navigateRef.current("/auth");
      handleLogoutRef.current();
      enqueueSnackbarRef.current(showServerError(error), { variant: "error" });
      setAuthLoading(false);
    }
  };

  // Проверяем авторизацию ТОЛЬКО ОДИН РАЗ при монтировании
  useEffect(() => {
    // Если уже проверяли - пропускаем
    if (authCheckedRef.current) return;
    
    const token = Cookies.get("jwt");
    if (token) {
      authCheckedRef.current = true;
      checkAuthRef.current();
    } else {
      setAuthLoading(false);
      authCheckedRef.current = true;
    }
    // Вызываем только один раз при монтировании
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (userId) {
      localStorage.setItem("user_id", userId);
      fetchRolesAndGroups();
    } else {
      localStorage.removeItem("user_id");
      setUserRoles([]);
      setUserGroups([]);
      setTechnician(null);
      setIsLoadingRoles(false);
    }
    // eslint-disable-next-line
  }, [userId]);

  useEffect(() => {
    name
      ? localStorage.setItem("user_name", name)
      : localStorage.removeItem("user_name");
  }, [name]);

  useEffect(() => {
    surname
      ? localStorage.setItem("user_surname", surname)
      : localStorage.removeItem("user_surname");
  }, [surname]);

  useEffect(() => {
    userRoles.length > 0
      ? localStorage.setItem("user_roles", JSON.stringify(userRoles))
      : localStorage.removeItem("user_roles");
  }, [userRoles]);

  // Отслеживаем удаление токена и очищаем состояние
  useEffect(() => {
    const checkTokenAndClear = () => {
      const token = Cookies.get("jwt");
      if (!token && userId) {
        // Токен удален, но состояние еще не очищено
        setUserId(null);
        setName(null);
        setSurname(null);
        setUserRoles([]);
        setUserGroups([]);
        setTechnician(null);
      }
    };

    checkTokenAndClear();
    const interval = setInterval(checkTokenAndClear, 1000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchRolesAndGroups = async () => {
    setIsLoadingRoles(true);
    try {
      const token = Cookies.get("jwt");
      if (!token || !userId) {
        setUserRoles([]);
        setUserGroups([]);
        setTechnician(null);
        setIsLoadingRoles(false);
        return;
      }

      const groups = await api.user.getGroupsList();
      const technicians = await api.users.getTechnicianList();
      const me = technicians.find((t) => t.user?.id === userId);

      // Получаем роли из technicians (из me.user.roles)
      const rawRoles = me?.user?.roles ? JSON.parse(me.user.roles) : [];

      // Находим группы, в которых состоит текущий пользователь
      // Используем ID техника (me.id), а не ID пользователя (userId)
      const myGroups = (groups || []).filter((g) => (g.users || []).includes(me?.id));

      setUserRoles(rawRoles);
      setUserGroups(myGroups);
      setTechnician(me || null);
      
      // Обновляем имя и фамилию из новой структуры данных
      if (me) {
        setName(me.name || null);
        setSurname(me.surname || null);
      }
      
      localStorage.setItem("user_roles", JSON.stringify(rawRoles));
    } catch (error) {
      console.error("error get data users", error.message);
      setUserRoles([]);
      setUserGroups([]);
      setTechnician(null);
    } finally {
      setIsLoadingRoles(false);
    }
  };

  const user = {
    id: userId,
    name,
    surname,
    roles: userRoles,
    groups: userGroups,
    technician,
    isAdmin,
    workflowOptions,
    accessibleGroupTitles,
    groupTitleForApi,
  };

  return (
    <UserContext.Provider
      value={{
        userId,
        setUserId,
        name,
        setName,
        surname,
        setSurname,
        userRoles,
        setUserRoles,
        userGroups,
        teamUserIds,
        isSameTeam,
        isLoadingRoles,
        technician,
        isAdmin,
        accessibleGroupTitles,
        customGroupTitle,
        setCustomGroupTitle,
        groupTitleForApi,
        workflowOptions,
        user,
      }}
    >
      {authLoading ? <LoadingOverlay /> : children}
    </UserContext.Provider>
  );
};
