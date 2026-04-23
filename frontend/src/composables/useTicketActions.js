import { ref } from 'vue';
import { useTicketsStore } from '../stores/tickets';
import { useAuthStore } from '../stores/auth';
import { useToastStore } from '../stores/toasts';

export function useTicketActions() {
  const tickets = useTicketsStore();
  const auth = useAuthStore();
  const toasts = useToastStore();

  const escalateTarget = ref(null);
  const resolveTarget = ref(null);
  const reassignTarget = ref(null);

  const openEscalate = (t) => { escalateTarget.value = t; };
  const closeEscalate = () => { escalateTarget.value = null; };

  const openResolve = (t) => { resolveTarget.value = t; };
  const closeResolve = () => { resolveTarget.value = null; };

  const openReassign = (t) => { reassignTarget.value = t; };
  const closeReassign = () => { reassignTarget.value = null; };

  const closeTicket = async (t) => {
    if (!auth.currentUser) return;
    if (!confirm(`Close ticket ${t.ticketNumber}?`)) return;
    try {
      await tickets.closeTicket(t.id, auth.currentUser);
      toasts.success(`Ticket ${t.ticketNumber} closed.`);
    } catch (e) {
      toasts.error(`Close failed: ${e.message}`);
    }
  };

  return {
    escalateTarget, openEscalate, closeEscalate,
    resolveTarget,  openResolve,  closeResolve,
    reassignTarget, openReassign, closeReassign,
    closeTicket,
  };
}
