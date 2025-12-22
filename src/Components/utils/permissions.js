export const hasPermission = (
    matrix,
    { module, action },
    context = {},
    options = {}
) => {
    if (!matrix || typeof matrix !== "object") return false;

    const key = `${module.toUpperCase()}_${action.toUpperCase()}`;
    const level = matrix[key];

    const responsibleId = String(context?.responsibleId || "");
    const currentUserId = String(context?.currentUserId || "");
    const isSameTeam = context?.isSameTeam || false;

    const { skipContextCheck = false } = options;

    if (!level || level === "Denied") return false;
    if (level === "Allowed") return true;
    if (skipContextCheck) return true;

    if (level === "IfResponsible") return responsibleId === currentUserId;
    
    // Для уровня "Team" и действия "CREATE": если responsibleId не установлен,
    // разрешаем создание (пользователь сможет выбрать ответственного из команды при создании)
    if (level === "Team") {
        // Если responsibleId не установлен и это CREATE, разрешаем (ответственный выберется при создании)
        if (action.toUpperCase() === "CREATE" && !responsibleId) {
            return true;
        }
        // Если responsibleId установлен, проверяем, что он из той же команды
        return isSameTeam;
    }

    return false;
};

export const hasStrictPermission = (roleList, module, action) => {
    if (!Array.isArray(roleList)) return false;
    return roleList.includes(`ROLE_${module}_${action}_ALLOWED`);
};

export const parseRolesString = (rolesArray) => {
    const roleMap = {};

    rolesArray.forEach((str) => {
        if (!str.startsWith("ROLE_")) return;

        const parts = str.replace("ROLE_", "").split("_");
        const [module, action, levelRaw] = parts;

        const key = `${module.toUpperCase()}_${action.toUpperCase()}`;
        const level = formatLevel(levelRaw);

        roleMap[key] = level;
    });

    return roleMap;
};

const formatLevel = (level) => {
    const map = {
        denied: "Denied",
        ifresponsible: "IfResponsible",
        team: "Team",
        allowed: "Allowed",
    };
    return map[level.toLowerCase()] || "Denied";
};

export const hasRouteAccess = (matrix, module, action) => {
    if (!matrix || typeof matrix !== "object") return false;

    const key = `${module.toUpperCase()}_${action.toUpperCase()}`;
    const level = matrix[key];

    return !!level && level !== "Denied";
};
