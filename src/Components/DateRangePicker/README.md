# DateRangePicker

Переиспользуемый компонент для выбора диапазона дат на основе `react-datepicker`.

## Возможности

- ✅ Выбор диапазона дат (startDate - endDate)
- ✅ Выбор одной даты
- ✅ Двойной клик на ту же дату для выбора одного дня
- ✅ Очистка выбранных дат
- ✅ Настройка формата даты
- ✅ Полная интеграция с Mantine UI

## Использование

### Базовый пример (диапазон дат)

```jsx
import { useState } from "react";
import { DateRangePicker } from "@components";

function MyComponent() {
  const [dateRange, setDateRange] = useState([]);

  return (
    <DateRangePicker
      value={dateRange}
      onChange={setDateRange}
      placeholder="Выберите даты"
    />
  );
}
```

### Выбор одной даты

```jsx
import { useState } from "react";
import { DateRangePicker } from "@components";

function MyComponent() {
  const [date, setDate] = useState(null);

  return (
    <DateRangePicker
      value={date}
      onChange={setDate}
      selectsRange={false}
      placeholder="Выберите дату"
    />
  );
}
```

### Без двойного клика

```jsx
<DateRangePicker
  value={dateRange}
  onChange={setDateRange}
  enableDoubleClick={false}
/>
```

### С дополнительными пропсами react-datepicker

```jsx
<DateRangePicker
  value={dateRange}
  onChange={setDateRange}
  minDate={new Date()}
  maxDate={new Date(2025, 11, 31)}
  dateFormat="dd.MM.yyyy"
  showMonthDropdown
  showYearDropdown
/>
```

## Props

| Prop | Тип | По умолчанию | Описание |
|------|-----|--------------|----------|
| `value` | `Array<Date>` или `Date` | `[]` или `null` | Выбранные даты |
| `onChange` | `Function` | - | Callback при изменении дат |
| `placeholder` | `string` | `"Selectează o dată"` | Текст placeholder |
| `isClearable` | `boolean` | `true` | Можно ли очистить выбор |
| `dateFormat` | `string` | `"yyyy-MM-dd"` | Формат отображения даты |
| `selectsRange` | `boolean` | `true` | Режим выбора диапазона |
| `enableDoubleClick` | `boolean` | `true` | Включить двойной клик на ту же дату |
| `style` | `Object` | - | Дополнительные стили для контейнера |
| `className` | `string` | - | CSS класс для контейнера |
| `...datePickerProps` | `Object` | - | Дополнительные пропсы для react-datepicker |

## Логика двойного клика

При включенном `enableDoubleClick` (по умолчанию):
- Первый клик на дату устанавливает её как начало диапазона
- Второй клик на ту же дату устанавливает диапазон на весь этот день (00:00:00 - 23:59:59)
- Клик на другую дату устанавливает её как конец диапазона

## Интеграция с Mantine

Компонент обернут в `Box` из Mantine, что позволяет использовать все стили и пропсы Mantine для контейнера.

