import { memo } from "react";
import { Flex, Text, Image, Box } from "@mantine/core";
import { Tooltip, Box as MuiBox, Typography } from "@mui/material";
import { ReportRounded } from "@mui/icons-material";
import { IoMdCheckmark } from "react-icons/io";
import { IoCheckmarkDoneSharp } from "react-icons/io5";
import { InfoOutlineRounded } from '@mui/icons-material';
import { renderContent } from "../../renderContent";
import { HH_mm, MEDIA_TYPE, DEFAULT_PHOTO } from "../../../../app-constants";
import { parseServerDate, MESSAGES_STATUS, getFullName, getLanguageByKey } from "../../../utils";
import { Call } from "./Call";
import { socialMediaIcons } from "../../../utils";
import { parseCallParticipants } from "../../../utils/callUtils";
import { getPageById } from "../../../../constants/webhookPagesConfig";
import "./Message.css";

const DEFAULT_SENDER_NAME = "SYSTEM TECHNICIAN";

const MESSAGE_STATUS_ICONS = {
  [MESSAGES_STATUS.PENDING]: <IoMdCheckmark size={12} style={{ color: "var(--crm-ui-kit-palette-text-secondary-dark)" }} />,
  [MESSAGES_STATUS.ERROR]: <ReportRounded sx={{ fontSize: 14, color: "var(--mantine-color-red-6)" }} />,
  [MESSAGES_STATUS.SUCCESS]: <IoCheckmarkDoneSharp size={12} style={{ color: "var(--crm-ui-kit-palette-link-primary)" }} />,
  [MESSAGES_STATUS.SEEN]: <IoCheckmarkDoneSharp size={12} style={{ color: "var(--mantine-color-blue-6)" }} />,
};

const MESSAGE_STATUS_LABELS = {
  [MESSAGES_STATUS.PENDING]: getLanguageByKey("message_status_pending"),
  [MESSAGES_STATUS.ERROR]: getLanguageByKey("message_status_error"),
  [MESSAGES_STATUS.SUCCESS]: getLanguageByKey("message_status_sent"),
  [MESSAGES_STATUS.SEEN]: getLanguageByKey("message_status_seen"),
};

export const SendedMessage = memo(({
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
    // Если есть status (сообщения из сокета) - конвертируем его
    else if (msg.status) {
      switch (msg.status) {
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
      <Flex w="100%" justify="center">
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
      <Flex w="90%" direction="column" className="chat-message sent">
        <Flex justify="end" gap="4">
          <Flex>
            <Flex
              miw="150px"
              direction="column"
              p="4"
              className="text"
              style={{ backgroundColor: "var(--crm-ui-kit-palette-message-sent-background)" }}
            >
              <Flex align="center" gap={4}>
                <Text fw="bold" size="xs">
                  {senderName}
                </Text>
                {socialMediaIcons[msg.platform] || null}
              </Flex>

              <Box mt={4}>
                {renderContent(msg)}
              </Box>

              <Flex justify="end" align="center" gap={2}>
                <Flex align="center" gap={2}>
                  <Flex align="center">
                    {messageStatus === MESSAGES_STATUS.ERROR && msg.error_message ? (
                      <Tooltip title={msg.error_message} arrow>
                        <MuiBox sx={{ display: "flex", alignItems: "center", cursor: "help" }}>
                          {MESSAGE_STATUS_ICONS[messageStatus]}
                        </MuiBox>
                      </Tooltip>
                    ) : (
                      MESSAGE_STATUS_ICONS[messageStatus]
                    )}
                  </Flex>
                  {MESSAGE_STATUS_LABELS[messageStatus] && (
                    <Text size="xs" c="var(--crm-ui-kit-palette-text-secondary-dark)">
                      {MESSAGE_STATUS_LABELS[messageStatus]}
                    </Text>
                  )}
                </Flex>

                <Text size="xs">
                  {parseServerDate(msg.time_sent).format(HH_mm)}
                </Text>

                {(msg.from_reference || msg.to_reference) && (
                  <Tooltip
                    title={
                      <Box>
                        {fromPage && (
                          <Typography fontSize="0.65rem">From: {fromPage.page_name} ({fromPage.page_id})</Typography>
                        )}
                        {!fromPage && msg.from_reference && (
                          <Typography fontSize="0.65rem">From: {msg.from_reference}</Typography>
                        )}
                        {toPage && (
                          <Typography fontSize="0.65rem">To: {toPage.page_name} ({toPage.page_id})</Typography>
                        )}
                        {!toPage && msg.to_reference && (
                          <Typography fontSize="0.65rem">To: {msg.to_reference}</Typography>
                        )}
                      </Box>
                    }
                    arrow
                  >
                    <Box
                      style={{
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      <InfoOutlineRounded sx={{ fontSize: 18, color: "var(--crm-ui-kit-palette-text-secondary-dark)" }} />
                    </Box>
                  </Tooltip>
                )}
              </Flex>
            </Flex>
          </Flex>
          <Image
            w={22}
            h={22}
            radius="50%"
            src={technicianPhoto}
            fallbackSrc={DEFAULT_PHOTO}
          />
        </Flex>
      </Flex>
    </Flex>
  );
});

SendedMessage.displayName = "SendedMessage";
