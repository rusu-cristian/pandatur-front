/**
 * Возвращает мапу: ключ — ID группы, значение — массив ID техников из этой группы
 * @param {Array} technicians
 * @returns {Map<string, string[]>}
 */
export const getGroupUserMap = (technicians) => {
    const map = new Map();

    for (let i = 0; i < technicians.length; i++) {
        const item = technicians[i];
        if (item.value.startsWith("__group__")) {
            const group = item.value;
            const users = [];

            for (let j = i + 1; j < technicians.length; j++) {
                const next = technicians[j];
                if (next.value.startsWith("__group__")) break;
                users.push(next.value);
            }

            map.set(group, users);
        }
    }

    return map;
};

/**
 * Делает группы в MultiSelect выбираемыми (disabled: false)
 * @param {Array} technicians
 * @returns {Array}
 */
export const formatMultiSelectData = (technicians) => {
    // Убираем дублирующиеся опции по value
    const uniqueItems = technicians.filter((item, index, self) => 
        index === self.findIndex(t => t.value === item.value)
    );
    
    return uniqueItems.map((item) =>
        item.value.startsWith("__group__")
            ? { ...item, disabled: false }
            : item
    );
};

/**
 * Обработчик выбора в MultiSelect с поддержкой групп
 * @param {Object} params
 * @param {Map<string, string[]>} params.groupUserMap
 * @param {Function} params.setGroupState
 * @returns {Function} — функция для onChange
 */
export const createMultiSelectGroupHandler = ({ groupUserMap, setGroupState }) => (groupId) => (val) => {
    const last = val[val.length - 1];
    const isGroup = last?.startsWith("__group__");

    setGroupState((prev) => {
        const current = prev[groupId]?.user_ids || [];

        if (isGroup) {
            const groupUsers = groupUserMap.get(last) || [];
            const unique = Array.from(new Set([...current, ...groupUsers]));
            return {
                ...prev,
                [groupId]: {
                    ...prev[groupId],
                    user_ids: unique,
                },
            };
        }

        return {
            ...prev,
            [groupId]: {
                ...prev[groupId],
                user_ids: val,
            },
        };
    });
};
