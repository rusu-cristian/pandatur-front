import { Text, Box, Flex } from "@mantine/core";
import { parseServerDate, getFullName } from "../../../utils";
import { getLanguageByKey } from "../../../utils";

// Helper function to get human-readable field labels
const getFieldLabel = (subject) => {
    const fieldLabels = {
        // Ticket fields
        priority: getLanguageByKey("Prioritate"),
        workflow: getLanguageByKey("Workflow"),
        contact: getLanguageByKey("Contact"),
        description: getLanguageByKey("Description"),
        tags: getLanguageByKey("tags"),
        technician_id: getLanguageByKey("responsible"),
        group_title: getLanguageByKey("Grup"),
        action_needed: getLanguageByKey("Acțiune necesară"),

        // Ticket info fields
        buget: getLanguageByKey("Buget"),
        status_sunet_telefonic: getLanguageByKey("Call Status"),
        sursa_lead: getLanguageByKey("Sursă lead"),
        promo: getLanguageByKey("Promo"),
        marketing: getLanguageByKey("Marketing"),
        tipul_serviciului: getLanguageByKey("Serviciu"),
        tara: getLanguageByKey("Tara"),
        tip_de_transport: getLanguageByKey("Transport"),
        denumirea_excursiei_turului: getLanguageByKey("Excursie"),
        procesarea_achizitionarii: getLanguageByKey("Achiziție"),
        numar_de_contract: getLanguageByKey("Nr de contract"),
        contract_trimis: getLanguageByKey("Contract trimis"),
        contract_semnat: getLanguageByKey("Contract semnat"),
        tour_operator: getLanguageByKey("Operator turistic"),
        numarul_cererii_de_la_operator: getLanguageByKey("Nr cererii de la operator"),
        achitare_efectuata: getLanguageByKey("Achitare efectuată"),
        rezervare_confirmata: getLanguageByKey("Rezervare confirmată"),
        contract_arhivat: getLanguageByKey("Contract arhivat"),
        statutul_platii: getLanguageByKey("Plată primită"),
        avans_euro: getLanguageByKey("Avans în euro"),
        pret_netto: getLanguageByKey("Preț NETTO"),
        achitat_client: getLanguageByKey("Achitat client"),
        restant_client: getLanguageByKey("Client Remaining") || "Remaining",
        comision_companie: getLanguageByKey("Comision companie"),
        statut_achitare: getLanguageByKey("Statut achitare"),
        control: getLanguageByKey("Control Admin"),
        f_serviciu: getLanguageByKey("Service") || "Service",
        f_nr_factura: getLanguageByKey("Invoice Number") || "Invoice Number",
        f_numarul: getLanguageByKey("Number") || "Number",
        f_pret: getLanguageByKey("Price") || "Price",
        f_suma: getLanguageByKey("Amount") || "Amount",
        f_valuta_contului: getLanguageByKey("Account Currency") || "Currency",
        iban: getLanguageByKey("IBAN") || "IBAN",
        motivul_refuzului: getLanguageByKey("Motivul refuzului"),
        evaluare_de_odihna: getLanguageByKey("Evaluare odihnă"),
        urmatoarea_vacanta: getLanguageByKey("Următoarea vacanță"),
        manager: getLanguageByKey("Manager"),
        vacanta: getLanguageByKey("Vacanța"),
        data_venit_in_oficiu: getLanguageByKey("Office Visit Date") || "Office Visit",
        data_plecarii: getLanguageByKey("Departure Date") || "Departure",
        data_intoarcerii: getLanguageByKey("Return Date") || "Return",
        data_cererii_de_retur: getLanguageByKey("Return Request Date") || "Return Request",
        data_contractului: getLanguageByKey("Data contractului"),
        data_avansului: getLanguageByKey("Data avansului"),
        data_de_plata_integrala: getLanguageByKey("Data de plată integrală"),

        // Client fields
        name: getLanguageByKey("Nume") || "Name",
        surname: getLanguageByKey("Prenume") || "Surname",
        email: getLanguageByKey("Email") || "Email",
        phone: getLanguageByKey("Telefon") || "Phone",
        created_at: getLanguageByKey("Data creării") || "Created at",
        updated_at: getLanguageByKey("Data actualizării") || "Updated at",
        import_success: getLanguageByKey("Import reușit") || "Import success",
        imported: getLanguageByKey("Importat") || "Imported",

        // Client contact fields
        contact_type: getLanguageByKey("Tip contact") || "Contact type",
        contact_value: getLanguageByKey("Valoare contact") || "Contact value",
    };

    return fieldLabels[subject] || subject;
};

