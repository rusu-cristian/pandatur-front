import { useState, useEffect, useMemo, useCallback, useRef, startTransition } from "react";
import { useSnackbar } from "notistack";
import { api } from "../api";
import { showServerError } from "@utils";
import { getPagesByType } from "../constants/webhookPagesConfig";

/** ====================== helpers ====================== */

const DEBUG = false;
const debug = (...args) => { if (DEBUG) console.log("[useClientContacts]", ...args); };

function normalizePlatformBlock(block) {
  if (!block) return {};
  if (Array.isArray(block)) {
    return block.reduce((acc, item, idx) => {
      const id = item?.id ?? idx;
      acc[id] = item || {};
      return acc;
    }, {});
  }
  if (typeof block === "object") return block;
  return {};
}

function buildClientIndex(clients) {
  const map = new Map();
  (clients || []).forEach((c) => {
    (c.contacts || []).forEach((ct) => {
      if (ct?.id != null) map.set(Number.parseInt(ct.id, 10), c);
    });
  });
  return map;
}

function computePlatformOptionsFromBlocks(platformBlocks) {
  const options = Object.keys(platformBlocks)
    .filter((key) => Object.keys(platformBlocks[key] || {}).length > 0)
    .map((key) => ({ label: key, value: key, payload: { platform: key } }))
    .sort((a, b) => a.label.localeCompare(b.label));
  return options;
}

function selectPageIdByMessage(platform, messagePageId, groupTitle) {
  if (!platform) return null;
  const allPages = getPagesByType(platform) || [];
  const filtered = groupTitle ? allPages.filter((p) => {
    if (Array.isArray(p.group_title)) {
      return p.group_title.includes(groupTitle);
    }
    return p.group_title === groupTitle;
  }) : allPages;
  if (!filtered.length) return null;
  return filtered.some((p) => p.page_id === messagePageId) ? messagePageId : filtered[0].page_id;
}

function matchContact(contactOptions, contactValue, clientId) {
  if (!contactOptions?.length || !contactValue) return null;
  const full = contactOptions.find(
    (c) => c?.payload?.contact_value === contactValue && c?.payload?.client_id === clientId
  );
  return full || contactOptions.find((c) => c?.payload?.contact_value === contactValue) || null;
}

/** ====================== hook ====================== */

