import { useSnackbar } from "notistack";
import { api } from "@api";
import { getLanguageByKey } from "@utils";

export const useUploadMediaFile = () => {
  const { enqueueSnackbar } = useSnackbar();

  const uploadFile = async (file) => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const data = await api.messages.upload(formData);

      if (data.url) {
        return data.url;
      } else {
        enqueueSnackbar(getLanguageByKey("imageUrlNotReturnedTryAgainLater"), {
          variant: "error",
        });
      }
    } catch (error) {
      enqueueSnackbar(getLanguageByKey("file_upload_failed"), {
        variant: "error",
      });
    }
  };

  return {
    uploadFile,
  };
};
