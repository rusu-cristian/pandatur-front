export const formatRoles = (roles) => {
  try {
    let parsed = [];

    if (Array.isArray(roles)) {
      parsed = roles;
    } else if (typeof roles === "string") {
      parsed = JSON.parse(roles);
    } else if (typeof roles === "object" && roles !== null) {
      parsed = Object.values(roles);
    }

    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((r) => r.replace(/^ROLE_/, ""))
      .filter(Boolean);
  } catch (e) {
    console.warn("formatRoles parsing error:", e);
    return [];
  }
};
