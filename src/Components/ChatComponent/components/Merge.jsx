import { TextInput, NumberInput, Button, Flex } from "@mantine/core";
import { useField } from "@mantine/form";
import { getLanguageByKey } from "../../utils";

export const Merge = ({
  placeholder,
  value,
  onSubmit,
  loading,
  buttonText,
  label,
}) => {
  const field = useField({
    initialValue: "",
    clearErrorOnChange: false,
    validate: (v) => {
      if (typeof v === "string" && v === "") {
        return getLanguageByKey("ID-ul leadului este necesar");
      }
      return null;
    },
  });

  const triggerSubmit = async () => {
    const validateField = await field.validate();
    if (validateField === null) {
      onSubmit(field.getValue(), field.reset);
    }
  };

  return (
    <>
      <TextInput
        disabled
        value={value ?? ""}
        placeholder={getLanguageByKey("Introduceți ID vechi")}
        variant="filled"
        styles={{
          root: { opacity: 1 },
          input: {
            color: "var(--crm-ui-kit-palette-text-primary)",
            WebkitTextFillColor: "var(--crm-ui-kit-palette-text-primary)",
            opacity: 1,
            backgroundColor: "var(--crm-ui-kit-palette-background-primary)",
            fontWeight: 600,
            "::placeholder": { 
              color: "var(--crm-ui-kit-palette-placeholder-default)", 
              opacity: 1 
            },
          },
        }}
      />

      <NumberInput
        hideControls
        mt="md"
        label={label}
        placeholder={placeholder}
        {...field.getInputProps()}
      />

      <Flex justify="end">
        <Button mt="md" onClick={triggerSubmit} loading={loading}>
          {buttonText}
        </Button>
      </Flex>
    </>
  );
};
