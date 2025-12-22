import { Select, TextInput, NumberInput, Flex, Box } from "@mantine/core";
import { useForm, isNotEmpty } from "@mantine/form";
import { useEffect } from "react";
import { getLanguageByKey } from "../utils";
import { valutaOptions, ibanOptions } from "../../FormOptions";

const INVOICE_FORM_FILTER_ID = "INVOICE_DOCUMENT_FORM";

export const InvoiceForm = ({
  onSubmit,
  data,
  renderFooterButtons,
  formId,
  okProps,
  initialClientData,
}) => {
  const idForm = formId || INVOICE_FORM_FILTER_ID;

  const form = useForm({
    mode: "uncontrolled",
    validate: {
      f_serviciu: isNotEmpty(getLanguageByKey("fieldIsRequired")),
      f_nr_factura: isNotEmpty(getLanguageByKey("fieldIsRequired")),
      f_numarul: isNotEmpty(getLanguageByKey("fieldIsRequired")),
      f_pret: isNotEmpty(getLanguageByKey("fieldIsRequired")),
      f_suma: isNotEmpty(getLanguageByKey("fieldIsRequired")),
      f_valuta_contului: isNotEmpty(getLanguageByKey("fieldIsRequired")),
      iban: isNotEmpty(getLanguageByKey("fieldIsRequired")),
      platitor: isNotEmpty(getLanguageByKey("fieldIsRequired")),
      nr_platitor: isNotEmpty(getLanguageByKey("fieldIsRequired")),
      f_cantitate: isNotEmpty(getLanguageByKey("fieldIsRequired")),
    },
  });

  useEffect(() => {
    const isFormEmpty = Object.keys(form.getValues()).every((key) => !form.isTouched(key));

    if (!isFormEmpty) return;

    const platitorFromClient =
      initialClientData?.platitor ?? `${data?.name ?? ""} ${data?.surname ?? ""}`.trim();
    const nrPlatitorFromClient =
      initialClientData?.nr_platitor ?? data?.phone ?? "";

    form.setValues({
      f_serviciu: data?.f_serviciu,
      f_nr_factura: data?.f_nr_factura,
      f_numarul: data?.f_numarul,
      f_pret: data?.f_pret,
      f_suma: data?.f_suma,
      f_valuta_contului: data?.f_valuta_contului,
      iban: data?.iban,
      platitor: data?.platitor ?? platitorFromClient,
      nr_platitor: data?.nr_platitor ?? nrPlatitorFromClient,
      f_cantitate: data?.f_cantitate,
    });
  }, [data, initialClientData]);

  return (
    <>
      <Box bg="var(--crm-ui-kit-palette-background-primary-disabled)" p="md" style={{ borderRadius: 8 }}>
        <TextInput
          label={getLanguageByKey("F/service")}
          placeholder={getLanguageByKey("F/service")}
          key={form.key("f_serviciu")}
          {...form.getInputProps("f_serviciu")}
        />

        <TextInput
          mt="md"
          label={getLanguageByKey("F/factura")}
          placeholder={getLanguageByKey("F/factura")}
          key={form.key("f_nr_factura")}
          {...form.getInputProps("f_nr_factura")}
        />

        <TextInput
          mt="md"
          label={getLanguageByKey("F/numarul")}
          placeholder={getLanguageByKey("F/numarul")}
          key={form.key("f_numarul")}
          {...form.getInputProps("f_numarul")}
        />

        <TextInput
          mt="md"
          label={getLanguageByKey("Plătitor")}
          placeholder={getLanguageByKey("Plătitor")}
          key={form.key("platitor")}
          {...form.getInputProps("platitor")}
        />

        <TextInput
          mt="md"
          label={getLanguageByKey("Nr. Plătitor")}
          placeholder={getLanguageByKey("Nr. Plătitor")}
          key={form.key("nr_platitor")}
          {...form.getInputProps("nr_platitor")}
        />

        <NumberInput
          mt="md"
          decimalScale={2}
          fixedDecimalScale
          hideControls
          label={getLanguageByKey("Cantitate")}
          placeholder={getLanguageByKey("Cantitate")}
          key={form.key("f_cantitate")}
          {...form.getInputProps("f_cantitate")}
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
        />

        <Select
          mt="md"
          label={getLanguageByKey("Valuta contului")}
          placeholder={getLanguageByKey("Valuta contului")}
          data={valutaOptions}
          clearable
          key={form.key("f_valuta_contului")}
          {...form.getInputProps("f_valuta_contului")}
          searchable
        />

        <Select
          mt="md"
          label="IBAN"
          placeholder="IBAN"
          data={ibanOptions}
          clearable
          key={form.key("iban")}
          {...form.getInputProps("iban")}
          searchable
        />

        <Flex justify="end" gap="md" mt="md">
          {renderFooterButtons?.({
            onResetForm: form.reset,
            formId: idForm,
            onSubmit: () => {
              if (!form.validate().hasErrors) {
                onSubmit(form.getValues());
                form.reset();
              }
            },
          })}
        </Flex>
      </Box>
    </>
  );
};
