import { Flex, Text, Switch } from "@mantine/core";

export const LabelSwitch = ({ mt, label, ...props }) => {
  const { error, ...rest } = props;
  return (
    <>
      <Flex align="center" justify="space-between" mt={mt}>
        <Text size="sm">{label}</Text>
        <Switch {...rest} />
      </Flex>
      {error && (
        <div style={{ color: "#fa5252", fontSize: "12px", marginTop: "4px" }}>
          {error}
        </div>
      )}
    </>
  );
};
