import { Box, Flex, Text, DEFAULT_THEME, Divider, Badge } from "@mantine/core";
import { MdCall } from "react-icons/md";
import { HiPhoneMissedCall } from "react-icons/hi";
import { HH_mm, CALL_STATUS } from "@app-constants";
import { parseServerDate, getLanguageByKey } from "@utils";
import { Audio } from "../../../../Audio";
import { findCallParticipantName } from "../../../../utils/callUtils";
import "./Call.css";

const { colors } = DEFAULT_THEME;

/**
 * @param {string} time
 * @param {string} from
 * @param {string} to
 * @param {string} name
 * @param {string} src
 * @param {string} status
 * @param {Array} technicians
 */
export const Call = ({
  time,
  from,
  to,
  name,
  src,
  status,
  technicians = [],
  clients = [],
}) => {
  const callerLabel = findCallParticipantName(from, technicians, clients);
  const receiverLabel = findCallParticipantName(to, technicians, clients);
  const hasRecording = Boolean(src);

  // Определяем статус звонка и его отображение
  const getCallStatusInfo = () => {
    switch (status) {
      case CALL_STATUS.IN_PROCESS:
        return {
          icon: <MdCall size={24} style={{ color: "#228be6" }} />,
          color: "blue",
          text: getLanguageByKey("InProgress"),
          showAudio: false,
        };
      case CALL_STATUS.ANSWER:
        return {
          icon: <MdCall size={24} style={{ color: "#12b886" }} />,
          color: "teal",
          text: getLanguageByKey("Answer"),
          showAudio: true,
        };
      case CALL_STATUS.NOANSWER:
        return {
          icon: <HiPhoneMissedCall size={24} color="#c92a2a" />,
          color: "red",
          text: getLanguageByKey("NoAnswer"),
          showAudio: hasRecording,
        };
      default:
        return {
          icon: <MdCall size={24} />,
          color: "gray",
          text: status || getLanguageByKey("Unknown"),
          showAudio: hasRecording,
        };
    }
  };

  const statusInfo = getCallStatusInfo();

  // console.log("%c📞 Звонок", "color: green; font-weight: bold");
  // console.log("⏱ Время:", time);
  // console.log("📍 Статус:", status);
  // console.log("➡️ Звонит:", callerLabel);
  // console.log("⬅️ Получает:", receiverLabel);
  // console.log("🎧 Аудио:", src);

  return (
    <Box p={4} className="call-message">
      <Flex w="100%" gap="4" justify="center" py="4">
        <Flex gap="4" align="center" wrap="wrap">
          {statusInfo.icon}
          <Divider orientation="vertical" />
          <Box>
            <Flex wrap="wrap" gap={2} align="center">
              <Text style={{ whiteSpace: "nowrap" }} size="xs" c={colors.gray[7]}>
                {getLanguageByKey("callFrom")}:
              </Text>
              <Text size="xs" c="black">
                {callerLabel}
              </Text>
              <Text size="xs" c={colors.gray[7]}>
                {getLanguageByKey("callTo")}: {receiverLabel}
              </Text>
              {status && (
                <Badge size="xs" color={statusInfo.color} variant="light">
                  {statusInfo.text}
                </Badge>
              )}
            </Flex>
          </Box>
          <Divider orientation="vertical" />
          {statusInfo.showAudio && src ? (
            <Audio src={src} />
          ) : (
            <Text size="xs" c={statusInfo.color === "red" ? "red" : colors.gray[6]} fw={500}>
              {statusInfo.text}
            </Text>
          )}
        </Flex>
        <Flex align="end">
          <Text c={colors.gray[7]} size="xs" ta="end" style={{ whiteSpace: "nowrap" }}>
            {parseServerDate(time).format(HH_mm)}
          </Text>
        </Flex>
      </Flex>
    </Box>
  );
};
