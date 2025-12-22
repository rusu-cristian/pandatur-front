import { openConfirmModal } from "@mantine/modals";
import { Text, DEFAULT_THEME } from "@mantine/core";
import { getLanguageByKey } from "@utils";

const { colors } = DEFAULT_THEME;

export const useConfirmPopup = ({ subTitle, loading }) => {
  return (callback) =>
    openConfirmModal({
      title: (
        <Text fz="xl" fw="bold">
          {getLanguageByKey("Confirmare ștergere")}
        </Text>
      ),
      centered: true,
      children: <Text>{subTitle}</Text>,
      labels: {
        confirm: getLanguageByKey("Șterge"),
        cancel: getLanguageByKey("Anulează"),
      },
      confirmProps: { color: colors.red[9], loading },
      onConfirm: callback,
    });
};
