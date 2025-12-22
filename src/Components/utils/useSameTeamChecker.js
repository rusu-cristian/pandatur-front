import { useMemo } from "react";
import { useUser } from "../../hooks";

export const useSameTeamChecker = () => {
    const { userId, userGroups } = useUser();

    return useMemo(() => {
        const myGroups = userGroups?.filter(group =>
            group.users?.includes(Number(userId))
        ) || [];

        const allTeamUserIds = new Set(
            myGroups.flatMap(group => group.users?.map(String) || [])
        );

        return (technicianId) => {
            if (!technicianId) return false;
            return allTeamUserIds.has(String(technicianId));
        };
    }, [userGroups, userId]);
};
