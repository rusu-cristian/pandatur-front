import { Select, Button, Flex, Divider } from "@mantine/core";
import { enqueueSnackbar } from "notistack";
import { useState } from "react";
import { getLanguageByKey, showServerError } from "@utils";
import { api } from "@api";
import { useDisclosure } from "@mantine/hooks";
import { File } from "../../File";
import { InvoiceForm } from "../../TicketForms/InvoiceForm";

const DOCUMENTS_TYPE = {
  ACCOUNT_DUE: "cont-spre-plata",
  RETURN_REQUEST: "cerere-de-restituire",
  JOIN_UP_LETTER_RO: "join-up-letter-ro",
  JOIN_UP_LETTER_RU: "join-up-letter-ru",
  PROGRAM_NEW_YEAR_INSTAMBUL: "program-new-year-instambul-ua",
  PROGRAM_BRASOV: "program-brasov-ua",
  PROGRAM_INSTAMBUL: "program-instambul-ua",
};

export const InvoiceTab = ({ clientInfo }) => {
  const [selectedValue, setSelectedValue] = useState();
  const [loading, handlers] = useDisclosure(false);
  const [generatedDocument, setGeneratedDocument] = useState(null);

  const generateDocument = async (type, values = {}) => {
    handlers.open();
    try {
      const data = await api.documents.create(type, values);

      if (data?.document_url) {
        setGeneratedDocument({ type, url: data.document_url });
        enqueueSnackbar(getLanguageByKey("documentGeneratedSuccessfully"), {
          variant: "success",
        });
      } else {
        enqueueSnackbar(showServerError(), {
          variant: "error",
        });
      }
    } catch (error) {
      enqueueSnackbar(showServerError(error), {
        variant: "error",
      });
    } finally {
      handlers.close();
    }
  };

  return (
    <div>
      <Select
        mb="md"
        onChange={(value) => {
          setSelectedValue(value);
          setGeneratedDocument(null);
        }}
        data={[
          {
            value: DOCUMENTS_TYPE.ACCOUNT_DUE,
            label: getLanguageByKey("accountForPayment"),
          },
          {
            value: DOCUMENTS_TYPE.JOIN_UP_LETTER_RO,
            label: getLanguageByKey("joinUpLetterRO"),
          },
          {
            value: DOCUMENTS_TYPE.JOIN_UP_LETTER_RU,
            label: getLanguageByKey("joinUpLetterRU"),
          },
          {
            value: DOCUMENTS_TYPE.RETURN_REQUEST,
            label: getLanguageByKey("returnRequest"),
          },
          {
            value: DOCUMENTS_TYPE.PROGRAM_BRASOV,
            label: getLanguageByKey("programBrasov"),
          },
          {
            value: DOCUMENTS_TYPE.PROGRAM_INSTAMBUL,
            label: getLanguageByKey("programInstambul"),
          },
          {
            value: DOCUMENTS_TYPE.PROGRAM_NEW_YEAR_INSTAMBUL,
            label: getLanguageByKey("programNewYearInstambul"),
          },
        ]}
        placeholder={getLanguageByKey("selectDocumentsType")}
      />

      {selectedValue === DOCUMENTS_TYPE.ACCOUNT_DUE ? (
        <InvoiceForm
          data={{}}
          initialClientData={{
            platitor: `${clientInfo?.name || ""} ${clientInfo?.surname || ""}`.trim(),
            nr_platitor: clientInfo?.phone || "",
          }}
          onSubmit={(values) => generateDocument(selectedValue, values)}
          renderFooterButtons={({ onSubmit }) => (
            <Button
              disabled={
                !selectedValue || generatedDocument?.type === selectedValue
              }
              loading={loading}
              onClick={onSubmit}
            >
              {getLanguageByKey("generate")}
            </Button>
          )}
        />
      ) : (
        <Flex justify="end">
          <Button
            onClick={() => generateDocument(selectedValue)}
            disabled={
              !selectedValue || generatedDocument?.type === selectedValue
            }
            loading={loading}
          >
            {getLanguageByKey("generate")}
          </Button>
        </Flex>
      )}

      {generatedDocument && (
        <>
          <Divider my="md" />
          <File
            src={generatedDocument.url}
            label={generatedDocument.url}
          />
        </>
      )}
    </div>
  );
};
