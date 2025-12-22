import { useTechniciansQuery } from "./useTechniciansQuery";
import { showServerError } from "@utils";

// Пустой массив — стабильная ссылка (не создаётся на каждый рендер)
const EMPTY_ARRAY = [];

/**
 * Хук для получения списка техников (обратная совместимость)
 * 
 * Использует React Query под капотом:
 * - Автоматическая дедупликация запросов
 * - Кэширование на 5 минут
 * - Синхронизация между компонентами
 * 
 * @returns {{ technicians: Array, loading: boolean, errors: string | null }}
 */
export const useGetTechniciansList = () => {
  const { data, isLoading, error } = useTechniciansQuery();

  return {
    technicians: data ?? EMPTY_ARRAY,
    loading: isLoading,
    errors: error ? showServerError(error) : null,
  };
};
