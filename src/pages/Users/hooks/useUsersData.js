import { useState, useEffect, useCallback, useMemo } from "react";
import { useSnackbar } from "notistack";
import { api } from "@api";
import { getLanguageByKey } from "../../../Components/utils/getLanguageByKey";

/**
 * Custom hook for Users page data management
 * Encapsulates all business logic: loading, filtering, search
 */
export const useUsersData = () => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({});
  const { enqueueSnackbar } = useSnackbar();

  const hasActiveFilters = useMemo(
    () =>
      (filters.group?.length || 0) > 0 ||
      (filters.role?.length || 0) > 0 ||
      !!filters.status ||
      !!filters.functie ||
      !!filters.department,
    [filters]
  );

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.users.getTechnicianList();

      const normalized = response.map((item) => {
        const user = item.user || {};

        return {
          id: item.id,
          name: item.name || "-",
          surname: item.surname || "-",
          username: user.username || "-",
          email: user.email || "-",
          groups: item.groups || [],
          jobTitle: item.job_title,
          department: item.department,
          status: item.status,
          permissions: item.permissions || [],
          rawRoles: user.roles || "[]",
          sipuni_id: item.sipuni_id,
          scheduleGroups: item.scheduleGroups || [],
          import_success: item.import_success,
          imported: item.imported,
          email_confirmed: user.email_confirmed,
          allow_lead_without_contact: item.allow_lead_without_contact,
        };
      });

      setUsers(normalized);
    } catch (err) {
      enqueueSnackbar(
        getLanguageByKey("Eroare la încărcarea utilizatorilor"),
        { variant: "error" }
      );
    } finally {
      setLoading(false);
    }
  }, [enqueueSnackbar]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const filteredUsers = useMemo(() => {
    const term = search.toLowerCase().trim();
    const searchWords = term.split(/\s+/).filter((word) => word.length > 0);
    const filtersSafe = {
      group: filters.group || [],
      role: filters.role || [],
      status: filters.status || null,
      functie: filters.functie || null,
      department: filters.department || null,
    };

    return users.filter((user) => {
      let matchesSearch;

      if (!term) {
        matchesSearch = true;
      } else {
        const userFullText = [
          user.name || "",
          user.surname || "",
          user.username || "",
          user.email || "",
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        if (searchWords.length > 1) {
          matchesSearch = searchWords.every((word) =>
            userFullText.includes(word)
          );
        } else {
          matchesSearch = userFullText.includes(term);
        }
      }

      const matchesGroup =
        filtersSafe.group.length === 0 ||
        user.groups.some((g) => filtersSafe.group.includes(g.name));

      const matchesRole =
        filtersSafe.role.length === 0 ||
        user.permissions.some((p) => filtersSafe.role.includes(p.name));

      const matchesStatus =
        !filtersSafe.status ||
        (filtersSafe.status === "active" && user.status) ||
        (filtersSafe.status === "inactive" && !user.status);

      const matchesJob =
        !filtersSafe.functie || user.jobTitle === filtersSafe.functie;

      const matchesDepartment =
        !filtersSafe.department || user.department === filtersSafe.department;

      return (
        matchesSearch &&
        matchesGroup &&
        matchesRole &&
        matchesStatus &&
        matchesJob &&
        matchesDepartment
      );
    });
  }, [users, search, filters]);

  return {
    users: filteredUsers,
    allUsers: users,
    loading,
    search,
    setSearch,
    filters,
    setFilters,
    hasActiveFilters,
    loadUsers,
  };
};
