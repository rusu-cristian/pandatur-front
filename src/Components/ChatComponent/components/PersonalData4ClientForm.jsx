import {
  TextInput,
  Title,
  Box,
  ActionIcon,
  Flex,
  Button,
  Group,
  Stack,
  Text,
  Divider,
  Avatar,
  Loader,
  Select,
  Collapse,
} from "@mantine/core";
import { useEffect, useState, useCallback } from "react";
import { useForm } from "@mantine/form";
import { getLanguageByKey } from "../../utils";
import { LuPlus, LuUser, LuMail, LuPhone } from "react-icons/lu";
import { MdEdit, MdClose, MdCheck, MdDelete } from "react-icons/md";
import { FaFacebook, FaInstagram, FaWhatsapp, FaViber, FaTelegram } from "react-icons/fa";
import { api } from "../../../api";
import { useSnackbar } from "notistack";
import { useConfirmPopup } from "../../../hooks/useConfirmPopup";
import "./PersonalData4ClientForm.css";
import Can from "@components/CanComponent/Can";
import { useTicketSync } from "../../../contexts/TicketSyncContext";

const CONTACT_TYPE_COLORS = {
  facebook: "#1877F2",
  instagram: "#E4405F",
  whatsapp: "#25D366",
  viber: "#7360F2",
  "viber-bot": "#7360F2",
  telegram: "#0088CC",
};

const ViberBotIcon = () => (
  <img src="/viber-bot.svg" alt="Viber Bot" loading="lazy" style={{ width: "24px", height: "24px", background: "#7360F2", borderRadius: "12px" }} />
);

const PLATFORM_ICONS = {
  facebook: FaFacebook,
  instagram: FaInstagram,
  whatsapp: FaWhatsapp,
  viber: FaViber,
  "viber-bot": ViberBotIcon,
  telegram: FaTelegram,
};