// Helper function to format values for display
const formatValue = (value, subject) => {
    // Handle empty/null values
    if (value === null || value === undefined || value === "") {
        return getLanguageByKey("Empty") || "-";
    }

    // Handle boolean values
    if (value === "true" || value === "false") {
        return value === "true"
            ? (getLanguageByKey("Da"))
            : (getLanguageByKey("Nu"));
    }

    // Handle date fields - format if it looks like a date
    const dateFields = [
        'data_venit_in_oficiu', 'data_plecarii', 'data_intoarcerii',
        'data_cererii_de_retur', 'data_contractului', 'data_avansului',
        'data_de_plata_integrala'
    ];
    if (dateFields.includes(subject) && value && value.match(/^\d{4}-\d{2}-\d{2}/)) {
        try {
            return parseServerDate(value).format("DD.MM.YYYY");
        } catch (e) {
            return value;
        }
    }

    // Handle currency/numeric fields - add formatting if needed
    const currencyFields = [
        'buget', 'avans_euro', 'pret_netto', 'achitat_client',
        'restant_client', 'comision_companie', 'f_pret', 'f_suma'
    ];
    if (currencyFields.includes(subject) && !isNaN(value)) {
        return `${Number(value).toLocaleString()} ${subject.includes('euro') || subject.startsWith('f_') ? '€' : ''}`;
    }

    // Handle tags - show as comma-separated
    if (subject === 'tags') {
        return value.replace(/,/g, ', ');
    }

    return value;
};

