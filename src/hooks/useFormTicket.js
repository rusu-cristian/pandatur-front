import { useState, useEffect, useMemo } from "react";
import { useForm } from "@mantine/form";
import { formatDate, getLanguageByKey } from "@utils";

const SKIP_REALIZAT_VALIDATION_GROUP_TITLES = [
  "HR",
  "QUALITYDEPARTMENT",
  "Agency",
  "GreenCard",
];

const WORKFLOWS_WITH_SOURCE = [
  "Luat în lucru",
  "Ofertă trimisă",
  "Aprobat cu client",
  "Contract semnat",
  "Plată primită",
  "Contract încheiat",
  "Realizat cu succes",
];

const WORKFLOWS_WITH_SERVICE = [
  "Ofertă trimisă",
  "Aprobat cu client",
  "Contract semnat",
  "Plată primită",
  "Contract încheiat",
  "Realizat cu succes",
];

const WORKFLOWS_WITH_PROCESS = [
  "Aprobat cu client",
  "Contract semnat",
  "Plată primită",
  "Contract încheiat",
  "Realizat cu succes",
];

const WORKFLOWS_WITH_CONTRACT = [
  "Contract semnat",
  "Plată primită",
  "Contract încheiat",
  "Realizat cu succes",
];

const WORKFLOWS_WITH_PAYMENT = [
  "Plată primită",
  "Contract încheiat",
  "Realizat cu succes",
];

const WORKFLOWS_FINAL_STAGE = ["Contract încheiat", "Realizat cu succes"];

const WORKFLOWS_REALIZAT_ONLY = ["Realizat cu succes"];

const WORKFLOWS_REFUSED_ONLY = ["Închis și nerealizat"];

