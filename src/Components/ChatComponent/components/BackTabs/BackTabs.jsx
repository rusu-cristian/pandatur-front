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
          top: "-10px",
          left: "6px",
          right: "6px",
          height: "20px",
          background: c.bg2, 
          border: `1px solid var(--crm-ui-kit-palette-border-primary)`,
          borderBottom: "none",
          borderTopLeftRadius: 10,
          borderTopRightRadius: 10,
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
          height: "16px",
          background: c.bg3,
          border: `1px solid var(--crm-ui-kit-palette-border-primary)`,
          borderBottom: "none",
          borderTopLeftRadius: 8,
          borderTopRightRadius: 8,
          pointerEvents: "none",
          zIndex: 3,
        }}
      />
    </>
  );
};

export default BackTabs;
