import { ComboSelect } from "../ComboSelect";

const IconSelect = ({
  options,
  value,
  onChange,
  label = "Select",
  placeholder = "Alege opțiune",
  required = false,
  disabled = false,
}) => {
  const selected = options.find((item) => item.name === value);

  return (
    <div style={{ width: 250 }}>
      {label && (
        <label
          style={{
            display: "inline-block",
            fontWeight: 500,
            fontSize: "var(--input-label-size, var(--mantine-font-size-sm))",
            marginBottom: 6,
            color: "var(--crm-ui-kit-palette-text-primary)",
          }}
        >
          {label}
          {required && <span style={{ color: "#ef4444", marginLeft: 4 }}>*</span>}
        </label>
      )}

      <div
        style={{
          opacity: disabled ? 0.6 : 1,
          pointerEvents: disabled ? "none" : "auto",
        }}
      >
        <ComboSelect
          data={options.map((item) => ({
            value: item.name,
            label: (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {item.icon}
                {item.name}
              </div>
            ),
          }))}
          currentValue={value}
          onChange={onChange}
          width={250}
          disabled={disabled}
          renderTriggerButton={(toggleDropdown) => (
            <div
              onClick={toggleDropdown}
              style={{
                border: "1px solid var(--crm-ui-kit-palette-border-default)",
                padding: "5px 12px",
                borderRadius: "0.25rem",
                background: "var(--crm-ui-kit-palette-background-primary)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                color: "var(--crm-ui-kit-palette-text-primary)",
              }}
            >
              {selected ? (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {selected.icon}
                  <span>{selected.name}</span>
                </div>
              ) : (
                <span style={{ color: "var(--crm-ui-kit-palette-placeholder-default)" }}>{placeholder}</span>
              )}
              <span style={{ fontSize: 12, marginLeft: "auto" }}>▾</span>
            </div>
          )}
        />
      </div>
    </div>
  );
};

export default IconSelect;
