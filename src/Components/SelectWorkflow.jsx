import { MultiSelect } from "@mantine/core";
import { useUser } from "../hooks";
import { getLanguageByKey } from "./utils";

export const SelectWorkflow = ({ onChange, selectedValues, ...props }) => {
  const { workflowOptions } = useUser();

  const selectAllLabel = getLanguageByKey("selectAll");
  const options = workflowOptions || [];

  return (
    <MultiSelect
      searchable
      label={getLanguageByKey("Workflow")}
      placeholder={getLanguageByKey("Alege workflow pentru afisare in sistem")}
      data={[selectAllLabel, ...options]}
      onChange={(values) => {
        if (values.includes(selectAllLabel)) {
          onChange(options);
        } else {
          onChange(values);
        }
      }}
      value={selectedValues}
      clearable
      {...props}
    />
  );
};
