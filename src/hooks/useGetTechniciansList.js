import { useState, useEffect } from "react";
import { api } from "@api";
import { showServerError } from "@utils";

let cachedTechnicians = null;
let fetchingPromise = null;

export const useGetTechniciansList = () => {
  const [technicians, setTechnicians] = useState(cachedTechnicians || []);
  const [loading, setLoading] = useState(!cachedTechnicians);
  const [errors, setErrors] = useState(null);

  useEffect(() => {
    if (cachedTechnicians) {
      setTechnicians(cachedTechnicians);
      setLoading(false);
      return;
    }

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

    fetchingPromise = new Promise(async (resolve, reject) => {
      try {
        setLoading(true);
        const data = await api.users.getTechnicianList();

        const groupMap = new Map();
        const processedUserIds = new Set(); // Добавляем Set для отслеживания обработанных ID

        data.forEach((item) => {
          const userId = item?.user?.id;
          if (!userId || processedUserIds.has(userId)) return; // Проверяем на дублирование
          
          // НЕ фильтруем по статусу - берем всех пользователей
          // Фильтрация по статусу будет в компоненте UserGroupMultiSelect

          processedUserIds.add(userId); // Добавляем ID в Set
          
          const groupName = item.groups?.[0]?.name || "Fără grupă";
          const label = `${item.surname || ""} ${item.name || ""}`.trim();

          const userItem = {
            value: `${userId}`,
            label,
            id: item.id, // ID техника
            user: item.user, // Данные пользователя
            name: item.name,
            surname: item.surname,
            sipuni_id: item.sipuni_id,
            status: item.status, // Добавляем статус
            groups: item.groups,
            groupName,
          };

          if (!groupMap.has(groupName)) {
            groupMap.set(groupName, []);
          }
          const groupUsers = groupMap.get(groupName);
          groupUsers.push(userItem);
        });

        const merged = [];
        for (const [groupName, users] of groupMap.entries()) {
          // Получаем ID группы из первого пользователя
          const groupId = users[0]?.groups?.[0]?.id;
          merged.push({
            value: `__group__${groupId || groupName}`,
            label: groupName,
            disabled: true,
          });
          merged.push(...users);
        }

        cachedTechnicians = merged;
        setTechnicians(merged);
        setLoading(false);

        resolve(merged);
      } catch (error) {
        setErrors(showServerError(error));
        setLoading(false);
        reject(error);
      } finally {
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
