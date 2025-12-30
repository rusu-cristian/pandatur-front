import PropTypes from "prop-types";
import "./Button.css";

/**
 * Custom Button component
 * Replaces Mantine Button
 */
export const Button = ({
  children,
  onClick,
  variant = "filled",
  size = "md",
  leftIcon,
  rightIcon,
  disabled = false,
  fullWidth = false,
  className = "",
  type = "button",
  ...props
}) => {
  const classNames = [
    "ui-button",
    `ui-button-${variant}`,
    `ui-button-${size}`,
    fullWidth && "ui-button-full-width",
    disabled && "ui-button-disabled",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type={type}
      className={classNames}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {leftIcon && <span className="ui-button-icon-left">{leftIcon}</span>}
      <span className="ui-button-label">{children}</span>
      {rightIcon && <span className="ui-button-icon-right">{rightIcon}</span>}
    </button>
  );
};

Button.propTypes = {
  children: PropTypes.node.isRequired,
  onClick: PropTypes.func,
  variant: PropTypes.oneOf(["filled", "outline", "subtle"]),
  size: PropTypes.oneOf(["sm", "md", "lg"]),
  leftIcon: PropTypes.node,
  rightIcon: PropTypes.node,
  disabled: PropTypes.bool,
  fullWidth: PropTypes.bool,
  className: PropTypes.string,
  type: PropTypes.oneOf(["button", "submit", "reset"]),
};
