import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { api } from "@api";

// Query key — единый ключ для React Query
export const TECHNICIANS_QUERY_KEY = ["technicians"];

// Стабильная ссылка на пустой массив
const EMPTY_ARRAY = [];

/**
 * Загружает сырые данные техников из API
 */
const fetchRawTechnicians = () => api.users.getTechnicianList();

/**
 * Трансформирует сырые данные в формат для селектов (с группировкой)
 */
export const transformTechniciansForSelect = (data) => {
  if (!data || !Array.isArray(data)) return [];

  const groupMap = new Map();
  const processedUserIds = new Set();

  data.forEach((item) => {
    const userId = item?.user?.id;
    if (!userId || processedUserIds.has(userId)) return;

    processedUserIds.add(userId);

    const groupName = item.groups?.[0]?.name || "Fără grupă";
    const label = `${item.surname || ""} ${item.name || ""}`.trim();

    const userItem = {
      value: `${userId}`,
      label,
      id: item.id,
      user: item.user,
      name: item.name,
      surname: item.surname,
      sipuni_id: item.sipuni_id,
      status: item.status,
      groups: item.groups,
      groupName,
    };

    if (!groupMap.has(groupName)) {
      groupMap.set(groupName, []);
    }
    groupMap.get(groupName).push(userItem);
  });

  const merged = [];
  for (const [groupName, users] of groupMap.entries()) {
    const groupId = users[0]?.groups?.[0]?.id;
    merged.push({
      value: `__group__${groupId || groupName}`,
      label: groupName,
      disabled: true,
    });
    merged.push(...users);
  }

  return merged;
};

/**
 * React Query хук для загрузки сырых данных техников
 */
export const useRawTechniciansQuery = (options = {}) => {
  return useQuery({
    queryKey: TECHNICIANS_QUERY_KEY,
    queryFn: fetchRawTechnicians,
    staleTime: 5 * 60 * 1000, // 5 минут
    refetchOnWindowFocus: false,
    ...options,
  });
};

/**
 * React Query хук для загрузки техников в формате для селектов
 */
export const useTechniciansQuery = (options = {}) => {
  const { data: rawData, ...rest } = useRawTechniciansQuery(options);
  
  // ВАЖНО: useMemo предотвращает создание нового массива на каждый рендер
  const formattedData = useMemo(
    () => (rawData ? transformTechniciansForSelect(rawData) : EMPTY_ARRAY),
    [rawData]
  );
  
  return {
    ...rest,
    data: formattedData,
  };
};

/**
 * Утилита для предзагрузки техников через queryClient
 * Используется в UserContext для гарантии дедупликации
 */
export const prefetchTechnicians = (queryClient) => {
  return queryClient.fetchQuery({
    queryKey: TECHNICIANS_QUERY_KEY,
    queryFn: fetchRawTechnicians,
    staleTime: 5 * 60 * 1000,
  });
};