export const MessagesLogItem = ({ log, technicians }) => {
    const date = parseServerDate(log.timestamp).format("DD.MM.YYYY HH:mm");

    const tech = technicians?.find((t) => String(t.value) === String(log.by)) || {};

    const author =
        String(log.by) === "1"
            ? "System"
            : (
                tech.label ||
                getFullName(tech.name, tech.surname) ||
                tech.name ||
                `#${log.by}`
            );

    // Определяем что изменилось
    let changed = "";
    // Добавляем префикс для client и client_contact логов
    const logTypePrefix = log.type === "client" 
        ? `[${getLanguageByKey("Client") || "Client"}] ` 
        : log.type === "client_contact" 
            ? `[${getLanguageByKey("Contact") || "Contact"}] ` 
            : "";
    
    if (log.action === "created" && log.subject === "ticket") {
        changed = getLanguageByKey("Ticket creat");
    } else if (log.action === "created" && log.type === "client") {
        // Специальная обработка для создания клиента
        const fieldLabel = getFieldLabel(log.subject);
        const toValue = formatValue(log.to, log.subject);
        changed = `${logTypePrefix}${fieldLabel}: ${toValue}`;
    } else if (log.action === "created" && log.type === "client_contact") {
        // Специальная обработка для создания контакта клиента
        const fieldLabel = getFieldLabel(log.subject);
        const toValue = formatValue(log.to, log.subject);
        changed = `${logTypePrefix}${fieldLabel}: ${toValue}`;
    } else if (log.action === "updated" && log.type === "client") {
        // Специальная обработка для обновления клиента
        const fieldLabel = getFieldLabel(log.subject);
        const fromValue = formatValue(log.from, log.subject);
        const toValue = formatValue(log.to, log.subject);
        changed = `${logTypePrefix}${fieldLabel}: ${fromValue} → ${toValue}`;
    } else if (log.action === "updated" && log.type === "client_contact") {
        // Специальная обработка для обновления контакта клиента
        const fieldLabel = getFieldLabel(log.subject);
        const fromValue = formatValue(log.from, log.subject);
        const toValue = formatValue(log.to, log.subject);
        changed = `${logTypePrefix}${fieldLabel}: ${fromValue} → ${toValue}`;
    } else if (log.action === "created" && log.type === "task") {
        // Специальная обработка для создания задачи
        const forTech = technicians?.find((t) => String(t.value) === String(log.for)) || {};
        const forName = log.for === "1" ? "System" : (forTech.label || getFullName(forTech.name, forTech.surname) || `#${log.for}`);
        changed = `Task created for ${forName}`;
    } else if (log.action === "updated" && log.subject === "technician_id") {
        // Специальная обработка для смены ответственного за лид
        const fromTech = technicians?.find((t) => String(t.value) === String(log.from)) || {};
        const toTech = technicians?.find((t) => String(t.value) === String(log.to)) || {};

        const fromName = log.from === "1" ? "System" : (fromTech.label || getFullName(fromTech.name, fromTech.surname) || `#${log.from}`);
        const toName = log.to === "1" ? "System" : (toTech.label || getFullName(toTech.name, toTech.surname) || `#${log.to}`);

        changed = `${getFieldLabel("technician_id")}: ${fromName} → ${toName}`;
    } else if (log.action === "updated" && log.subject === "workflow") {
        // Специальная обработка для изменения этапа workflow
        changed = `${getFieldLabel("workflow")}: ${log.from} → ${log.to}`;
    } else if (log.action === "updated" && log.subject === "status" && log.type === "task" && log.from === "false" && log.to === "true") {
        // Специальная обработка для завершения задачи
        changed = getLanguageByKey("Task completed");
    } else if (log.action === "updated" && log.subject === "created_for" && log.type === "task") {
        // Специальная обработка для переназначения задачи
        const fromTech = technicians?.find((t) => String(t.value) === String(log.from)) || {};
        const toTech = technicians?.find((t) => String(t.value) === String(log.to)) || {};

        const fromName = log.from === "1" ? "System" : (fromTech.label || getFullName(fromTech.name, fromTech.surname) || `#${log.from}`);
        const toName = log.to === "1" ? "System" : (toTech.label || getFullName(toTech.name, toTech.surname) || `#${log.to}`);

        changed = `${getLanguageByKey("Task reassigned")}: ${fromName} → ${toName}`;
    } else if (log.action === "updated" && log.subject === "created_by" && log.type === "task") {
        // Специальная обработка для изменения автора задачи
        const fromTech = technicians?.find((t) => String(t.value) === String(log.from)) || {};
        const toTech = technicians?.find((t) => String(t.value) === String(log.to)) || {};

        const fromName = log.from === "1" ? "System" : (fromTech.label || getFullName(fromTech.name, fromTech.surname) || `#${log.from}`);
        const toName = log.to === "1" ? "System" : (toTech.label || getFullName(toTech.name, toTech.surname) || `#${log.to}`);

        changed = `${getLanguageByKey("Task author changed")}: ${fromName} → ${toName}`;
    } else if (log.action === "updated" && log.subject === "priority") {
        // Handle priority updates with formatted label
        changed = `${getFieldLabel("priority")}: ${log.from} → ${log.to}`;
    } else if (log.action === "updated" && log.subject === "contact") {
        // Handle contact updates
        changed = `${getFieldLabel("contact")}: ${log.from} → ${log.to}`;
    } else if (log.action === "updated" && log.subject === "description") {
        // Handle description updates - truncate if too long
        const fromText = log.from?.length > 50 ? log.from.substring(0, 50) + "..." : log.from;
        const toText = log.to?.length > 50 ? log.to.substring(0, 50) + "..." : log.to;
        changed = `${getFieldLabel("description")}: ${fromText} → ${toText}`;
    } else if (log.action === "updated" && log.subject === "tags") {
        // Handle tags updates with formatted display
        changed = `${getFieldLabel("tags")}: ${formatValue(log.from, "tags")} → ${formatValue(log.to, "tags")}`;
    } else if (log.action === "updated" && log.subject === "group_title") {
        // Handle group title updates
        changed = `${getFieldLabel("group_title")}: ${log.from} → ${log.to}`;
    } else if (log.action === "updated" && log.subject === "action_needed") {
        // Handle action_needed boolean updates
        changed = `${getFieldLabel("action_needed")}: ${formatValue(log.from, "action_needed")} → ${formatValue(log.to, "action_needed")}`;
    } else if (log.action === "updated" && log.type === "ticket_info") {
        // Handle all ticket_info fields with formatted labels and values
        const fieldLabel = getFieldLabel(log.subject);
        const fromValue = formatValue(log.from, log.subject);
        const toValue = formatValue(log.to, log.subject);
        changed = `${fieldLabel}: ${fromValue} → ${toValue}`;
    } else if (log.subject && log.from && log.to) {
        // Fallback for any other updates - use helpers if available
        const fieldLabel = getFieldLabel(log.subject);
        const fromValue = formatValue(log.from, log.subject);
        const toValue = formatValue(log.to, log.subject);
        changed = `${fieldLabel}: ${fromValue} → ${toValue}`;
    } else if (log.subject) {
        changed = getFieldLabel(log.subject);
    } else {
        changed = log.action || "modified";
    }

    return (
        <Box
            mb="6px"
            style={{
                backgroundColor: "transparent",
                borderRadius: "8px",
                position: "relative",
                overflow: "hidden"
            }}
        >
            <Flex
                align="center"
                gap="md"
                wrap="nowrap"
                // p="xs" 
                style={{
                    backgroundColor: "transparent",
                    borderRadius: "8px"
                }}
            >
                {/* Дата */}
                <Flex align="center" gap="xs" style={{ minWidth: "120px" }}>
                    <Text size="sm" fw={600} c="dimmed">
                        {date}
                    </Text>
                </Flex>

                {/* Стрелка */}
                <Text size="sm" c="dimmed" fw={500}>
                    →
                </Text>

                {/* Кто сделал */}
                <Box style={{ minWidth: "120px" }}>
                    <Text size="sm" fw={700} c="dark" style={{ lineHeight: 1.2 }}>
                        {author}  {log.action?.toUpperCase() || "ACTION"}
                    </Text>
                </Box>

                {/* Стрелка */}
                <Text size="sm" c="dimmed" fw={500}>
                    →
                </Text>

                {/* Что сделал */}
                <Box style={{ flex: 1, minWidth: "200px", overflow: "hidden" }}>
                    <Text size="sm" fw={500} c="dark" style={{ lineHeight: 1.3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {changed} {" "} {log.task_id && `Task #${log.task_id}`}
                    </Text>
                </Box>
            </Flex>
        </Box>
    );
};
