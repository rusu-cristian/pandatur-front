
import { Link } from "react-router-dom";
import { GoTrash } from "react-icons/go";
import { FaRegFileLines } from "react-icons/fa6";
import { MdCall } from "react-icons/md";
import { PiImageBrokenThin } from "react-icons/pi";
import {
  Flex,
  Box,
  ActionIcon,
  Text,
  Divider,
  Grid,
  Image as MantineImage,
} from "@mantine/core";
import {
  FALLBACK_IMAGE,
  MEDIA_TYPE,
  YYYY_MM_DD,
  HH_mm,
} from "@app-constants";
import { getLanguageByKey, parseServerDate } from "@utils";
import { Audio } from "../../../Audio";
import { TimeClient } from "./TimeClient";
import { Empty } from "../../../Empty";
import { Image } from "@components";
import { EmailMessage } from "../EmailMessage/EmailMessage";
import "./Media.css";

/**
 * @typedef {Object} Params
 * @property {string} type
 * @property {string} message
 * @property {number} id
 * @property {boolean} shouldDelete
 * @property {string} string
 * @property {() => void} deleteAttachment
 */

/**
 * @param {Params} param
 */
export const renderMediaContent = ({
  type,
  message,
  id,
  shouldDelete,
  msjTime,
  deleteAttachment,
  payload,
}) => {
  const MEDIA_CONTENT = {
    [MEDIA_TYPE.IMAGE]: (
      <Image
        url={message}
        renderFallbackImage={() => (
          <Box
            w="100%"
            h="100%"
            style={{ border: "1px solid var(--mantine-color-red-3)" }}
            pos="relative"
          >
            <Flex c="red" align="center" justify="center" h="100px">
              <PiImageBrokenThin size={32} />
            </Flex>
          </Box>
        )}
        renderImage={() => (
          <Box
            w="100%"
            h="100%"
            className="media-wrapper media-files"
            pos="relative"
          >
            {shouldDelete && (
              <Box
                className="media-wrapper-delete-btn"
                bg="white"
                right="4px"
                top="4px"
                pos="absolute"
              >
                <ActionIcon
                  size="md"
                  onClick={() => deleteAttachment(id)}
                  variant="danger"
                >
                  <GoTrash size={14} />
                </ActionIcon>
              </Box>
            )}

            <MantineImage
              fit="cover"
              radius="md"
              className="pointer"
              src={message}
              fallbackSrc={FALLBACK_IMAGE}
              onClick={() => window.open(message, "_blank")}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </Box>
        )}
      />
    ),
    [MEDIA_TYPE.VIDEO]: (
      <Flex className="media-wrapper" pos="relative">
        {shouldDelete && (
          <Box
            pos="absolute"
            className="media-wrapper-delete-btn"
            bg="white"
            right="10px"
            top="10px"
          >
            <ActionIcon
              size="md"
              onClick={() => deleteAttachment(id)}
              variant="danger"
            >
              <GoTrash size={14} />
            </ActionIcon>
          </Box>
        )}
        <video controls className="video-preview">
          <source src={message} type="video/mp4" />
          {getLanguageByKey("Acest browser nu suporta video")}
        </video>
      </Flex>
    ),
    [MEDIA_TYPE.AUDIO]: (
      <Flex
        align="center"
        justify="space-between"
        w="100%"
        className="media-wrapper"
      >
        <Flex direction="column" gap="4">
          <Audio src={message} />
          <TimeClient
            id={payload?.client_id}
            date={parseServerDate(msjTime)?.format(`${YYYY_MM_DD} ${HH_mm}`)}
          />
        </Flex>

        {shouldDelete && (
          <ActionIcon
            size="md"
            onClick={() => deleteAttachment(id)}
            variant="danger"
          >
            <GoTrash size={14} />
          </ActionIcon>
        )}
      </Flex>
    ),
    [MEDIA_TYPE.FILE]: (
      <Flex
        align="center"
        justify="space-between"
        w="100%"
        className="media-wrapper"
      >
        <Flex>
          <Link className="file-link" to={message} target="_blank">
            <Flex gap="xs" align="center" p={8}>
              <FaRegFileLines size={32} />
              <Flex direction="column" gap="4">
                <Text>{`${message?.slice(0, 45)}...`}</Text>
                <TimeClient
                  id={payload?.client_id}
                  date={parseServerDate(msjTime)?.format(
                    `${YYYY_MM_DD} ${HH_mm}`,
                  )}
                />
              </Flex>
            </Flex>
          </Link>
        </Flex>

        {shouldDelete && (
          <ActionIcon
            size="md"
            onClick={() => deleteAttachment(id)}
            variant="danger"
          >
            <GoTrash size={14} />
          </ActionIcon>
        )}
      </Flex>
    ),
    [MEDIA_TYPE.CALL]: (
      <Flex gap="4" direction="column">
        <Flex align="center">
          <MdCall />
          <Box>
            <Divider orientation="vertical" mx="8" h="30px" />
          </Box>
          <Audio src={message} />
        </Flex>

        {!shouldDelete && (
          <TimeClient
            id={payload?.client_id}
            date={parseServerDate(msjTime)?.format(`${YYYY_MM_DD} ${HH_mm}`)}
          />
        )}
      </Flex>
    ),
    [MEDIA_TYPE.EMAIL]: (
      <Flex gap="4" direction="column">
        <EmailMessage
          message={message}
          platform_id={payload?.platform_id}
          page_id={payload?.page_id}
        />

        {!shouldDelete && (
          <TimeClient
            id={payload?.client_id}
            date={parseServerDate(msjTime)?.format(`${YYYY_MM_DD} ${HH_mm}`)}
          />
        )}
      </Flex>
    ),
    // Обработка типа "document" - отображаем как обычный файл
    document: (
      <Flex
        align="center"
        justify="space-between"
        w="100%"
        className="media-wrapper"
      >
        <Flex>
          <Link className="file-link" to={message} target="_blank">
            <Flex gap="xs" align="center" p={8}>
              <FaRegFileLines size={32} />
              <Flex direction="column" gap="4">
                <Text>{`${message?.slice(0, 45)}...`}</Text>
                <TimeClient
                  id={payload?.client_id}
                  date={parseServerDate(msjTime)?.format(
                    `${YYYY_MM_DD} ${HH_mm}`,
                  )}
                />
              </Flex>
            </Flex>
          </Link>
        </Flex>

        {shouldDelete && (
          <ActionIcon
            size="md"
            onClick={() => deleteAttachment(id)}
            variant="danger"
          >
            <GoTrash size={14} />
          </ActionIcon>
        )}
      </Flex>
    ),
  };

  // Если тип не найден, пробуем использовать обработчик для FILE (для совместимости)
  return MEDIA_CONTENT[type] || MEDIA_CONTENT[MEDIA_TYPE.FILE];
};

