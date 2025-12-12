import { LEVEL_VALUES } from "../utils/permissionConstants";

export const safeParseJson = (str) => {
    try {
        let result = typeof str === "string" ? JSON.parse(str) : str;
        while (typeof result === "string") {
            result = JSON.parse(result);
        }
        return result;
    } catch (err) {
        if (import.meta.env.DEV) {
            console.warn("error safeParseJson:", err, str);
        }
        return [];
    }
};

export const parseRoleString = (roleStr) => {
    const withoutPrefix = roleStr.replace(/^ROLE_/, "");
    const parts = withoutPrefix.split("_");
    const levelRaw = parts.pop();
    const key = parts.join("_");

    const readable = Object.keys(LEVEL_VALUES).find(
        (k) => LEVEL_VALUES[k] === levelRaw?.toUpperCase()
    ) || "Denied";

    return { key, level: readable };
};

export const convertMatrixToRoles = (matrix) => {
    return Object.entries(matrix).map(([key, level]) => {
        const levelValue = LEVEL_VALUES[level] || "DENIED";
        return `ROLE_${key.toUpperCase()}_${levelValue}`;
    });
};

const REVERSE_LEVEL_VALUES = {
    ALLOWED: "Allowed",
    DENIED: "Denied",
    IFRESPONSIBLE: "IfResponsible",
    TEAM: "Team",
};

export const convertRolesToMatrix = (roles) => {
    const matrix = {};
    if (!Array.isArray(roles)) return matrix;

    roles.forEach((roleStr) => {
        if (!roleStr.startsWith("ROLE_")) return;

        const parts = roleStr.replace("ROLE_", "").split("_");
        const levelRaw = parts.pop();
        const key = parts.join("_");

        const readable = REVERSE_LEVEL_VALUES[levelRaw?.toUpperCase()] || "Denied";
        matrix[key] = readable;
    });

    return matrix;
};