export const useFormTicket = ({ groupTitle } = {}) => {
  const [hasErrorsTicketInfoForm, setHasErrorsTicketInfoForm] = useState();
  const [hasErrorsContractForm, setHasErrorsContractForm] = useState();
  const [hasErrorQualityControl, setHasErrorQualityControl] = useState();

  const skipRealizatValidation = !!groupTitle && SKIP_REALIZAT_VALIDATION_GROUP_TITLES.includes(groupTitle);

  const shouldValidateForWorkflow = (workflow, workflowsToCheck) => {
    if (!workflow || !workflowsToCheck?.length) {
      return false;
    }

    if (skipRealizatValidation && workflow === "Realizat cu succes") {
      return false;
    }

    return workflowsToCheck.includes(workflow);
  };

  const form = useForm({
    mode: "uncontrolled",
    validateInputOnChange: true,
    validateInputOnBlur: true,

    onValuesChange: (values) => {
      const budget = values.buget;
      const netPrice = values.pret_netto;
      const isSetBudgetNetPrice = budget && netPrice;
      form.isTouched("buget") && form.isTouched("pret_netto");
      if (isSetBudgetNetPrice) {
        const companyCommission = budget - netPrice;
        form.setFieldValue("comision_companie", companyCommission);
      }
    },

    validate: {
      sursa_lead: (value, values) => {
        if (shouldValidateForWorkflow(values.workflow, WORKFLOWS_WITH_SOURCE) && !value) {
          return getLanguageByKey("workflow_change_field_required");
        }
      },

      promo: (value, values) => {
        if (shouldValidateForWorkflow(values.workflow, WORKFLOWS_WITH_SOURCE) && !value) {
          return getLanguageByKey("workflow_change_field_required");
        }
      },
      marketing: (value, values) => {
        if (shouldValidateForWorkflow(values.workflow, WORKFLOWS_WITH_SOURCE) && !value) {
          return getLanguageByKey("workflow_change_field_required");
        }
      },
      tipul_serviciului: (value, values) => {
        if (shouldValidateForWorkflow(values.workflow, WORKFLOWS_WITH_SERVICE) && !value) {
          return getLanguageByKey("workflow_change_field_required");
        }
      },
      tara: (value, values) => {
        if (shouldValidateForWorkflow(values.workflow, WORKFLOWS_WITH_SERVICE) && !value) {
          return getLanguageByKey("workflow_change_field_required");
        }
      },
      tip_de_transport: (value, values) => {
        if (shouldValidateForWorkflow(values.workflow, WORKFLOWS_WITH_SERVICE) && !value) {
          return getLanguageByKey("workflow_change_field_required");
        }
      },
      denumirea_excursiei_turului: (value, values) => {
        if (shouldValidateForWorkflow(values.workflow, WORKFLOWS_WITH_SERVICE) && !value) {
          return getLanguageByKey("workflow_change_field_required");
        }
      },
      procesarea_achizitionarii: (value, values) => {
        if (shouldValidateForWorkflow(values.workflow, WORKFLOWS_WITH_PROCESS) && !value) {
          return getLanguageByKey("workflow_change_field_required");
        }
      },
      numar_de_contract: (value, values) => {
        if (shouldValidateForWorkflow(values.workflow, WORKFLOWS_WITH_CONTRACT) && !value) {
          return getLanguageByKey("workflow_change_field_required");
        }
      },
      data_contractului: (value, values) => {
        if (shouldValidateForWorkflow(values.workflow, WORKFLOWS_WITH_CONTRACT) && !value) {
          return getLanguageByKey("workflow_change_field_required");
        }
      },
      contract_trimis: (value, values) => {
        if (shouldValidateForWorkflow(values.workflow, WORKFLOWS_WITH_CONTRACT) && !value) {
          return getLanguageByKey("workflow_change_field_required");
        }
      },
      contract_semnat: (value, values) => {
        if (shouldValidateForWorkflow(values.workflow, WORKFLOWS_WITH_CONTRACT) && !value) {
          return getLanguageByKey("workflow_change_field_required");
        }
      },
      achitare_efectuata: (value, values) => {
        if (shouldValidateForWorkflow(values.workflow, WORKFLOWS_WITH_PAYMENT) && !value) {
          return getLanguageByKey("workflow_change_field_required");
        }
      },
      buget: (value, values) => {
        if (shouldValidateForWorkflow(values.workflow, WORKFLOWS_FINAL_STAGE) && !value) {
          return getLanguageByKey("workflow_change_field_required");
        }
      },
      data_plecarii: (value, values) => {
        if (shouldValidateForWorkflow(values.workflow, WORKFLOWS_FINAL_STAGE) && !value) {
          return getLanguageByKey("workflow_change_field_required");
        }
      },
      data_intoarcerii: (value, values) => {
        if (shouldValidateForWorkflow(values.workflow, WORKFLOWS_FINAL_STAGE) && !value) {
          return getLanguageByKey("workflow_change_field_required");
        }
      },
      tour_operator: (value, values) => {
        if (shouldValidateForWorkflow(values.workflow, WORKFLOWS_FINAL_STAGE) && !value) {
          return getLanguageByKey("workflow_change_field_required");
        }
      },
      numarul_cererii_de_la_operator: (value, values) => {
        if (shouldValidateForWorkflow(values.workflow, WORKFLOWS_FINAL_STAGE) && !value) {
          return getLanguageByKey("workflow_change_field_required");
        }
      },

      rezervare_confirmata: (value, values) => {
        if (shouldValidateForWorkflow(values.workflow, WORKFLOWS_FINAL_STAGE) && !value) {
          return getLanguageByKey("workflow_change_field_required");
        }
      },
      contract_arhivat: (value, values) => {
        if (shouldValidateForWorkflow(values.workflow, WORKFLOWS_FINAL_STAGE) && !value) {
          return getLanguageByKey("workflow_change_field_required");
        }
      },
      statutul_platii: (value, values) => {
        if (shouldValidateForWorkflow(values.workflow, WORKFLOWS_FINAL_STAGE) && !value) {
          return getLanguageByKey("workflow_change_field_required");
        }
      },
      pret_netto: (value, values) => {
        if (shouldValidateForWorkflow(values.workflow, WORKFLOWS_FINAL_STAGE) && !value) {
          return getLanguageByKey("workflow_change_field_required");
        }
      },
      control: (value, values) => {
        if (shouldValidateForWorkflow(values.workflow, WORKFLOWS_REALIZAT_ONLY) && !value) {
          return getLanguageByKey("workflow_change_field_required");
        }
      },
      motivul_refuzului: (value, values) => {
        if (shouldValidateForWorkflow(values.workflow, WORKFLOWS_REFUSED_ONLY) && !value) {
          return getLanguageByKey("workflow_change_field_required");
        }
      },
      technician_id: (value) => {
        if (!value) {
          return getLanguageByKey("workflow_change_field_required");
        }
      },
    },

    transformValues: ({
      data_venit_in_oficiu,
      data_plecarii,
      data_intoarcerii,
      data_cererii_de_retur,
      data_contractului,
      data_avansului,
      data_de_plata_integrala,
      contract_trimis,
      contract_semnat,
      achitare_efectuata,
      rezervare_confirmata,
      contract_arhivat,
      control,
      workflow,
      ...rest
    }) => {
      const formattedData = {
        data_venit_in_oficiu: formatDate(data_venit_in_oficiu),
        data_plecarii: formatDate(data_plecarii),
        data_intoarcerii: formatDate(data_intoarcerii),
        data_cererii_de_retur: formatDate(data_cererii_de_retur),
        data_contractului: formatDate(data_contractului),
        data_avansului: formatDate(data_avansului),
        data_de_plata_integrala: formatDate(data_de_plata_integrala),
        contract_trimis: String(contract_trimis ?? false),
        contract_semnat: String(contract_semnat ?? false),
        achitare_efectuata: String(achitare_efectuata ?? false),
        rezervare_confirmata: String(rezervare_confirmata ?? false),
        contract_arhivat: String(contract_arhivat ?? false),
        control: String(control ?? false),
      };

      return { ...formattedData, ...rest };
    },
  });

  // Мемоизируем строковое представление ошибок для отслеживания изменений
  const errorsJson = useMemo(() => JSON.stringify(form.errors), [form.errors]);

  useEffect(() => {
    const {
      sursa_lead,
      promo,
      marketing,
      tipul_serviciului,
      tara,
      tip_de_transport,
      denumirea_excursiei_turului,
      procesarea_achizitionarii,
      buget,
      data_plecarii,
      data_intoarcerii,
      motivul_refuzului,
      control,
      pret_netto,
      statutul_platii,
      contract_arhivat,
      rezervare_confirmata,
      numarul_cererii_de_la_operator,
      tour_operator,
      numar_de_contract,
      data_contractului,
      contract_trimis,
      contract_semnat,
      achitare_efectuata,
    } = form.errors;

    // console.log('useFormTicket - форма errors:', form.errors);

    if (motivul_refuzului || control) {
      setHasErrorQualityControl(true);
    } else {
      setHasErrorQualityControl(false);
    }

    if (
      [
        numar_de_contract,
        pret_netto,
        statutul_platii,
        contract_arhivat,
        rezervare_confirmata,
        numarul_cererii_de_la_operator,
        tour_operator,
        data_contractului,
        contract_trimis,
        contract_semnat,
        achitare_efectuata,
      ].some((value) => value)
    ) {
      setHasErrorsContractForm(true);
    } else {
      setHasErrorsContractForm(false);
    }

    if (
      [
        sursa_lead,
        promo,
        marketing,
        tipul_serviciului,
        tara,
        tip_de_transport,
        denumirea_excursiei_turului,
        procesarea_achizitionarii,
        buget,
        data_plecarii,
        data_intoarcerii,
      ].some((value) => value)
    ) {
      setHasErrorsTicketInfoForm(true);
    } else {
      setHasErrorsTicketInfoForm(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [errorsJson]);

  return {
    form,
    hasErrorsTicketInfoForm,
    hasErrorsContractForm,
    hasErrorQualityControl,
  };
};
