import { MultiSelect } from "@mantine/core";
import { useContext } from "react";
import { AppContext } from "../contexts/AppContext";
import { getLanguageByKey } from "./utils";

export const SelectWorkflow = ({ onChange, selectedValues, ...props }) => {
  const { workflowOptions } = useContext(AppContext);

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
