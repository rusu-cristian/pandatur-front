import { useState, useRef, useEffect } from "react";
import PropTypes from "prop-types";
import { IoMdClose, IoMdArrowDropdown } from "react-icons/io";
import "./MultiSelect.css";

/**
 * Custom MultiSelect component
 * Replaces Mantine MultiSelect
 */
export const MultiSelect = ({
  label,
  placeholder = "Select options",
  data = [],
  value = [],
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

  const handleToggle = (option) => {
    const optionValue = typeof option === "string" ? option : option.value;
    const newValue = value.includes(optionValue)
      ? value.filter((v) => v !== optionValue)
      : [...value, optionValue];
    onChange(newValue);
  };

  const handleRemove = (valueToRemove, e) => {
    e.stopPropagation();
    onChange(value.filter((v) => v !== valueToRemove));
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange([]);
  };

  const getSelectedLabels = () => {
    return value.map((v) => {
      const found = data.find((item) =>
        typeof item === "string" ? item === v : item.value === v
      );
      return typeof found === "string" ? found : found?.label || v;
    });
  };

  return (
    <div className="ui-multiselect-wrapper">
      {label && <label className="ui-multiselect-label">{label}</label>}
      <div
        className={`ui-multiselect ${disabled ? "ui-multiselect-disabled" : ""}`}
        ref={selectRef}
      >
        <div
          className="ui-multiselect-trigger"
          onClick={() => !disabled && setIsOpen(!isOpen)}
        >
          <div className="ui-multiselect-content">
            {value.length === 0 ? (
              <span className="ui-multiselect-placeholder">{placeholder}</span>
            ) : (
              <div className="ui-multiselect-tags">
                {getSelectedLabels().map((label, index) => (
                  <span key={index} className="ui-multiselect-tag">
                    {label}
                    {!disabled && (
                      <button
                        className="ui-multiselect-tag-remove"
                        onClick={(e) => handleRemove(value[index], e)}
                        type="button"
                      >
                        <IoMdClose size={14} />
                      </button>
                    )}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="ui-multiselect-icons">
            {clearable && value.length > 0 && !disabled && (
              <button
                className="ui-multiselect-clear-btn"
                onClick={handleClear}
                type="button"
              >
                <IoMdClose size={16} />
              </button>
            )}
            <IoMdArrowDropdown
              size={20}
              className={`ui-multiselect-arrow ${isOpen ? "open" : ""}`}
            />
          </div>
        </div>

        {isOpen && !disabled && (
          <div className="ui-multiselect-dropdown">
            {searchable && (
              <div className="ui-multiselect-search">
                <input
                  type="text"
                  className="ui-multiselect-search-input"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search..."
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            )}

            <div className="ui-multiselect-options">
              {filteredData.length === 0 ? (
                <div className="ui-multiselect-empty">No options</div>
              ) : (
                filteredData.map((item, index) => {
                  const itemValue = typeof item === "string" ? item : item.value;
                  const itemLabel = typeof item === "string" ? item : item.label;
                  const isSelected = value.includes(itemValue);

                  return (
                    <div
                      key={index}
                      className={`ui-multiselect-option ${
                        isSelected ? "selected" : ""
                      }`}
                      onClick={() => handleToggle(item)}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        readOnly
                        className="ui-multiselect-checkbox"
                      />
                      {itemLabel}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

MultiSelect.propTypes = {
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
  value: PropTypes.arrayOf(PropTypes.string),
  onChange: PropTypes.func.isRequired,
  clearable: PropTypes.bool,
  searchable: PropTypes.bool,
  disabled: PropTypes.bool,
};
