import React, { useState, useEffect } from "react";
import {
  Drawer,
  Stack,
  Group,
  TextInput,
  Button,
  ActionIcon,
  Text,
} from "@mantine/core";
import { FaTrash, FaPlus, FaMinus } from "react-icons/fa";
import { api } from "../../api";
import { useSnackbar } from "notistack";
import { showServerError } from "../utils/showServerError";
import { translations } from "../utils/translations";
import { UserGroupMultiSelect } from "../ChatComponent/components/UserGroupMultiSelect/UserGroupMultiSelect";

const language = localStorage.getItem("language") || "RO";

const DAYS = [
  { label: translations["Mo"][language], value: translations["Monday"][language], apiName: "Monday" },
  { label: translations["Tu"][language], value: translations["Tuesday"][language], apiName: "Tuesday" },
  { label: translations["We"][language], value: translations["Wednesday"][language], apiName: "Wednesday" },
  { label: translations["Th"][language], value: translations["Thursday"][language], apiName: "Thursday" },
  { label: translations["Fr"][language], value: translations["Friday"][language], apiName: "Friday" },
  { label: translations["Sa"][language], value: translations["Saturday"][language], apiName: "Saturday" },
  { label: translations["Su"][language], value: translations["Sunday"][language], apiName: "Sunday" },
];

