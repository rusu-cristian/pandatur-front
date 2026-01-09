import { memo } from "react";
import { Flex, Text, Image, Box } from "@mantine/core";
import { Tooltip, Typography } from "@mui/material";
import { DEFAULT_PHOTO, HH_mm, MEDIA_TYPE } from "../../../../app-constants";
import {
  getFullName,
  parseServerDate,
  socialMediaIcons,
} from "../../../utils";
import { renderContent } from "../../renderContent";
import { Call } from "./Call";
import { parseCallParticipants } from "../../../utils/callUtils";
import { InfoOutlineRounded } from '@mui/icons-material';
import { getPageById } from "../../../../constants/webhookPagesConfig";

export const ReceivedMessage = memo(({ personalInfo, msg, technicians = [] }) => {
  const clients = personalInfo?.clients || [];
  const isCall = msg.mtype === MEDIA_TYPE.CALL;

  const findClientByPhone = (phone) =>
    clients.find((c) => String(c.phone) === String(phone));

  const findTechnicianBySip = (sip) =>
    technicians.find((t) => String(t.sipuni_id) === String(sip));

  if (isCall) {
    const participants = parseCallParticipants(
      msg.call_metadata, 
      technicians, 
      clients
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
          clients={clients}
        />
      </Flex>
    );
  }

  const senderClient = clients.find(
    (c) => String(c.id) === String(msg.sender_id)
  );

  const senderTechnician = technicians.find(
    (t) => String(t.id) === String(msg.sender_id)
  );

  const senderName =
    getFullName(senderClient?.name, senderClient?.surname) ||
    senderTechnician?.label ||
    `#${msg.sender_id}`;

  // Фото берётся напрямую из тикета
  const clientPhoto = personalInfo?.photo_url || null;

  // Получаем информацию о страницах для tooltip
  const fromPage = msg.from_reference ? getPageById(msg.from_reference) : null;
  const toPage = msg.to_reference ? getPageById(msg.to_reference) : null;

  return (
    <Flex w="100%">
      <Flex w="90%" direction="column" className="chat-message received">
        <Flex gap="4" py="4">
          <Image
            w={28}
            h={28}
            radius="50%"
            src={clientPhoto}
            fallbackSrc={DEFAULT_PHOTO}
          />
          <Flex
            miw="150px"
            direction="column"
            p="4"
            className="text"
            style={{ backgroundColor: "var(--crm-ui-kit-palette-message-received-background)" }}
          >
            <Flex align="center" gap="2" style={{ color: "var(--crm-ui-kit-palette-text-secondary-dark)" }}>
              <Text size="xs" fw="bold">
                {senderName}
              </Text>
              {socialMediaIcons[msg.platform] || null}
            </Flex>
            <Box mt={4} mb="4">
              {renderContent(msg)}
            </Box>
            <Flex justify="end" align="center" gap={2}>
              <Text size="xs" style={{ color: "var(--crm-ui-kit-palette-text-secondary-dark)" }}>
                {parseServerDate(msg.time_sent).format(HH_mm)}
              </Text>
              {(msg.from_reference || msg.to_reference || msg.seen_by_user_id) && (
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
                      {msg.seen_by_user_id && (
                        <Typography fontSize="0.65rem">Seen by user ID: {msg.seen_by_user_id}</Typography>
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
      </Flex>
    </Flex>
  );
});

ReceivedMessage.displayName = "ReceivedMessage";
