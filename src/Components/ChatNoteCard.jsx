import { Paper, Flex, Text, Anchor, Badge, Group } from "@mantine/core";
import { FiImage, FiVideo, FiMusic, FiFileText } from "react-icons/fi";
import { getLanguageByKey } from "@utils";

const IMAGE_EXT = ["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg", "heic", "heif", "avif"];
const VIDEO_EXT = ["mp4", "webm", "ogg", "mov", "m4v"];
const AUDIO_EXT = ["mp3", "wav", "ogg", "m4a", "aac", "flac", "wma"];

const safeDecodeURIComponent = (s = "") => {
    try {
        return decodeURIComponent(s);
    } catch {
        try {
            return decodeURI(s);
        } catch {
            return s;
        }
    }
};

const escapeBadPercents = (s = "") => s.replace(/%(?![0-9A-Fa-f]{2})/g, "%25");

const extractName = (pathLike = "") => {
    const raw = (pathLike.split("/").pop() || "").split("?")[0].split("#")[0];
    return safeDecodeURIComponent(escapeBadPercents(raw));
};

const getExt = (url = "") => {
    const str = String(url).trim();
    const fromPath = (pathname) => {
        const decoded = extractName(pathname);
        const parts = decoded.split(".");
        return parts.length > 1 ? (parts.pop() || "").toLowerCase() : "";
    };

    try {
        const u = new URL(str, typeof window !== "undefined" ? window.location.origin : "http://localhost");
        return fromPath(u.pathname);
    } catch {
        const clean = str.split("?")[0].split("#")[0];
        return fromPath(clean);
    }
};

const getFileNameFromUrl = (url = "") => {
    const str = String(url).trim();
    if (!str) return "file";
    if (str.startsWith("data:") || str.startsWith("blob:")) return "file";

    const pickName = (pathname, search = "") => {
        const params = new URLSearchParams(search);
        const qn = params.get("filename") || params.get("file") || params.get("name");
        if (qn) return safeDecodeURIComponent(escapeBadPercents(qn));
        const name = extractName(pathname);
        return name || "file";
    };

    try {
        const u = new URL(str, typeof window !== "undefined" ? window.location.origin : "http://localhost");
        return pickName(u.pathname, u.search);
    } catch {
        const clean = str.split("?")[0].split("#")[0];
        return pickName(clean);
    }
};

const getNoteKind = (note) => {
    const t = (note?.type || "").toLowerCase();
    if (t === "text") return "text";
    if (t === "image") return "image";
    if (t === "video") return "video";
    if (t === "audio") return "audio";
    const ext = getExt(note?.value);
    if (IMAGE_EXT.includes(ext)) return "image";
    if (VIDEO_EXT.includes(ext)) return "video";
    if (AUDIO_EXT.includes(ext)) return "audio";
    return "file";
};

const NoteContent = ({ note }) => {
    const kind = getNoteKind(note);
    const url = note?.value;
    const fileName = kind === "text" ? "" : getFileNameFromUrl(url);

    if (kind === "text") {
        return (
            <Text size="sm" style={{ whiteSpace: "pre-wrap", lineHeight: 1.5 }}>
                {url || ""}
            </Text>
        );
    }

    if (kind === "image") {
        return (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <img
                    src={url}
                    alt={fileName}
                    loading="lazy"
                    style={{ 
                        maxWidth: "100%", 
                        maxHeight: 160, 
                        objectFit: "contain", 
                        borderRadius: 10, 
                        cursor: "pointer",
                        background: "var(--crm-ui-kit-palette-background-primary)"
                    }}
                    onClick={() => window.open(url, '_blank')}
                    onError={(e) => {
                        e.currentTarget.style.display = "none";
                        const link = e.currentTarget.nextSibling;
                        if (link) link.style.display = "inline-block";
                    }}
                />
                <Anchor href={url} target="_blank" rel="noopener noreferrer" style={{ display: "none" }}>
                    {getLanguageByKey("Открыть/скачать")} ({fileName})
                </Anchor>
            </div>
        );
    }

    if (kind === "video") {
        return (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <video src={url} controls style={{ width: "100%", maxHeight: 520, borderRadius: 10, boxShadow: "0 2px 10px rgba(0,0,0,.2)", background: "var(--crm-ui-kit-palette-background-primary-disabled)" }} />
                <Anchor href={url} target="_blank" rel="noopener noreferrer">
                    {getLanguageByKey("Открыть/скачать")} ({fileName})
                </Anchor>
            </div>
        );
    }

    if (kind === "audio") {
        return (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <audio src={url} controls style={{ width: "100%" }} />
                <Anchor href={url} target="_blank" rel="noopener noreferrer">
                    {getLanguageByKey("Открыть/скачать")} ({fileName})
                </Anchor>
            </div>
        );
    }

    return (
        <Text size="sm" style={{ whiteSpace: "pre-wrap" }}>
            {getLanguageByKey("Файл заметки")}:{" "}
            <Anchor href={url} target="_blank" rel="noopener noreferrer">
                {getLanguageByKey("Открыть/скачать")} ({fileName})
            </Anchor>
        </Text>
    );
};

