import React, { useState, useMemo, useEffect } from "react";
import { MultiSelect, Group, Text, Badge, Box } from "@mantine/core";
import { FaUsers, FaUser, FaCheck } from "react-icons/fa";
import { useUser } from "@hooks";

/**
 * Компонент для выбора пользователей и групп
 * 
 * ЛОГИКА РАБОТЫ:
 * 1. В options включаем ВСЕХ пользователей (активных + неактивных)
 *    - Это нужно чтобы в выбранных значениях (pills) показывались имена, а не ID
 * 
 * 2. В dropdown показываем только активных пользователей
 *    - Фильтрация происходит в renderOption
 *    - Выбранные неактивные пользователи НЕ показываются в dropdown, но остаются в pills
 * 
 * 3. При выборе группы добавляются ВСЕ пользователи группы (включая неактивных)
 *    - Это нужно для сохранения выбранных значений
 */
export const UserGroupMultiSelect = ({
  value = [],
  onChange = () => { },
  placeholder = "Select users and groups",
  label = "Users & Groups",
  usersData = [], // Данные пользователей из API (raw data)
  techniciansData = [], // Данные из useGetTechniciansList (formatted)
  mode = "multi", // "multi" или "single"
  allowedUserIds = null, // Set с разрешенными ID пользователей для фильтрации
  disabled = false
}) => {
  const [selectedValues, setSelectedValues] = useState(value);
  const { userGroups } = useUser();

  // Синхронизируем selectedValues с внешним value
  useEffect(() => {
    setSelectedValues(value);
  }, [value]);

  // Определяем placeholder в зависимости от режима
  const actualPlaceholder = mode === "single"
    ? (placeholder === "Select users and groups" ? "Select user" : placeholder)
    : placeholder;

  // Создаем полный список опций (ВСЕХ пользователей - активных и неактивных)
  // Это нужно чтобы в pills показывались имена, а не ID
  const options = useMemo(() => {
    // Вариант 1: Если есть techniciansData (отформатированные данные)
    if (techniciansData && techniciansData.length > 0) {
      // Создаем Map всех пользователей (активных из techniciansData + неактивных из usersData)
      const allUsersMap = new Map();
      
      // Добавляем всех пользователей из techniciansData
      techniciansData.forEach(item => {
        if (!item.value.startsWith("__group__")) {
          allUsersMap.set(item.value, item);
        }
      });
      
      // Добавляем неактивных пользователей из usersData (если они есть)
      if (usersData && usersData.length > 0) {
        usersData.forEach(user => {
          const userId = String(user.id);
          // Если пользователь еще не добавлен, добавляем его
          if (!allUsersMap.has(userId)) {
            const name = `${user.name || ''} ${user.surname || ''}`.trim();
            const sipuniId = user.sipuni_id ? ` (SIP: ${user.sipuni_id})` : '';
            const userIdLabel = ` (ID: ${user.id})`;
            
            allUsersMap.set(userId, {
              value: userId,
              label: `${name}${sipuniId}${userIdLabel}`,
              id: user.id,
              sipuni_id: user.sipuni_id,
              status: user.status, // Сохраняем статус для фильтрации
              groupName: user.groups?.[0]?.name,
              name: user.name,
              surname: user.surname
            });
          }
        });
      }
      
      // Обрабатываем данные
      const filtered = techniciansData
        .filter(item => {
          // НЕ фильтруем по статусу - берем все
          // Фильтрация по allowedUserIds
          if (allowedUserIds && !item.value.startsWith("__group__")) {
            return allowedUserIds.has(item.value);
          }
          return true;
        })
        .map(item => {
          const isGroup = item.value.startsWith("__group__");

          // В режиме single отключаем группы
          if (isGroup) {
            return {
              ...item,
              disabled: mode === "single"
            };
          } else {
            // Для пользователей проверяем фильтрацию и обновляем label
            if (allowedUserIds && !allowedUserIds.has(item.value)) {
              return {
                ...item,
                disabled: true
              };
            }

            // Обновляем label с ID техника и SIP ID
            let enhancedLabel = item.label;
            if (item.sipuni_id || item.id) {
              const sipuniId = item.sipuni_id ? ` (SIP: ${item.sipuni_id})` : '';
              const technicianId = item.id ? ` (ID: ${item.id})` : '';
              enhancedLabel = item.label + sipuniId + technicianId;
            }

            return {
              ...item,
              label: enhancedLabel,
              disabled: false,
              status: item.status // Сохраняем статус для фильтрации в dropdown
            };
          }
        });

      // Группируем элементы: сначала все группы, затем все пользователи
      const groups = filtered.filter(item => item.value.startsWith("__group__"));
      const users = filtered.filter(item => !item.value.startsWith("__group__"));

      // Сортируем группы по алфавиту
      groups.sort((a, b) => a.label.localeCompare(b.label));

      // Сортируем пользователей по алфавиту
      users.sort((a, b) => a.label.localeCompare(b.label));

      // Создаем итоговый массив: сначала пользователи без группы, затем группы с пользователями
      const result = [];
      
      // Добавляем пользователей без группы (например, Client и System) в начало
      const usersWithoutGroup = users.filter(user => !user.groupName);
      result.push(...usersWithoutGroup);
      
      groups.forEach(group => {
        // Добавляем группу
        result.push(group);
        
        // Добавляем пользователей этой группы
        const groupUsers = users.filter(user => user.groupName === group.label);
        result.push(...groupUsers);
      });
      
      // Добавляем неактивных пользователей из allUsersMap (которых нет в result)
      allUsersMap.forEach((userItem, userId) => {
        // Проверяем, есть ли пользователь уже в result
        const existsInResult = result.some(opt => opt.value === userId);
        if (!existsInResult) {
          // Добавляем неактивного пользователя
          result.push({
            ...userItem,
            disabled: false
          });
        }
      });

      return result;
    }

    // Вариант 2: Если есть raw данные пользователей из API
    if (usersData && usersData.length > 0) {
      // Берем ВСЕХ пользователей (не фильтруем по статусу)
      const allUsers = usersData;
      
      // Собираем все уникальные группы
      const allGroups = new Map();
      allUsers.forEach(user => {
        if (user.groups && user.groups.length > 0) {
          user.groups.forEach(group => {
            if (!allGroups.has(group.id)) {
              allGroups.set(group.id, {
                id: group.id,
                name: group.name,
                users: []
              });
            }
            // Используем user.id напрямую, так как в новой структуре это уже ID пользователя
            allGroups.get(group.id).users.push(user.id);
          });
        }
      });

      // Создаем опции в формате как в существующей системе
      const options = [];

      // Сортируем группы по алфавиту
      const sortedGroups = Array.from(allGroups.values())
        .sort((a, b) => a.name.localeCompare(b.name));

      // Добавляем группы и их пользователей
      sortedGroups.forEach(group => {
        // Добавляем группу
        options.push({
          value: `__group__${group.id}`,
          label: group.name,
          disabled: mode === "single"
        });

        // Добавляем пользователей этой группы
        const groupUsers = allUsers.filter(user =>
          user.groups && user.groups.some(g => g.id === group.id)
        );

        groupUsers
          .sort((a, b) => {
            const nameA = `${a.name} ${a.surname}`.trim();
            const nameB = `${b.name} ${b.surname}`.trim();
            return nameA.localeCompare(nameB);
          }) // Сортируем пользователей по алфавиту
          .forEach(user => {
            const name = `${user.name} ${user.surname}`.trim();
            const sipuniId = user.sipuni_id ? ` (SIP: ${user.sipuni_id})` : '';
            const userId = ` (ID: ${user.id})`;

            options.push({
              value: String(user.id),
              label: `${name}${sipuniId}${userId}`,
              status: user.status, // Сохраняем статус для фильтрации
              groupName: group.name
            });
          });
      });

      return options;
    }

    // Fallback: используем данные из UserContext (только группы текущего пользователя)
    if (userGroups && userGroups.length > 0) {
      const options = [];
      
      // Сортируем группы по алфавиту
      const sortedGroups = userGroups.sort((a, b) => a.name.localeCompare(b.name));
      
      sortedGroups.forEach(group => {
        // Добавляем группу
        options.push({
          value: `__group__${group.id}`,
          label: group.name,
          isGroup: true,
          groupId: group.id,
          userCount: group.users?.length || 0,
          disabled: mode === "single"
        });

        // Добавляем пользователей этой группы
        const groupUsers = (group.users || [])
          .map(userId => ({
            id: userId,
            groupId: group.id,
            groupName: group.name,
            name: `User ${userId}`
          }))
          .sort((a, b) => a.name.localeCompare(b.name)); // Сортируем пользователей по алфавиту

        groupUsers.forEach(user => {
          options.push({
            value: String(user.id),
            label: `${user.name} (ID: ${user.id})`,
            isGroup: false,
            userId: user.id,
            groupId: user.groupId,
            groupName: user.groupName
          });
        });
      });

      return options;
    }

    // Если нет данных - возвращаем пустой массив
    return [];
  }, [userGroups, usersData, techniciansData, mode, allowedUserIds]);

  const handleChange = (newValues) => {
    // В режиме single ограничиваем выбор одним пользователем
    if (mode === "single") {
      const lastValue = newValues[newValues.length - 1];
      // Проверяем, что выбранный элемент не является группой
      if (lastValue?.startsWith("__group__")) {
        return; // Игнорируем выбор групп в режиме single
      }
      // Оставляем только последний выбранный пользователь
      const singleValue = [lastValue].filter(Boolean);
      setSelectedValues(singleValue);
      onChange(singleValue);
      return;
    }

    // Режим multi - используем существующую логику
    const last = newValues[newValues.length - 1];
    const isGroup = last?.startsWith("__group__");

    if (isGroup) {
      // Если выбрана группа, добавляем или убираем всех пользователей из группы
      const groupId = last.replace("__group__", "");
      
      // Находим название группы
      const groupOption = options.find(opt => opt.value === `__group__${groupId}`);
      const groupName = groupOption?.label;

      // Находим всех пользователей этой группы в options (включая неактивных)
      const groupUsers = options
        .filter(opt => {
          // Пропускаем группы, берем только пользователей
          if (opt.value.startsWith("__group__")) return false;
          // Проверяем принадлежность к группе
          return opt.groupName === groupName;
        })
        .map(opt => opt.value);

      const current = selectedValues || [];

      // Проверяем, были ли уже выбраны пользователи этой группы
      const groupUsersSelected = groupUsers.every(userId => current.includes(userId));

      let newSelection;
      if (groupUsersSelected) {
        // Если группа уже была выбрана - убираем всех её пользователей
        newSelection = current.filter(userId => !groupUsers.includes(userId));
      } else {
        // Если группа не была выбрана - добавляем всех её пользователей
        newSelection = Array.from(new Set([...current, ...groupUsers]));
      }

      setSelectedValues(newSelection);
      onChange(newSelection);
    } else {
      // Обычный выбор пользователя
      setSelectedValues(newValues);
      onChange(newValues);
    }
  };


  // Рендер элемента в выпадающем списке
  const renderOption = ({ option, checked }) => {
    const isGroup = option.value.startsWith("__group__");
    const isDisabled = option.disabled;
    
    // ФИЛЬТРАЦИЯ: Скрываем неактивных пользователей в dropdown
    // Но НЕ скрываем выбранных (чтобы можно было снять галочку)
    if (!isGroup && !checked) {
      const isActive = option.status === true || option.status === undefined;
      if (!isActive) {
        return null; // Не показываем неактивного пользователя
      }
    }

    return (
      <Group
        gap="xs"
        style={{
          padding: '8px 12px',
          opacity: isDisabled ? 0.7 : 1,
          backgroundColor: checked ? "var(--crm-ui-kit-palette-surface-hover-background-color)" : "transparent",
          border: checked ? "1px solid var(--crm-ui-kit-palette-link-primary)" : "1px solid transparent",
          borderRadius: checked ? "6px" : "4px",
          cursor: isDisabled ? "not-allowed" : "pointer",
          transition: "all 0.2s ease",
          position: "relative"
        }}
        onMouseEnter={(e) => {
          if (!isDisabled && !checked) {
            e.currentTarget.style.backgroundColor = "var(--crm-ui-kit-palette-button-classic-hover-background)";
            e.currentTarget.style.border = "1px solid var(--crm-ui-kit-palette-border-default)";
          }
        }}
        onMouseLeave={(e) => {
          if (!checked) {
            e.currentTarget.style.backgroundColor = "transparent";
            e.currentTarget.style.border = "1px solid transparent";
          }
        }}
      >
        {/* Чекбокс для выбранных элементов */}
        {checked && (
          <Box
            style={{
              position: "absolute",
              left: "4px",
              top: "50%",
              transform: "translateY(-50%)",
              width: "16px",
              height: "16px",
              backgroundColor: "var(--crm-ui-kit-palette-link-primary)",
              borderRadius: "3px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1
            }}
          >
            <FaCheck size={10} color="white" />
          </Box>
        )}

        {/* Отступ для чекбокса */}
        <Box style={{ width: checked ? "24px" : "0px", transition: "width 0.2s ease" }} />

        {isGroup ? (
          <FaUsers size={14} style={{ color: checked ? "var(--crm-ui-kit-palette-link-primary)" : "#4caf50" }} />
        ) : (
          <FaUser size={12} style={{ color: checked ? "var(--crm-ui-kit-palette-link-primary)" : "var(--crm-ui-kit-palette-text-secondary-light)" }} />
        )}
        <Box style={{ flex: 1 }}>
          <Text
            size="sm"
            fw={isGroup ? 600 : 400}
            style={{
              color: checked ? "var(--crm-ui-kit-palette-link-primary)" : (isGroup ? "#4caf50" : "var(--crm-ui-kit-palette-text-primary)"),
              fontWeight: checked ? 600 : (isGroup ? 600 : 400)
            }}
          >
            {option.label}
          </Text>
        </Box>
        {isGroup && (
          <Badge
            size="xs"
            variant={checked ? "filled" : "light"}
            color={checked ? "blue" : "green"}
          >
            {(() => {
              const groupName = option.label;
              
              // Считаем только активных пользователей в группе из options
              const userCount = options.filter(opt => {
                // Пропускаем группы, берем только пользователей
                if (opt.value.startsWith("__group__")) return false;
                // Проверяем принадлежность к группе и активный статус
                const isActive = opt.status === true || opt.status === undefined;
                return opt.groupName === groupName && isActive;
              }).length;
              
              return `${userCount} users`;
            })()}
          </Badge>
        )}
      </Group>
    );
  };


  return (
    <Box mt="xs">
      <MultiSelect
        label={label}
        placeholder={actualPlaceholder}
        value={selectedValues}
        onChange={handleChange}
        data={options}
        searchable
        clearable
        hidePickedOptions={false}
        renderOption={renderOption}
        disabled={disabled}
        styles={{
          label: { fontSize: 14, fontWeight: 500 },
          input: {
            borderRadius: 4,
            fontSize: 14,
            minHeight: "36px"
          },
          dropdown: {
            borderRadius: 8,
            boxShadow: "0 4px 6px -1px var(--crm-ui-kit-palette-box-shadow-default)"
          },
          option: {
            padding: 0
          },
          pill: {
            backgroundColor: "var(--crm-ui-kit-palette-background-primary-disabled)",
            color: "var(--crm-ui-kit-palette-text-primary)",
            border: "1px solid var(--crm-ui-kit-palette-border-default)",
            fontWeight: 600
          }
        }}
      />
    </Box>
  );
};
