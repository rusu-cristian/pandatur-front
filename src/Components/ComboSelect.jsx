import { Combobox, useCombobox, Group } from "@mantine/core";
import { useState } from "react";
import { FaCheck } from "react-icons/fa6";

export const ComboSelect = ({
  data,
  onChange,
  position,
  renderTriggerButton,
  maxHeight = 200,
  width = 250,
  currentValue,
}) => {
  const [selectedItem, setSelectedItem] = useState();

  const combobox = useCombobox({
    onDropdownClose: () => combobox.resetSelectedOption(),
  });

  return (
    <Combobox
      value={selectedItem}
      store={combobox}
      width={width}
      position={position}
      onOptionSubmit={(value) => {
        setSelectedItem(value);
        onChange(value);
        combobox.closeDropdown();
      }}
    >
      <Combobox.Target>
        {renderTriggerButton(combobox.toggleDropdown)}
      </Combobox.Target>

      <Combobox.Dropdown>
        <Combobox.Options mah={maxHeight} style={{ overflowY: "auto" }}>
          {data.map(({ value, label }) => {
            return (
              <Combobox.Option active={true} value={value} key={value}>
                <Group>
                  {value === selectedItem && <FaCheck />}
                  {label}
                </Group>
              </Combobox.Option>
            );
          })}
        </Combobox.Options>
      </Combobox.Dropdown>
    </Combobox>
  );
};
