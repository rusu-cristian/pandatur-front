import { useState, useCallback } from "react";
import PropTypes from "prop-types";
import "./LanguageSelector.css";

/**
 * Language Selector Component
 * Custom dropdown for language selection with flag icons
 * Supports both collapsed (icon only) and expanded (with label) states
 */
export const LanguageSelector = ({
  isCollapsed,
  selectedLanguage,
  languages,
  languageOptions,
  onChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedLanguageIcon = languages[selectedLanguage]?.icon;

  const handleToggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleSelect = useCallback(
    (value) => {
      onChange(value);
      setIsOpen(false);
    },
    [onChange]
  );

  const handleCollapsedClick = useCallback(() => {
    const nextLanguage =
      selectedLanguage === "RO"
        ? "RU"
        : selectedLanguage === "RU"
        ? "EN"
        : "RO";
    onChange(nextLanguage);
  }, [selectedLanguage, onChange]);

  // Collapsed state - just an icon that cycles through languages
  if (isCollapsed) {
    return (
      <div
        className="lang-collapsed"
        onClick={handleCollapsedClick}
        title={selectedLanguage}
      >
        {selectedLanguageIcon && (
          <img
            src={selectedLanguageIcon}
            alt={`${selectedLanguage} flag`}
            className="lang-flag-collapsed"
          />
        )}
      </div>
    );
  }

  // Expanded state - dropdown with all language options
  return (
    <div className="lang-selector">
      <div className="lang-selector-trigger" onClick={handleToggle}>
        {selectedLanguageIcon && (
          <img
            src={selectedLanguageIcon}
            alt={`${selectedLanguage} flag`}
            className="lang-flag"
          />
        )}
        <span className="lang-label">{selectedLanguage}</span>
      </div>

      {isOpen && (
        <>
          <div className="lang-dropdown-overlay" onClick={handleClose} />
          <div className="lang-dropdown">
            {languageOptions.map((option) => (
              <div
                key={option.value}
                className="lang-option"
                onClick={() => handleSelect(option.value)}
              >
                <img
                  src={option.icon}
                  alt={`${option.label} flag`}
                  className="lang-flag"
                />
                <span>{option.label}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

LanguageSelector.propTypes = {
  isCollapsed: PropTypes.bool.isRequired,
  selectedLanguage: PropTypes.string.isRequired,
  languages: PropTypes.object.isRequired,
  languageOptions: PropTypes.array.isRequired,
  onChange: PropTypes.func.isRequired,
};
