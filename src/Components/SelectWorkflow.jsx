import { MultiSelect } from "@mantine/core";
import { useContext } from "react";
import { UserContext } from "../contexts/UserContext";
import { getLanguageByKey } from "./utils";

export const SelectWorkflow = ({ onChange, selectedValues, ...props }) => {
  const { workflowOptions } = useContext(UserContext);

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
