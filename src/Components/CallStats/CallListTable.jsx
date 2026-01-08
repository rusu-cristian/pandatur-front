import { useMemo, useRef, useState, useEffect } from "react";
import {
    Box, Flex, Pagination, Badge, ActionIcon, Text, Tooltip, Anchor, LoadingOverlay
} from "@mantine/core";
import { RcTable } from "../RcTable";
import { getLanguageByKey } from "@utils";
import { format } from "date-fns";
import { FaDownload, FaPlay, FaPause } from "react-icons/fa";
import { Link } from "react-router-dom";

const formatDate = (ts) => {
    if (!ts) return "-";
    try { return format(new Date(ts * 1000), "dd.MM.yyyy HH:mm:ss"); } catch { return "-"; }
};

const formatDuration = (totalSeconds = 0) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = Math.floor(totalSeconds % 60);
    return [h > 0 ? String(h).padStart(2, "0") : null, String(m).padStart(2, "0"), String(s).padStart(2, "0")]
        .filter(Boolean).join(":");
};

export const CallListTable = ({
    data = [],
    pagination,
    onPageChange,
    loading,
    techniciansMap,
}) => {
    const audioRef = useRef(null);
    const [playingUrl, setPlayingUrl] = useState(null);

    const [localLoading, setLocalLoading] = useState(false);

    useEffect(() => {
        if (!loading) setLocalLoading(false);
    }, [loading, data, pagination?.page]);

    useEffect(() => () => { if (audioRef.current) audioRef.current.pause(); }, []);

    const playUrl = async (url) => {
        try {
            if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
            const audio = new Audio(url);
            audioRef.current = audio;
            audio.onended = () => setPlayingUrl(null);
            await audio.play();
            setPlayingUrl(url);
        } catch { }
    };

    const togglePlay = (url) => {
        if (!url) return;
        const a = audioRef.current;
        if (playingUrl === url && a) {
            if (a.paused) { a.play().catch(() => { }); setPlayingUrl(url); }
            else { a.pause(); setPlayingUrl(null); }
        } else {
            playUrl(url);
        }
    };

    const columns = useMemo(() => [
        {
            title: getLanguageByKey("DateTime"),
            dataIndex: "timestamp",
            width: 130,
            render: (ts) => <span style={{ fontFamily: "monospace", fontSize: 11 }}>{formatDate(ts)}</span>,
        },
        {
            title: getLanguageByKey("Users"),
            dataIndex: "user_id",
            width: 140,
            render: (userId) => techniciansMap.get(String(userId)) || userId,
        },
        {
            title: getLanguageByKey("Client"),
            dataIndex: "client_fullname",
            width: 120,
            render: (val) => val || "-",
        },
        {
            title: getLanguageByKey("Ticket"),
            dataIndex: "ticket_id",
            width: 100,
            align: "center",
            render: (id) =>
                id ? (
                    <Link
                        to={`/analytics/calls/${id}`}
                        style={{
                            textDecoration: 'underline',
                            color: '#007bff',
                            fontWeight: 'bold',
                            fontSize: 11
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <Flex justify="center" gap="4" align="center">
                            {id}
                        </Flex>
                    </Link>
                ) : "-",
        },
        {
            title: getLanguageByKey("WhoCalled"),
            dataIndex: "who_called",
            width: 90,
            render: (v) =>
                v === "user" ? <Badge size="xs" color="blue">{getLanguageByKey("User")}</Badge>
                    : v === "client" ? <Badge size="xs" color="green">{getLanguageByKey("Client")}</Badge>
                        : v,
        },
        {
            title: getLanguageByKey("Status"),
            dataIndex: "status",
            width: 80,
            render: (v) =>
                v === "ANSWER" ? <Badge size="xs" color="teal">{getLanguageByKey("Answer")}</Badge>
                    : v === "NOANSWER" ? <Badge size="xs" color="red">{getLanguageByKey("NoAnswer")}</Badge>
                        : v,
        },
        {
            title: getLanguageByKey("Record"),
            key: "record",
            width: 80,
            render: (_, record) =>
                record.call_url ? (
                    <Flex align="center" gap={4}>
                        <Tooltip label={playingUrl === record.call_url ? getLanguageByKey("Pause") : getLanguageByKey("Play")}>
                            <ActionIcon
                                size="xs"
                                color={playingUrl === record.call_url ? "teal" : "blue"}
                                variant="light"
                                onClick={(e) => { e.stopPropagation(); togglePlay(record.call_url); }}
                            >
                                {playingUrl === record.call_url ? <FaPause size={10} /> : <FaPlay size={10} />}
                            </ActionIcon>
                        </Tooltip>

                        <Tooltip label={getLanguageByKey("DownloadListen")}>
                            <ActionIcon
                                size="xs"
                                component="a"
                                href={record.call_url}
                                target="_blank"
                                color="blue"
                                variant="light"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <FaDownload size={10} />
                            </ActionIcon>
                        </Tooltip>

                        {record.duration != null && (
                            <Text size="xs" c="dimmed">{formatDuration(record.duration)}</Text>
                        )}
                    </Flex>
                ) : <span style={{ color: "#888" }}>—</span>,
        },
    ], [techniciansMap, playingUrl]);

    const handlePaginate = (p) => {
        setLocalLoading(true);
        onPageChange?.(p);
    };

    const overlayVisible = loading || localLoading;

    return (
        <Box>
            <Box pos="relative">
                <LoadingOverlay
                    visible={overlayVisible}
                    zIndex={10}
                    overlayProps={{ blur: 1, backgroundOpacity: 0.35 }}
                />
                <div style={{ height: "calc(85vh - 70px)" }}>
                    <RcTable
                        columns={columns}
                        data={data}
                        bordered
                        loading={false}
                        rowKey={(_, index) => `row_${index}`}
                        style={{ opacity: overlayVisible ? 0.7 : 1, height: "100%" }}
                    />
                </div>
                <Flex
                    pt={12}
                    pb={12}
                    justify="center"
                    style={{
                        borderTop: "1px solid var(--crm-ui-kit-palette-border-primary)",
                        backgroundColor: "var(--crm-ui-kit-palette-background-primary)"
                    }}
                >
                    <Pagination
                        size="xs"
                        total={pagination?.total_pages || 1}
                        value={pagination?.page || 1}
                        onChange={handlePaginate}
                        disabled={overlayVisible}
                    />
                </Flex>
            </Box>
        </Box>
    );
};
