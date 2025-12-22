import { Flex, Tabs, Text, ActionIcon, Tooltip, Loader } from "@mantine/core";
import { useState, useMemo } from "react";
import { useSnackbar } from "notistack";
import dayjs from "dayjs";
import { getLanguageByKey, showServerError } from "@utils";
import { YYYY_MM_DD_HH_mm_ss } from "@app-constants";
import { api } from "../../../../api";
import { useMessagesContext } from "@hooks";
import { ChatNoteCard } from "../../../ChatNoteCard";
import { renderFile, renderMedia, renderCall } from "./utils";
import { FiTrash2 } from "react-icons/fi";
import { useConfirmPopup, useGetTechniciansList } from "../../../../hooks";
import "./Media.css";

const IMAGE_EXT = ["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg", "heic", "heif", "avif"];
const VIDEO_EXT = ["mp4", "webm", "ogg", "mov", "m4v"];
const AUDIO_EXT = ["mp3", "wav", "ogg", "m4a", "aac", "flac", "wma"];

const guessNoteKind = (n) => {
  const t = String(n?.type || "").toLowerCase();
  if (["text", "image", "video", "audio", "file"].includes(t)) return t;
  const v = String(n?.value || "");
  const clean = v.split("?")[0].split("#")[0];
  const ext = (clean.split(".").pop() || "").toLowerCase();
  if (IMAGE_EXT.includes(ext)) return "image";
  if (VIDEO_EXT.includes(ext)) return "video";
  if (AUDIO_EXT.includes(ext)) return "audio";
  return "file";
};

