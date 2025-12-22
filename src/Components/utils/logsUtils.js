// logs.utils.js

// Проверка, активен ли фильтр
export const isFilterActive = (filters) => {
    if (!filters) return false;
    return Object.entries(filters).some(([key, value]) => {
        if (Array.isArray(value)) return value.length > 0;
        if (typeof value === "object" && value !== null)
            return Object.keys(value).length > 0;
        return value !== undefined && value !== null && value !== "";
    });
};

// Парсинг строкового массива как JSON, если возможно
export const parsePossibleJson = (str) => {
    try {
        if (typeof str === "string" && str.startsWith("[") && str.endsWith("]")) {
            return JSON.parse(str);
        }
        return str;
    } catch {
        return str;
    }
};

// Сравнение массивов
export const arrayDiff = (before, after) => {
    const beforeArr = Array.isArray(before) ? before : [];
    const afterArr = Array.isArray(after) ? after : [];
    const removed = beforeArr.filter((item) => !afterArr.includes(item));
    const added = afterArr.filter((item) => !beforeArr.includes(item));
    return { removed, added };
};

// Получение изменённых полей между before/after
export const getChangedFields = (before = {}, after = {}) => {
    if (!before || !after) return [];
    const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);
    const changes = [];
    for (const key of allKeys) {
        const valBefore = parsePossibleJson(before[key]);
        const valAfter = parsePossibleJson(after[key]);
        if (Array.isArray(valBefore) && Array.isArray(valAfter)) {
            const diff = arrayDiff(valBefore, valAfter);
            if (diff.removed.length || diff.added.length) {
                changes.push({
                    field: key,
                    from: diff.removed.length ? diff.removed.join(", ") : "-",
                    to: diff.added.length ? diff.added.join(", ") : "-",
                    type: "array",
                });
            }
        } else if (valBefore !== valAfter) {
            changes.push({
                field: key,
                from: valBefore ?? "-",
                to: valAfter ?? "-",
            });
        }
    }
    return changes;
};
