import { useState, useRef, useEffect } from "react";
import PropTypes from "prop-types";
import { IoMdClose, IoMdArrowDropdown } from "react-icons/io";
import "./Select.css";

/**
 * Custom Select component
 * Replaces Mantine Select
 */
export const Select = ({
  label,
  placeholder = "Select option",
  data = [],
  value,
  onChange,
  clearable = false,
  searchable = false,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const selectRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (selectRef.current && !selectRef.current.contains(e.target)) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter options based on search
  const filteredData = searchable
    ? data.filter((item) => {
        const itemValue = typeof item === "string" ? item : item.label;
        return itemValue.toLowerCase().includes(searchTerm.toLowerCase());
      })
    : data;

  const handleSelect = (option) => {
    const optionValue = typeof option === "string" ? option : option.value;
    onChange(optionValue);
    setIsOpen(false);
    setSearchTerm("");
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange(null);
  };

  const getDisplayValue = () => {
    if (!value) return "";
    const selected = data.find((item) =>
      typeof item === "string" ? item === value : item.value === value
    );
    return typeof selected === "string" ? selected : selected?.label || "";
  };

  return (
    <div className="ui-select-wrapper">
      {label && <label className="ui-select-label">{label}</label>}
      <div
        className={`ui-select ${disabled ? "ui-select-disabled" : ""}`}
        ref={selectRef}
      >
        <div
          className="ui-select-trigger"
          onClick={() => !disabled && setIsOpen(!isOpen)}
        >
          {searchable && isOpen ? (
            <input
              type="text"
              className="ui-select-search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={placeholder}
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span className={`ui-select-value ${!value ? "placeholder" : ""}`}>
              {getDisplayValue() || placeholder}
            </span>
          )}

          <div className="ui-select-icons">
            {clearable && value && !disabled && (
              <button
                className="ui-select-clear-btn"
                onClick={handleClear}
                type="button"
              >
                <IoMdClose size={16} />
              </button>
            )}
            <IoMdArrowDropdown
              size={20}
              className={`ui-select-arrow ${isOpen ? "open" : ""}`}
            />
          </div>
        </div>

        {isOpen && !disabled && (
          <div className="ui-select-dropdown">
            {filteredData.length === 0 ? (
              <div className="ui-select-empty">No options</div>
            ) : (
              filteredData.map((item, index) => {
                const itemValue = typeof item === "string" ? item : item.value;
                const itemLabel = typeof item === "string" ? item : item.label;
                const isSelected = itemValue === value;

                return (
                  <div
                    key={index}
                    className={`ui-select-option ${
                      isSelected ? "selected" : ""
                    }`}
                    onClick={() => handleSelect(item)}
                  >
                    {itemLabel}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
};

Select.propTypes = {
  label: PropTypes.string,
  placeholder: PropTypes.string,
  data: PropTypes.arrayOf(
    PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.shape({
        value: PropTypes.string.isRequired,
        label: PropTypes.string.isRequired,
      }),
    ])
  ).isRequired,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  clearable: PropTypes.bool,
  searchable: PropTypes.bool,
  disabled: PropTypes.bool,
};