export const Media = ({ messages, id }) => {
  const { enqueueSnackbar } = useSnackbar();
  const { notes: ctxNotes = [], getUserMessages } = useMessagesContext();
  const { technicians: techOptions = [] } = useGetTechniciansList();

  const [uploadTab, setUploadTab] = useState("notes");
  const [deletingIds, setDeletingIds] = useState(() => new Set());

  const safeMessages = Array.isArray(messages) ? messages : [];

  const ticketNotes = useMemo(
    () => (ctxNotes || []).filter((n) => Number(n.ticket_id) === Number(id)),
    [ctxNotes, id]
  );

  const techLabelById = useMemo(() => {
    const m = new Map();
    (techOptions || []).forEach((t) => {
      const key = String(t?.value ?? t?.id ?? "");
      const label =
        t?.label ||
        t?.name ||
        [t?.first_name, t?.last_name].filter(Boolean).join(" ") ||
        (key ? `#${key}` : (getLanguageByKey("Unknown") || "Unknown"));
      if (key) m.set(key, label);
    });
    return m;
  }, [techOptions]);

  const resolveTechLabel = (n) => {
    const direct =
      n?.technician_full_name ||
      n?.technician_name ||
      n?.created_by_full_name;
    if (direct && String(direct).trim()) return direct;
    const idStr = String(n?.technician_id ?? "");
    return techLabelById.get(idStr) || (idStr ? `#${idStr}` : (getLanguageByKey("Unknown") || "Unknown"));
  };

  const normalizeNote = (n) => ({
    ...n,
    timeCreatedDisplay: dayjs(n.created_at || n.time_created).isValid()
      ? dayjs(n.created_at || n.time_created).format(YYYY_MM_DD_HH_mm_ss)
      : "",
  });

  const isDeleting = (noteId) => deletingIds.has(noteId);

  const confirmDelete = useConfirmPopup({
    subTitle: getLanguageByKey("Are you sure you want to delete this note?") || "Delete this note?",
    loading: false,
  });

  const handleDelete = async (noteId) => {
    setDeletingIds((s) => new Set(s).add(noteId));
    try {
      await api.messages.notes.delete(noteId);
      await getUserMessages(Number(id));
      enqueueSnackbar(getLanguageByKey("Deleted successfully") || "Deleted successfully", { variant: "success" });
    } catch (e) {
      enqueueSnackbar(showServerError(e), { variant: "error" });
    } finally {
      setDeletingIds((s) => {
        const next = new Set(s);
        next.delete(noteId);
        return next;
      });
    }
  };

  const renderDeleteBtn = (n) => (
    <Tooltip label={isDeleting(n.id) ? (getLanguageByKey("Deleting") || "Deleting") : getLanguageByKey("delete")}>
      <ActionIcon
        color="red"
        variant="subtle"
        onClick={() => confirmDelete(() => handleDelete(n.id))}
        aria-label="delete-note"
        mt={4}
        disabled={isDeleting(n.id)}
        aria-busy={isDeleting(n.id)}
      >
        {isDeleting(n.id) ? <Loader size="xs" /> : <FiTrash2 />}
      </ActionIcon>
    </Tooltip>
  );

  const notesAll = ticketNotes;
  const notesText = ticketNotes.filter((n) => String(n?.type).toLowerCase() === "text");
  const notesAudio = ticketNotes.filter((n) => guessNoteKind(n) === "audio");
  const notesFiles = ticketNotes.filter((n) => guessNoteKind(n) === "file");
  const notesMedia = ticketNotes.filter((n) => {
    const k = guessNoteKind(n);
    return k === "image" || k === "video";
  });

  return (
    <Tabs h="100%" className="media-tabs" defaultValue="messages-media">
      <Tabs.List>
        <Tabs.Tab h="100%" value="messages-media">
          <Text fw={700} size="sm">{getLanguageByKey("messageAttachments")}</Text>
        </Tabs.Tab>
        <Tabs.Tab value="uploaded-media">
          <Text fw={700} size="sm">{getLanguageByKey("FileNotice")}</Text>
        </Tabs.Tab>
      </Tabs.List>

      <Tabs.Panel h="calc(100% - 36px)" value="messages-media">
        <Tabs className="media-tabs" defaultValue="media">
          <Tabs.List>
            <Tabs.Tab value="media">{getLanguageByKey("Media")}</Tabs.Tab>
            <Tabs.Tab value="files">{getLanguageByKey("files")}</Tabs.Tab>
            <Tabs.Tab value="audio">{getLanguageByKey("audio")}</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel className="media-tabs" h="100%" value="media">
            <Flex h="100%" direction="column" mt="md">
              {renderMedia({ media: safeMessages })}
            </Flex>
          </Tabs.Panel>

          <Tabs.Panel className="media-tabs" h="100%" value="files">
            <Flex h="100%" direction="column" mt="md">
              {renderFile({ media: safeMessages })}
            </Flex>
          </Tabs.Panel>

          <Tabs.Panel className="media-tabs" h="100%" value="audio">
            <Flex h="100%" direction="column" mt="md">
              {renderCall({ media: safeMessages })}
            </Flex>
          </Tabs.Panel>
        </Tabs>
      </Tabs.Panel>

      <Tabs.Panel h="calc(100% - 36px)" value="uploaded-media">
        <Tabs className="media-tabs" value={uploadTab} onChange={setUploadTab}>
          <Tabs.List>
            <Tabs.Tab value="media">{getLanguageByKey("Media")}</Tabs.Tab>
            <Tabs.Tab value="files">{getLanguageByKey("files")}</Tabs.Tab>
            <Tabs.Tab value="audio">{getLanguageByKey("audio")}</Tabs.Tab>
            <Tabs.Tab value="text">{getLanguageByKey("Text") || "Text"}</Tabs.Tab>
            <Tabs.Tab value="notes">{getLanguageByKey("Notice")}</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel className="media-tabs" h="100%" value="media">
            <Flex direction="column" gap="12" mt="md">
              {notesMedia.length ? (
                notesMedia.map((n) => (
                  <Flex key={n.id} align="stretch" gap={8}>
                    <ChatNoteCard
                      note={normalizeNote(n)}
                      techLabel={resolveTechLabel(n)}
                      showActions
                      style={{ flex: 1 }}
                    />
                    {renderDeleteBtn(n)}
                  </Flex>
                ))
              ) : (
                <Text c="dimmed">{getLanguageByKey("noNotesYet")}</Text>
              )}
            </Flex>
          </Tabs.Panel>

          <Tabs.Panel className="media-tabs" h="100%" value="files">
            <Flex direction="column" gap="12" mt="md">
              {notesFiles.length ? (
                notesFiles.map((n) => (
                  <Flex key={n.id} align="stretch" gap={8}>
                    <ChatNoteCard
                      note={normalizeNote(n)}
                      techLabel={resolveTechLabel(n)}
                      showActions
                      style={{ flex: 1 }}
                    />
                    {renderDeleteBtn(n)}
                  </Flex>
                ))
              ) : (
                <Text c="dimmed">{getLanguageByKey("noNotesYet")}</Text>
              )}
            </Flex>
          </Tabs.Panel>

          <Tabs.Panel className="media-tabs" h="100%" value="audio">
            <Flex direction="column" gap="12" mt="md">
              {notesAudio.length ? (
                notesAudio.map((n) => (
                  <Flex key={n.id} align="stretch" gap={8}>
                    <ChatNoteCard
                      note={normalizeNote(n)}
                      techLabel={resolveTechLabel(n)}
                      showActions
                      style={{ flex: 1 }}
                    />
                    {renderDeleteBtn(n)}
                  </Flex>
                ))
              ) : (
                <Text c="dimmed">{getLanguageByKey("noNotesYet")}</Text>
              )}
            </Flex>
          </Tabs.Panel>

          <Tabs.Panel className="media-tabs" h="100%" value="text">
            <Flex direction="column" gap="12" mt="md">
              {notesText.length ? (
                notesText.map((n) => (
                  <Flex key={n.id} align="stretch" gap={8}>
                    <ChatNoteCard
                      note={normalizeNote(n)}
                      techLabel={resolveTechLabel(n)}
                      showActions
                      style={{ flex: 1 }}
                    />
                    {renderDeleteBtn(n)}
                  </Flex>
                ))
              ) : (
                <Text c="dimmed">{getLanguageByKey("noNotesYet")}</Text>
              )}
            </Flex>
          </Tabs.Panel>

          <Tabs.Panel className="media-tabs" h="100%" value="notes">
            <Flex direction="column" gap="12" mt="md">
              {notesAll.length ? (
                notesAll.map((n) => (
                  <Flex key={n.id} align="stretch" gap={8}>
                    <ChatNoteCard
                      note={normalizeNote(n)}
                      techLabel={resolveTechLabel(n)}
                      showActions
                      style={{ flex: 1 }}
                    />
                    {renderDeleteBtn(n)}
                  </Flex>
                ))
              ) : (
                <Text c="dimmed">{getLanguageByKey("noNotesYet")}</Text>
              )}
            </Flex>
          </Tabs.Panel>
        </Tabs>
      </Tabs.Panel>
    </Tabs>
  );
};
