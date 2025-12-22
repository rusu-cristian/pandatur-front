import { Select, NumberInput, Box } from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { MdOutlineEuroSymbol } from "react-icons/md";
import { useEffect, useRef } from "react";
import dayjs from "dayjs";
import { getLanguageByKey, parseServerDatePicker } from "../utils";
import {
  sourceOfLeadOptions,
  promoOptions,
  marketingOptions,
  serviceTypeOptions,
  countryOptions,
  transportOptions,
  nameExcursionOptions,
  purchaseProcessingOptions,
} from "../../FormOptions";
import { YYYY_MM_DD } from "../../app-constants";

export const TicketInfoForm = ({
  data,
  hideDisabledInput,
  setMinDate,
  formInstance,
}) => {
  const isInitialized = useRef(false);

  useEffect(() => {
    if (data && !isInitialized.current) {
      // Инициализируем форму только один раз при первой загрузке данных
      formInstance.setValues({
        data_venit_in_oficiu: parseServerDatePicker(data.data_venit_in_oficiu),
        data_plecarii: parseServerDatePicker(data.data_plecarii),
        data_intoarcerii: parseServerDatePicker(data.data_intoarcerii),
        data_cererii_de_retur: parseServerDatePicker(data.data_cererii_de_retur),
        buget: data.buget,
        sursa_lead: data.sursa_lead,
        promo: data.promo,
        marketing: data.marketing,
        tipul_serviciului: data.tipul_serviciului,
        tara: data.tara,
        tip_de_transport: data.tip_de_transport,
        denumirea_excursiei_turului: data.denumirea_excursiei_turului,
        procesarea_achizitionarii: data.procesarea_achizitionarii,
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
      <NumberInput
        decimalScale={2}
        fixedDecimalScale
        leftSection={<MdOutlineEuroSymbol />}
        hideControls
        label={getLanguageByKey("Vânzare")}
        placeholder={getLanguageByKey("Indicați suma în euro")}
        key={formInstance.key("buget")}
        {...formInstance.getInputProps("buget")}
      />

      <DatePickerInput
        key={formInstance.key("data_venit_in_oficiu")}
        mt="md"
        label={getLanguageByKey("Data venit in oficiu")}
        placeholder={getLanguageByKey("Selectează data venirii în oficiu")}
        clearable
        valueFormat="DD.MM.YYYY"
        minDate={setMinDate}
        {...formInstance.getInputProps("data_venit_in_oficiu")}
        getDayProps={getDayPropsWithHighlight}
      />

      <DatePickerInput
        key={formInstance.key("data_plecarii")}
        mt="md"
        label={getLanguageByKey("Data și ora plecării")}
        placeholder={getLanguageByKey("Data și ora plecării")}
        clearable
        valueFormat="DD.MM.YYYY"
        minDate={setMinDate}
        {...formInstance.getInputProps("data_plecarii")}
        getDayProps={getDayPropsWithHighlight}
      />

      <DatePickerInput
        key={formInstance.key("data_intoarcerii")}
        mt="md"
        label={getLanguageByKey("Data și ora întoarcerii")}
        placeholder={getLanguageByKey("Data și ora întoarcerii")}
        clearable
        valueFormat="DD.MM.YYYY"
        minDate={setMinDate}
        {...formInstance.getInputProps("data_intoarcerii")}
        getDayProps={getDayPropsWithHighlight}
      />

      <DatePickerInput
        key={formInstance.key("data_cererii_de_retur")}
        mt="md"
        label={getLanguageByKey("Data cererii de retur")}
        placeholder={getLanguageByKey("Data cererii de retur")}
        clearable
        valueFormat="DD.MM.YYYY"
        minDate={setMinDate}
        {...formInstance.getInputProps("data_cererii_de_retur")}
        getDayProps={getDayPropsWithHighlight}
      />

      {!hideDisabledInput && (
        <Select
          disabled
          mt="md"
          label={getLanguageByKey("Status sunet telefonic")}
          placeholder={getLanguageByKey("Status sunet telefonic")}
          data={[]}
          clearable
          searchable
        />
      )}

      <Select
        mt="md"
        label={getLanguageByKey("Sursă lead")}
        placeholder={getLanguageByKey("Sursă lead")}
        data={sourceOfLeadOptions}
        clearable
        key={formInstance.key("sursa_lead")}
        {...formInstance.getInputProps("sursa_lead")}
        searchable
      />

      <Select
        mt="md"
        label={getLanguageByKey("Promo")}
        placeholder={getLanguageByKey("Promo")}
        data={promoOptions}
        clearable
        key={formInstance.key("promo")}
        {...formInstance.getInputProps("promo")}
        searchable
      />

      <Select
        mt="md"
        label={getLanguageByKey("Marketing")}
        placeholder={getLanguageByKey("Marketing")}
        data={marketingOptions}
        clearable
        key={formInstance.key("marketing")}
        {...formInstance.getInputProps("marketing")}
        searchable
      />

      <Select
        mt="md"
        label={getLanguageByKey("Serviciu")}
        placeholder={getLanguageByKey("Serviciu")}
        data={serviceTypeOptions}
        clearable
        key={formInstance.key("tipul_serviciului")}
        {...formInstance.getInputProps("tipul_serviciului")}
        searchable
      />

      <Select
        mt="md"
        label={getLanguageByKey("Țară")}
        placeholder={getLanguageByKey("Țară")}
        data={countryOptions}
        clearable
        key={formInstance.key("tara")}
        {...formInstance.getInputProps("tara")}
        searchable
      />

      <Select
        mt="md"
        label={getLanguageByKey("Transport")}
        placeholder={getLanguageByKey("Transport")}
        data={transportOptions}
        clearable
        key={formInstance.key("tip_de_transport")}
        {...formInstance.getInputProps("tip_de_transport")}
        searchable
      />

      <Select
        mt="md"
        label={getLanguageByKey("Excursie")}
        placeholder={getLanguageByKey("Excursie")}
        data={nameExcursionOptions}
        clearable
        key={formInstance.key("denumirea_excursiei_turului")}
        {...formInstance.getInputProps("denumirea_excursiei_turului")}
        searchable
      />

      <Select
        mt="md"
        label={getLanguageByKey("Achiziție")}
        placeholder={getLanguageByKey("Achiziție")}
        data={purchaseProcessingOptions}
        clearable
        key={formInstance.key("procesarea_achizitionarii")}
        {...formInstance.getInputProps("procesarea_achizitionarii")}
        searchable
      />
    </Box>
  );
};
