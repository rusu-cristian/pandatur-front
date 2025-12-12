import { useEffect, useState, useCallback } from "react";
import { Button, Popover, Flex, Stack, TextInput } from "@mantine/core";
import { DatePicker, TimeInput } from "@mantine/dates";
import dayjs from "dayjs";
import { applyOffset, quickOptions, translations } from "../../utils";
import { HH_mm } from "../../../app-constants";

const language = localStorage.getItem("language") || "RO";

// Универсальная функция парсинга даты
const parseDate = (val) => {
    if (!val) return null;
    if (val instanceof Date) return isNaN(val.getTime()) ? null : val;
    if (typeof val === "number") return new Date(val);
    if (typeof val === "string") {
        const s = val.trim();
        // Пробуем разные форматы
        if (s.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)) {
            return new Date(s);
        }
        if (s.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
            return new Date(s);
        }
        if (s.match(/^\d{2}\.\d{2}\.\d{4} \d{2}:\d{2}:\d{2}$/)) {
            const [datePart, timePart] = s.split(" ");
            const [day, month, year] = datePart.split(".").map(Number);
            return new Date(year, month - 1, day, ...timePart.split(":").map(Number));
        }
        return new Date(s);
    }
    return null;
};

// Создание даты из строк даты и времени
const createDate = (dateStr, timeStr) => {
    if (!dateStr) return null;

    let year, month, day;
    if (dateStr.includes("-")) {
        [year, month, day] = dateStr.split("-").map(Number);
    } else if (dateStr.includes(".")) {
        [day, month, year] = dateStr.split(".").map(Number);
    } else {
        return null;
    }

    const [hour, minute] = (timeStr || "00:00").split(":").map(Number);
    if (!year || !month || !day) return null;

    const date = new Date(year, month - 1, day, hour || 0, minute || 0, 0);
    return isNaN(date.getTime()) ? null : date;
};

const DateQuickInput = ({ value, onChange, disabled = false }) => {
    const [popoverOpen, setPopoverOpen] = useState(false);
    const [internalDate, setInternalDate] = useState("");
    const [internalTime, setInternalTime] = useState("");

    // Инициализация внутреннего состояния из внешнего value
    useEffect(() => {
        const parsedDate = parseDate(value);
        if (parsedDate) {
            const dayjsDate = dayjs(parsedDate);
            setInternalDate(dayjsDate.format("YYYY-MM-DD"));
            setInternalTime(dayjsDate.format(HH_mm));
        } else {
            setInternalDate("");
            setInternalTime("");
        }
    }, [value]);

    // Создание итоговой даты из внутреннего состояния
    const finalDate = createDate(internalDate, internalTime);
    const displayValue = finalDate ? dayjs(finalDate).format("YYYY-MM-DD HH:mm:ss") : "";

    // Уведомление родительского компонента об изменении
    const notifyChange = useCallback((newDate) => {
        if (!disabled && onChange && newDate) {
            onChange(newDate);
        }
    }, [disabled, onChange]);

    // Обработка быстрого выбора
    const handleQuickSelect = useCallback((option) => {
        if (disabled) return;

        const baseDate = finalDate && dayjs(finalDate).isAfter(dayjs()) ? dayjs(finalDate) : dayjs();
        const resultDate = option.custom ? option.custom() : applyOffset(baseDate, option.offset);

        const newDateStr = resultDate.format("YYYY-MM-DD");
        const newTimeStr = resultDate.format(HH_mm);

        setInternalDate(newDateStr);
        setInternalTime(newTimeStr);

        // Сразу уведомляем об изменении
        const newDate = createDate(newDateStr, newTimeStr);
        notifyChange(newDate);
    }, [disabled, finalDate, notifyChange]);

    // Обработка изменения даты
    const handleDateChange = useCallback((newDateStr) => {
        setInternalDate(newDateStr);
        const newDate = createDate(newDateStr, internalTime);
        notifyChange(newDate);
    }, [internalTime, notifyChange]);

    // Обработка изменения времени
    const handleTimeChange = useCallback((newTimeStr) => {
        setInternalTime(newTimeStr);
        const newDate = createDate(internalDate, newTimeStr);
        notifyChange(newDate);
    }, [internalDate, notifyChange]);

    // Обработка выбора из DatePicker
    const handleDatePickerChange = useCallback((date) => {
        if (date) {
            const newDateStr = dayjs(date).format("YYYY-MM-DD");
            setInternalDate(newDateStr);
            const newDate = createDate(newDateStr, internalTime);
            notifyChange(newDate);
        }
    }, [internalTime, notifyChange]);

    return (
        <Popover
            opened={popoverOpen}
            onChange={setPopoverOpen}
            position="bottom-start"
            shadow="md"
            disabled={disabled}
        >
            <Popover.Target>
                <TextInput
                    value={displayValue}
                    readOnly
                    onClick={() => !disabled && setPopoverOpen(true)}
                    label={translations["Deadline"][language]}
                    placeholder={translations["Deadline"][language]}
                    disabled={disabled}
                />
            </Popover.Target>

            <Popover.Dropdown>
                <Flex gap="md" align="flex-start">
                    {/* Быстрые опции */}
                    <Stack gap="xs" w={180}>
                        {quickOptions.map((option) => (
                            <Button
                                key={option.label}
                                fullWidth
                                variant="subtle"
                                onClick={() => handleQuickSelect(option)}
                                style={{ justifyContent: "flex-start" }}
                                disabled={disabled}
                            >
                                {option.label}
                            </Button>
                        ))}
                    </Stack>

                    {/* Ручной ввод */}
                    <Stack gap="xs">
                        <TextInput
                            label={translations["Date"][language]}
                            value={internalDate}
                            onChange={(e) => handleDateChange(e.currentTarget.value)}
                            placeholder="yyyy-mm-dd / dd.mm.yyyy"
                            disabled={disabled}
                        />
                        <TimeInput
                            label={translations["Hour"][language]}
                            value={internalTime}
                            onChange={(e) => handleTimeChange(e.currentTarget.value)}
                            disabled={disabled}
                        />
                        <DatePicker
                            value={finalDate ?? null}
                            onChange={handleDatePickerChange}
                            size="md"
                            minDate={new Date()}
                            disabled={disabled}
                        />
                    </Stack>
                </Flex>
            </Popover.Dropdown>
        </Popover>
    );
};

export default DateQuickInput;
