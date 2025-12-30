import { useState, useRef, useEffect } from "react";
import PropTypes from "prop-types";
import "./Dropdown.css";

/**
 * Dropdown Menu component
 * Replaces Mantine Menu
 */
export const Dropdown = ({ trigger, children, width = 200 }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleItemClick = (onClick) => {
    if (onClick) {
      onClick();
    }
    setIsOpen(false);
  };

  return (
    <div className="ui-dropdown" ref={dropdownRef}>
      <div onClick={() => setIsOpen(!isOpen)}>{trigger}</div>
      {isOpen && (
        <div className="ui-dropdown-menu" style={{ width }}>
          {typeof children === "function"
            ? children({ onItemClick: handleItemClick })
            : children}
        </div>
      )}
    </div>
  );
};

Dropdown.propTypes = {
  trigger: PropTypes.node.isRequired,
  children: PropTypes.oneOfType([PropTypes.node, PropTypes.func]).isRequired,
  width: PropTypes.number,
};

/**
 * Dropdown Item component
 */
export const DropdownItem = ({ children, onClick, disabled = false }) => {
  return (
    <button
      className={`ui-dropdown-item ${disabled ? "ui-dropdown-item-disabled" : ""}`}
      onClick={onClick}
      disabled={disabled}
      type="button"
    >
      {children}
    </button>
  );
};

DropdownItem.propTypes = {
  children: PropTypes.node.isRequired,
  onClick: PropTypes.func,
  disabled: PropTypes.bool,
};
