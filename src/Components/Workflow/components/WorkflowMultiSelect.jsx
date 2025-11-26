import { useState, useRef, useEffect } from "react";
import { getColorByWorkflowType, getBrightByWorkflowType } from "./WorkflowTag";
import "./WorkflowMultiSelect.css";
import { getLanguageByKey } from "../../utils";

export const WorkflowMultiSelect = ({
  workflowOptions = [],
  value = [],
  onChange,
  label,
  placeholder = getLanguageByKey("Selectează flux de lucru"),
  disabled = false,
  clearable = true,
  selectAllLabel,
  ...props
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const selectRef = useRef(null);
  const dropdownRef = useRef(null);

  // Убеждаемся, что value - это массив
  const selectedValues = Array.isArray(value) ? value : [];

  // Фильтрация опций по поисковому запросу
  const filteredOptions = workflowOptions.filter((option) =>
    option.toLowerCase().includes(searchValue.toLowerCase())
  );

  // Добавляем selectAllLabel в начало, если он передан
  const optionsWithSelectAll = selectAllLabel
    ? [selectAllLabel, ...filteredOptions]
    : filteredOptions;

  // Закрытие при клике вне компонента
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        selectRef.current &&
        !selectRef.current.contains(event.target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setIsOpen(false);
        setSearchValue("");
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleToggle = (option) => {
    if (option === selectAllLabel) {
      // Логика для Select All
      const workflowsWithoutSelectAll = selectedValues.filter(v => v !== selectAllLabel);
      const allSelected =
        filteredOptions.length > 0 &&
        workflowsWithoutSelectAll.length === filteredOptions.length &&
        filteredOptions.every(wf => workflowsWithoutSelectAll.includes(wf));

      if (allSelected) {
        // Снять все
        onChange([]);
      } else {
        // Выбрать все
        onChange([...filteredOptions]);
      }
    } else {
      // Обычный выбор/снятие выбора
      const newValue = selectedValues.includes(option)
        ? selectedValues.filter(v => v !== option)
        : [...selectedValues.filter(v => v !== selectAllLabel), option];
      onChange(newValue);
    }
  };

  const handleRemoveTag = (option, e) => {
    e.stopPropagation();
    const newValue = selectedValues.filter(v => v !== option);
    onChange(newValue);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange([]);
    setIsOpen(false);
    setSearchValue("");
  };

  const isSelected = (option) => {
    if (option === selectAllLabel) {
      const workflowsWithoutSelectAll = selectedValues.filter(v => v !== selectAllLabel);
      return (
        filteredOptions.length > 0 &&
        workflowsWithoutSelectAll.length === filteredOptions.length &&
        filteredOptions.every(wf => workflowsWithoutSelectAll.includes(wf))
      );
    }
    return selectedValues.includes(option);
  };

  return (
    <div className="workflow-multiselect-container">
      {label && (
        <label className="workflow-multiselect-label">
          {label}
        </label>
      )}
      <div
        ref={selectRef}
        className={`workflow-multiselect-trigger ${disabled ? "disabled" : ""}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        style={{
          cursor: disabled ? "not-allowed" : "pointer",
        }}
      >
        <div className="workflow-multiselect-values">
          {selectedValues.length > 0 ? (
            <div className="workflow-multiselect-tags">
              {selectedValues.slice(0, 4).map((option) => {
                const bgColor = getColorByWorkflowType(option);
                const borderColor = getBrightByWorkflowType(option);
                return (
                  <span
                    key={option}
                    className="workflow-multiselect-tag"
                    style={{
                      backgroundColor: bgColor,
                      borderColor: borderColor,
                      // border: `1px solid ${borderColor}`,
                    }}
                  >
                    <span style={{ color: "#000000", fontSize: "14px",fontWeight: "600" }}>
                      {option}
                    </span>
                    {!disabled && (
                      <span
                        className="workflow-multiselect-tag-remove"
                        onClick={(e) => handleRemoveTag(option, e)}
                      >
                        ×
                      </span>
                    )}
                  </span>
                );
              })}
              {selectedValues.length > 4 && (
                <span className="workflow-multiselect-more">
                  +{selectedValues.length - 4}
                </span>
              )}
            </div>
          ) : (
            <span className="workflow-multiselect-placeholder">{placeholder}</span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          {clearable && selectedValues.length > 0 && !disabled && (
            <span
              className="workflow-multiselect-clear"
              onClick={handleClear}
            >
              ×
            </span>
          )}
          <span className="workflow-multiselect-arrow">▾</span>
        </div>
      </div>

      {isOpen && !disabled && (
        <div ref={dropdownRef} className="workflow-multiselect-dropdown">
          <input
            type="text"
            className="workflow-multiselect-search"
            placeholder={getLanguageByKey("Caută...")}
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onClick={(e) => e.stopPropagation()}
          />
          <div className="workflow-multiselect-options">
            {optionsWithSelectAll.length > 0 ? (
              optionsWithSelectAll.map((option) => {
                const isOptionSelected = isSelected(option);
                // Для selectAllLabel используем специальный стиль
                const optionBgColor = option === selectAllLabel
                  ? "#f0f0f0"
                  : getColorByWorkflowType(option);
                const optionBorderColor = option === selectAllLabel
                  ? "#ccc"
                  : getBrightByWorkflowType(option);

                return (
                  <div
                    key={option}
                    className={`workflow-multiselect-option ${isOptionSelected ? "selected" : ""}`}
                    onClick={() => handleToggle(option)}
                    style={{
                      backgroundColor: optionBgColor,
                      borderColor: optionBorderColor,
                      border: `1px solid ${optionBorderColor}`,
                    }}
                  >
                    <span
                      style={{
                        color: "#000000",
                        fontSize: "14px",
                        fontWeight: option === selectAllLabel ? "600" : "normal",
                      }}
                    >
                      {option}
                    </span>
                    {isOptionSelected && <span className="workflow-multiselect-check">✓</span>}
                  </div>
                );
              })
            ) : (
              <div className="workflow-multiselect-no-results">
                {getLanguageByKey("Nu s-au găsit rezultate")}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
