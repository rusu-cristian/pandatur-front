import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { TYPE_SOCKET_EVENTS } from "@app-constants";
import { SocketContext } from "../contexts/SocketContext";

const DDMMYYYY_HHMMSS_RE = /^(\d{2})-(\d{2})-(\d{4})[ T](\d{2}):(\d{2}):(\d{2})$/;
const toTs = (s) => {
    if (!s) return 0;
    const m = String(s).match(DDMMYYYY_HHMMSS_RE);
    if (!m) return 0;
    const [, dd, MM, yyyy, hh, mm, ss] = m;
    return new Date(`${yyyy}-${MM}-${dd}T${hh}:${mm}:${ss}`).getTime() || 0;
};

const noteKey = (n) =>
    `${n.ticket_id}|${n.technician_id}|${n.type}|${String(n.value ?? "").trim()}|${n.created_at}`;

export const useLiveTicketNotes = (ticketId) => {
    const { onEvent, offEvent } = useContext(SocketContext);
    const [liveNotes, setLiveNotes] = useState([]);
    const keySetRef = useRef(new Set());

    useEffect(() => {
        setLiveNotes([]);
        keySetRef.current.clear();
    }, [ticketId]);

    useEffect(() => {
        if (!ticketId) return;

        const handler = (msg) => {
            const d = msg?.data;
            if (!d || String(d.ticket_id) !== String(ticketId)) return;

            const incoming = {
                ticket_id: d.ticket_id,
                type: d.type,
                value: d.value,
                technician_id: d.technician_id,
                created_at: d.created_at,
            };

            const k = noteKey(incoming);
            if (keySetRef.current.has(k)) return;

            keySetRef.current.add(k);
            setLiveNotes((prev) => {
                const next = [...prev, incoming];
                next.sort((a, b) => toTs(a.created_at) - toTs(b.created_at));
                return next;
            });
        };

        onEvent(TYPE_SOCKET_EVENTS.TICKET_NOTE, handler);
        return () => offEvent(TYPE_SOCKET_EVENTS.TICKET_NOTE, handler);
    }, [ticketId, onEvent, offEvent]);

    const liveNoteKeys = useMemo(() => new Set(liveNotes.map(noteKey)), [liveNotes]);
    return { liveNotes, liveNoteKeys };
};
