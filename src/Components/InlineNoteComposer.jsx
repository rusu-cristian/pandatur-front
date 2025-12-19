import { useEffect, useRef, useState, useCallback } from "react";
import {
    Paper,
    Flex,
    Textarea,
    Button,
    ActionIcon,
    FileButton,
    Badge,
    CloseButton,
    Loader,
} from "@mantine/core";
import { getLanguageByKey } from "@utils";
import { RiAttachment2 } from "react-icons/ri";
import { useUploadMediaFile } from "../hooks";
import { getMediaType } from "./ChatComponent/renderContent";
import { messages } from "../api/messages";
import { AttachmentsPreview } from "./ChatComponent/components/AttachmentsPreview";

export const InlineNoteComposer = ({ ticketId, technicianId, onCancel, onSave, loading }) => {
    const [text, setText] = useState("");
    const [attachments, setAttachments] = useState([]);
    const [isDragOver, setIsDragOver] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [sending, setSending] = useState(false);

    const taRef = useRef(null);
    const { uploadFile } = useUploadMediaFile();

    const canSend =
        (text.trim().length > 0 || attachments.length > 0) &&
        !uploading &&
        !loading &&
        !sending;

    const removeAttachment = (url) => {
        setAttachments((prev) => prev.filter((a) => a.media_url !== url));
    };

    const uploadAndAddFiles = async (files) => {
        if (!files?.length) return;
        setUploading(true);
        try {
            for (const file of files) {
                const url = await uploadFile(file);
                if (url) {
                    const media_type = getMediaType(file.type);
                    setAttachments((prev) => [
                        ...prev,
                        { media_url: url, media_type, name: file.name, size: file.size },
                    ]);
                }
            }
        } catch (e) {
            console.error("InlineNote upload error:", e);
        } finally {
            setUploading(false);
            requestAnimationFrame(() => taRef.current?.focus());
        }
    };

    const handleFileButton = async (fileOrFiles) => {
        const files = Array.isArray(fileOrFiles) ? fileOrFiles : [fileOrFiles];
        await uploadAndAddFiles(files);
    };

    const handleDrop = async (e) => {
        e.preventDefault();
        setIsDragOver(false);
        const files = Array.from(e.dataTransfer.files || []);
        await uploadAndAddFiles(files);
    };

    const handlePaste = async (e) => {
        const files = Array.from(e.clipboardData?.files || []);
        if (!files.length) return;
        e.preventDefault();
        await uploadAndAddFiles(files);
    };

    const clearState = () => {
        setText("");
        setAttachments([]);
    };

    const mapMediaToType = (t = "") => {
        const mt = String(t).toLowerCase();
        if (mt.includes("image")) return "image";
        if (mt.includes("video")) return "video";
        if (mt.includes("audio")) return "audio";
        return "file";
    };

    const handleSend = useCallback(async () => {
        if (!canSend || !ticketId || !technicianId) return;
        const trimmed = text.trim();
        setSending(true);
        try {
            const results = [];

            if (trimmed) {
                const res = await messages.notes.create({
                    ticket_id: ticketId,
                    type: "text",
                    value: trimmed,
                    technician_id: technicianId,
                });
                results.push(res);
            }

            for (const att of attachments) {
                // eslint-disable-next-line no-await-in-loop
                const res = await messages.notes.create({
                    ticket_id: ticketId,
                    type: mapMediaToType(att.media_type),
                    value: att.media_url,
                    technician_id: technicianId,
                });
                results.push(res);
            }

            onSave?.(results);
            clearState();
        } catch (e) {
            console.error("InlineNote send error:", e);
        } finally {
            setSending(false);
        }
    }, [attachments, canSend, technicianId, ticketId, text, onSave]);

    useEffect(() => {
        const el = taRef.current;
        if (!el) return;
        const onKey = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                e.preventDefault();
                handleSend();
            }
            if (e.key === "Escape") {
                e.preventDefault();
                onCancel?.();
            }
        };
        el.addEventListener("keydown", onKey);
        return () => el.removeEventListener("keydown", onKey);
    }, [handleSend, onCancel]);

    return (
        <Paper p="12" radius="md" withBorder style={{ background: "var(--crm-ui-kit-palette-background-primary)" }}>
            <Flex direction="column" gap="8">
                <Flex
                    align="center"
                    justify="space-between"
                    mb={4}
                    style={{ borderBottom: "1px solid #ffe58f", paddingBottom: 6 }}
                >
                    <Badge variant="light" color="yellow">
                        {getLanguageByKey("Notice")}
                    </Badge>
                    <CloseButton
                        aria-label={getLanguageByKey("Închide")}
                        title={getLanguageByKey("Închide")}
                        onClick={onCancel}
                        disabled={uploading || loading || sending}
                    />
                </Flex>

                <Textarea
                    ref={taRef}
                    placeholder={getLanguageByKey("WriteNote")}
                    autosize
                    minRows={3}
                    maxRows={8}
                    value={text}
                    onChange={(e) => setText(e.currentTarget.value)}
                    onPaste={handlePaste}
                    onDragEnter={(e) => {
                        e.preventDefault();
                        setIsDragOver(true);
                    }}
                    onDragLeave={(e) => {
                        e.preventDefault();
                        setIsDragOver(false);
                    }}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDrop}
                    styles={{
                        input: {
                            border: isDragOver ? "2px dashed #69db7c" : undefined,
                            backgroundColor: isDragOver ? "#ebfbee" : undefined,
                        },
                    }}
                />
                <AttachmentsPreview attachments={attachments} onRemove={removeAttachment} mb={0} />

                <Flex justify="space-between" align="center" gap="8">

                    <Flex gap="8">
                        <Button
                            onClick={handleSend}
                            disabled={!canSend}
                            loading={uploading || loading || sending}
                        >
                            {getLanguageByKey("Save")}
                        </Button>
                        <Button
                            variant="outline"
                            color="gray"
                            onClick={onCancel}
                            disabled={uploading || loading || sending}
                        >
                            {getLanguageByKey("Anuleaza")}
                        </Button>
                    </Flex>

                    <Flex gap="6" align="center">
                        <FileButton
                            variant="outline"
                            color="var(--crm-ui-kit-palette-link-primary)"
                            onChange={handleFileButton}
                            accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                            multiple
                        >
                            {(props) => (
                                <ActionIcon {...props} title={getLanguageByKey("Attach files")}>
                                    <RiAttachment2 size={18} />
                                </ActionIcon>
                            )}
                        </FileButton>
                        {(uploading || loading || sending) && <Loader size="xs" />}
                    </Flex>

                </Flex>
            </Flex>
        </Paper>
    );
};
