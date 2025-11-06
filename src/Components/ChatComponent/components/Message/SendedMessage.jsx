import { Flex, Text, Image, Box, Tooltip } from "@mantine/core";
import { CiWarning } from "react-icons/ci";
import { FaHeadphones } from "react-icons/fa6";
import { IoMdCheckmark } from "react-icons/io";
import { IoCheckmarkDoneSharp } from "react-icons/io5";
import { IoInformationCircleOutline } from "react-icons/io5";
import { renderContent } from "../../renderContent";
import { HH_mm, MEDIA_TYPE, DEFAULT_PHOTO } from "../../../../app-constants";
import { parseServerDate, MESSAGES_STATUS, getFullName } from "../../../utils";
import { Call } from "./Call";
import { socialMediaIcons } from "../../../utils";
import { parseCallParticipants } from "../../../utils/callUtils";
import { getPageById } from "../../../../constants/webhookPagesConfig";
import "./Message.css";

const DEFAULT_SENDER_NAME = "Panda Tur";

const MESSAGE_STATUS_ICONS = {
  [MESSAGES_STATUS.PENDING]: <IoMdCheckmark size={24} style={{ color: "var(--crm-ui-kit-palette-text-secondary-dark)" }} />,
  [MESSAGES_STATUS.ERROR]: <CiWarning size={24} style={{ color: "var(--mantine-color-red-6)", }} />,
  [MESSAGES_STATUS.SUCCESS]: <IoCheckmarkDoneSharp size={24} style={{ color: "var(--crm-ui-kit-palette-link-primary)" }} />,
  [MESSAGES_STATUS.SEEN]: <IoCheckmarkDoneSharp size={24} style={{ color: "var(--mantine-color-blue-6)" }} />,
};

export const SendedMessage = ({
  msg,
  technician,
  technicians = [],
  personalInfo = {},
}) => {

  const isCall = msg.mtype === MEDIA_TYPE.CALL;

  const findTechnicianById = (id) =>
    technicians.find(
      (t) => !String(t.value).startsWith("__group__") && String(t.value) === String(id)
    );

  const resolvedTechnician = technician || findTechnicianById(msg.sender_id);
  const senderName =
    getFullName(resolvedTechnician?.id?.name, resolvedTechnician?.id?.surname) ||
    resolvedTechnician?.label ||
    DEFAULT_SENDER_NAME;

  // Получаем фото техника
  const getTechnicianPhoto = () => {
    // Если есть фото у техника
    if (resolvedTechnician?.id?.photo && resolvedTechnician.id.photo.trim() !== "") {
      return resolvedTechnician.id.photo;
    }

    // Возвращаем null для использования fallback
    return null;
  };

  const technicianPhoto = getTechnicianPhoto();

  // Определяем статус сообщения для отображения иконки
  const getMessageStatus = () => {
    // Сначала определяем базовый статус сообщения
    let baseStatus;

    // Если есть messageStatus (сообщения из CRM) - используем его
    if (msg.messageStatus) {
      baseStatus = msg.messageStatus;
    }
    // Если есть message_status (сообщения из API) - конвертируем его
    else if (msg.message_status) {
      switch (msg.message_status) {
        case 'SENT':
          baseStatus = MESSAGES_STATUS.SUCCESS;
          break;
        case 'NOT_SENT':
          baseStatus = MESSAGES_STATUS.ERROR;
          break;
        default:
          baseStatus = MESSAGES_STATUS.SUCCESS;
      }
    }
    // По умолчанию - SUCCESS
    else {
      baseStatus = MESSAGES_STATUS.SUCCESS;
    }

    // Если клиент прочитал сообщение (seen_by_client_id заполнен),
    // показываем SEEN только если базовый статус = SENT/SUCCESS
    if (msg.seen_by_client_id != null && baseStatus === MESSAGES_STATUS.SUCCESS) {
      return MESSAGES_STATUS.SEEN;
    }

    return baseStatus;
  };

  const messageStatus = getMessageStatus();

  // Получаем информацию о страницах для tooltip
  const fromPage = msg.from_reference ? getPageById(msg.from_reference) : null;
  const toPage = msg.to_reference ? getPageById(msg.to_reference) : null;

  if (isCall) {
    const participants = parseCallParticipants(
      msg.call_metadata,
      technicians,
      personalInfo.clients || []
    );

    return (
      <Flex w="100%" justify="end">
        <Call
          time={msg.time_sent}
          from={participants.callerId}
          to={participants.receiverId}
          name={participants.callerName}
          src={msg.message}
          status={msg.call_metadata?.status}
          technicians={technicians}
          clients={personalInfo.clients || []}
        />
      </Flex>
    );
  }

  return (
    <Flex w="100%" justify="end">
      <Flex w="90%" direction="column" className="chat-message sent" style={{
        animation: 'fadeIn 0.3s ease-out'
      }}>
        <Flex justify="end" gap="8">
          <Flex>
            <Flex
              miw="250px"
              direction="column"
              p="8"
              className="text"
              style={{ backgroundColor: "var(--crm-ui-kit-palette-message-sent-background)" }}
            >
              <Flex align="center" gap={8}>
                <FaHeadphones size={12} />
                <Text fw="bold" size="sm">
                  {senderName}
                </Text>
                {socialMediaIcons[msg.platform] || null}
              </Flex>

              <Box mt="xs">
                {renderContent(msg)}
              </Box>

              <Flex justify="end" align="center" gap={4}>
                <Flex align="center">
                  {MESSAGE_STATUS_ICONS[messageStatus] || MESSAGE_STATUS_ICONS[MESSAGES_STATUS.SUCCESS]}
                </Flex>

                <Text size="sm">
                  {parseServerDate(msg.time_sent).format(HH_mm)}
                </Text>

                {(msg.from_reference || msg.to_reference) && (
                  <Tooltip
                    label={
                      <Box>
                        {fromPage && (
                          <Text size="xs">From: {fromPage.page_name} ({fromPage.page_id})</Text>
                        )}
                        {!fromPage && msg.from_reference && (
                          <Text size="xs">From: {msg.from_reference}</Text>
                        )}
                        {toPage && (
                          <Text size="xs">To: {toPage.page_name} ({toPage.page_id})</Text>
                        )}
                        {!toPage && msg.to_reference && (
                          <Text size="xs">To: {msg.to_reference}</Text>
                        )}
                      </Box>
                    }
                    withArrow
                  >
                    <Box
                      style={{
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      <IoInformationCircleOutline size={18} style={{ color: "var(--crm-ui-kit-palette-text-secondary-dark)" }} />
                    </Box>
                  </Tooltip>
                )}
              </Flex>
            </Flex>
          </Flex>
          <Image
            w={36}
            h={36}
            radius="50%"
            src={technicianPhoto}
            fallbackSrc={DEFAULT_PHOTO}
          />
        </Flex>
      </Flex>
    </Flex>
  );
};