const ModalIntervals = ({
  opened,
  onClose,
  schedule,
  selected,
  fetchData,
  selectedTechnicians = [],
}) => {
  const { enqueueSnackbar } = useSnackbar();
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [selectedDays, setSelectedDays] = useState([]);
  const [intervalsByDay, setIntervalsByDay] = useState({});
  const selectedEmployee = schedule[selected.employeeIndex];
  const selectedShifts = selectedEmployee?.shifts || [];
  const [shouldRefresh, setShouldRefresh] = useState(false);
  const isAddOrCutDisabled = !startTime || !endTime || selectedDays.length === 0;
  const isDeleteDisabled = selectedDays.length === 0;

  const toggleDay = (day) => {
    const updated = selectedDays.includes(day)
      ? selectedDays.filter((d) => d !== day)
      : [...selectedDays, day];

    const sorted = updated.sort(
      (a, b) =>
        DAYS.findIndex((d) => d.value === a) -
        DAYS.findIndex((d) => d.value === b)
    );

    setSelectedDays(sorted);
  };

  useEffect(() => {
    if (!opened || selected.employeeIndex === null) return;

    if (selected.dayIndex !== null) {
      const defaultDay = DAYS[selected.dayIndex]?.value;
      if (defaultDay && !selectedDays.includes(defaultDay)) {
        setSelectedDays([defaultDay]);
      }
    }
  }, [opened, selected]);

  useEffect(() => {
    if (!opened || selected.employeeIndex === null) return;

    const updated = {};
    selectedDays.forEach((day) => {
      const index = DAYS.findIndex((d) => d.value === day);
      updated[day] = selectedShifts[index] || [];
    });
    setIntervalsByDay(updated);
  }, [selectedDays, opened, selected.employeeIndex]);

  const getTechnicianIds = () =>
    selectedTechnicians.length > 0
      ? selectedTechnicians
      : [selectedEmployee?.id];

  const getWeekdays = () =>
    DAYS.filter((d) => selectedDays.includes(d.value)).map((d) => d.apiName);

  const refreshIntervalsByDay = () => {
    const updatedEmployee = schedule[selected.employeeIndex];
    if (!updatedEmployee) return;

    const updatedShifts = updatedEmployee.shifts || [];
    const updated = {};

    selectedDays.forEach((day) => {
      const index = DAYS.findIndex((d) => d.value === day);
      updated[day] = updatedShifts[index] || [];
    });

    setIntervalsByDay(updated);
  };

  const handleRequest = async (apiMethod, payload) => {
    try {
      await apiMethod(payload);
      setStartTime("");
      setEndTime("");
      await fetchData();
      setShouldRefresh(true);
    } catch (e) {
      enqueueSnackbar(showServerError(e), { variant: "error" });
    }
  };

  const addInterval = () =>
    handleRequest(api.schedules.addTimeframe, {
      technician_ids: getTechnicianIds(),
      weekdays: getWeekdays(),
      start: startTime,
      end: endTime,
    });

  const cutInterval = () =>
    handleRequest(api.schedules.removeTimeframe, {
      technician_ids: getTechnicianIds(),
      weekdays: getWeekdays(),
      start: startTime,
      end: endTime,
    });

  useEffect(() => {
    if (shouldRefresh) {
      refreshIntervalsByDay();
      setShouldRefresh(false);
    }
  }, [schedule, shouldRefresh]);

  useEffect(() => {
    if (!opened) {
      setSelectedDays([]);
      setStartTime("");
      setEndTime("");
      setIntervalsByDay({});
    }
  }, [opened]);

  const deleteByDays = async () => {
    const payload = {
      technician_ids: getTechnicianIds(),
      weekdays: getWeekdays(),
    };

    try {
      await api.schedules.deleteWeekdays(payload);
      setStartTime("");
      setEndTime("");
      fetchData();

      const updated = { ...intervalsByDay };
      getWeekdays().forEach((weekday) => {
        const dayValue = DAYS.find((d) => d.apiName === weekday)?.value;
        if (dayValue) delete updated[dayValue];
      });
      setIntervalsByDay(updated);
      setSelectedDays((prev) =>
        prev.filter((d) => !getWeekdays().includes(
          DAYS.find((day) => day.value === d)?.apiName
        ))
      );
    } catch (e) {
      enqueueSnackbar(showServerError(e), { variant: "error" });
    }
  };

  const handleDeleteInterval = async (dayKey, intervalIndex, interval) => {
    const weekday = DAYS.find((d) => d.value === dayKey)?.apiName;

    try {
      await api.schedules.removeTimeframe({
        technician_ids: getTechnicianIds(),
        weekdays: [weekday],
        start: interval.start,
        end: interval.end,
      });

      setIntervalsByDay((prev) => {
        const updated = prev[dayKey].filter((_, i) => i !== intervalIndex);
        return { ...prev, [dayKey]: updated };
      });

      fetchData();
    } catch (e) {
      enqueueSnackbar(showServerError(e), { variant: "error" });
    }
  };

  const getSelectedNames = () => {
    if (selectedTechnicians.length > 1) {
      // Преобразуем данные schedule в формат для UserGroupMultiSelect
      const techniciansData = schedule
        .filter((s) => selectedTechnicians.includes(s.id))
        .map((s) => ({
          value: String(s.id),
          label: s.name,
          groupName: s.group || "Default"
        }));

      return (
        <Group direction="column" spacing="xs">
          <Text fw={500} size="lg">
            {translations["Utilizatori selectați"][language]}:
          </Text>
          <UserGroupMultiSelect
            value={selectedTechnicians.map(id => String(id))}
            onChange={() => {}} // disabled, не изменяем
            techniciansData={techniciansData}
            disabled={true}
            mode="multi"
            label=""
            placeholder=""
          />
        </Group>
      );
    }

    if (selectedTechnicians.length === 1) {
      const tech = schedule.find((s) => s.id === selectedTechnicians[0]);
      return tech ? tech.name : "";
    }

    return selectedEmployee
      ? `${selectedEmployee.name} (${selectedEmployee.id})`
      : translations["Intervale pentru mai mulți tehnicieni"][language];
  };

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      title={getSelectedNames()}
      position="right"
      size="md"
      padding="xl"
    >
      <form onSubmit={(e) => e.preventDefault()}>
        <Stack>
          <Group spacing="xs" mt="xs">
            <Button
              size="xs"
              variant={selectedDays.length === DAYS.length ? "filled" : "light"}
              onClick={() =>
                setSelectedDays(
                  selectedDays.length === DAYS.length
                    ? []
                    : DAYS.map((d) => d.value)
                )
              }
              style={{ width: 65 }}
            >
              {translations["Toate"][language]}
            </Button>

            {DAYS.map((day) => (
              <button
                key={day.value}
                onClick={() => toggleDay(day.value)}
                style={{
                  width: 54,
                  height: 32,
                  padding: '4px 8px',
                  border: selectedDays.includes(day.value) 
                    ? '1px solid #1a73e8' 
                    : '1px solid #dadce0',
                  borderRadius: 4,
                  backgroundColor: selectedDays.includes(day.value) 
                    ? '#1a73e8' 
                    : 'white',
                  color: selectedDays.includes(day.value) 
                    ? 'white' 
                    : '#3c4043',
                  fontSize: 12,
                  fontWeight: selectedDays.includes(day.value) ? 600 : 400,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onMouseEnter={(e) => {
                  if (!selectedDays.includes(day.value)) {
                    e.target.style.backgroundColor = '#f8f9fa';
                    e.target.style.borderColor = '#1a73e8';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!selectedDays.includes(day.value)) {
                    e.target.style.backgroundColor = 'white';
                    e.target.style.borderColor = '#dadce0';
                  }
                }}
              >
                {day.label}
              </button>
            ))}

            <Group align="flex-end" mt="md">
              <TextInput
                type="time"
                label={translations["Start"][language]}
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
              <TextInput
                type="time"
                label={translations["End"][language]}
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />

              <ActionIcon
                variant="light"
                color="green"
                onClick={addInterval}
                disabled={isAddOrCutDisabled}
              >
                <FaPlus />
              </ActionIcon>

              <ActionIcon
                variant="light"
                color="yellow"
                onClick={cutInterval}
                disabled={isAddOrCutDisabled}
              >
                <FaMinus />
              </ActionIcon>

              <ActionIcon
                variant="light"
                color="red"
                onClick={deleteByDays}
                disabled={isDeleteDisabled}
              >
                <FaTrash />
              </ActionIcon>
            </Group>
          </Group>

          {selectedTechnicians.length <= 1 &&
            selectedEmployee &&
            Object.entries(intervalsByDay).map(([dayKey, intervals]) => {
              const dayLabel = DAYS.find((d) => d.value === dayKey)?.value;
              return (
                <Stack key={dayKey} mt="md">
                  <Text fw={600}>{dayLabel}</Text>
                  {intervals.length > 0 ? (
                    intervals.map((interval, index) => (
                      <Group key={index} align="flex-end">
                        <TextInput
                          type="time"
                          label={translations["Start"][language]}
                          value={interval.start}
                          disabled={true}
                          onChange={(e) => {
                            const updated = [...intervals];
                            updated[index].start = e.target.value;
                            setIntervalsByDay({
                              ...intervalsByDay,
                              [dayKey]: updated,
                            });
                          }}
                        />
                        <TextInput
                          type="time"
                          label={translations["End"][language]}
                          value={interval.end}
                          disabled={true}
                          onChange={(e) => {
                            const updated = [...intervals];
                            updated[index].end = e.target.value;
                            setIntervalsByDay({
                              ...intervalsByDay,
                              [dayKey]: updated,
                            });
                          }}
                        />
                        <ActionIcon
                          variant="light"
                          color="red"
                          onClick={() => handleDeleteInterval(dayKey, index, interval)}
                        >
                          <FaTrash />
                        </ActionIcon>
                      </Group>
                    ))
                  ) : (
                    <Text size="sm">
                      {translations["Fără intervale"][language]}
                    </Text>
                  )}
                </Stack>
              );
            })}

          <Group mt="xl" grow>
            <Button onClick={onClose} variant="default">
              {translations["Închide"][language]}
            </Button>
          </Group>
        </Stack>
      </form>
    </Drawer >
  );
};

export default ModalIntervals;
