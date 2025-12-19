/**
 * UserContext — контекст для данных пользователя
 * 
 * Отвечает только за:
 * - Данные пользователя (name, surname, technician)
 * - Роли и группы
 * - Workflow options
 * - isAdmin
 * 
 * Принцип: Single Responsibility — только данные пользователя
 * Авторизация вынесена в AuthContext
 */

import React, { createContext, useState, useEffect, useMemo, useCallback, useContext } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "../api";
import {
  workflowOptionsByGroupTitle,
  workflowOptionsLimitedByGroupTitle,
  userGroupsToGroupTitle,
  TikTokworkflowOptionsByGroupTitle
} from "../Components/utils/workflowUtils";
import { prefetchTechnicians } from "../hooks/useTechniciansQuery";
import { AuthContext } from "./AuthContext";

export const UserContext = createContext(null);

export const UserProvider = ({ children }) => {
  const queryClient = useQueryClient();
  const { userId, isAuthenticated } = useContext(AuthContext);

  // === Локальное состояние пользователя ===
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

  // === Computed values ===
  
  // ID пользователей из одной команды
  const teamUserIds = useMemo(() => {
    const groups = userGroups || [];
    const all = groups
      .filter((group) => group.users?.includes(technician?.id))
      .flatMap((group) => group.users || []);
    return new Set(all.map(String));
  }, [userGroups, technician?.id]);

  // Проверка принадлежности к команде
  const isSameTeam = useCallback((responsibleId) => {
    if (!responsibleId) return false;
    return teamUserIds.has(String(responsibleId));
  }, [teamUserIds]);

  // Является ли пользователь админом
  const isAdmin = useMemo(
    () => userGroups.some((g) =>
      ["Admin", "IT dep.", "Quality Department"].includes(g.name)
    ),
    [userGroups]
  );

  // Доступные group titles
  const accessibleGroupTitles = useMemo(() => {
    const titles = userGroups.flatMap((group) => userGroupsToGroupTitle[group.name] || []);
    return [...new Set(titles)];
  }, [userGroups]);

  // Group title для API запросов
  const groupTitleForApi = useMemo(
    () => customGroupTitle || accessibleGroupTitles[0] || null,
    [customGroupTitle, accessibleGroupTitles]
  );

  // Workflow options в зависимости от роли
  const workflowOptions = useMemo(() => {
    if (!groupTitleForApi) return [];
    if (isAdmin) return workflowOptionsByGroupTitle[groupTitleForApi] || [];
    
    // Проверка на TikTok Manager
    const isTikTokManager = userGroups.some((g) => g.name === "TikTok Manager");
    if (isTikTokManager) return TikTokworkflowOptionsByGroupTitle[groupTitleForApi] || [];
    
    return workflowOptionsLimitedByGroupTitle[groupTitleForApi] || [];
  }, [groupTitleForApi, isAdmin, userGroups]);

  // === Синхронизация с localStorage ===
  
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

  // === Загрузка данных пользователя ===
  
  const fetchRolesAndGroups = useCallback(async () => {
    if (!userId || !isAuthenticated) {
      setUserRoles([]);
      setUserGroups([]);
      setTechnician(null);
      setIsLoadingRoles(false);
      return;
    }

    setIsLoadingRoles(true);
    
    try {
      const groups = await api.user.getGroupsList();
      
      // React Query гарантирует дедупликацию
      const technicians = await prefetchTechnicians(queryClient);
      
      const me = technicians.find((t) => t.user?.id === userId);

      // Получаем роли из technicians
      const rawRoles = me?.user?.roles ? JSON.parse(me.user.roles) : [];

      // Находим группы, в которых состоит текущий пользователь
      const myGroups = (groups || []).filter((g) => (g.users || []).includes(me?.id));

      setUserRoles(rawRoles);
      setUserGroups(myGroups);
      setTechnician(me || null);
      
      // Обновляем имя и фамилию
      if (me) {
        setName(me.name || null);
        setSurname(me.surname || null);
      }
      
      localStorage.setItem("user_roles", JSON.stringify(rawRoles));
    } catch (error) {
      console.error("Error fetching user data:", error.message);
      setUserRoles([]);
      setUserGroups([]);
      setTechnician(null);
    } finally {
      setIsLoadingRoles(false);
    }
  }, [userId, isAuthenticated, queryClient]);

  // Загружаем данные при изменении userId или авторизации
  useEffect(() => {
    if (isAuthenticated && userId) {
      fetchRolesAndGroups();
    } else {
      // Очищаем данные при logout
      setName(null);
      setSurname(null);
      setUserRoles([]);
      setUserGroups([]);
      setTechnician(null);
      setIsLoadingRoles(false);
    }
  }, [userId, isAuthenticated, fetchRolesAndGroups]);

  // === Объект user для удобства ===
  const user = useMemo(() => ({
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
  }), [userId, name, surname, userRoles, userGroups, technician, isAdmin, workflowOptions, accessibleGroupTitles, groupTitleForApi]);

  const value = useMemo(() => ({
    // Основные данные
    userId,
    name,
    setName,
    surname,
    setSurname,
    
    // Роли и группы
    userRoles,
    setUserRoles,
    userGroups,
    teamUserIds,
    isSameTeam,
    isLoadingRoles,
    technician,
    isAdmin,
    
    // Group titles и workflow
    accessibleGroupTitles,
    customGroupTitle,
    setCustomGroupTitle,
    groupTitleForApi,
    workflowOptions,
    
    // Объект user
    user,
    
    // Методы
    refetchUserData: fetchRolesAndGroups,
  }), [
    userId, name, surname, userRoles, userGroups, teamUserIds, 
    isSameTeam, isLoadingRoles, technician, isAdmin, accessibleGroupTitles,
    customGroupTitle, groupTitleForApi, workflowOptions, user, fetchRolesAndGroups
  ]);

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};