const NOTE_STYLE = {
    text: { borderColor: "rgba(255, 229, 143, 0.3)", bgColor: "var(--crm-ui-kit-palette-background-primary)", accentColor: "#FFA500", icon: FiFileText, label: "Text" },
    image: { borderColor: "rgba(145, 213, 255, 0.3)", bgColor: "var(--crm-ui-kit-palette-background-primary)", accentColor: "#91d5ff", icon: FiImage, label: "Image" },
    video: { borderColor: "rgba(179, 127, 235, 0.3)", bgColor: "var(--crm-ui-kit-palette-background-primary)", accentColor: "#b37feb", icon: FiVideo, label: "Video" },
    audio: { borderColor: "rgba(149, 222, 100, 0.3)", bgColor: "var(--crm-ui-kit-palette-background-primary)", accentColor: "#95de64", icon: FiMusic, label: "Audio" },
    file: { borderColor: "var(--crm-ui-kit-palette-border-default)", bgColor: "var(--crm-ui-kit-palette-background-primary)", accentColor: "#d9d9d9", icon: FiFileText, label: "File" },
};

export const ChatNoteCard = ({ note, techLabel, showActions = true, className, style }) => {
    const kind = getNoteKind(note);
    const meta = NOTE_STYLE[kind] || NOTE_STYLE.file;
    const Icon = meta.icon;

    return (
        <Paper
            mb="15"
            radius="lg"
            withBorder
            className={className}
            style={{
                overflow: "hidden",
                background: meta.bgColor,
                borderColor: meta.borderColor,
                ...style,
            }}
        >
            <Flex 
                align="center" 
                justify="space-between" 
                px="14" 
                py="10" 
                style={{ 
                    borderBottom: `1px solid ${meta.borderColor}`,
                    background: "var(--crm-ui-kit-palette-background-primary-disabled)"
                }}
            >
                <Group gap={10}>
                    <span
                        style={{
                            display: "inline-flex",
                            width: 28,
                            height: 28,
                            borderRadius: 8,
                            alignItems: "center",
                            justifyContent: "center",
                            background: `${meta.accentColor}20`,
                            color: meta.accentColor,
                        }}
                    >
                        <Icon size={16} />
                    </span>
                    <Text fw={600} size="sm">{getLanguageByKey("Notice")}</Text>
                    <Badge 
                        variant="light" 
                        radius="sm" 
                        style={{
                            background: `${meta.accentColor}20`,
                            color: "var(--crm-ui-kit-palette-text-primary)"
                        }}
                    >
                        {getLanguageByKey(meta.label)}
                    </Badge>
                </Group>
            </Flex>

            <Flex direction="column" gap="8" px="12" py="10">
                <NoteContent note={note} />
            </Flex>

            <Flex 
                align="center" 
                justify="space-between" 
                px="12" 
                py="8" 
                style={{ 
                    borderTop: `1px solid ${meta.borderColor}`,
                    background: "var(--crm-ui-kit-palette-background-primary-disabled)"
                }}
            >
                <Text size="xs" c="dimmed">
                    {getLanguageByKey("Заметка")} · {techLabel}
                </Text>
                <Text size="xs" c="dimmed">
                    {note.timeCreatedDisplay}
                </Text>
            </Flex>
        </Paper>
    );
};
