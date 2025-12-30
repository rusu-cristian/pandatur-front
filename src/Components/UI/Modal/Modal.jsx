import { useEffect } from "react";
import PropTypes from "prop-types";
import { IoMdClose } from "react-icons/io";
import "./Modal.css";

/**
 * Custom Modal component
 * Replaces Mantine Modal
 */
export const Modal = ({
  opened,
  onClose,
  title,
  children,
  size = "md",
  centered = true,
  withCloseButton = true,
}) => {
  // Lock body scroll when modal is open
  useEffect(() => {
    if (opened) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [opened]);

  // Close on ESC key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && opened) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [opened, onClose]);

  if (!opened) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className={`ui-modal-overlay ${centered ? "ui-modal-centered" : ""}`}
      onClick={handleBackdropClick}
    >
      <div className={`ui-modal ui-modal-${size}`}>
        {/* Header */}
        {(title || withCloseButton) && (
          <div className="ui-modal-header">
            {title && <h2 className="ui-modal-title">{title}</h2>}
            {withCloseButton && (
              <button
                className="ui-modal-close-btn"
                onClick={onClose}
                aria-label="Close modal"
              >
                <IoMdClose size={20} />
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div className="ui-modal-body">{children}</div>
      </div>
    </div>
  );
};

Modal.propTypes = {
  opened: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string,
  children: PropTypes.node.isRequired,
  size: PropTypes.oneOf(["sm", "md", "lg", "xl"]),
  centered: PropTypes.bool,
  withCloseButton: PropTypes.bool,
};
