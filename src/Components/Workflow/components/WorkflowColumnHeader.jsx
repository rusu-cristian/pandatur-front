import { Flex, Text, Box } from "@mantine/core";
import { getBrightByWorkflowType } from "./WorkflowTag";
import { getLanguageByKey } from "../../utils";

export const WorkflowColumnHeader = ({ workflow, filteredTickets }) => {
  return (
    <Box
      pos="relative"
      w="100%"
      h="60px"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Цветная линия внизу */}
      <Box
        pos="absolute"
        bottom={0}
        left={0}
        right={0}
        h="4px"
        style={{
          backgroundColor: getBrightByWorkflowType(workflow, ""),
          borderRadius: "2px",
        }}
      />

      {/* Контент поверх линии */}
      <Flex
        direction="column"
        align="center"
        p="12px"
        gap="4px"
        style={{
          zIndex: 1,
          position: "relative",
        }}
      >
        <Text
          fw="bold"
          c="var(--crm-ui-kit-palette-text-primary)"
          size="xl"
          ta="center"
        >
          {getLanguageByKey(workflow)}
        </Text>

        <Text
          fw="bold"
          c="var(--crm-ui-kit-palette-text-secondary-light)"
          size="md"
          ta="center"
          pb={"6px"}
        >
          {filteredTickets.length} leads
        </Text>
      </Flex>
    </Box>
  );
};
