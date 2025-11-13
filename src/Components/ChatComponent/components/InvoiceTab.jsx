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
  RETURN_REQUEST: "cerere-de-return",
  JOIN_UP_GUARANTEE_LETTER: "join-up-guarantee-letter",
};

export const InvoiceTab = ({ clientInfo }) => {
  const [selectedValue, setSelectedValue] = useState();
  const [loading, handlers] = useDisclosure(false);
  const [generatedDocument, setGeneratedDocument] = useState("");

  const generateDocument = async (type, values = {}) => {
    handlers.open();
    try {
      const data = await api.documents.create(type, values);

      if (data?.document_url) {
        setGeneratedDocument(data.document_url);
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
        onChange={setSelectedValue}
        data={[
          {
            value: DOCUMENTS_TYPE.ACCOUNT_DUE,
            label: getLanguageByKey("accountForPayment"),
          },
          {
            value: DOCUMENTS_TYPE.RETURN_REQUEST,
            label: getLanguageByKey("returnRequest"),
          },
          {
            value: DOCUMENTS_TYPE.JOIN_UP_GUARANTEE_LETTER,
            label: getLanguageByKey("joinUpGuaranteeLetter"),
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
                !selectedValue || generatedDocument.includes(selectedValue)
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
              !selectedValue || generatedDocument.includes(selectedValue)
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
            src={generatedDocument}
            label={generatedDocument}
          />
        </>
      )}
    </div>
  );
};
