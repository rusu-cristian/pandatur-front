import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { Text, Popover, ScrollArea, Box, Flex, Divider } from "@mantine/core";
import { SocketContext } from "../contexts/SocketContext";
import { useGetTechniciansList } from "@hooks";
import { getLanguageByKey } from "@utils";
import "./TicketParticipants.css";

const SERVER = {
    INIT: "ticket_clients",
    JOINED: "ticket_client_joined",
    LEFT: "ticket_client_left",
    ERROR: "error",
};

export const useTicketPresence = (ticketId, clientId) => {
    const { sendedValue, joinTicketRoom, leaveTicketRoom, onOpenSubscribe, socketRef } = useContext(SocketContext);
    const [connected, setConnected] = useState(false);
    const [presence, setPresence] = useState({ ticketId: null, clients: [], total: 0 });
    const joinedRef = useRef({ ticketId: null, clientId: null });

    useEffect(() => {
        const ws = socketRef.current;
        if (!ws) { setConnected(false); return; }
        setConnected(ws.readyState === WebSocket.OPEN);
        const onOpen = () => setConnected(true);
        const onClose = () => setConnected(false);
        ws.addEventListener?.("open", onOpen);
        ws.addEventListener?.("close", onClose);
        return () => {
            ws?.removeEventListener?.("open", onOpen);
            ws?.removeEventListener?.("close", onClose);
        };
    }, [socketRef]);

    useEffect(() => {
        if (!ticketId || !clientId) return;

        const prev = joinedRef.current;
        const sameTicket = String(prev.ticketId) === String(ticketId);
        const sameClient = String(prev.clientId) === String(clientId);

        if (!sameTicket || !sameClient) {
            if (prev.ticketId && prev.clientId && !sameTicket) {
                leaveTicketRoom(prev.ticketId, prev.clientId);
            }
            joinTicketRoom(ticketId, clientId);
            joinedRef.current = { ticketId, clientId };
        }

        return () => {
            const cur = joinedRef.current;
            if (cur.ticketId && cur.clientId) {
                leaveTicketRoom(cur.ticketId, cur.clientId);
                joinedRef.current = { ticketId: null, clientId: null };
            }
        };
    }, [ticketId, clientId, joinTicketRoom, leaveTicketRoom]);

    useEffect(() => {
        if (!ticketId || !clientId) return;
        const unsub = onOpenSubscribe(() => {
            const cur = joinedRef.current;
            if (String(cur.ticketId) === String(ticketId) && String(cur.clientId) === String(clientId)) {
                joinTicketRoom(ticketId, clientId);
            }
        });
        return () => unsub && unsub();
    }, [ticketId, clientId, onOpenSubscribe, joinTicketRoom]);

    useEffect(() => {
        const msg = sendedValue;
        if (!msg || !msg.type) return;
        const { type, data } = msg;
        if (!data || String(data.ticket_id) !== String(ticketId)) return;

        switch (type) {
            case SERVER.INIT: {
                const existing = Array.isArray(data.clients) ? data.clients.map(Number) : [];
                const set = new Set(existing);
                if (clientId != null) set.add(Number(clientId));
                const clients = Array.from(set);
                setPresence({ ticketId: data.ticket_id, clients, total: clients.length });
                break;
            }
            case SERVER.JOINED: {
                setPresence((prev) => {
                    const set = new Set(prev.clients);
                    if (data && data.client_id != null) set.add(Number(data.client_id));
                    const clients = Array.from(set);
                    return { ticketId: data.ticket_id, clients, total: data?.total_clients ?? clients.length };
                });
                break;
            }
            case SERVER.LEFT: {
                setPresence((prev) => {
                    const id = Number(data?.client_id);
                    const clients = prev.clients.filter((x) => x !== id);
                    return { ticketId: data.ticket_id, clients, total: data?.total_clients ?? clients.length };
                });
                break;
            }
            default: break;
        }
    }, [sendedValue, ticketId, clientId]);

    return { connected, clients: presence.clients, total: presence.total };
};

const SYSTEM_ID = 1;
const MAX_INLINE_NAMES = 4;

