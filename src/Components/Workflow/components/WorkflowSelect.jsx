import { useState, useRef, useEffect } from "react";
import { getColorByWorkflowType, getBrightByWorkflowType } from "./WorkflowTag";
import "./WorkflowSelect.css";
import { getLanguageByKey } from "../../utils";

export const WorkflowSelect = ({ 
  workflowOptions = [], 
  value, 
  onChange, 
  label,
  placeholder = getLanguageByKey("Selectează flux de lucru"),
  disabled = false,
  clearable = true,
  ...props 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const selectRef = useRef(null);
  const dropdownRef = useRef(null);

  // Фильтрация опций по поисковому запросу
  const filteredOptions = workflowOptions.filter((option) =>
    option.toLowerCase().includes(searchValue.toLowerCase())
  );

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

  const handleSelect = (option) => {
    onChange(option);
    setIsOpen(false);
    setSearchValue("");
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange(null);
    setIsOpen(false);
    setSearchValue("");
  };

  const selectedWorkflow = value || null;
  const backgroundColor = selectedWorkflow
    ? getColorByWorkflowType(selectedWorkflow)
    : "transparent";
  const borderColor = selectedWorkflow
    ? getBrightByWorkflowType(selectedWorkflow)
    : "#ccc";

  return (
    <div className="workflow-select-container">
      {label && (
        <label className="workflow-select-label">
          {label}
        </label>
      )}
      <div
        ref={selectRef}
        className={`workflow-select-trigger ${disabled ? "disabled" : ""}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        style={{
          backgroundColor: selectedWorkflow ? backgroundColor : "var(--crm-ui-kit-palette-background-primary)",
          borderColor: selectedWorkflow ? borderColor : "var(--crm-ui-kit-palette-border-default)",
          border: `1px solid ${selectedWorkflow ? borderColor : "#ccc"}`,
          cursor: disabled ? "not-allowed" : "pointer",
        }}
      >
        {selectedWorkflow ? (
          <span
            style={{
              color: "#000000",
              fontSize: "12px",
            }}
          >
            {getLanguageByKey(selectedWorkflow)}
          </span>
        ) : (
          <span className="workflow-select-placeholder">{placeholder}</span>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          {clearable && selectedWorkflow && !disabled && (
            <span
              className="workflow-select-clear"
              onClick={handleClear}
              style={{
                cursor: "pointer",
                fontSize: "16px",
                color: "fff000",
                padding: "0 4px",
              }}
            >
              ×
            </span>
          )}
          <span className="workflow-select-arrow">▾</span>
        </div>
      </div>

      {isOpen && !disabled && (
        <div ref={dropdownRef} className="workflow-select-dropdown">
          <input
            type="text"
            className="workflow-select-search"
            placeholder={getLanguageByKey("Caută...")}
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onClick={(e) => e.stopPropagation()}
          />
          <div className="workflow-select-options">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => {
                const optionBgColor = getColorByWorkflowType(option);
                const optionBorderColor = getBrightByWorkflowType(option);
                const isSelected = option === value;

                return (
                  <div
                    key={option}
                    className={`workflow-select-option ${isSelected ? "selected" : ""}`}
                    onClick={() => handleSelect(option)}
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
                      }}
                    >
                      {getLanguageByKey(option)}
                    </span>
                    {isSelected && <span className="workflow-select-check">✓</span>}
                  </div>
                );
              })
            ) : (
              <div className="workflow-select-no-results">
                {getLanguageByKey("Nu s-au găsit rezultate")}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
