import {
  Select,
  Flex,
  NumberInput,
  MultiSelect,
  Text,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { DateRangePicker } from "../../DateRangePicker/DateRangePicker";
import {
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";
import { MdOutlineEuroSymbol } from "react-icons/md";
import dayjs from "dayjs";
import { getLanguageByKey } from "../../utils";
import {
  formatDateOrUndefined,
  formatNumericValue,
  convertDateToArray,
  convertNumberRangeToSingleValue,
} from "../../LeadsComponent/utils";
import {
  sourceOfLeadOptions,
  promoOptions,
  marketingOptions,
  serviceTypeOptions,
  countryOptions,
  transportOptions,
  nameExcursionOptions,
  purchaseProcessingOptions,
} from "../../../FormOptions";

const TICKET_FORM_FILTER_ID = "TICKET_FORM_FILTER_ID";

export const TicketInfoFormFilter = forwardRef(
  ({ data, hideDisabledInput, renderFooterButtons, setMinDate, formId }, ref) => {
    const idForm = formId || TICKET_FORM_FILTER_ID;

    const form = useForm({
      mode: "controlled",
      initialValues: {
        data_plecarii: [null, null],
        data_venit_in_oficiu: [null, null],
        data_intoarcerii: [null, null],
        data_cererii_de_retur: [null, null],
        buget: "",
        sursa_lead: [],
        promo: [],
        marketing: [],
        tipul_serviciului: [],
        tara: [],
        tip_de_transport: [],
        denumirea_excursiei_turului: [],
        procesarea_achizitionarii: [],
      },
      transformValues: (values) => ({
        data_plecarii: formatDateOrUndefined(values.data_plecarii),
        data_venit_in_oficiu: formatDateOrUndefined(values.data_venit_in_oficiu),
        data_intoarcerii: formatDateOrUndefined(values.data_intoarcerii),
        data_cererii_de_retur: formatDateOrUndefined(values.data_cererii_de_retur),
        buget: formatNumericValue(values.buget),
        sursa_lead: values.sursa_lead ?? undefined,
        promo: values.promo ?? undefined,
        marketing: values.marketing ?? undefined,
        tipul_serviciului: values.tipul_serviciului ?? undefined,
        tara: values.tara ?? undefined,
        tip_de_transport: values.tip_de_transport ?? undefined,
        denumirea_excursiei_turului: values.denumirea_excursiei_turului ?? undefined,
        procesarea_achizitionarii: values.procesarea_achizitionarii ?? undefined,
      }),
    });

    useEffect(() => {
      if (data) {
        form.setValues({
          data_venit_in_oficiu: convertDateToArray(data.data_venit_in_oficiu),
          data_plecarii: convertDateToArray(data.data_plecarii),
          data_intoarcerii: convertDateToArray(data.data_intoarcerii),
          data_cererii_de_retur: convertDateToArray(data.data_cererii_de_retur),
          buget: convertNumberRangeToSingleValue(data.buget),
          sursa_lead: data.sursa_lead || [],
          promo: data.promo || [],
          marketing: data.marketing || [],
          tipul_serviciului: data.tipul_serviciului || [],
          tara: data.tara || [],
          tip_de_transport: data.tip_de_transport || [],
          denumirea_excursiei_turului: data.denumirea_excursiei_turului || [],
          procesarea_achizitionarii: data.procesarea_achizitionarii || [],
        });
      }
    }, [data]);

    useImperativeHandle(ref, () => ({
      getValues: () => form.getTransformedValues(),
    }));

    // Функции для преобразования между форматом формы и DateRangePicker
    const getDateRangeValue = (dateArray) => {
      if (!dateArray || !Array.isArray(dateArray) || dateArray.length === 0) {
        return [];
      }
      const [startDate, endDate] = dateArray;
      
      // Преобразуем startDate в Date объект
      let start = null;
      if (startDate) {
        if (startDate instanceof Date) {
          start = startDate;
        } else if (dayjs.isDayjs(startDate)) {
          start = startDate.toDate();
        } else {
          start = dayjs(startDate).toDate();
        }
      }
      
      // Преобразуем endDate в Date объект
      let end = null;
      if (endDate) {
        if (endDate instanceof Date) {
          end = endDate;
        } else if (dayjs.isDayjs(endDate)) {
          end = endDate.toDate();
        } else {
          end = dayjs(endDate).toDate();
        }
      }
      
      if (start && end) {
        return [start, end];
      } else if (start) {
        return [start, null];
      }
      return [];
    };

    const handleDateRangeChange = (fieldName) => (range) => {
      if (!range || (Array.isArray(range) && range.length === 0)) {
        form.setFieldValue(fieldName, [null, null]);
        return;
      }

      if (Array.isArray(range)) {
        const [startDate, endDate] = range;
        if (startDate && endDate) {
          form.setFieldValue(fieldName, [startDate, endDate]);
        } else if (startDate && !endDate) {
          form.setFieldValue(fieldName, [startDate, null]);
        } else {
          form.setFieldValue(fieldName, [null, null]);
        }
      }
    };

    return (
      <>
        <form id={idForm}>
          <NumberInput
            hideControls
            label={getLanguageByKey("Vânzare")}
            placeholder={getLanguageByKey("Indicați suma în euro")}
            decimalScale={2}
            fixedDecimalScale
            leftSection={<MdOutlineEuroSymbol />}
            key={form.key("buget")}
            {...form.getInputProps("buget")}
          />

          <div style={{ marginTop: "1rem" }}>
            <Text size="sm" fw={500} mb={4}>
              {getLanguageByKey("Data venit in oficiu")}
            </Text>
            <DateRangePicker
              value={getDateRangeValue(form.values.data_venit_in_oficiu)}
              onChange={handleDateRangeChange("data_venit_in_oficiu")}
              isClearable={true}
              dateFormat="yyyy-MM-dd"
              placeholder={getLanguageByKey("Selectează data venirii în oficiu")}
              minDate={setMinDate}
            />
          </div>

          <div style={{ marginTop: "1rem" }}>
            <Text size="sm" fw={500} mb={4}>
              {getLanguageByKey("Data și ora plecării")}
            </Text>
            <DateRangePicker
              value={getDateRangeValue(form.values.data_plecarii)}
              onChange={handleDateRangeChange("data_plecarii")}
              isClearable={true}
              dateFormat="yyyy-MM-dd"
              placeholder={getLanguageByKey("Data și ora plecării")}
              minDate={setMinDate}
            />
          </div>

          <div style={{ marginTop: "1rem" }}>
            <Text size="sm" fw={500} mb={4}>
              {getLanguageByKey("Data și ora întoarcerii")}
            </Text>
            <DateRangePicker
              value={getDateRangeValue(form.values.data_intoarcerii)}
              onChange={handleDateRangeChange("data_intoarcerii")}
              isClearable={true}
              dateFormat="yyyy-MM-dd"
              placeholder={getLanguageByKey("Data și ora întoarcerii")}
              minDate={setMinDate}
            />
          </div>

          <div style={{ marginTop: "1rem" }}>
            <Text size="sm" fw={500} mb={4}>
              {getLanguageByKey("Data cererii de retur")}
            </Text>
            <DateRangePicker
              value={getDateRangeValue(form.values.data_cererii_de_retur)}
              onChange={handleDateRangeChange("data_cererii_de_retur")}
              isClearable={true}
              dateFormat="yyyy-MM-dd"
              placeholder={getLanguageByKey("Data cererii de retur")}
              minDate={setMinDate}
            />
          </div>

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

          <MultiSelect
            mt="md"
            label={getLanguageByKey("Sursă lead")}
            placeholder={getLanguageByKey("Sursă lead")}
            data={sourceOfLeadOptions}
            clearable
            key={form.key("sursa_lead")}
            {...form.getInputProps("sursa_lead")}
            searchable
          />

          <MultiSelect
            mt="md"
            label={getLanguageByKey("Promo")}
            placeholder={getLanguageByKey("Promo")}
            data={promoOptions}
            clearable
            key={form.key("promo")}
            {...form.getInputProps("promo")}
            searchable
          />

          <MultiSelect
            mt="md"
            label={getLanguageByKey("Marketing")}
            placeholder={getLanguageByKey("Marketing")}
            data={marketingOptions}
            clearable
            key={form.key("marketing")}
            {...form.getInputProps("marketing")}
            searchable
          />

          <MultiSelect
            mt="md"
            label={getLanguageByKey("Serviciu")}
            placeholder={getLanguageByKey("Serviciu")}
            data={serviceTypeOptions}
            clearable
            key={form.key("tipul_serviciului")}
            {...form.getInputProps("tipul_serviciului")}
            searchable
          />

          <MultiSelect
            mt="md"
            label={getLanguageByKey("Țară")}
            placeholder={getLanguageByKey("Țară")}
            data={countryOptions}
            clearable
            key={form.key("tara")}
            {...form.getInputProps("tara")}
            searchable
          />

          <MultiSelect
            mt="md"
            label={getLanguageByKey("Transport")}
            placeholder={getLanguageByKey("Transport")}
            data={transportOptions}
            clearable
            key={form.key("tip_de_transport")}
            {...form.getInputProps("tip_de_transport")}
            searchable
          />

          <MultiSelect
            mt="md"
            label={getLanguageByKey("Excursie")}
            placeholder={getLanguageByKey("Excursie")}
            data={nameExcursionOptions}
            clearable
            key={form.key("denumirea_excursiei_turului")}
            {...form.getInputProps("denumirea_excursiei_turului")}
            searchable
          />

          <MultiSelect
            mt="md"
            label={getLanguageByKey("Achiziție")}
            placeholder={getLanguageByKey("Achiziție")}
            data={purchaseProcessingOptions}
            clearable
            key={form.key("procesarea_achizitionarii")}
            {...form.getInputProps("procesarea_achizitionarii")}
            searchable
          />
        </form>

        <Flex justify="end" gap="md" mt="md">
          {renderFooterButtons?.({ onResetForm: form.reset, formId: idForm })}
        </Flex>
      </>
    );
  }
);
