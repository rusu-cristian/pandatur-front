import { useState, useRef, useEffect } from "react";
import dayjs from "dayjs";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./DateRangePicker.css";
import { Box } from "@mantine/core";

const getStartEndDateRange = (date) => {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  return [startOfDay, endOfDay];
};

/**
 * Компонент для выбора диапазона дат
 * 
 * @param {Array<Date>} value - Массив из двух дат [startDate, endDate]
 * @param {Function} onChange - Callback при изменении дат (dates) => void
 * @param {string} placeholder - Текст placeholder
 * @param {boolean} isClearable - Можно ли очистить выбор
 * @param {string} dateFormat - Формат отображения даты (по умолчанию "yyyy-MM-dd")
 * @param {boolean} selectsRange - Выбор диапазона (по умолчанию true)
 * @param {boolean} enableDoubleClick - Включить двойной клик на ту же дату для выбора одного дня (по умолчанию true)
 * @param {Object} style - Дополнительные стили для контейнера
 * @param {string} className - CSS класс для контейнера
 * @param {Object} datePickerProps - Дополнительные пропсы для react-datepicker
 */
export const DateRangePicker = ({
  value = [],
  onChange,
  placeholder = "Selectează o dată",
  isClearable = true,
  dateFormat = "yyyy-MM-dd",
  selectsRange = true,
  enableDoubleClick = true,
  style,
  className,
  ...datePickerProps
}) => {
  // Отслеживаем предыдущую первую дату для обработки двойного клика на ту же дату
  const previousFirstDateRef = useRef(null);
  const [internalValue, setInternalValue] = useState(value);

  // Синхронизируем внутреннее состояние с внешним значением
  useEffect(() => {
    setInternalValue(value);
    if (!enableDoubleClick) {
      previousFirstDateRef.current = null;
    }
  }, [value, enableDoubleClick]);

  const handleChange = (dates) => {
    if (!enableDoubleClick) {
      // Если двойной клик отключен, просто передаем значение
      setInternalValue(dates || []);
      onChange?.(dates || []);
      return;
    }

    // Логика с поддержкой двойного клика
    if (dates) {
      if (Array.isArray(dates)) {
        const [start, end] = dates;

        // Если выбраны две даты
        if (start && end) {
          // Если обе даты совпадают (двойной клик на ту же дату)
          if (dayjs(start).isSame(dayjs(end), "day")) {
            const fullDayRange = getStartEndDateRange(start);
            setInternalValue(fullDayRange);
            onChange?.(fullDayRange);
            previousFirstDateRef.current = null;
          } else {
            setInternalValue(dates);
            onChange?.(dates);
            previousFirstDateRef.current = null;
          }
        } else if (start && !end) {
          // Выбрана только первая дата
          const previousDate = previousFirstDateRef.current;

          // Проверяем, совпадает ли выбранная дата с предыдущей (двойной клик на ту же дату)
          if (previousDate && dayjs(start).isSame(dayjs(previousDate), "day")) {
            // Двойной клик на ту же дату - устанавливаем обе даты на эту дату
            const fullDayRange = getStartEndDateRange(start);
            setInternalValue(fullDayRange);
            onChange?.(fullDayRange);
            previousFirstDateRef.current = null;
          } else {
            // Сохраняем первую дату и ждем выбора второй
            const newValue = [start, null];
            setInternalValue(newValue);
            onChange?.(newValue);
            previousFirstDateRef.current = start;
          }
        } else {
          setInternalValue(dates);
          onChange?.(dates);
          previousFirstDateRef.current = null;
        }
      } else {
        // Если выбрана одна дата (не массив) - устанавливаем как начало диапазона
        const currentDate = dates;
        const previousDate = previousFirstDateRef.current;

        if (previousDate && dayjs(currentDate).isSame(dayjs(previousDate), "day")) {
          // Двойной клик на ту же дату
          const fullDayRange = getStartEndDateRange(currentDate);
          setInternalValue(fullDayRange);
          onChange?.(fullDayRange);
          previousFirstDateRef.current = null;
        } else {
          const newValue = selectsRange ? [currentDate, null] : currentDate;
          setInternalValue(newValue);
          onChange?.(newValue);
          if (selectsRange) {
            previousFirstDateRef.current = currentDate;
          }
        }
      }
    } else {
      // Даты очищены
      const emptyValue = selectsRange ? [] : null;
      setInternalValue(emptyValue);
      onChange?.(emptyValue);
      previousFirstDateRef.current = null;
    }
  };

  const startDate = Array.isArray(internalValue) ? (internalValue[0] || null) : null;
  const endDate = Array.isArray(internalValue) ? (internalValue[1] || null) : null;
  const singleDate = !Array.isArray(internalValue) ? internalValue : null;

  return (
    <Box style={style} className={`DateRangePicker ${className || ""}`.trim()}>
      <DatePicker
        {...datePickerProps}
        selectsRange={selectsRange}
        startDate={selectsRange ? startDate : null}
        endDate={selectsRange ? endDate : null}
        selected={selectsRange ? null : singleDate}
        onChange={handleChange}
        isClearable={isClearable}
        placeholderText={placeholder}
        dateFormat={dateFormat}
        popperPlacement="bottom-start"
        popperContainer={({ children }) => {
          // Рендерим popper в body документа, чтобы избежать проблем с overflow и zoom
          return <div style={{ position: 'relative', zIndex: 9999 }}>{children}</div>;
        }}
      />
    </Box>
  );
};

export default DateRangePicker;

