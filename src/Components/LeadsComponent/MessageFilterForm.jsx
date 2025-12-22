import {
    useRef,
    useEffect,
    useState,
    useMemo,
    forwardRef,
    useImperativeHandle,
} from "react";
import {
    Flex,
    TextInput,
    Select,
    MultiSelect,
} from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import dayjs from "dayjs";
import { useGetTechniciansList } from "../../hooks";
import { getLanguageByKey } from "../utils";
import { MESSAGES_TYPE_OPTIONS, YYYY_MM_DD_DASH } from "../../app-constants";
import {
    formatMultiSelectData,
} from "../utils/multiSelectUtils";
import { UserGroupMultiSelect } from "../ChatComponent/components/UserGroupMultiSelect/UserGroupMultiSelect";

export const MessageFilterForm = forwardRef(({ initialData, loading }, ref) => {
    const [message, setMessage] = useState("");
    const [mtype, setMtype] = useState(null);
    const [senderIds, setSenderIds] = useState([]);
    const [timeSent, setTimeSent] = useState([null, null]);
    const [lastMessageAuthor, setLastMessageAuthor] = useState([]);
    const [action_needed, setActionNeeded] = useState(null);
    const [unseen, setUnseen] = useState(null);

    const { technicians = [] } = useGetTechniciansList();
    const formattedTechnicians = useMemo(() => formatMultiSelectData(technicians), [technicians]);

    const extendedTechnicians = useMemo(
        () => {
            // Создаем мапу существующих значений для проверки дублирования
            const existingValues = new Set(formattedTechnicians.map(t => t.value));
            
            const systemOptions = [
                { value: "0", label: getLanguageByKey("Client"), status: true },
                { value: "1", label: getLanguageByKey("System"), status: true },
            ];
            
            // Фильтруем системные опции, чтобы избежать дублирования
            const uniqueSystemOptions = systemOptions.filter(opt => !existingValues.has(opt.value));
            
            return [...uniqueSystemOptions, ...formattedTechnicians];
        },
        [formattedTechnicians]
    );


    useEffect(() => {
        if (!initialData) return;

        setMessage(initialData.message || "");
        setMtype(initialData.mtype || null);
        setSenderIds(
            Array.isArray(initialData.sender_id)
                ? initialData.sender_id.map(String)
                : typeof initialData.sender_id === "string"
                    ? initialData.sender_id.split(",")
                    : []
        );

        if (initialData.time_sent?.from || initialData.time_sent?.to) {
            setTimeSent([
                initialData.time_sent?.from
                    ? dayjs(initialData.time_sent.from, YYYY_MM_DD_DASH).toDate()
                    : null,
                initialData.time_sent?.to
                    ? dayjs(initialData.time_sent.to, YYYY_MM_DD_DASH).toDate()
                    : null,
            ]);
        } else {
            setTimeSent([null, null]);
        }

        setLastMessageAuthor(
            Array.isArray(initialData.last_message_author)
                ? initialData.last_message_author.map(String)
                : []
        );

        setActionNeeded(
            initialData.action_needed != null ? String(initialData.action_needed) : null
        );
        setUnseen(
            initialData.unseen != null ? String(initialData.unseen) : null
        );
    }, [initialData]);

    useImperativeHandle(ref, () => ({
        getValues: () => {
            const filters = {};

            if (message?.trim()) filters.message = message.trim();
            if (mtype) filters.mtype = mtype;
            if (senderIds?.length) filters.sender_id = senderIds.map(Number);
            if (timeSent?.[0] || timeSent?.[1]) {
                filters.time_sent = {
                    ...(timeSent[0] && { from: dayjs(timeSent[0]).format(YYYY_MM_DD_DASH) }),
                    ...(timeSent[1] && { to: dayjs(timeSent[1]).format(YYYY_MM_DD_DASH) }),
                };
            }
            if (lastMessageAuthor?.length) filters.last_message_author = lastMessageAuthor.map(Number);
            if (action_needed !== null) filters.action_needed = action_needed !== null;
            if (unseen !== null) filters.unseen = unseen;

            return filters;
        },
    }));

    return (
        <form>
            <Flex direction="column" gap="md">
                <TextInput
                    label={getLanguageByKey("searchByMessages")}
                    placeholder={getLanguageByKey("searchByMessages")}
                    value={message}
                    onChange={(e) => setMessage(e.currentTarget.value)}
                />

                <Select
                    label={getLanguageByKey("typeMessages")}
                    placeholder={getLanguageByKey("typeMessages")}
                    data={MESSAGES_TYPE_OPTIONS}
                    value={mtype}
                    onChange={setMtype}
                    clearable
                />

                <DatePickerInput
                    type="range"
                    label={getLanguageByKey("searchByInterval")}
                    placeholder={getLanguageByKey("searchByInterval")}
                    value={timeSent}
                    onChange={setTimeSent}
                    valueFormat="DD-MM-YYYY"
                    clearable
                />

                {/* <UserGroupMultiSelect
                    label={getLanguageByKey("Selectează autor mesaj")}
                    placeholder={getLanguageByKey("Selectează autor mesaj")}
                    value={senderIds}
                    onChange={setSenderIds}
                    techniciansData={formattedTechnicians}
                    mode="multi"
                /> */}

                <UserGroupMultiSelect
                    label={getLanguageByKey("Autor ultim mesaj")}
                    placeholder={getLanguageByKey("Selectează autor ultim mesaj")}
                    value={lastMessageAuthor}
                    onChange={setLastMessageAuthor}
                    techniciansData={extendedTechnicians}
                    mode="multi"
                />

                <Select
                    label={getLanguageByKey("Acțiune necesară")}
                    placeholder={getLanguageByKey("Alege")}
                    data={[
                        { value: "true", label: getLanguageByKey("Da") },
                        { value: "false", label: getLanguageByKey("Nu") },
                    ]}
                    value={action_needed}
                    onChange={setActionNeeded}
                    clearable
                />

                <Select
                    label={getLanguageByKey("Mesaje necitite")}
                    placeholder={getLanguageByKey("Alege")}
                    data={[
                        { value: "true", label: getLanguageByKey("Da") },
                        { value: "false", label: getLanguageByKey("Nu") },
                    ]}
                    value={unseen}
                    onChange={setUnseen}
                    clearable
                />
            </Flex>
        </form>
    );
});