export const TicketParticipants = ({ ticketId, currentUserId }) => {
    const { technicians } = useGetTechniciansList();
    const { clients } = useTicketPresence(ticketId, currentUserId);

    const techMap = useMemo(() => {
        const map = new Map();
        (technicians || []).forEach((t) => map.set(Number(t.value), t));
        return map;
    }, [technicians]);

    const participants = useMemo(() => {
        return clients.map((id) => {
            const isSystem = Number(id) === SYSTEM_ID;
            const t = techMap.get(Number(id));
            const name = isSystem 
                ? "System" 
                : t?.label || [t?.name, t?.surname].filter(Boolean).join(" ") || `User ${id}`;
            const isCurrentUser = String(id) === String(currentUserId);
            return { id, name, isCurrentUser, isSystem };
        });
    }, [clients, techMap, currentUserId]);

    const inline = participants.slice(0, MAX_INLINE_NAMES);
    const rest = participants.slice(MAX_INLINE_NAMES);
    const hasMore = rest.length > 0;

    return (
        <Box>
            <Flex align="center" gap="md" wrap="wrap">
                <Flex align="center" gap="xs">
                    <Text pl="xs" size="sm" fw={900} style={{ whiteSpace: "nowrap", color: "var(--crm-ui-kit-palette-text-primary)" }}>
                        LIVE
                    </Text>
                </Flex>

                {participants.length > 0 ? (
                    <Flex align="center" gap="xs" style={{ flex: 1, minWidth: 0 }}>
                        {inline.map((participant, index) => (
                                <Flex key={participant.id || index} align="center" gap="xs">
                                    <Box
                                        className="status-indicator"
                                        style={{
                                            width: "8px",
                                            height: "8px",
                                            borderRadius: "50%",
                                            backgroundColor: "var(--crm-ui-kit-palette-link-primary)",
                                            boxShadow: "0 0 6px color-mix(in srgb, var(--crm-ui-kit-palette-link-primary) 60%, transparent)"
                                        }}
                                    />
                                    <Text
                                        size="sm"
                                        fw={participant.isCurrentUser ? 700 : 500}
                                        style={{
                                            whiteSpace: "nowrap",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            maxWidth: "120px",
                                            color: participant.isCurrentUser ? "var(--crm-ui-kit-palette-link-primary)" : "var(--crm-ui-kit-palette-text-primary)"
                                        }}
                                        title={participant.name}
                                    >
                                        {participant.name}
                                    </Text>
                                </Flex>
                            )
                        )}
                        {hasMore && (
                            <Popover width={320} position="bottom-end" withArrow>
                                <Popover.Target>
                                    <Text
                                        size="sm"
                                        fw={600}
                                        style={{
                                            cursor: "pointer",
                                            userSelect: "none",
                                            whiteSpace: "nowrap",
                                            textDecoration: "underline",
                                            color: "var(--crm-ui-kit-palette-link-primary)"
                                        }}
                                        aria-label={getLanguageByKey("showAllParticipants")}
                                    >
                                        +{rest.length} {getLanguageByKey("andMore")}
                                    </Text>
                                </Popover.Target>
                                <Popover.Dropdown>
                                    <Box p="md">
                                        <Text size="sm" fw={600} mb="sm" style={{ color: "var(--crm-ui-kit-palette-text-primary)" }}>
                                            {getLanguageByKey("showAllParticipants")}
                                        </Text>
                                        <Divider mb="sm" />
                                        <ScrollArea.Autosize mah={220} type="auto">
                                            <Flex direction="column" gap="xs">
                                                {rest.map((participant, index) => (
                                                        <Flex key={participant.id || index} align="center" gap="xs">
                                                            <Box
                                                                style={{
                                                                    width: "8px",
                                                                    height: "8px",
                                                                    borderRadius: "50%",
                                                                    backgroundColor: "var(--crm-ui-kit-palette-link-primary)",
                                                                    boxShadow: "0 0 6px color-mix(in srgb, var(--crm-ui-kit-palette-link-primary) 60%, transparent)"
                                                                }}
                                                            />
                                                            <Text 
                                                                size="sm" 
                                                                fw={participant.isCurrentUser ? 700 : 500}
                                                                style={{ 
                                                                    color: participant.isCurrentUser 
                                                                        ? "var(--crm-ui-kit-palette-link-primary)" 
                                                                        : "var(--crm-ui-kit-palette-text-primary)" 
                                                                }}
                                                            >
                                                                {participant.name}
                                                            </Text>
                                                        </Flex>
                                                    )
                                                )}
                                            </Flex>
                                        </ScrollArea.Autosize>
                                    </Box>
                                </Popover.Dropdown>
                            </Popover>
                        )}
                    </Flex>
                ) : (
                    <Text size="sm" c="dimmed" fw={500}>
                        {getLanguageByKey("noParticipantsInTicket")}
                    </Text>
                )}
            </Flex>
        </Box >
    );
};
