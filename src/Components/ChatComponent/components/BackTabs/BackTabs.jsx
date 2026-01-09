import { Box } from "@mantine/core";

const BackTabs = () => {
  // Используем глобальные CSS переменные для адаптации под темы
  const getColors = () => ({
    bg3: "var(--crm-ui-kit-palette-background-primary)",
    border3: "var(--crm-ui-kit-palette-border-default)",
    bg2: "color-mix(in srgb, var(--crm-ui-kit-palette-background-primary) 90%, var(--crm-ui-kit-palette-background-default) 10%)",
    border2: "var(--crm-ui-kit-palette-border-default)",
  });
  
  const c = getColors();

  return (
    <>
      {/* Средняя вкладка */}
      <Box
        style={{
          position: "absolute",
          top: "-6px",
          left: "4px",
          right: "4px",
          height: "14px",
          background: c.bg2,
          border: `1px solid var(--crm-ui-kit-palette-border-primary)`,
          borderBottom: "none",
          borderTopLeftRadius: 6,
          borderTopRightRadius: 6,
          zIndex: 2,
        }}
      />
      {/* Ближайшая вкладка */}
      <Box
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "10px",
          background: c.bg3,
          border: `1px solid var(--crm-ui-kit-palette-border-primary)`,
          borderBottom: "none",
          borderTopLeftRadius: 6,
          borderTopRightRadius: 6,
          pointerEvents: "none",
          zIndex: 3,
        }}
      />
    </>
  );
};

export default BackTabs;
