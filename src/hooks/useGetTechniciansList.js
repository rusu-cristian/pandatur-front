import { useState, useEffect } from "react";
import { api } from "@api";
import { showServerError } from "@utils";

let cachedTechnicians = null;
let cachedRawTechnicians = null; // Сырые данные для UserContext
let fetchingPromise = null;
let rawFetchingPromise = null; // Promise для сырых данных (из UserContext)

/**
 * Установить Promise загрузки сырых данных (вызывается из UserContext ДО запроса)
 */
export const setRawTechniciansPromise = (promise) => {
  rawFetchingPromise = promise;
};

/**
 * Установить кэш сырых данных (вызывается из UserContext после загрузки)
 */
export const setRawTechniciansCache = (data) => {
  cachedRawTechnicians = data;
  rawFetchingPromise = null; // Сбрасываем Promise после успешной загрузки
};

/**
 * Получить кэш сырых данных (для UserContext)
 */
export const getRawTechniciansCache = () => cachedRawTechnicians;

/**
 * Функция загрузки техников (вынесена для предотвращения race condition)
 */
const fetchTechnicians = async () => {
  // Проверяем есть ли уже сырые данные (загруженные из UserContext)
  let data = cachedRawTechnicians;
  
  if (!data) {
    // Если UserContext уже загружает — ждём его
    if (rawFetchingPromise) {
      data = await rawFetchingPromise;
    } else {
      // Никто не загружает — загружаем сами
      data = await api.users.getTechnicianList();
      cachedRawTechnicians = data;
    }
  }

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

export const useGetTechniciansList = () => {
  const [technicians, setTechnicians] = useState(cachedTechnicians || []);
  const [loading, setLoading] = useState(!cachedTechnicians);
  const [errors, setErrors] = useState(null);

  useEffect(() => {
    // Уже есть кэш — используем его
    if (cachedTechnicians) {
      setTechnicians(cachedTechnicians);
      setLoading(false);
      return;
    }

    // Уже идёт загрузка — ждём результат
    if (fetchingPromise) {
      setLoading(true);
      fetchingPromise
        .then((merged) => {
          setTechnicians(merged);
          setLoading(false);
        })
        .catch((error) => {
          setErrors(showServerError(error));
          setLoading(false);
        });
      return;
    }

    // Создаём Promise СРАЗУ (до async операций) — предотвращает race condition
    setLoading(true);
    fetchingPromise = fetchTechnicians()
      .then((merged) => {
        cachedTechnicians = merged;
        setTechnicians(merged);
        setLoading(false);
        return merged;
      })
      .catch((error) => {
        setErrors(showServerError(error));
        setLoading(false);
        throw error;
      })
      .finally(() => {
        // Сбрасываем promise только при ошибке, чтобы можно было повторить
        // При успехе кэш уже заполнен
        if (!cachedTechnicians) {
          fetchingPromise = null;
        }
      });
  }, []);

  return {
    technicians,
    loading,
    errors,
  };
};
