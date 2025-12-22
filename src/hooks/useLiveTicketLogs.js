import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { SocketContext } from "../contexts/SocketContext";
import { TYPE_SOCKET_EVENTS } from "@app-constants";

const tsFromDDMMYYYY = (s) => {
    if (!s) return 0;
    const m = String(s).match(/^(\d{2})-(\d{2})-(\d{4})[ T](\d{2}):(\d{2}):(\d{2})$/);
    if (!m) return 0;
    const [, dd, MM, yyyy, hh, mm, ss] = m;
    const t = new Date(`${yyyy}-${MM}-${dd}T${hh}:${mm}:${ss}`).getTime();
    return Number.isFinite(t) ? t : 0;
};

export const useLiveTicketLogs = (ticketId) => {
    const { onEvent, offEvent } = useContext(SocketContext);
    const [liveLogs, setLiveLogs] = useState([]);
    const keySetRef = useRef(new Set());

    useEffect(() => {
        setLiveLogs([]);
        keySetRef.current.clear();
    }, [ticketId]);

    useEffect(() => {
        if (!ticketId) return;

        const handler = (msg) => {
            const data = msg?.data;
            if (!data || String(data.ticket_id) !== String(ticketId)) return;

            const incoming = Array.isArray(data.logs) ? data.logs : [];
            if (!incoming.length) return;

            setLiveLogs((prev) => {
                const map = new Map();

                for (const l of prev) {
                    const key = l?.id ?? `${l?.timestamp}-${l?.subject}`;
                    map.set(key, l);
                }

                for (const l of incoming) {
                    const key = l?.id ?? `${l?.timestamp}-${l?.subject}`;
                    keySetRef.current.add(key);
                    map.set(key, l);
                }

                const merged = Array.from(map.values());
                merged.sort((a, b) => tsFromDDMMYYYY(a?.timestamp) - tsFromDDMMYYYY(b?.timestamp));
                return merged;
            });
        };

        onEvent(TYPE_SOCKET_EVENTS.TICKET_LOGS, handler);
        return () => offEvent(TYPE_SOCKET_EVENTS.TICKET_LOGS, handler);
    }, [ticketId, onEvent, offEvent]);

    const liveIds = useMemo(() => new Set(liveLogs.map((l) => l?.id).filter(Boolean)), [liveLogs]);

    return { liveLogs, liveIds };
};
