import { useEffect, useRef } from "react";
import { Select, TextInput, Box } from "@mantine/core";
import { getLanguageByKey } from "../utils";
import {
  motivulRefuzuluiOptions,
  evaluareOdihnaOptions,
} from "../../FormOptions";

export const QualityControlForm = ({ data, formInstance }) => {
  const isInitialized = useRef(false);

  useEffect(() => {
    if (data && !isInitialized.current) {
      // Инициализируем форму только один раз при первой загрузке данных
      formInstance.setValues({
        motivul_refuzului: data.motivul_refuzului,
        evaluare_de_odihna: data.evaluare_de_odihna,
        urmatoarea_vacanta: data.urmatoarea_vacanta,
        manager: data.manager,
        vacanta: data.vacanta,
      });
      isInitialized.current = true;
    }
  }, [data, formInstance]);

  return (
    <>
      <Box bg="var(--crm-ui-kit-palette-background-primary-disabled)" p="md" style={{ borderRadius: 8 }}>
        <Select
          clearable
          searchable
          label={getLanguageByKey("Motivul refuzului")}
          placeholder={getLanguageByKey("Motivul refuzului")}
          data={motivulRefuzuluiOptions}
          key={formInstance.key("motivul_refuzului")}
          {...formInstance.getInputProps("motivul_refuzului")}
          size="xs"
        />

        <Select
          mt="md"
          clearable
          searchable
          label={getLanguageByKey("Evaluare odihnă")}
          placeholder={getLanguageByKey("Evaluare odihnă")}
          data={evaluareOdihnaOptions}
          key={formInstance.key("evaluare_de_odihna")}
          {...formInstance.getInputProps("evaluare_de_odihna")}
          size="xs"
        />

        <TextInput
          mt="md"
          label={getLanguageByKey("Următoarea vacanță")}
          placeholder={getLanguageByKey("Următoarea vacanță")}
          key={formInstance.key("urmatoarea_vacanta")}
          {...formInstance.getInputProps("urmatoarea_vacanta")}
          size="xs"
        />

        <TextInput
          mt="md"
          label={getLanguageByKey("Manager")}
          placeholder={getLanguageByKey("Manager")}
          key={formInstance.key("manager")}
          {...formInstance.getInputProps("manager")}
          size="xs"
        />

        <TextInput
          mt="md"
          label={getLanguageByKey("Vacanța")}
          placeholder={getLanguageByKey("Vacanța")}
          key={formInstance.key("vacanta")}
          {...formInstance.getInputProps("vacanta")}
          size="xs"
        />
      </Box>
    </>
  );
};
