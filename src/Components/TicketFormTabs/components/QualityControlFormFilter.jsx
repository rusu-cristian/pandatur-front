import { useEffect, forwardRef, useImperativeHandle } from "react";
import { MultiSelect, TextInput, Flex } from "@mantine/core";
import { useForm } from "@mantine/form";
import { getLanguageByKey } from "../../utils";
import {
  motivulRefuzuluiOptions,
  evaluareOdihnaOptions,
} from "../../../FormOptions";

const QUALITY_CONTROL_FORM_FILTER = "QUALITY_CONTROL_FORM_FILTER";

export const QualityControlFormFilter = forwardRef(
  ({ onSubmit, data, renderFooterButtons }, ref) => {
    const form = useForm({
      mode: "uncontrolled",
      transformValues: (values) => {
        return Object.fromEntries(
          Object.entries(values).filter(
            ([_, val]) =>
              val !== undefined &&
              val !== null &&
              !(Array.isArray(val) && val.length === 0) &&
              val !== ""
          )
        );
      },
    });

    useImperativeHandle(ref, () => ({
      getValues: () => form.getTransformedValues(),
      reset: form.reset,
    }));

    useEffect(() => {
      if (data) {
        form.setValues({
          motivul_refuzului: data.motivul_refuzului,
          evaluare_de_odihna: data.evaluare_de_odihna,
          urmatoarea_vacanta: data.urmatoarea_vacanta,
          manager: data.manager,
          vacanta: data.vacanta,
        });

        onSubmit?.(form.getTransformedValues());
      }
    }, [data]);

    return (
      <>
        <form
          id={QUALITY_CONTROL_FORM_FILTER}
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit?.(form.getTransformedValues());
          }}
        >
          <MultiSelect
            clearable
            searchable
            label={getLanguageByKey("Motivul refuzului")}
            placeholder={getLanguageByKey("Motivul refuzului")}
            data={motivulRefuzuluiOptions}
            key={form.key("motivul_refuzului")}
            {...form.getInputProps("motivul_refuzului")}
            size="xs"
          />

          <MultiSelect
            mt="md"
            clearable
            searchable
            label={getLanguageByKey("Evaluare odihnă")}
            placeholder={getLanguageByKey("Evaluare odihnă")}
            data={evaluareOdihnaOptions}
            key={form.key("evaluare_de_odihna")}
            {...form.getInputProps("evaluare_de_odihna")}
            size="xs"
          />

          <TextInput
            mt="md"
            label={getLanguageByKey("Următoarea vacanță")}
            placeholder={getLanguageByKey("Următoarea vacanță")}
            key={form.key("urmatoarea_vacanta")}
            {...form.getInputProps("urmatoarea_vacanta")}
            size="xs"
          />

          <TextInput
            mt="md"
            label={getLanguageByKey("Manager")}
            placeholder={getLanguageByKey("Manager")}
            key={form.key("manager")}
            {...form.getInputProps("manager")}
            size="xs"
          />

          <TextInput
            mt="md"
            label={getLanguageByKey("Vacanța")}
            placeholder={getLanguageByKey("Vacanța")}
            key={form.key("vacanta")}
            {...form.getInputProps("vacanta")}
            size="xs"
          />
        </form>

        <Flex justify="end" gap="md" mt="md">
          {renderFooterButtons?.({
            onResetForm: form.reset,
            formId: QUALITY_CONTROL_FORM_FILTER,
          })}
        </Flex>
      </>
    );
  }
);
