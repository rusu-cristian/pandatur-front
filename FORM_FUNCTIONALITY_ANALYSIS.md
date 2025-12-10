# Полный анализ функционала форм тикетов

## 📋 Содержание
1. [Архитектура форм](#архитектура-форм)
2. [Компоненты форм](#компоненты-форм)
3. [Валидация](#валидация)
4. [API взаимодействия](#api-взаимодействия)
5. [Сохранение данных](#сохранение-данных)
6. [Места использования](#места-использования)
7. [События и обновления](#события-и-обновления)
8. [Разрешения и безопасность](#разрешения-и-безопасность)
9. [Состояния загрузки](#состояния-загрузки)

---

## 🏗️ Архитектура форм

### Единая форма Mantine
Все формы используют **один экземпляр формы** через хук `useFormTicket`:
- **Режим**: `uncontrolled` (неконтролируемые компоненты)
- **Валидация**: `validateInputOnChange: true`, `validateInputOnBlur: true`
- **Форматирование**: автоматическое через `transformValues` (даты, булевы значения)

### Хук `useFormTicket`
```javascript
const {
  form,                      // Экземпляр Mantine формы
  hasErrorsTicketInfoForm,   // Флаг ошибок формы Lead
  hasErrorsContractForm,     // Флаг ошибок формы Contract
  hasErrorQualityControl,    // Флаг ошибок формы Quality Control
} = useFormTicket({
  groupTitle: updatedTicket?.group_title ?? extraInfo?.group_title
});
```

**Возвращает**:
- `form` - объект формы Mantine со всеми методами
- Флаги ошибок для каждой вкладки (для визуальной индикации)

---

## 🧩 Компоненты форм

### 1. **GeneralForm** (Основная форма)
**Местоположение**: `src/Components/TicketForms/GeneralForm.jsx`

**Поля**:
- `group_title` - Группа (Select, required)
- `workflow` - Workflow (Select, required, зависит от group_title)
- `technician_id` - Ответственный (UserGroupMultiSelect, single mode)
- `priority` - Приоритет (Select, disabled)
- `contact` - Контакт (TextInput)
- `tags` - Теги (TagsInput)
- `description` - Описание (Textarea)

**Особенности**:
- Динамическая фильтрация workflow по `group_title`
- Сброс workflow при смене группы
- Блокировка финальных статусов для не-админов
- Разные наборы workflow для админов, TikTok Manager и обычных пользователей

**Использование**:
```javascript
<GeneralForm
  data={formData.general}      // Данные из updatedTicket
  formInstance={form}           // Общий экземпляр формы
  onSubmit={handleUpdateTicketDate}  // Обработчик (используется редко)
/>
```

---

### 2. **TicketInfoForm** (Форма Lead)
**Местоположение**: `src/Components/TicketForms/TicketInfoForm.jsx`

**Поля**:
- `buget` - Бюджет (NumberInput, €)
- `data_venit_in_oficiu` - Дата прихода в офис (DatePickerInput)
- `data_plecarii` - Дата выезда (DatePickerInput)
- `data_intoarcerii` - Дата возврата (DatePickerInput)
- `data_cererii_de_retur` - Дата заявки на возврат (DatePickerInput)
- `sursa_lead` - Источник лида (Select)
- `promo` - Промо (Select)
- `marketing` - Маркетинг (Select)
- `tipul_serviciului` - Тип услуги (Select)
- `tara` - Страна (Select)
- `tip_de_transport` - Тип транспорта (Select)
- `denumirea_excursiei_turului` - Название экскурсии/тура (Select)
- `procesarea_achizitionarii` - Обработка покупки (Select)

**Особенности**:
- Подсветка сегодняшней даты в календаре
- Минимальная дата через `setMinDate`

---

### 3. **ContractForm** (Форма контракта)
**Местоположение**: `src/Components/TicketForms/ContractForm.jsx`

**Поля**:
- `numar_de_contract` - Номер контракта (TextInput)
- `data_contractului` - Дата контракта (DatePickerInput)
- `data_avansului` - Дата аванса (DatePickerInput)
- `data_de_plata_integrala` - Дата полной оплаты (DatePickerInput)
- `contract_trimis` - Контракт отправлен (LabelSwitch)
- `contract_semnat` - Контракт подписан (LabelSwitch)
- `tour_operator` - Тур-оператор (TextInput)
- `numarul_cererii_de_la_operator` - Номер заявки от оператора (TextInput)
- `achitare_efectuata` - Оплата выполнена (LabelSwitch)
- `rezervare_confirmata` - Резерв подтвержден (LabelSwitch)
- `contract_arhivat` - Контракт архивирован (LabelSwitch)
- `statutul_platii` - Статус оплаты (Select)
- `avans_euro` - Аванс в евро (NumberInput, €)
- `pret_netto` - Цена нетто (NumberInput, €)
- `achitat_client` - Оплачено клиентом (NumberInput)
- `comision_companie` - Комиссия компании (NumberInput, €, может быть disabled)
- `control` - Контроль админа (LabelSwitch, только для админов и IT dep.)

**Особенности**:
- Автоматический расчет комиссии: `comision_companie = buget - pret_netto` (через `onValuesChange` в useFormTicket)
- Условное отображение `control` только для админов и группы "IT dep."
- Некоторые поля могут быть disabled через `hideDisabledInput`

---

### 4. **QualityControlForm** (Форма контроля качества)
**Местоположение**: `src/Components/TicketForms/QualityControlForm.jsx`

**Поля**:
- `motivul_refuzului` - Причина отказа (Select)
- `evaluare_de_odihna` - Оценка отдыха (Select)
- `urmatoarea_vacanta` - Следующая вакансия (TextInput)
- `manager` - Менеджер (TextInput)
- `vacanta` - Вакансия (TextInput)

**Особенности**:
- Минимальный набор полей
- Используется для финальной проверки качества

---

## ✅ Валидация

### Зависимая от workflow валидация
Валидация полей зависит от текущего `workflow`:

#### WORKFLOWS_WITH_SOURCE
**Workflows**: "Luat în lucru", "Ofertă trimisă", "Aprobat cu client", "Contract semnat", "Plată primită", "Contract încheiat", "Realizat cu succes"

**Обязательные поля**:
- `sursa_lead` - Источник лида
- `promo` - Промо
- `marketing` - Маркетинг

#### WORKFLOWS_WITH_SERVICE
**Workflows**: "Ofertă trimisă", "Aprobat cu client", "Contract semnat", "Plată primită", "Contract încheiat", "Realizat cu succes"

**Обязательные поля**:
- `tipul_serviciului` - Тип услуги
- `tara` - Страна
- `tip_de_transport` - Тип транспорта
- `denumirea_excursiei_turului` - Название экскурсии

#### WORKFLOWS_WITH_PROCESS
**Workflows**: "Aprobat cu client", "Contract semnat", "Plată primită", "Contract încheiat", "Realizat cu succes"

**Обязательные поля**:
- `procesarea_achizitionarii` - Обработка покупки

#### WORKFLOWS_WITH_CONTRACT
**Workflows**: "Contract semnat", "Plată primită", "Contract încheiat", "Realizat cu succes"

**Обязательные поля**:
- `numar_de_contract` - Номер контракта
- `data_contractului` - Дата контракта
- `contract_trimis` - Контракт отправлен
- `contract_semnat` - Контракт подписан

#### WORKFLOWS_WITH_PAYMENT
**Workflows**: "Plată primită", "Contract încheiat", "Realizat cu succes"

**Обязательные поля**:
- `achitare_efectuata` - Оплата выполнена

#### WORKFLOWS_FINAL_STAGE
**Workflows**: "Contract încheiat", "Realizat cu succes"

**Обязательные поля**:
- `buget` - Бюджет
- `data_plecarii` - Дата выезда
- `data_intoarcerii` - Дата возврата
- `tour_operator` - Тур-оператор
- `numarul_cererii_de_la_operator` - Номер заявки от оператора
- `rezervare_confirmata` - Резерв подтвержден
- `contract_arhivat` - Контракт архивирован
- `statutul_platii` - Статус оплаты
- `pret_netto` - Цена нетто

#### WORKFLOWS_REALIZAT_ONLY
**Workflow**: "Realizat cu succes"

**Обязательные поля**:
- `control` - Контроль админа

#### WORKFLOWS_REFUSED_ONLY
**Workflow**: "Închis și nerealizat"

**Обязательные поля**:
- `motivul_refuzului` - Причина отказа

### Исключения для групп
Для групп `["HR", "QUALITYDEPARTMENT", "Agency", "GreenCard"]`:
- Валидация для workflow "Realizat cu succes" **пропускается**

### Визуальная индикация ошибок
- Вкладки показывают индикатор ошибки через атрибут `data-error="true"`
- Флаги ошибок обновляются автоматически через `useEffect` в `useFormTicket`

---

## 🌐 API взаимодействия

### 1. Загрузка данных

#### `api.tickets.ticket.getInfo(ticketId)`
**Назначение**: Получение дополнительной информации о тикете (lead, contract, quality)
**Используется в**: `fetchTicketExtraInfo` (ChatExtraInfo.js:131-142)
**Возвращает**: Данные для форм Lead, Contract, Quality Control

#### `api.tickets.ticket.getLightById(id)`
**Назначение**: Получение легкой версии тикета (основные поля)
**Используется в**: ManageLeadInfoTabs.jsx
**Возвращает**: Данные для GeneralForm

### 2. Сохранение данных

#### `api.tickets.updateById(body)`
**Метод**: PATCH
**URL**: `/api/tickets`
**Параметры**:
```javascript
{
  id: [ticketId],           // Массив ID тикетов
  technician_id: null,      // ID ответственного (может быть null)
  workflow: "...",          // Текущий workflow
  priority: "...",          // Приоритет
  contact: "...",           // Контакт
  tags: [...],              // Массив тегов
  group_title: "...",       // Группа
  description: "..."        // Описание
}
```

**Используется в**:
- `updateTicketDate` - сохранение только GeneralForm
- `handleSubmitAllForms` - сохранение всех форм

#### `api.tickets.ticket.create(ticketId, extraFields)`
**Метод**: POST
**URL**: `/api/ticket-info/${ticketId}`
**Параметры**: Все поля кроме основных (technician_id, workflow, priority, contact, tags, group_title, description)

**Используется в**:
- `saveTicketExtraDate` - сохранение отдельных форм (Lead, Contract, Quality)
- `handleSubmitAllForms` - сохранение всех дополнительных полей

### 3. Дополнительные операции

#### `api.tickets.merge(body)`
**Назначение**: Объединение тикетов
```javascript
{
  ticket_old: ticketId,
  ticket_new: id
}
```

#### `api.users.clientMerge(body)`
**Назначение**: Объединение клиентов
```javascript
{
  old_user_id: selectedClient.payload?.id,
  new_user_id: id
}
```

#### `api.tickets.ticket.addClientToTicket(body)`
**Назначение**: Добавление клиента к тикету
```javascript
{
  ticket_id: ticketId,
  name: "...",
  surname: "..."
}
```

---

## 💾 Сохранение данных

### Сценарий 1: Сохранение через кнопку "Actualizare"
**Функция**: `handleSubmitAllForms` (ChatExtraInfo.js:230-301)

**Процесс**:
1. Получение всех значений формы: `form.getValues()`
2. Валидация: `form.validate().hasErrors`
3. Обработка `technician_id`:
   - Если пустой (undefined, null, "", "undefined", "null") → `null`
   - Иначе → значение из формы
4. Разделение полей:
   - **General fields**: `technician_id`, `workflow`, `priority`, `contact`, `tags`, `group_title`, `description`
   - **Extra fields**: все остальные поля
5. Последовательное сохранение:
   - Сначала: `api.tickets.updateById` (general fields)
   - Затем: `api.tickets.ticket.create` (extra fields)
6. Отправка события: `window.dispatchEvent(new CustomEvent('ticketUpdated'))`
7. Показ уведомления об успехе/ошибке

### Сценарий 2: Отдельное сохранение GeneralForm
**Функция**: `updateTicketDate` (ChatExtraInfo.js:99-129)

**Процесс**:
- Валидация
- Сохранение через `api.tickets.updateById`
- Уведомление (используется редко, т.к. GeneralForm не имеет собственной кнопки сохранения)

### Сценарий 3: Сохранение через ManageLeadInfoTabs
**Функция**: `handleSubmit` (ManageLeadInfoTabs.jsx:34-86)

**Процесс**:
- Валидация
- Преобразование булевых полей в строки
- Сохранение через `api.tickets.updateById` (все поля сразу)
- Обновление списка лидов через `fetchLeads()`
- Закрытие модального окна

---

## 📍 Места использования

### 1. ChatExtraInfo (Основное использование)
**Файл**: `src/Components/ChatComponent/ChatExtraInfo.js`
**Страницы**: Chat.js, SingleChat.js

**Особенности**:
- Полный функционал всех форм
- Интеграция с PersonalData4ClientForm
- Объединение тикетов и клиентов (для админов)
- Вкладки: General, Lead, Contract, Documents, Media, Quality Control

**Props**:
- `updatedTicket` - данные тикета (light version)
- `extraInfo` - дополнительная информация (загружается через `fetchTicketExtraInfo`)
- `selectedClient` - выбранный клиент
- `clientsData` - данные клиентов (из useClientContacts)

### 2. ManageLeadInfoTabs (Редактирование лидов)
**Файл**: `src/Components/LeadsComponent/ManageLeadInfoTabs.jsx`
**Используется**: Модальное окно редактирования лидов

**Особенности**:
- Только формы (без PersonalData4ClientForm)
- Одна кнопка "Save" внизу
- Автоматическое обновление списка лидов после сохранения
- Вкладки: General Info, Ticket Info, Contract, Quality Control

### 3. TicketFormTabs (Фильтры)
**Файл**: `src/Components/TicketFormTabs/TicketFormTabs.jsx`
**Используется**: Фильтрация лидов

**Особенности**:
- Использует **Filter версии** форм (BasicGeneralFormFilter, TicketInfoFormFilter, ContractFormFilter, QualityControlFormFilter)
- Формы работают как фильтры, а не редакторы
- Использует `forwardRef` для получения значений через `getValues()`

---

## 🔔 События и обновления

### Событие `ticketUpdated`
**Тип**: CustomEvent
**Детали**: `{ ticketId: number }`

**Отправляется из**:
1. `handleSubmitAllForms` (ChatExtraInfo.js:288-290)
2. `handleSaveClient` (PersonalData4ClientForm.jsx:235)
3. `handleUpdateClient` (PersonalData4ClientForm.jsx:453)
4. `handleDeleteContact` (PersonalData4ClientForm.jsx:287)
5. `handleAddContact` (PersonalData4ClientForm.jsx:382)

**Назначение**:
- Уведомление других компонентов об обновлении тикета
- Обновление данных в родительских компонентах
- Синхронизация состояния приложения

**Примечание**: В PersonalData4ClientForm слушатель был удален, т.к. вызывал дублирующие запросы (комментарий в коде)

---

## 🔐 Разрешения и безопасность

### Компонент `Can`
Используется для контроля доступа к кнопке сохранения:

```javascript
<Can permission={{ module: "leads", action: "edit" }} context={{ responsibleId }}>
  <Button onClick={handleSubmitAllForms}>
    {getLanguageByKey("Actualizare")}
  </Button>
</Can>
```

**Условия отображения**:
- Пользователь должен иметь разрешение `module: "leads", action: "edit"`
- `responsibleId` должен совпадать с текущим пользователем (или пользователь должен быть админом)

**responsibleId вычисляется**:
```javascript
const responsibleId = useMemo(() => {
  const technicianId = form.values.technician_id 
    ?? updatedTicket?.technician_id 
    ?? extraInfo?.technician_id;
  
  return technicianId !== null && technicianId !== undefined
    ? String(technicianId)
    : null;
}, [form.values.technician_id, updatedTicket?.technician_id, extraInfo?.technician_id]);
```

**Приоритет**:
1. Значение из формы (текущее редактирование)
2. Значение из `updatedTicket` (данные тикета)
3. Значение из `extraInfo` (дополнительная информация)

### Условное отображение полей
- Поле `control` в ContractForm видно только админам и группе "IT dep."
- Финальные workflow блокируются для не-админов
- Объединение тикетов/клиентов доступно только админам

---

## ⏳ Состояния загрузки

### Состояния в ChatExtraInfo
```javascript
const [isLoadingExtraInfo, setIsLoadingExtraInfo] = useState(true);    // Загрузка дополнительной информации
const [isLoadingGeneral, setIsLoadingGeneral] = useState(false);       // Сохранение основных данных
const [isLoadingCombineLead, setIsLoadingCombineLead] = useState(false);  // Объединение тикетов
const [isLoadingCombineClient, setIsLoadingClient] = useState(false);     // Объединение клиентов
const [isLoadingInfoTicket, setIsLoadingInfoTicket] = useState(false);    // Сохранение дополнительных данных
```

### Индикация загрузки
- При загрузке `extraInfo`: показывается `Loader` вместо всего компонента
- Кнопка "Actualizare": `loading={isLoadingGeneral || isLoadingInfoTicket}`
- Кнопки объединения: индивидуальные состояния загрузки

---

## 🔄 Автоматические вычисления

### Комиссия компании
**Триггер**: Изменение `buget` или `pret_netto`
**Формула**: `comision_companie = buget - pret_netto`
**Реализация**: `onValuesChange` в `useFormTicket` (строки 82-91)

**Условия**:
- Оба поля должны быть заполнены
- Оба поля должны быть "touched" (пользователь взаимодействовал)

---

## 📝 Форматирование данных

### transformValues в useFormTicket
Автоматическое преобразование перед отправкой:

1. **Даты** → форматирование через `formatDate()`:
   - `data_venit_in_oficiu`
   - `data_plecarii`
   - `data_intoarcerii`
   - `data_cererii_de_retur`
   - `data_contractului`
   - `data_avansului`
   - `data_de_plata_integrala`

2. **Булевы значения** → преобразование в строки:
   - `contract_trimis` → `String(value ?? false)`
   - `contract_semnat` → `String(value ?? false)`
   - `achitare_efectuata` → `String(value ?? false)`
   - `rezervare_confirmata` → `String(value ?? false)`
   - `contract_arhivat` → `String(value ?? false)`
   - `control` → `String(value ?? false)`

---

## 🎯 Инициализация форм

### Паттерн инициализации
Все формы используют одинаковый паттерн с `useRef`:

```javascript
const isInitialized = useRef(false);

useEffect(() => {
  if (data && !isInitialized.current) {
    formInstance.setValues({ /* поля */ });
    isInitialized.current = true;
  }
}, [data, formInstance]);
```

**Цель**: Инициализация только один раз при первой загрузке данных

**Преимущества**:
- Предотвращение перезаписи пользовательских изменений
- Стабильность формы при перерендерах
- Эффективность (инициализация только один раз)

---

## 🔗 Связанные компоненты

### PersonalData4ClientForm
**Расположение**: `src/Components/ChatComponent/components/PersonalData4ClientForm.jsx`
**Связь**: Отображается на вкладке "General" вместе с GeneralForm

**Функционал**:
- Отображение клиентов тикета
- Добавление нового клиента
- Редактирование клиента
- Добавление/удаление контактов клиента
- Использует отдельную форму Mantine для редактирования

**Интеграция**:
- Получает `clientsData` из `useClientContacts` (передается через props)
- Отправляет событие `ticketUpdated` при изменениях
- Не связана напрямую с `useFormTicket`, но работает в том же контексте

### InvoiceTab
**Расположение**: `src/Components/ChatComponent/components/InvoiceTab.jsx`
**Связь**: Отображается на вкладке "Documents"

**Функционал**: Работа с документами/инвойсами (не связана с формами)

### Media
**Расположение**: `src/Components/ChatComponent/components/Media.jsx`
**Связь**: Отображается на вкладке "Media"

**Функционал**: Отображение медиафайлов тикета (не связана с формами)

---

## 🐛 Особенности и потенциальные проблемы

### 1. Дублирование данных
- `formData.general` = `updatedTicket`
- `formData.lead`, `formData.contract`, `formData.quality` = `extraInfo`
- Мемоизация через `useMemo` предотвращает ненужные перерендеры

### 2. Сохранение `technician_id`
- Специальная обработка для пустых значений
- Конвертация в строку для проверки разрешений
- Может быть `null` (явное указание отсутствия ответственного)

### 3. События ticketUpdated
- Используются для синхронизации, но могут вызывать дублирующие запросы
- В PersonalData4ClientForm слушатель был удален для предотвращения этого

### 4. Валидация workflow
- Динамическая валидация в зависимости от `workflow`
- Может быть запутанной для пользователя (непонятно, почему поле обязательно)
- Индикация ошибок на вкладках помогает найти проблемные поля

---

## 📊 Структура данных

### GeneralForm данные (updatedTicket)
```javascript
{
  technician_id: number | null,
  workflow: string,
  priority: string,
  contact: string,
  tags: string | string[],
  group_title: string,
  description: string
}
```

### ExtraInfo данные (lead/contract/quality)
```javascript
{
  // Lead fields
  buget: number,
  data_venit_in_oficiu: string,
  data_plecarii: string,
  data_intoarcerii: string,
  data_cererii_de_retur: string,
  sursa_lead: string,
  promo: string,
  marketing: string,
  tipul_serviciului: string,
  tara: string,
  tip_de_transport: string,
  denumirea_excursiei_turului: string,
  procesarea_achizitionarii: string,
  
  // Contract fields
  numar_de_contract: string,
  data_contractului: string,
  data_avansului: string,
  data_de_plata_integrala: string,
  contract_trimis: boolean | string,
  contract_semnat: boolean | string,
  tour_operator: string,
  numarul_cererii_de_la_operator: string,
  achitare_efectuata: boolean | string,
  rezervare_confirmata: boolean | string,
  contract_arhivat: boolean | string,
  statutul_platii: string,
  avans_euro: number,
  pret_netto: number,
  achitat_client: number,
  comision_companie: number,
  control: boolean | string,
  
  // Quality fields
  motivul_refuzului: string,
  evaluare_de_odihna: string,
  urmatoarea_vacanta: string,
  manager: string,
  vacanta: string
}
```

---

## 🎨 UI/UX особенности

### Визуальная индикация ошибок
- Вкладки с ошибками имеют атрибут `data-error="true"`
- Можно стилизовать через CSS селектор `[data-error="true"]`
- Обновляется в реальном времени при изменении формы

### Ключи компонентов
Каждая форма имеет уникальный `key` для принудительного пересоздания:
```javascript
key={`general-${ticketId}-${JSON.stringify(formData.general)}`}
key={`lead-${ticketId}-${JSON.stringify(formData.lead)}`}
```

**Цель**: Переинициализация формы при изменении `ticketId` или данных

### Состояния загрузки
- Кнопка "Actualizare" блокируется во время сохранения
- Лоадер отображается при первой загрузке `extraInfo`
- Индивидуальные состояния для каждого типа операции

---

## ✅ Итоговая схема потока данных

```
1. Компонент монтируется
   ↓
2. useEffect: fetchTicketExtraInfo(ticketId)
   ↓
3. setExtraInfo(data) → обновление formData
   ↓
4. Формы инициализируются через useEffect (один раз)
   ↓
5. Пользователь редактирует поля
   ↓
6. Валидация в реальном времени (onChange, onBlur)
   ↓
7. Обновление флагов ошибок (hasErrors*)
   ↓
8. Пользователь нажимает "Actualizare"
   ↓
9. handleSubmitAllForms:
   - Валидация всех полей
   - Разделение на general и extra поля
   - api.tickets.updateById (general)
   - api.tickets.ticket.create (extra)
   - window.dispatchEvent('ticketUpdated')
   ↓
10. Обновление UI через события и перезагрузка данных
```

---

## 🔍 Полезные команды для отладки

### Проверка состояния формы
```javascript
console.log('Form values:', form.values);
console.log('Form errors:', form.errors);
console.log('Has errors:', {
  ticketInfo: hasErrorsTicketInfoForm,
  contract: hasErrorsContractForm,
  quality: hasErrorQualityControl
});
```

### Отслеживание событий
```javascript
window.addEventListener('ticketUpdated', (e) => {
  console.log('Ticket updated:', e.detail);
});
```

---

**Дата создания анализа**: 2024
**Версия кодовой базы**: актуальная на момент анализа