export const renderFile = ({
  media,
  deleteAttachment,
  shouldDelete,
  renderAddAttachments,
}) => {
  const filterMediaByImageAndVideo = media?.filter((i) =>
    [MEDIA_TYPE.FILE, MEDIA_TYPE.EMAIL, "document"].includes(i.mtype),
  );

  return (
    <>
      {filterMediaByImageAndVideo.length > 0 ? (
        <div>
          {filterMediaByImageAndVideo.map((media, index) => (
            <Flex direction="column" align="center" key={media.id ?? index}>
              {index === 0 && <Divider w="100%" />}

              {renderMediaContent({
                type: media.mtype,
                message: media.url || media.message || "",
                id: media.id,
                deleteAttachment: () => deleteAttachment(media.id),
                shouldDelete,
                msjTime: media.time_sent,
                payload: media,
              })}

              <Divider w="100%" />
            </Flex>
          ))}
          <Flex justify="center" mt="md">
            {renderAddAttachments?.()}
          </Flex>
        </div>
      ) : (
        <Flex
          direction="column"
          h="100%"
          align="center"
          justify="center"
          gap="md"
        >
          <Empty title={getLanguageByKey("Fără date media")} />
          {renderAddAttachments?.()}
        </Flex>
      )}
    </>
  );
};

export const renderMedia = ({
  media,
  deleteAttachment,
  shouldDelete,
  renderAddAttachments,
}) => {
  const filterMediaByImageAndVideo = media?.filter((i) =>
    [MEDIA_TYPE.VIDEO, MEDIA_TYPE.IMAGE].includes(i.mtype),
  );

  return (
    <>
      {filterMediaByImageAndVideo.length ? (
        <div>
          <Grid gutter="1px">
            {filterMediaByImageAndVideo?.map((media) => (
              <Grid.Col span={4} key={media.id}>
                {renderMediaContent({
                  type: media.mtype,
                  message: media.url || media.message,
                  id: media.id,
                  deleteAttachment: () => deleteAttachment(media.id),
                  shouldDelete,
                })}
              </Grid.Col>
            ))}
          </Grid>

          <Flex justify="center" mt="md">
            {renderAddAttachments?.()}
          </Flex>
        </div>
      ) : (
        <Flex
          direction="column"
          h="100%"
          align="center"
          justify="center"
          gap="md"
        >
          <Empty title={getLanguageByKey("Fără date media")} />
          {renderAddAttachments?.()}
        </Flex>
      )}
    </>
  );
};

export const renderCall = ({
  media,
  deleteAttachment,
  shouldDelete,
  renderAddAttachments,
}) => {
  const filterMediaByCallAndAudio = media?.filter((i) =>
    [MEDIA_TYPE.CALL, MEDIA_TYPE.AUDIO].includes(i.mtype),
  );

  return (
    <>
      {filterMediaByCallAndAudio.length ? (
        <div>
          {filterMediaByCallAndAudio.map((media, index) => (
            <Flex w="100%" direction="column" key={media.id}>
              {index === 0 && <Divider w="100%" />}
              <Box py="md">
                {renderMediaContent({
                  type: media.mtype,
                  message: media.url || media.message,
                  id: media.id,
                  deleteAttachment: () => deleteAttachment(media.id),
                  shouldDelete,
                  msjTime: media.time_sent,
                  payload: media,
                })}
              </Box>

              <Divider w="100%" />
            </Flex>
          ))}

          <Flex justify="center" mt="md">
            {renderAddAttachments?.()}
          </Flex>
        </div>
      ) : (
        <Flex
          direction="column"
          h="100%"
          align="center"
          justify="center"
          gap="md"
        >
          <Empty title={getLanguageByKey("Fără date media")} />
          {renderAddAttachments?.()}
        </Flex>
      )}
    </>
  );
};
