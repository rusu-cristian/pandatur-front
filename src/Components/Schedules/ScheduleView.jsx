import React, { useEffect, useState } from "react";
import { startOfWeek, addDays, format } from "date-fns";
import { translations } from "../utils/translations";
import { api } from "../../api";
import { useSnackbar } from "notistack";
import ModalIntervals from "./ModalIntervals";
import ModalGroup from "./ModalGroup";
import { Button, Checkbox } from "@mantine/core";
import Can from "../CanComponent/Can";
import "./Schedule.css";

const language = localStorage.getItem("language") || "RO";

const dayKeys = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const ScheduleView = ({ groupUsers, groupName, groupId, onGroupUpdate }) => {
  const [schedule, setSchedule] = useState([]);
  const [selected, setSelected] = useState({
    employeeIndex: null,
    dayIndex: null,
  });
  const [currentWeekStart, setCurrentWeekStart] = useState(
    startOfWeek(new Date(), { weekStartsOn: 1 }),
  );
  const [isLoading, setIsLoading] = useState(false);
  const [groupModalOpened, setGroupModalOpened] = useState(false);
  const [selectedTechnicians, setSelectedTechnicians] = useState([]);
  const [supervisorId, setSupervisorId] = useState(null);
  const { enqueueSnackbar } = useSnackbar();

  const getWeekDays = () =>
    Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const scheduleData = await api.schedules.getSchedules();

      const combined = groupUsers.map((user) => {
        const userId = user.id;
        const userSchedule = scheduleData.find(
          (s) => s.technician_id === userId
        );
        const weeklySchedule = userSchedule?.weekly_schedule || {};

        const shifts = dayKeys.map((day) =>
          Array.isArray(weeklySchedule[day]) ? weeklySchedule[day] : []
        );

        const fullName = `${user.name || ""} ${user.surname || ""}`.trim();

        return { id: userId, name: fullName, shifts };
      });

      setSchedule(combined);
    } catch (e) {
      enqueueSnackbar(
        translations["Eroare la încărcarea programului"][language],
        { variant: "error" },
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [groupUsers, groupId]);

  const parseTime = (time) => {
    if (!time) return 0;
    const [h, m] = time.split(":").map(Number);
    return h + m / 60;
  };

  const calculateWorkedHours = (shifts) => {
    const totalHours = shifts.reduce(
      (total, shift) =>
        total +
        shift.reduce(
          (sum, i) => sum + parseTime(i.end) - parseTime(i.start),
          0
        ),
      0
    );

    const hours = Math.floor(totalHours);
    const minutes = Math.round((totalHours - hours) * 60);

    return `${hours}h ${minutes}m`;
  };

  const openDrawer = (employeeIndex, dayIndex) => {
    setSelected({ employeeIndex, dayIndex });
  };

  const closeDrawer = () => {
    setSelected({ employeeIndex: null, dayIndex: null });
  };

  const toggleTechnician = (id) => {
    setSelectedTechnicians((prev) =>
      prev.includes(id) ? prev.filter((tid) => tid !== id) : [...prev, id],
    );
  };

  const openGroupModal = async () => {
    try {
      const techs = await api.groupSchedules.getTechniciansInGroup(groupId);
      const supervisor = techs.find((u) => u.is_supervisor);
      setSupervisorId(supervisor?.id?.toString() || null);
      setGroupModalOpened(true);
    } catch (err) {
      enqueueSnackbar("Eroare la încărcarea supervizorului", { variant: "error" });
    }
  };

  useEffect(() => {
    const fetchSupervisor = async () => {
      try {
        const techs = await api.groupSchedules.getTechniciansInGroup(groupId);
        const supervisor = techs.find((u) => u.is_supervisor);
        setSupervisorId(supervisor?.id?.toString() || null);
      } catch (err) {
        enqueueSnackbar("Eroare la încărcarea supervizorului", { variant: "error" });
      }
    };

    fetchSupervisor();
  }, [groupId]);

  return (
    <div className="schedule-container">
      <div className="header-component">
        {translations["Grafic de lucru"][language]}
      </div>

      {groupName && (
        <div
          style={{
            textAlign: "center",
            fontWeight: 500,
            fontSize: 18,
            marginTop: 4,
          }}
        >
          {groupName}
        </div>
      )}

      <div className="week-navigation">
        <button
          onClick={() => setCurrentWeekStart(addDays(currentWeekStart, -7))}
        >
          {translations["săptămâna trecută"][language]}
        </button>
        <span>
          {translations["săptămâna"][language]}{" "}
          {format(currentWeekStart, "dd.MM.yyyy")} -{" "}
          {format(addDays(currentWeekStart, 6), "dd.MM.yyyy")}
        </span>
        <button
          onClick={() => setCurrentWeekStart(addDays(currentWeekStart, 7))}
        >
          {translations["săptămâna viitoare"][language]}
        </button>
      </div>

      <Can
        permission={{ module: "schedules", action: "edit" }}
        context={{ responsibleId: supervisorId }}
      >
        <Button
          fullWidth
          variant="outline"
          color="blue"
          style={{ marginTop: 20 }}
          onClick={openGroupModal}
        >
          {translations["Modifică grupul"][language]}
        </Button>
      </Can>

      <div className="schedule-table-container">
        <table className="schedule-table">
          <thead>
            <tr>
              <th style={{ width: 40 }}>
                <Checkbox
                  color="var(--crm-ui-kit-palette-link-primary)"
                  checked={
                    selectedTechnicians.length === schedule.length &&
                    schedule.length > 0
                  }
                  indeterminate={
                    selectedTechnicians.length > 0 &&
                    selectedTechnicians.length < schedule.length
                  }
                  onChange={() => {
                    if (selectedTechnicians.length === schedule.length) {
                      setSelectedTechnicians([]);
                    } else {
                      setSelectedTechnicians(schedule.map((s) => s.id));
                    }
                  }}
                />
              </th>
              <th>{translations["Angajat"][language]}</th>
              {getWeekDays().map((day, i) => (
                <th key={i}>
                  {translations[format(day, "EEEE")][language]},{" "}
                  {format(day, "dd.MM")}
                </th>
              ))}
              <th>{translations["Ore de lucru"][language]}</th>
            </tr>
          </thead>
          <tbody>
            {schedule.map((employee, ei) => (
              <tr key={ei}>
                <td>
                  <Checkbox
                    checked={selectedTechnicians.includes(employee.id)}
                    onChange={() => toggleTechnician(employee.id)}
                    color="var(--crm-ui-kit-palette-link-primary)"
                  />
                </td>
                <td>{employee.name}</td>
                {employee.shifts.map((shift, di) => (
                  <td
                    key={di}
                    className="shift-cell"
                    onClick={() => openDrawer(ei, di)}
                  >
                    {shift.length > 0
                      ? shift.map((i, idx) => (
                        <div className="container-interval" key={idx}>
                          {i.start} - {i.end}
                        </div>
                      ))
                      : "-"}
                  </td>
                ))}
                <td>{calculateWorkedHours(employee.shifts)} h.</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ModalGroup
        opened={groupModalOpened}
        onClose={() => setGroupModalOpened(false)}
        onGroupCreated={(updatedGroup) => {
          fetchData();
          setGroupModalOpened(false);
          if (typeof onGroupUpdate === "function") {
            onGroupUpdate(updatedGroup);
          }
        }}
        initialData={{
          id: groupId,
          name: groupName,
          user_ids: groupUsers.map((u) => u.id),
          supervisor_id: supervisorId,
        }}
        isEditMode={true}
      />

      <ModalIntervals
        opened={selected.employeeIndex !== null}
        onClose={closeDrawer}
        schedule={schedule}
        selected={selected}
        setSchedule={setSchedule}
        fetchData={fetchData}
        selectedTechnicians={selectedTechnicians}
      />
    </div>
  );
};

export default ScheduleView;
