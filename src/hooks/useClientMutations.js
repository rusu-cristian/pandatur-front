/**
 * 🚀 React Query Mutations для операций с клиентами
 * 
 * Включает:
 * - Добавление клиента
 * - Обновление клиента
 * - Удаление клиента
 * - Добавление контакта
 * - Обновление контакта
 * - Удаление контакта
 * 
 * С optimistic updates для мгновенного обновления UI
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSnackbar } from "notistack";
import { api } from "../api";
import { getLanguageByKey } from "@utils";

// ==================== КЛИЕНТЫ ====================

/**
 * Хук для добавления клиента к тикету
 */
export function useAddClientMutation(ticketId) {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  return useMutation({
    mutationFn: async (clientData) => {
      return await api.tickets.ticket.addClientToTicket({
        ticket_id: ticketId,
        name: clientData.name,
        surname: clientData.surname,
      });
    },
    onMutate: async (clientData) => {
      // Отменяем текущие запросы
      await queryClient.cancelQueries(['clientContacts', ticketId]);

      // Сохраняем предыдущее состояние (для rollback)
      const previous = queryClient.getQueryData(['clientContacts', ticketId]);

      // ✅ Оптимистичное обновление - добавляем клиента сразу в UI
      queryClient.setQueryData(['clientContacts', ticketId], (old) => {
        if (!old) return old;
        const newClient = {
          id: `temp-${Date.now()}`, // Временный ID
          name: clientData.name,
          surname: clientData.surname,
          contacts: [],
          emails: [],
          phones: [],
        };
        return {
          ...old,
          clients: [...(old.clients || []), newClient],
        };
      });

      return { previous };
    },
    onError: (error, clientData, context) => {
      // Откатываем изменения при ошибке
      queryClient.setQueryData(['clientContacts', ticketId], context.previous);
      enqueueSnackbar(getLanguageByKey("Eroare la adăugarea clientului"), {
        variant: "error",
      });
    },
    onSuccess: () => {
      enqueueSnackbar(getLanguageByKey("Clientul a fost adăugat cu succes"), {
        variant: "success",
      });
    },
    onSettled: () => {
      // После успеха/ошибки - обновляем данные с сервера
      queryClient.invalidateQueries(['clientContacts', ticketId]);
    },
  });
}

/**
 * Хук для обновления клиента
 */
export function useUpdateClientMutation(ticketId) {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  return useMutation({
    mutationFn: async ({ clientId, data }) => {
      return await api.users.updateClient(clientId, data);
    },
    onMutate: async ({ clientId, data }) => {
      await queryClient.cancelQueries(['clientContacts', ticketId]);
      const previous = queryClient.getQueryData(['clientContacts', ticketId]);

      // ✅ Оптимистичное обновление
      queryClient.setQueryData(['clientContacts', ticketId], (old) => {
        if (!old?.clients) return old;
        return {
          ...old,
          clients: old.clients.map((c) =>
            c.id === clientId ? { ...c, ...data } : c
          ),
        };
      });

      return { previous };
    },
    onError: (error, variables, context) => {
      queryClient.setQueryData(['clientContacts', ticketId], context.previous);
      enqueueSnackbar(getLanguageByKey("Eroare la actualizarea clientului"), {
        variant: "error",
      });
    },
    onSuccess: () => {
      enqueueSnackbar(getLanguageByKey("Clientul a fost actualizat cu succes"), {
        variant: "success",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries(['clientContacts', ticketId]);
    },
  });
}

// ==================== КОНТАКТЫ ====================

/**
 * Хук для добавления контакта к клиенту
 */
export function useAddContactMutation(ticketId) {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  return useMutation({
    mutationFn: async ({ clientId, contactData }) => {
      return await api.users.addClientContact(clientId, contactData);
    },
    onMutate: async ({ clientId, contactData }) => {
      await queryClient.cancelQueries(['clientContacts', ticketId]);
      const previous = queryClient.getQueryData(['clientContacts', ticketId]);

      // ✅ Оптимистичное обновление
      queryClient.setQueryData(['clientContacts', ticketId], (old) => {
        if (!old?.clients) return old;
        return {
          ...old,
          clients: old.clients.map((c) =>
            c.id === clientId
              ? {
                  ...c,
                  contacts: [
                    ...(c.contacts || []),
                    {
                      id: `temp-${Date.now()}`,
                      ...contactData,
                    },
                  ],
                }
              : c
          ),
        };
      });

      return { previous };
    },
    onError: (error, variables, context) => {
      queryClient.setQueryData(['clientContacts', ticketId], context.previous);
      enqueueSnackbar(getLanguageByKey("Eroare la adăugarea contactului"), {
        variant: "error",
      });
    },
    onSuccess: () => {
      enqueueSnackbar(getLanguageByKey("Contactul a fost adăugat cu succes"), {
        variant: "success",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries(['clientContacts', ticketId]);
    },
  });
}

/**
 * Хук для обновления контакта
 */
export function useUpdateContactMutation(ticketId) {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  return useMutation({
    mutationFn: async ({ clientId, contactId, data }) => {
      return await api.users.updateClientContact(clientId, contactId, data);
    },
    onMutate: async ({ clientId, contactId, data }) => {
      await queryClient.cancelQueries(['clientContacts', ticketId]);
      const previous = queryClient.getQueryData(['clientContacts', ticketId]);

      // ✅ Оптимистичное обновление
      queryClient.setQueryData(['clientContacts', ticketId], (old) => {
        if (!old?.clients) return old;
        return {
          ...old,
          clients: old.clients.map((c) =>
            c.id === clientId
              ? {
                  ...c,
                  contacts: (c.contacts || []).map((contact) =>
                    contact.id === contactId ? { ...contact, ...data } : contact
                  ),
                }
              : c
          ),
        };
      });

      return { previous };
    },
    onError: (error, variables, context) => {
      queryClient.setQueryData(['clientContacts', ticketId], context.previous);
      enqueueSnackbar(getLanguageByKey("Eroare la actualizarea contactului"), {
        variant: "error",
      });
    },
    onSuccess: () => {
      enqueueSnackbar(getLanguageByKey("Contactul a fost actualizat cu succes"), {
        variant: "success",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries(['clientContacts', ticketId]);
    },
  });
}

/**
 * Хук для удаления контакта
 */
export function useDeleteContactMutation(ticketId) {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  return useMutation({
    mutationFn: async ({ clientId, contactId }) => {
      return await api.users.deleteClientContact(clientId, contactId);
    },
    onMutate: async ({ clientId, contactId }) => {
      await queryClient.cancelQueries(['clientContacts', ticketId]);
      const previous = queryClient.getQueryData(['clientContacts', ticketId]);

      // ✅ Оптимистичное обновление
      queryClient.setQueryData(['clientContacts', ticketId], (old) => {
        if (!old?.clients) return old;
        return {
          ...old,
          clients: old.clients.map((c) =>
            c.id === clientId
              ? {
                  ...c,
                  contacts: (c.contacts || []).filter(
                    (contact) => contact.id !== contactId
                  ),
                }
              : c
          ),
        };
      });

      return { previous };
    },
    onError: (error, variables, context) => {
      queryClient.setQueryData(['clientContacts', ticketId], context.previous);
      enqueueSnackbar(getLanguageByKey("Eroare la ștergerea contactului"), {
        variant: "error",
      });
    },
    onSuccess: () => {
      enqueueSnackbar(getLanguageByKey("Contactul a fost șters cu succes"), {
        variant: "success",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries(['clientContacts', ticketId]);
    },
  });
}
