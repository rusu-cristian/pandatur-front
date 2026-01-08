import { Select, TextInput, NumberInput, Flex } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useEffect } from "react";
import { getLanguageByKey } from "../../utils";
import { valutaOptions, ibanOptions } from "../../../FormOptions";
import {
  formatNumericValue,
  convertNumberRangeToSingleValue,
} from "../../LeadsComponent/utils";

const INVOICE_FORM_FILTER_ID = "INVOICE_FORM_FILTER_ID";

export const InvoiceFormFilter = ({
  onSubmit,
  data,
  renderFooterButtons,
  formId,
}) => {
  const idForm = formId || INVOICE_FORM_FILTER_ID;

  const form = useForm({
    mode: "uncontrolled",
    transformValues: ({
      f_pret,
      f_suma,
      f_serviciu,
      f_nr_factura,
      f_numarul,
      f_valuta_contului,
      iban,
    }) => {
      const formattedData = {
        f_serviciu: f_serviciu ?? undefined,
        f_nr_factura: f_nr_factura ?? undefined,
        f_numarul: f_numarul ?? undefined,
        f_pret: formatNumericValue(f_pret),
        f_suma: formatNumericValue(f_suma),
        f_valuta_contului: f_valuta_contului ?? undefined,
        iban: iban ?? undefined,
      };

      return formattedData;
    },
  });

  useEffect(() => {
    if (data) {
      form.setValues({
        f_serviciu: data.f_serviciu,
        f_nr_factura: data.f_nr_factura,
        f_numarul: data.f_numarul,
        f_pret: convertNumberRangeToSingleValue(data.f_pret),
        f_suma: convertNumberRangeToSingleValue(data.f_suma),
        f_valuta_contului: data.f_valuta_contului,
        iban: data.iban,
      });
    }
  }, [data]);

  return (
    <>
      <form
        id={idForm}
        onSubmit={form.onSubmit((values) =>
          onSubmit(values, () => form.reset()),
        )}
      >
        <TextInput
          label={getLanguageByKey("F/service")}
          placeholder={getLanguageByKey("F/service")}
          key={form.key("f_serviciu")}
          {...form.getInputProps("f_serviciu")}
          size="xs"
        />

        <TextInput
          mt="md"
          label={getLanguageByKey("F/factura")}
          placeholder={getLanguageByKey("F/factura")}
          key={form.key("f_nr_factura")}
          {...form.getInputProps("f_nr_factura")}
          size="xs"
        />

        <TextInput
          mt="md"
          label={getLanguageByKey("F/numarul")}
          placeholder={getLanguageByKey("F/numarul")}
          key={form.key("f_numarul")}
          {...form.getInputProps("f_numarul")}
          size="xs"
        />

        <NumberInput
          hideControls
          mt="md"
          decimalScale={2}
          fixedDecimalScale
          label={getLanguageByKey("F/preț")}
          placeholder={getLanguageByKey("F/preț")}
          key={form.key("f_pret")}
          {...form.getInputProps("f_pret")}
          size="xs"
        />

        <NumberInput
          mt="md"
          decimalScale={2}
          fixedDecimalScale
          hideControls
          label={getLanguageByKey("F/sumă")}
          placeholder={getLanguageByKey("F/sumă")}
          key={form.key("f_suma")}
          {...form.getInputProps("f_suma")}
          size="xs"
        />

        <Select
          mt="md"
          label={getLanguageByKey("Valuta contului")}
          placeholder={getLanguageByKey("Valuta contului")}
          data={valutaOptions}
          clearable
          key={form.key("f_valuta_contului")}
          {...form.getInputProps("f_valuta_contului")}
          size="xs"
        />

        <Select
          mt="md"
          label="IBAN"
          placeholder="IBAN"
          data={ibanOptions}
          clearable
          key={form.key("iban")}
          {...form.getInputProps("iban")}
          size="xs"
        />
      </form>

      <Flex justify="end" gap="md" mt="md">
        {renderFooterButtons?.({ onResetForm: form.reset, formId: idForm })}
      </Flex>
    </>
  );
};
