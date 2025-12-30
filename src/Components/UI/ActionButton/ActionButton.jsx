import PropTypes from "prop-types";
import "./ActionButton.css";

/**
 * Action Button component (icon button)
 * Replaces Mantine ActionIcon
 */
export const ActionButton = ({
  children,
  onClick,
  variant = "default",
  size = "md",
  disabled = false,
  active = false,
  className = "",
  title,
  ...props
}) => {
  const classNames = [
    "ui-action-button",
    `ui-action-button-${variant}`,
    `ui-action-button-${size}`,
    active && "ui-action-button-active",
    disabled && "ui-action-button-disabled",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type="button"
      className={classNames}
      onClick={onClick}
      disabled={disabled}
      title={title}
      {...props}
    >
      {children}
    </button>
  );
};

ActionButton.propTypes = {
  children: PropTypes.node.isRequired,
  onClick: PropTypes.func,
  variant: PropTypes.oneOf(["default", "filled", "subtle"]),
  size: PropTypes.oneOf(["sm", "md", "lg"]),
  disabled: PropTypes.bool,
  active: PropTypes.bool,
  className: PropTypes.string,
  title: PropTypes.string,
};
