import dayjs from "dayjs";
import { YYYY_MM_DD_DASH, YYYY_MM_DD } from "../../app-constants";

const parseBoolean = (val) => {
    if (val === "true") return true;
    if (val === "false") return false;
    return undefined;
};

const parseDateRange = (from, to, format = YYYY_MM_DD) => {
    const result = {};
    if (from && dayjs(from, format, true).isValid()) result.from = from;
    if (to && dayjs(to, format, true).isValid()) result.to = to;
    return Object.keys(result).length ? result : undefined;
};

// Универсальный парсер для from/to (и дат, и чисел)
const getFromTo = (params, key, format) => {
    const from = params.get(`${key}_from`);
    const to = params.get(`${key}_to`);
    // Если оба пустые — undefined
    if (!from && !to) return undefined;
    // Для дат — используем формат, для чисел не нужен формат
    if (format) return parseDateRange(from, to, format);
    // Для чисел
    const res = {};
    if (from !== null && from !== undefined && from !== "") res.from = Number(from);
    if (to !== null && to !== undefined && to !== "") res.to = Number(to);
    return Object.keys(res).length ? res : undefined;
};

const parseMulti = (params, key) => {
    const arr = params.getAll(key);
    if (!arr.length) return undefined;
    return arr;
};

const parseNumberMulti = (params, key) => {
    const arr = params.getAll(key);
    if (!arr.length) return undefined;
    return arr.map((v) => String(Number(v))).filter(Boolean);
};

export const parseFiltersFromUrl = (params) => ({
    // MessageFilterForm
    message: params.get("message") || undefined,
    mtype: params.get("mtype") || undefined,
    sender_id: parseNumberMulti(params, "sender_id"),
    time_sent: getFromTo(params, "time_sent", YYYY_MM_DD_DASH),
    last_message_author: parseNumberMulti(params, "last_message_author"),
    action_needed: parseBoolean(params.get("action_needed")),
    unseen: params.get("unseen") || undefined,

    // BasicGeneralFormFilter
    workflow: parseMulti(params, "workflow"),
    priority: parseMulti(params, "priority"),
    has_tasks: params.get("has_tasks") || undefined,
    contact: params.get("contact") || undefined,
    tags: parseMulti(params, "tags"),
    technician_id: parseNumberMulti(params, "technician_id"),
    creation_date: getFromTo(params, "creation_date", YYYY_MM_DD_DASH),
    last_interaction_date: getFromTo(params, "last_interaction_date", YYYY_MM_DD_DASH),
    platform_source: params.get("platform_source") || undefined,

    // TicketInfoFormFilter
    buget: getFromTo(params, "buget"), // число
    sursa_lead: parseMulti(params, "sursa_lead"),
    promo: parseMulti(params, "promo"),
    marketing: parseMulti(params, "marketing"),
    tipul_serviciului: parseMulti(params, "tipul_serviciului"),
    tara: parseMulti(params, "tara"),
    tip_de_transport: parseMulti(params, "tip_de_transport"),
    denumirea_excursiei_turului: parseMulti(params, "denumirea_excursiei_turului"),
    procesarea_achizitionarii: parseMulti(params, "procesarea_achizitionarii"),
    data_plecarii: getFromTo(params, "data_plecarii", YYYY_MM_DD_DASH),
    data_venit_in_oficiu: getFromTo(params, "data_venit_in_oficiu", YYYY_MM_DD_DASH),
    data_intoarcerii: getFromTo(params, "data_intoarcerii", YYYY_MM_DD_DASH),
    data_cererii_de_retur: getFromTo(params, "data_cererii_de_retur", YYYY_MM_DD_DASH),

    // ContractFormFilter
    numar_de_contract: params.get("numar_de_contract") || undefined,
    data_contractului: getFromTo(params, "data_contractului", YYYY_MM_DD_DASH),
    data_avansului: getFromTo(params, "data_avansului", YYYY_MM_DD_DASH),
    data_de_plata_integrala: getFromTo(params, "data_de_plata_integrala", YYYY_MM_DD_DASH),
    contract_trimis: parseBoolean(params.get("contract_trimis")),
    contract_semnat: parseBoolean(params.get("contract_semnat")),
    tour_operator: params.get("tour_operator") || undefined,
    numarul_cererii_de_la_operator: params.get("numarul_cererii_de_la_operator") || undefined,
    achitare_efectuata: parseBoolean(params.get("achitare_efectuata")),
    rezervare_confirmata: parseBoolean(params.get("rezervare_confirmata")),
    contract_arhivat: parseBoolean(params.get("contract_arhivat")),
    statutul_platii: params.get("statutul_platii") || undefined,
    avans_euro: getFromTo(params, "avans_euro"), // число
    pret_netto: getFromTo(params, "pret_netto"), // число
    achitat_client: getFromTo(params, "achitat_client"), // число
    control: parseBoolean(params.get("control")),

    // QualityControlFormFilter
    motivul_refuzului: parseMulti(params, "motivul_refuzului"),
    evaluare_de_odihna: parseMulti(params, "evaluare_de_odihna"),
    urmatoarea_vacanta: params.get("urmatoarea_vacanta") || undefined,
    manager: params.get("manager") || undefined,
    vacanta: params.get("vacanta") || undefined,

    // group_title всегда строка!
    group_title: params.get("group_title") || undefined,

    // Поиск
    search: params.get("search") || undefined,

    // ChatList параметры (только серверные фильтры)
    is_filtered: parseBoolean(params.get("is_filtered")),
});

export const prepareFiltersForUrl = (filters) => {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
        if (value === undefined || value === null) return;

        // массив → дублирующиеся ключи
        if (Array.isArray(value)) {
            value.forEach((val) => params.append(key, val));
            return;
        }

        // диапазон → from/to
        if (typeof value === "object" && ("from" in value || "to" in value)) {
            if (value.from) params.set(`${key}_from`, value.from);
            if (value.to) params.set(`${key}_to`, value.to);
            return;
        }

        // булевы значения и строки/числа
        params.set(key, String(value));
    });

    return params;
};
