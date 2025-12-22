import { TextInput, Select, NumberInput, Box } from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { useEffect, useContext, useRef } from "react";
import { MdOutlineEuroSymbol } from "react-icons/md";
import dayjs from "dayjs";
import { getLanguageByKey, parseServerDate } from "../utils";
import { LabelSwitch } from "../LabelSwitch";
import { paymentStatusOptions } from "../../FormOptions";
import { YYYY_MM_DD } from "../../app-constants";
import { UserContext } from "../../contexts/UserContext";
import { useWorkflowOptions } from "../../hooks/useWorkflowOptions";

export const ContractForm = ({
  data,
  hideDisabledInput,
  setMinDate,
  formInstance,
}) => {
  const { userGroups, userId } = useContext(UserContext);
  const isInitialized = useRef(false);

  const { isAdmin } = useWorkflowOptions({
    userGroups,
    userId,
    groupTitle: data?.group_title || "RO",
  });

  // Проверяем есть ли группа "IT dep." у пользователя
  const isITDep = userGroups.some((g) => g.name === "IT dep.");

  useEffect(() => {
    if (data && !isInitialized.current) {
      // Инициализируем форму только один раз при первой загрузке данных
      formInstance.setValues({
        data_contractului: parseServerDate(data.data_contractului),
        data_avansului: parseServerDate(data.data_avansului),
        data_de_plata_integrala: parseServerDate(data.data_de_plata_integrala),
        numar_de_contract: data.numar_de_contract,
        contract_trimis: data.contract_trimis,
        contract_semnat: data.contract_semnat,
        tour_operator: data.tour_operator,
        numarul_cererii_de_la_operator: data.numarul_cererii_de_la_operator,
        achitare_efectuata: data.achitare_efectuata,
        rezervare_confirmata: data.rezervare_confirmata,
        contract_arhivat: data.contract_arhivat,
        statutul_platii: data.statutul_platii,
        avans_euro: data.avans_euro,
        pret_netto: data.pret_netto,
        achitat_client: data.achitat_client,
        control: data.control,
        comision_companie:
          data.comision_companie ??
          (data.budget && data.pret_netto ? data.budget - data.pret_netto : undefined),
      });
      isInitialized.current = true;
    }
  }, [data, formInstance]);

  const getDayPropsWithHighlight = (date) => {
    const isToday = dayjs(date).isSame(dayjs(), 'day');
    return {
      style: isToday ? {
        backgroundColor: 'var(--mantine-color-blue-1)',
        fontWeight: 700,
        border: '2px solid var(--mantine-color-blue-6)',
        borderRadius: '50%',
      } : undefined,
    };
  };

  return (
    <Box bg="var(--crm-ui-kit-palette-background-primary-disabled)" p="md" style={{ borderRadius: 8 }}>
      <TextInput
        label={getLanguageByKey("Nr de contract")}
        placeholder={getLanguageByKey("Nr de contract")}
        key={formInstance.key("numar_de_contract")}
        {...formInstance.getInputProps("numar_de_contract")}
      />

      <DatePickerInput
        minDate={setMinDate}
        valueFormat="DD.MM.YYYY"
        clearable
        mt="md"
        label={getLanguageByKey("Data contractului")}
        placeholder={getLanguageByKey("Data contractului")}
        key={formInstance.key("data_contractului")}
        {...formInstance.getInputProps("data_contractului")}
        getDayProps={getDayPropsWithHighlight}
      />

      <DatePickerInput
        minDate={setMinDate}
        valueFormat="DD.MM.YYYY"
        clearable
        mt="md"
        label={getLanguageByKey("Data avansului")}
        placeholder={getLanguageByKey("Data avansului")}
        key={formInstance.key("data_avansului")}
        {...formInstance.getInputProps("data_avansului")}
        getDayProps={getDayPropsWithHighlight}
      />

      <DatePickerInput
        minDate={setMinDate}
        valueFormat="DD.MM.YYYY"
        clearable
        mt="md"
        label={getLanguageByKey("Data de plată integrală")}
        placeholder={getLanguageByKey("Data de plată integrală")}
        key={formInstance.key("data_de_plata_integrala")}
        {...formInstance.getInputProps("data_de_plata_integrala")}
        getDayProps={getDayPropsWithHighlight}
      />

      <LabelSwitch
        mt="md"
        color="var(--crm-ui-kit-palette-link-primary)"
        label={getLanguageByKey("Contract trimis")}
        key={formInstance.key("contract_trimis")}
        {...formInstance.getInputProps("contract_trimis", {
          type: "checkbox",
        })}
      />


      <LabelSwitch
        mt="md"
        color="var(--crm-ui-kit-palette-link-primary)"
        label={getLanguageByKey("Contract_semnat")}
        key={formInstance.key("contract_semnat")}
        {...formInstance.getInputProps("contract_semnat", {
          type: "checkbox",
        })}
      />

      <TextInput
        mt="md"
        label={getLanguageByKey("Operator turistic")}
        placeholder={getLanguageByKey("Operator turistic")}
        key={formInstance.key("tour_operator")}
        {...formInstance.getInputProps("tour_operator")}
      />

      <TextInput
        mt="md"
        label={getLanguageByKey("Nr cererii de la operator")}
        placeholder={getLanguageByKey("Nr cererii de la operator")}
        key={formInstance.key("numarul_cererii_de_la_operator")}
        {...formInstance.getInputProps("numarul_cererii_de_la_operator")}
      />

      <LabelSwitch
        mt="md"
        color="var(--crm-ui-kit-palette-link-primary)"
        label={getLanguageByKey("Achitare efectuată")}
        key={formInstance.key("achitare_efectuata")}
        {...formInstance.getInputProps("achitare_efectuata", {
          type: "checkbox",
        })}
      />

      <LabelSwitch
        mt="md"
        color="var(--crm-ui-kit-palette-link-primary)"
        label={getLanguageByKey("Rezervare confirmată")}
        key={formInstance.key("rezervare_confirmata")}
        {...formInstance.getInputProps("rezervare_confirmata", {
          type: "checkbox",
        })}
      />

      <LabelSwitch
        mt="md"
        color="var(--crm-ui-kit-palette-link-primary)"
        label={getLanguageByKey("Contract arhivat")}
        key={formInstance.key("contract_arhivat")}
        {...formInstance.getInputProps("contract_arhivat", {
          type: "checkbox",
        })}
      />

      <Select
        mt="md"
        label={getLanguageByKey("Plată_primită")}
        placeholder={getLanguageByKey("Plată_primită")}
        data={paymentStatusOptions}
        clearable
        key={formInstance.key("statutul_platii")}
        {...formInstance.getInputProps("statutul_platii")}
        searchable
      />

      <NumberInput
        hideControls
        leftSection={<MdOutlineEuroSymbol />}
        mt="md"
        decimalScale={2}
        fixedDecimalScale
        label={getLanguageByKey("Avans euro")}
        placeholder={getLanguageByKey("Avans euro")}
        key={formInstance.key("avans_euro")}
        {...formInstance.getInputProps("avans_euro")}
      />

      <NumberInput
        hideControls
        mt="md"
        decimalScale={2}
        fixedDecimalScale
        leftSection={<MdOutlineEuroSymbol />}
        label={getLanguageByKey("Preț NETTO")}
        placeholder={getLanguageByKey("Preț NETTO")}
        key={formInstance.key("pret_netto")}
        {...formInstance.getInputProps("pret_netto")}
      />

      <NumberInput
        hideControls
        mt="md"
        label={getLanguageByKey("Achitat client")}
        decimalScale={2}
        fixedDecimalScale
        placeholder={getLanguageByKey("Achitat client")}
        key={formInstance.key("achitat_client")}
        {...formInstance.getInputProps("achitat_client")}
      />

      {!hideDisabledInput && (
        <NumberInput
          disabled
          hideControls
          mt="md"
          label={getLanguageByKey("Restanță client")}
          placeholder={getLanguageByKey("Restanță client")}
        />
      )}

      {!hideDisabledInput && (
        <NumberInput
          disabled
          hideControls
          decimalScale={2}
          fixedDecimalScale
          mt="md"
          leftSection={<MdOutlineEuroSymbol />}
          label={getLanguageByKey("Comision companie")}
          placeholder={`${getLanguageByKey("Comision companie")} €`}
          key={formInstance.key("comision_companie")}
          {...formInstance.getInputProps("comision_companie")}
        />
      )}

      {!hideDisabledInput && (
        <TextInput
          disabled
          mt="md"
          label={getLanguageByKey("Statut achitare")}
          placeholder={getLanguageByKey("Statut achitare")}
        />
      )}

      {(isAdmin || isITDep) && (
        <LabelSwitch
          mt="md"
          color="var(--crm-ui-kit-palette-link-primary)"
          label={getLanguageByKey("Control Admin")}
          key={formInstance.key("control")}
          {...formInstance.getInputProps("control", { type: "checkbox" })}
        />
      )}
    </Box>
  );
};
