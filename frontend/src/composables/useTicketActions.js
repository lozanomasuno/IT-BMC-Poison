import { ref } from 'vue';
import { useTicketsStore } from '../stores/tickets';
import { useAuthStore } from '../stores/auth';

// Centralizes the modal state for ticket actions (escalate, resolve, close).
export function useTicketActions() {
  const tickets = useTicketsStore();
  const auth = useAuthStore();

  const escalateTarget = ref(null); // ticket
  const resolveTarget = ref(null);  // ticket

  const openEscalate = (t) => { escalateTarget.value = t; };
  const closeEscalate = () => { escalateTarget.value = null; };

  const openResolve = (t) => { resolveTarget.value = t; };
  const closeResolve = () => { resolveTarget.value = null; };

  const closeTicket = async (t) => {
    if (!auth.currentUser) return;
    if (!confirm(`Close ticket ${t.ticketNumber}?`)) return;
    await tickets.closeTicket(t.id, auth.currentUser);
  };

  return {
    escalateTarget, openEscalate, closeEscalate,
    resolveTarget,  openResolve,  closeResolve,
    closeTicket,
  };
}
