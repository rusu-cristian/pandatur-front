/**
 * Маппинг: Воронка (group_title) → Группы пользователей, которые работают с этой воронкой
 * 
 * Сгенерировано на основе userGroupsToGroupTitle из workflowUtils.js (обратный маппинг)
 * 
 * Ключ: код воронки (например "MD", "RO", "FILIALE")
 * Значение: массив названий групп пользователей
 */

// ============ КОНСТАНТЫ ДЛЯ СПЕЦИАЛЬНЫХ ГРУПП ============

/**
 * Группы с полным доступом — игнорируют фильтрацию по воронке
 */
export const FULL_ACCESS_GROUPS = ["Admin", "IT dep."];

/**
 * Скрытые группы — не показываются в селектах
 */
export const HIDDEN_GROUPS = ["Dismissed"];

/**
 * Проверить, имеет ли пользователь полный доступ (Admin или IT dep.)
 * @param {Array<{name: string}>} userGroups - группы пользователя
 * @returns {boolean}
 */
export const hasFullAccess = (userGroups) => {
    if (!userGroups?.length) return false;
    return userGroups.some(group => FULL_ACCESS_GROUPS.includes(group.name));
};

/**
 * Проверить, находится ли пользователь в скрытой группе
 * @param {string} groupName - название группы
 * @returns {boolean}
 */
export const isHiddenGroup = (groupName) => {
    return HIDDEN_GROUPS.includes(groupName);
};

export const groupTitleToUserGroups = {
    MD: [
        "Front Office",
        "Back Flagman",
        "Back Minions",
        "Franchises Curator"
    ],

    RO: [
        "Brasov RO",
        "Bucharest RO",
        "Iasi RO",
        "Back RO"
    ],

    FILIALE: [
        "Branches MD Balti",
        "Branches MD Falesti",
        "Branches MD Calarasi",
        "Branches MD Cahul",
        "Branches MD Ungheni",
    ],

    MARKETING: [
        "Admin",
        "IT dep.",
        "Quality Department",
        "Marketing",
        "Franchises Curator",
        "TikTok Manager"
    ],

    INDIVIDUALGROUPS: [
        "Corporate sales"
    ],

    AGENCY: [
        "Agency"
    ],

    GREENCARD: [

        "Green Card",
        "Front Office",
        "Back Flagman",
        "Back Minions",
    ],

    CATALAN: [

        "UA Sales Department"
    ],

    HR: [
        "Quality Department",
        "HR Department"
    ],

    QUALITYDEPARTMENT: [
        "Quality Department"
    ],

    // ============ ФРАНШИЗЫ ============

    ORHEI: [
        "Orhei Franchise",
    ],

    CANTEMIR: [
        "Cantemir Franchise",
    ],

    EDINET: [
        "Edinet Franchise",
    ],

    DROCHIA: [
        "Drochia Franchise"
    ],

    IALOVENI: [
        "Ialoveni Franchise"
    ],

    BUIUCANI: [
        "Chisinau, Buiucani Franchise"
    ],

    CAUSENI: [
        "Causeni Franchise"
    ],

    SOLDANESTI: [
        "Soldanesti Franchise"
    ],

    SOROCA: [
        "Soroca Franchise"
    ],  

    ANENIINOI: [
        "Anenii Noi Franchise"
    ],

    VARNITA: [
        "Varnita Franchise"
    ],

    REZINA: [
        "Rezina Franchise"
    ],

    RASCANI: [
        "Chisinau, Riscani Franchise"
    ],

    TIMISOARA: [
        "Timisoara Franchise"
    ],

    NISPORENI: [
        "Nisporeni Franchise"
    ],

    CLUJ: [
        "Cluj Franchise"
    ],

    STAUCENI: [
        "Stauceni Franchise"
    ],

    HANCESTI: [
        "Hincesti Franchise"
    ],

    CIMISLIA: [
        "Cimislia Franchise"
    ],

    GLODENI: [
        "Glodeni Franchise"
    ],

    BRICENI: [
        "Briceni Franchise"
    ],

    FRANCHISEPANDATUR: [
        "Franchise PandaTur"
    ],
};

/**
 * Получить группы пользователей для выбранной воронки
 * @param {string} groupTitle - код воронки (например "MD", "RO")
 * @returns {string[]} - массив названий групп пользователей
 */
export const getUserGroupsForFunnel = (groupTitle) => {
    if (!groupTitle) return [];
    return groupTitleToUserGroups[groupTitle] || [];
};

/**
 * Проверить, принадлежит ли группа пользователя к выбранной воронке
 * @param {string} userGroupName - название группы пользователя
 * @param {string} groupTitle - код воронки
 * @returns {boolean}
 */
export const isUserGroupInFunnel = (userGroupName, groupTitle) => {
    if (!groupTitle || !userGroupName) return false;
    const allowedGroups = getUserGroupsForFunnel(groupTitle);
    return allowedGroups.includes(userGroupName);
};