export const PersonalData4ClientForm = ({ 
  ticketId, 
  responsibleId,
  clientsData, // Данные из useClientContacts (если переданы, не делаем запрос)
}) => {
  const { enqueueSnackbar } = useSnackbar();
  const { notifyTicketUpdated } = useTicketSync();
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [expandedClientId, setExpandedClientId] = useState(null);
  const [isSavingContact, setIsSavingContact] = useState(false);
  const [editingContact, setEditingContact] = useState(null); // { clientId, contactId, type }
  const [isDeletingContact, setIsDeletingContact] = useState(false);
  const [editingClient, setEditingClient] = useState(null); // { clientId }
  const [isSavingClient, setIsSavingClient] = useState(false);
  const [expandedContactId, setExpandedContactId] = useState(null); // Для Collapse с информацией о контакте

  const confirmDelete = useConfirmPopup({
    subTitle: getLanguageByKey("Sunteți sigur că doriți să ștergeți acest contact?"),
    loading: isDeletingContact,
  });

  const form = useForm({
    initialValues: {
      name: "",
      surname: "",
    },
    validate: {
      name: (value) => (!value ? getLanguageByKey("Introduceți numele") : null),
      surname: (value) => (!value ? getLanguageByKey("Introduceți prenumele") : null),
    },
  });

  const contactForm = useForm({
    initialValues: {
      contact_type: "",
      contact_value: "",
      is_primary: false,
    },
    validate: {
      contact_type: (value) => (!value ? getLanguageByKey("Selectați tipul de contact") : null),
      contact_value: (value, values) => {
        if (!value) return getLanguageByKey("Introduceți valoarea contactului");

        if (values.contact_type === "email") {
          return /^\S+@\S+$/.test(value) ? null : getLanguageByKey("Email invalid");
        }

        if (values.contact_type === "phone") {
          return /^\d+$/.test(value) ? null : getLanguageByKey("Introduceți doar cifre");
        }

        if (values.contact_type === "telegram") {
          return /^[a-zA-Z0-9_]{1,32}$/.test(value) ? null : getLanguageByKey("Username Telegram invalid (fără @)");
        }

        return null;
      },
    },
  });

  const editContactForm = useForm({
    initialValues: {
      contact_value: "",
    },
    validate: {
      contact_value: (value) => {
        if (!value) return getLanguageByKey("Introduceți valoarea contactului");

        if (editingContact?.type === "email") {
          return /^\S+@\S+$/.test(value) ? null : getLanguageByKey("Email invalid");
        }

        if (editingContact?.type === "phone") {
          return /^\d+$/.test(value) ? null : getLanguageByKey("Introduceți doar cifre");
        }

        if (editingContact?.type === "telegram") {
          return /^[a-zA-Z0-9_]{1,32}$/.test(value) ? null : getLanguageByKey("Username Telegram invalid (fără @)");
        }

        return null;
      },
    },
  });

  const editClientForm = useForm({
    initialValues: {
      name: "",
      surname: "",
    },
    validate: {
      name: (value) => (!value ? getLanguageByKey("Introduceți numele") : null),
      surname: (value) => (!value ? getLanguageByKey("Introduceți prenumele") : null),
    },
  });

  // Загрузка данных клиентов
  const loadClientsData = useCallback(async () => {
    if (!ticketId) return;

    try {
      setLoading(true);
      // Передаем undefined или null для platform, чтобы получить всех клиентов
      const response = await api.users.getUsersClientContactsByPlatform(ticketId, undefined);

      if (response?.clients) {
        setClients(response.clients);
      }
    } catch (error) {
      console.error("Ошибка загрузки данных клиентов:", error);
      enqueueSnackbar(getLanguageByKey("Eroare la încărcarea datelor clienților"), {
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [ticketId, enqueueSnackbar]);

  // Если данные переданы через props (из useClientContacts) - используем их
  useEffect(() => {
    if (clientsData?.clients) {
      // Используем данные из props - не делаем запрос
      setClients(clientsData.clients);
      setLoading(false);
      return;
    }
    
    // Иначе загружаем самостоятельно
    loadClientsData();
  }, [loadClientsData, clientsData]);

  // ❌ УДАЛЕНО: Слушатель ticketUpdated вызывал дублирующие запросы
  // Компонент и так перерендеривается при изменении ticketId через props
  // useEffect(() => {
  //   const handleTicketUpdate = (event) => {
  //     if (event.detail?.ticketId === ticketId) {
  //       loadClientsData();
  //     }
  //   };
  //
  //   window.addEventListener('ticketUpdated', handleTicketUpdate);
  //
  //   return () => {
  //     window.removeEventListener('ticketUpdated', handleTicketUpdate);
  //   };
  // }, [ticketId, loadClientsData]);

  // Обработчик добавления нового клиента
  const handleAddClient = () => {
    form.reset();
    setShowAddForm(true);
  };

  // Сохранение нового клиента
  const handleSaveClient = async () => {
    // Валидация формы
    if (form.validate().hasErrors) {
      return;
    }

    const values = form.values;

    try {
      setIsSaving(true);

      await api.tickets.ticket.addClientToTicket({
        ticket_id: ticketId,
        name: values.name,
        surname: values.surname,
      });

      enqueueSnackbar(getLanguageByKey("Clientul a fost adăugat cu succes"), {
        variant: "success",
      });

      setShowAddForm(false);
      form.reset();

      // Перезагружаем данные клиентов
      await loadClientsData();

      // Оповещаем об обновлении тикета через TicketSyncContext
      notifyTicketUpdated(ticketId, null);
    } catch (error) {
      console.error("Ошибка добавления клиента:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setShowAddForm(false);
    form.reset();
  };


  const handleContactPhoneChange = (e) => {
    const onlyDigits = e.currentTarget.value.replace(/\D/g, "");
    contactForm.setFieldValue("contact_value", onlyDigits);
  };

  const handleContactTelegramChange = (e) => {
    const withoutAt = e.currentTarget.value.replace(/@/g, "");
    contactForm.setFieldValue("contact_value", withoutAt);
  };

  // Обработчик добавления контакта к клиенту
  const handleAddContact = async (clientId) => {
    if (contactForm.validate().hasErrors) {
      return;
    }

    try {
      setIsSavingContact(true);

      await api.users.addClientContact(clientId, {
        contact_type: contactForm.values.contact_type,
        contact_value: contactForm.values.contact_value,
        is_primary: contactForm.values.is_primary,
      });

      enqueueSnackbar(getLanguageByKey("Contactul a fost adăugat cu succes"), {
        variant: "success",
      });

      contactForm.reset();
      setExpandedClientId(null);

      // Перезагружаем данные клиентов
      await loadClientsData();

      // Оповещаем об обновлении тикета через TicketSyncContext
      notifyTicketUpdated(ticketId, null);
    } catch (error) {
      console.error("Ошибка добавления контакта:", error);
    } finally {
      setIsSavingContact(false);
    }
  };

  const toggleClientExpand = (clientId) => {
    if (expandedClientId === clientId) {
      setExpandedClientId(null);
      contactForm.reset();
    } else {
      setExpandedClientId(clientId);
      contactForm.reset();
    }
  };

  // Начать редактирование контакта
  const startEditContact = (clientId, contactId, contactType, currentValue) => {
    setEditingContact({ clientId, contactId, type: contactType });
    editContactForm.setValues({ contact_value: currentValue });
  };

  // Отменить редактирование
  const cancelEditContact = () => {
    setEditingContact(null);
    editContactForm.reset();
  };

  // Сохранить изменения контакта
  const handleUpdateContact = async () => {
    if (!editingContact) return;

    const validation = editContactForm.validate();
    if (validation.hasErrors) return;

    try {
      setIsSavingContact(true);

      await api.users.updateClientContact(
        editingContact.clientId,
        editingContact.contactId,
        {
          contact_value: editContactForm.values.contact_value,
        }
      );

      enqueueSnackbar(getLanguageByKey("Contactul a fost actualizat cu succes"), {
        variant: "success",
      });

      cancelEditContact();

      // Перезагружаем данные клиентов
      await loadClientsData();

      // Оповещаем об обновлении тикета через TicketSyncContext
      notifyTicketUpdated(ticketId, null);
    } catch (error) {
      console.error("Ошибка обновления контакта:", error);
      enqueueSnackbar(getLanguageByKey("Eroare la actualizarea contactului"), {
        variant: "error",
      });
    } finally {
      setIsSavingContact(false);
    }
  };

  // Обработка ввода телефона (только цифры) для редактирования
  const handleEditPhoneChange = (event) => {
    const value = event.target.value.replace(/\D/g, '');
    editContactForm.setFieldValue('contact_value', value);
  };

  // Удаление контакта
  const handleDeleteContact = async (clientId, contactId) => {
    const deleteContact = async () => {
      try {
        setIsDeletingContact(true);

        await api.users.deleteClientContact(clientId, contactId);

        enqueueSnackbar(getLanguageByKey("Contactul a fost șters cu succes"), {
          variant: "success",
        });

        // Перезагружаем данные клиентов
        await loadClientsData();

        // Диспатчим событие для обновления данных тикета
        window.dispatchEvent(new CustomEvent('ticketUpdated', {
          detail: { ticketId }
        }));
      } catch (error) {
        console.error("Ошибка удаления контакта:", error);
        enqueueSnackbar(getLanguageByKey("Eroare la ștergerea contactului"), {
          variant: "error",
        });
      } finally {
        setIsDeletingContact(false);
      }
    };

    confirmDelete(deleteContact);
  };

  // Получение всех контактов платформ (не только уникальных типов)
  const getClientPlatformContacts = (contacts) => {
    return contacts.filter((contact) => PLATFORM_ICONS[contact.contact_type]);
  };

  // Получение всех email контактов
  const getEmailContacts = (contacts) => {
    return contacts.filter((c) => c.contact_type === "email");
  };

  // Получение всех телефонных контактов
  const getPhoneContacts = (contacts) => {
    return contacts.filter((c) => c.contact_type === "phone");
  };

  // Начать редактирование клиента
  const startEditClient = (clientId, currentName, currentSurname) => {
    setEditingClient({ clientId });
    editClientForm.setValues({
      name: currentName || "",
      surname: currentSurname || ""
    });
  };

  // Отменить редактирование клиента
  const cancelEditClient = () => {
    setEditingClient(null);
    editClientForm.reset();
  };

  // Сохранить изменения клиента
  const handleUpdateClient = async () => {
    if (!editingClient) return;

    const validation = editClientForm.validate();
    if (validation.hasErrors) return;

    try {
      setIsSavingClient(true);

      await api.users.updateClient(editingClient.clientId, {
        name: editClientForm.values.name,
        surname: editClientForm.values.surname,
      });

      enqueueSnackbar(getLanguageByKey("Clientul a fost actualizat cu succes"), {
        variant: "success",
      });

      cancelEditClient();

      // Перезагружаем данные клиентов
      await loadClientsData();

      // Оповещаем об обновлении тикета через TicketSyncContext
      notifyTicketUpdated(ticketId, null);
    } catch (error) {
      console.error("Ошибка обновления клиента:", error);
      enqueueSnackbar(getLanguageByKey("Eroare la actualizarea clientului"), {
        variant: "error",
      });
    } finally {
      setIsSavingClient(false);
    }
  };

  if (loading) {
    return (
      <Box className="personal-data-container">
        <Flex justify="center" align="center" className="loading-container">
          <Loader size="sm" />
        </Flex>
      </Box>
    );
  }

  return (
    <Box className="personal-data-container">
      <Flex justify="space-between" align="center" mb="md">
        <Title order={3}>{getLanguageByKey("Date personale")}</Title>
        <ActionIcon onClick={handleAddClient} variant="filled">
          <LuPlus size={24} />
        </ActionIcon>
      </Flex>

      {/* Форма добавления нового клиента */}
      {showAddForm && (
        <Box className="add-client-form">
          <Flex justify="space-between" align="center" mb="md">
            <Title order={5} className="add-client-form-title">
              {getLanguageByKey("Adaugă client nou")}
            </Title>
          </Flex>

          <TextInput
            label={getLanguageByKey("Nume")}
            placeholder={getLanguageByKey("Introduceti numele")}
            leftSection={<LuUser size={24} />}
            {...form.getInputProps("name")}
            mb="sm"
          />

          <TextInput
            label={getLanguageByKey("Prenume")}
            placeholder={getLanguageByKey("Introduceti prenumele")}
            leftSection={<LuUser size={24} />}
            {...form.getInputProps("surname")}
            mb="sm"
          />

          <Group grow>
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isSaving}
            >
              {getLanguageByKey("Anulează")}
            </Button>
            <Button
              onClick={handleSaveClient}
              loading={isSaving}
            >
              {getLanguageByKey("Adaugǎ clientul")}
            </Button>
          </Group>
        </Box>
      )}

      {/* Список клиентов */}
      {clients.length === 0 ? (
        <Text className="empty-state">
          {getLanguageByKey("Nu există clienți asociați cu acest ticket")}
        </Text>
      ) : (
        <Stack gap="md">
          {clients.map((client) => {
            const fullName = [client.name, client.surname].filter(Boolean).join(" ") || "—";
            const platformContacts = getClientPlatformContacts(client.contacts);
            const emailContacts = getEmailContacts(client.contacts);
            const phoneContacts = getPhoneContacts(client.contacts);

            const isExpanded = expandedClientId === client.id;

            return (
              <Box key={client.id} className="client-card">
                {/* Шапка карточки с аватаром и именем */}
                <Flex align="center" gap="md" mb="md">
                  <Avatar
                    src={client.photo}
                    radius="xl"
                    size="lg"
                  >
                    <LuUser size={24} />
                  </Avatar>
                  <Box style={{ flex: 1 }}>
                    {editingClient?.clientId === client.id ? (
                      <Box>
                        <TextInput
                          placeholder={getLanguageByKey("Introduceti numele")}
                          leftSection={<LuUser size={24} />}
                          {...editClientForm.getInputProps("name")}
                          mb="xs"
                          rightSection={
                            <Flex gap="xs" align="center" wrap="nowrap">
                              <ActionIcon
                                size="sm"
                                variant="subtle"
                                color="red"
                                onClick={cancelEditClient}
                                disabled={isSavingClient}
                              >
                                <MdClose size={24} />
                              </ActionIcon>
                              <ActionIcon
                                size="sm"
                                variant="subtle"
                                color="green"
                                onClick={handleUpdateClient}
                                loading={isSavingClient}
                              >
                                <MdCheck size={24} />
                              </ActionIcon>
                            </Flex>
                          }
                        />
                        <TextInput
                          placeholder={getLanguageByKey("Introduceti prenumele")}
                          leftSection={<LuUser size={24} />}
                          {...editClientForm.getInputProps("surname")}
                        />
                      </Box>
                    ) : (
                      <>
                        <Text className="client-card-name" mb="xs">
                          {fullName}
                          <Can permission={{ module: "LEADS", action: "EDIT" }} context={{ responsibleId }}>
                            <ActionIcon
                              size="sm"
                              variant="subtle"
                              ml="xs"
                              onClick={() => {
                                startEditClient(client.id, client.name, client.surname);
                              }}
                            >
                              <MdEdit size={14} />
                            </ActionIcon>
                          </Can>
                        </Text>
                        <Text className="client-card-subtitle">
                          {getLanguageByKey("ID")}: {client.id}
                        </Text>
                      </>
                    )}
                  </Box>
                  <Can permission={{ module: "LEADS", action: "EDIT" }} context={{ responsibleId }}>
                    <ActionIcon
                      onClick={() => toggleClientExpand(client.id)}
                      variant="subtle"
                      size="lg"
                    >
                      <LuPlus size={24} />
                    </ActionIcon>
                  </Can>
                </Flex>

                {/* Email контакты */}
                {emailContacts.length > 0 && (
                  <Box mb="xs">
                    {emailContacts.map((emailContact, index) => (
                      <Box key={`email-${emailContact.id}-${index}`}>
                        {editingContact?.clientId === client.id && editingContact?.contactId === emailContact.id ? (
                          <Box mb="xs">
                            <TextInput
                              leftSection={<LuMail size={24} />}
                              placeholder="example@email.com"
                              type="email"
                              {...editContactForm.getInputProps("contact_value")}
                              rightSection={
                                <Flex gap="xs" align="center" wrap="nowrap">
                                  <ActionIcon
                                    size="sm"
                                    variant="subtle"
                                    color="red"
                                    onClick={cancelEditContact}
                                    disabled={isSavingContact}
                                  >
                                    <MdClose size={24} />
                                  </ActionIcon>
                                  <ActionIcon
                                    size="sm"
                                    variant="subtle"
                                    color="green"
                                    onClick={handleUpdateContact}
                                    loading={isSavingContact}
                                  >
                                    <MdCheck size={24} />
                                  </ActionIcon>
                                </Flex>
                              }
                            />
                          </Box>
                        ) : (
                          <Flex align="center" gap="sm" mb="xs" className="client-card-contact">
                            <LuMail size={24} className="client-card-icon" />
                            <Text className="client-card-contact-text" style={{ flex: 1 }}>
                              {emailContact.contact_value}
                            </Text>
                            <Flex gap="xs">
                              <Can permission={{ module: "LEADS", action: "EDIT" }} context={{ responsibleId }}>
                                <ActionIcon
                                  size="sm"
                                  variant="subtle"
                                  onClick={() => {
                                    startEditContact(client.id, emailContact.id, "email", emailContact.contact_value);
                                  }}
                                >
                                  <MdEdit size={24} />
                                </ActionIcon>
                              </Can>
                              <Can permission={{ module: "LEADS", action: "EDIT" }} context={{ responsibleId }}>
                                <ActionIcon
                                  size="sm"
                                  variant="subtle"
                                  color="red"
                                  onClick={() => {
                                    handleDeleteContact(client.id, emailContact.id);
                                  }}
                                  loading={isDeletingContact}
                                >
                                  <MdDelete size={24} />
                                </ActionIcon>
                              </Can>
                            </Flex>
                          </Flex>
                        )}
                      </Box>
                    ))}
                  </Box>
                )}

                {/* Телефонные контакты */}
                {phoneContacts.length > 0 && (
                  <Box mb="md">
                    {phoneContacts.map((phoneContact, index) => (
                      <Box key={`phone-${phoneContact.id}-${index}`}>
                        {editingContact?.clientId === client.id && editingContact?.contactId === phoneContact.id ? (
                          <Box mb="xs">
                            <TextInput
                              leftSection={<LuPhone size={24} />}
                              placeholder="37300000000"
                              type="text"
                              inputMode="numeric"
                              {...editContactForm.getInputProps("contact_value")}
                              onChange={handleEditPhoneChange}
                              value={editContactForm.values.contact_value}
                              rightSection={
                                <Flex gap="xs" align="center" wrap="nowrap">
                                  <ActionIcon
                                    size="sm"
                                    variant="subtle"
                                    color="red"
                                    onClick={cancelEditContact}
                                    disabled={isSavingContact}
                                  >
                                    <MdClose size={24} />
                                  </ActionIcon>
                                  <ActionIcon
                                    size="sm"
                                    variant="subtle"
                                    color="green"
                                    onClick={handleUpdateContact}
                                    loading={isSavingContact}
                                  >
                                    <MdCheck size={24} />
                                  </ActionIcon>
                                </Flex>
                              }
                            />
                          </Box>
                        ) : (
                          <Flex align="center" gap="sm" mb="xs" className="client-card-contact">
                            <LuPhone size={24} className="client-card-icon" />
                            <Text className="client-card-contact-text" style={{ flex: 1 }}>
                              {phoneContact.contact_value}
                            </Text>
                            <Flex gap="xs">
                              <Can permission={{ module: "LEADS", action: "EDIT" }} context={{ responsibleId }}>
                                <ActionIcon
                                  size="sm"
                                  variant="subtle"
                                  onClick={() => {
                                    startEditContact(client.id, phoneContact.id, "phone", phoneContact.contact_value);
                                  }}
                                >
                                  <MdEdit size={24} />
                                </ActionIcon>
                              </Can>
                              <Can permission={{ module: "LEADS", action: "EDIT" }} context={{ responsibleId }}>
                                <ActionIcon
                                  size="sm"
                                  variant="subtle"
                                  color="red"
                                  onClick={() => {
                                    handleDeleteContact(client.id, phoneContact.id);
                                  }}
                                  loading={isDeletingContact}
                                >
                                  <MdDelete size={24} />
                                </ActionIcon>
                              </Can>
                            </Flex>
                          </Flex>
                        )}
                      </Box>
                    ))}
                  </Box>
                )}

                {/* Платформы */}
                {platformContacts.length > 0 && (
                  <>
                    <Divider className="section-divider" mb="sm" />
                    <Box>
                      <Flex gap="sm" wrap="wrap" align="center">
                        {platformContacts.map((contact, index) => {
                          const Icon = PLATFORM_ICONS[contact.contact_type];
                          const isContactExpanded = expandedContactId === contact.id;

                          return (
                            <Box key={`${contact.contact_type}-${contact.id}-${index}`} className="platform-contact-container">
                              <Box
                                className="platform-icon-container"
                                onClick={() => setExpandedContactId(isContactExpanded ? null : contact.id)}
                                style={{ cursor: 'pointer' }}
                              >
                                <Icon
                                  size={24}
                                  style={{ color: CONTACT_TYPE_COLORS[contact.contact_type] }}
                                />
                              </Box>
                              <Can permission={{ module: "LEADS", action: "EDIT" }} context={{ responsibleId }}>
                                <ActionIcon
                                  size="xs"
                                  variant="subtle"
                                  color="red"
                                  className="platform-delete-btn"
                                  onClick={() => {
                                    handleDeleteContact(client.id, contact.id);
                                  }}
                                  loading={isDeletingContact}
                                >
                                  <MdDelete size={24} />
                                </ActionIcon>
                              </Can>
                            </Box>
                          );
                        })}
                      </Flex>

                      {/* Expanded contact details appear below all icons */}
                      {platformContacts.map((contact, index) => {
                        const isContactExpanded = expandedContactId === contact.id;

                        return (
                          <Collapse key={`collapse-${contact.id}-${index}`} in={isContactExpanded}>
                            <Box mt="xs" p="sm">
                              <Stack gap="xs">
                                <Box>
                                  <Text size="xs" fw={500} c="dimmed">ID:</Text>
                                  <Text size="sm">{contact.id}</Text>
                                </Box>

                                <Box>
                                  <Text size="xs" fw={500} c="dimmed">{getLanguageByKey("Tip contact")}:</Text>
                                  <Text size="sm">{contact.contact_type}</Text>
                                </Box>

                                <Box>
                                  <Text size="xs" fw={500} c="dimmed">{getLanguageByKey("Valoare contact")}:</Text>
                                  <Text size="sm">{contact.contact_value}</Text>
                                </Box>

                                {contact.original_name && (
                                  <Box>
                                    <Text size="xs" fw={500} c="dimmed">Original Name:</Text>
                                    <Text size="sm">{contact.original_name}</Text>
                                  </Box>
                                )}
                              </Stack>
                            </Box>
                          </Collapse>
                        );
                      })}
                    </Box>
                  </>
                )}

                {/* Форма добавления контакта */}
                <Collapse in={isExpanded}>
                  <Divider className="section-divider" my="md" />
                  <Box className="add-contact-form">
                    <Title order={6} mb="xs">
                      {getLanguageByKey("Adaugă contact nou")}
                    </Title>

                    <Select
                      label={getLanguageByKey("Tip contact")}
                      placeholder={getLanguageByKey("Selectați tipul")}
                      data={[
                        { value: "phone", label: getLanguageByKey("Telefon") },
                        { value: "email", label: "Email" },
                        { value: "telegram", label: "Telegram" },
                      ]}
                      {...contactForm.getInputProps("contact_type")}
                      mb="sm"
                    />

                    <TextInput
                      label={getLanguageByKey("Valoare contact")}
                      placeholder={
                        contactForm.values.contact_type === "email"
                          ? "example@email.com"
                          : contactForm.values.contact_type === "phone"
                            ? "37300000000"
                            : contactForm.values.contact_type === "telegram"
                              ? "telegram username"
                              : "Introduceți username-ul"
                      }
                      leftSection={
                        contactForm.values.contact_type === "email" ? (
                          <LuMail size={24} />
                        ) : contactForm.values.contact_type === "phone" ? (
                          <LuPhone size={24} />
                        ) : contactForm.values.contact_type === "telegram" ? (
                          <FaTelegram size={24} />
                        ) : null
                      }
                      type={contactForm.values.contact_type === "email" ? "email" : "text"}
                      inputMode={contactForm.values.contact_type === "phone" ? "numeric" : "text"}
                      {...contactForm.getInputProps("contact_value")}
                      onChange={
                        contactForm.values.contact_type === "phone"
                          ? handleContactPhoneChange
                          : contactForm.values.contact_type === "telegram"
                            ? handleContactTelegramChange
                            : contactForm.getInputProps("contact_value").onChange
                      }
                      value={contactForm.values.contact_value}
                      mb="md"
                    />

                    <Group grow>
                      <Button
                        variant="outline"
                        onClick={() => toggleClientExpand(client.id)}
                        disabled={isSavingContact}
                      >
                        {getLanguageByKey("Anulează")}
                      </Button>
                      <Button
                        onClick={() => handleAddContact(client.id)}
                        loading={isSavingContact}
                      >
                        {getLanguageByKey("Adaugă contact")}
                      </Button>
                    </Group>
                  </Box>
                </Collapse>
              </Box>
            );
          })}
        </Stack>
      )}
    </Box>
  );
};