export const useClientContacts = (ticketId, lastMessage, groupTitle) => {
  const { enqueueSnackbar } = useSnackbar();

  const [ticketData, setTicketData] = useState(null);
  const [selectedPlatform, setSelectedPlatform] = useState(null);
  const [selectedClient, setSelectedClient] = useState({}); // option
  const [selectedPageId, setSelectedPageId] = useState(null);
  const [loading, setLoading] = useState(false);

  const abortRef = useRef(null);
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  /** 1) Единожды нормализуем все платформенные блоки и строим индекс клиентов */
  const { platformBlocks, clientIndex } = useMemo(() => {
    if (!ticketData) return { platformBlocks: {}, clientIndex: new Map() };
    const blocks = Object.entries(ticketData).reduce((acc, [key, val]) => {
      if (key === "clients") return acc;
      acc[key] = normalizePlatformBlock(val);
      return acc;
    }, {});
    return {
      platformBlocks: blocks,
      clientIndex: buildClientIndex(ticketData.clients),
    };
  }, [ticketData]);

  /** 2) Опции платформ и контактов на мемо-данных */
  const platformOptions = useMemo(
    () => computePlatformOptionsFromBlocks(platformBlocks),
    [platformBlocks]
  );

  const contactOptions = useMemo(() => {
    if (!selectedPlatform) return [];
    const block = platformBlocks[selectedPlatform] || {};
    const contacts = Object.entries(block).map(([contactIdRaw, contactData]) => {
      const contactId = Number.parseInt(contactIdRaw, 10);
      const client = clientIndex.get(contactId);

      const client_id = client?.id;
      const name = contactData?.name || client?.name || "";
      const surname = contactData?.surname || client?.surname || "";
      const contact_value = contactData?.contact_value || "";

      let label;
      if (["whatsapp", "viber", "telegram"].includes(selectedPlatform)) {
        const fullName = `${name} ${surname || ""}`.trim();
        label = `${fullName} - ${contact_value}`;
      } else {
        label = `${contactId} - ${name} ${surname || ""}`.trim();
      }

      return {
        label,
        value: `${client_id ?? "x"}-${contactId}`,
        payload: {
          id: client_id,
          client_id,
          contact_id: contactId,
          platform: selectedPlatform,
          name,
          surname,
          phone: selectedPlatform === "phone" ? contact_value : "",
          email: selectedPlatform === "email" ? contact_value : "",
          contact_value,
          is_primary: Boolean(contactData?.is_primary),
          photo: client?.photo,
        },
      };
    });

    contacts.sort((a, b) => a.label.localeCompare(b.label));
    return contacts;
  }, [platformBlocks, selectedPlatform, clientIndex]);

  /** Загрузка ticketData */
  const fetchClientContacts = useCallback(async () => {
    if (!ticketId) return;
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    try {
      const response = await api.users.getUsersClientContactsByPlatform(ticketId, null, {
        signal: controller.signal,
      });
      if (controller.signal.aborted || !mountedRef.current) return;

      startTransition(() => {
        setTicketData(response);
        // мягкий локальный сброс — автоэтапы ниже всё выставят
        setSelectedPlatform(null);
        setSelectedClient({});
        setSelectedPageId(null);
      });
    } catch (error) {
      if (error?.name !== "AbortError") {
        enqueueSnackbar(showServerError(error), { variant: "error" });
      }
    } finally {
      if (!controller.signal.aborted && mountedRef.current) setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketId]);

  /** Рефетч по ticketId (+ cleanup) */
  useEffect(() => {
    if (!ticketId) return;
    debug("ticketId changed → refetch + local reset", ticketId);

    startTransition(() => {
      setSelectedPlatform(null);
      setSelectedClient({});
      setSelectedPageId(null);
    });

    fetchClientContacts();

    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketId]);

  /** Этап 1: Выбор платформы (lastMessage → иначе первая доступная) */
  useEffect(() => {
    if (!ticketData || !platformOptions.length) return;
    if (selectedPlatform) return;

    let nextPlatform = null;

    if (lastMessage && lastMessage.ticket_id === ticketId) {
      const msgPlatform = lastMessage.platform?.toLowerCase();
      if (msgPlatform && platformOptions.some((p) => p.value === msgPlatform)) {
        nextPlatform = msgPlatform;
      }
    }
    if (!nextPlatform) nextPlatform = platformOptions[0]?.value || null;

    if (nextPlatform && nextPlatform !== selectedPlatform) {
      debug("auto select platform:", nextPlatform);
      setSelectedPlatform(nextPlatform);
    }
  }, [ticketData, platformOptions, lastMessage, ticketId, selectedPlatform]);

  /** Этап 2: Выбор page_id (по платформе и groupTitle) */
  useEffect(() => {
    if (!selectedPlatform) return;
    if (selectedPageId) return;

    let nextPageId = null;

    if (lastMessage && lastMessage.ticket_id === ticketId) {
      const candidate = selectPageIdByMessage(
        selectedPlatform,
        lastMessage.page_id,
        groupTitle
      );
      if (candidate) nextPageId = candidate;
    }

    if (!nextPageId) {
      const all = getPagesByType(selectedPlatform) || [];
      const filtered = groupTitle ? all.filter((p) => {
        if (Array.isArray(p.group_title)) {
          return p.group_title.includes(groupTitle);
        }
        return p.group_title === groupTitle;
      }) : all;
      nextPageId = filtered[0]?.page_id || null;
    }

    if (nextPageId && nextPageId !== selectedPageId) {
      debug("auto select page_id:", nextPageId);
      setSelectedPageId(nextPageId);
    }
  }, [selectedPlatform, selectedPageId, lastMessage, ticketId, groupTitle]);

  /** Этап 3: Выбор контакта (когда известны платформа и contactOptions) */
  useEffect(() => {
    if (!selectedPlatform || !contactOptions.length) return;
    if (selectedClient?.value) return;

    let contactValue = null;
    let messageClientId = null;

    if (lastMessage && lastMessage.ticket_id === ticketId) {
      messageClientId = lastMessage.client_id;

      // входящее — from_reference; исходящее — to_reference
      contactValue =
        lastMessage.sender_id === lastMessage.client_id
          ? lastMessage.from_reference
          : lastMessage.to_reference;

      if (!contactValue && platformBlocks[selectedPlatform]) {
        const block = platformBlocks[selectedPlatform];
        const entry = Object.entries(block).find(([cid]) => {
          const client = clientIndex.get(Number.parseInt(cid, 10));
          return client?.id === messageClientId;
        });
        if (entry) contactValue = entry[1]?.contact_value;
      }
    }

    const found = matchContact(contactOptions, contactValue, messageClientId);
    const next = found || contactOptions[0];

    if (next && next.value !== selectedClient?.value) {
      debug("auto select contact:", next.value);
      setSelectedClient(next);
    }
  }, [
    selectedPlatform,
    contactOptions,
    selectedClient?.value,
    lastMessage,
    ticketId,
    platformBlocks,
    clientIndex,
  ]);

  /** Публичные коллбеки (idempotent) */
  const changePlatform = useCallback((platform) => {
    if (platform === selectedPlatform) return;
    startTransition(() => {
      setSelectedPlatform(platform || null);
      setSelectedClient({});
      setSelectedPageId(null);
    });
  }, [selectedPlatform]);

  const changeContact = useCallback((value) => {
    if (!value) return;
    const contact = contactOptions.find((o) => o.value === value);
    if (contact && contact.value !== selectedClient?.value) {
      setSelectedClient(contact);
    }
  }, [contactOptions, selectedClient?.value]);

  const changePageId = useCallback((pageId) => {
    if (pageId === selectedPageId) return;
    setSelectedPageId(pageId || null);
  }, [selectedPageId]);

  /** Точечное обновление клиента */
  const updateClientData = useCallback((clientId, platform, newData) => {
    setTicketData((prev) => {
      if (!prev?.clients) return prev;
      const next = {
        ...prev,
        clients: prev.clients.map((c) =>
          c.id === clientId
            ? {
              ...c,
              name: newData.name ?? c.name,
              surname: newData.surname ?? c.surname,
              phone: newData.phone ?? c.phone,
              email: newData.email ?? c.email,
            }
            : c
        ),
      };
      return next;
    });

    setSelectedClient((prev) =>
      prev?.payload?.id === clientId
        ? { ...prev, payload: { ...prev.payload, ...newData } }
        : prev
    );
  }, []);

  return {
    platformOptions,            // memo
    selectedPlatform,
    changePlatform,

    contactOptions,             // memo
    changeContact,
    selectedClient,

    selectedPageId,
    changePageId,

    loading,
    updateClientData,
    refetch: fetchClientContacts,
  };
};
