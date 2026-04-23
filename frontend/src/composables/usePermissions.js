import { computed } from 'vue';
import { useAuthStore } from '../stores/auth';
import { ESCALATION_PATHS } from '../utils/constants';

export function usePermissions() {
  const auth = useAuthStore();

  const canEscalateFrom = (level) => {
    // Managers may force-escalate to any forward level.
    if (auth.isManager) return ESCALATION_PATHS[level] || [];
    if (!auth.isAgent) return [];
    // An agent only sees the paths their own level allows AND only on tickets
    // currently sitting at their level or below (their job to push it up).
    return ESCALATION_PATHS[auth.supportLevel] || [];
  };

  return {
    canCreateTicket: computed(() => auth.canCreateTicket),
    canEscalateTo: computed(() => auth.canEscalateTo),
    canEscalateFrom,
    canViewAll: computed(() => auth.canViewAll),
    canEdit: (ticket) => {
      if (!ticket) return false;
      if (auth.isManager) return true;
      return auth.isAgent && ticket.assignedTo === auth.currentUserId;
    },
    canResolve: (ticket) => {
      if (!ticket) return false;
      if (auth.isManager) return true;
      return auth.isAgent && ticket.assignedTo === auth.currentUserId;
    },
    canClose: (ticket) => {
      if (!ticket) return false;
      return auth.isManager || ticket.status === 'resolved';
    },
    canReopen: (ticket) => {
      if (!ticket) return false;
      if (!['resolved', 'closed', 'cancelled'].includes(ticket.status)) return false;
      return auth.isManager || ticket.assignedTo === auth.currentUserId;
    },
    canEscalate: (ticket) => {
      if (!ticket) return false;
      if (['resolved', 'closed', 'cancelled'].includes(ticket.status)) return false;
      const paths = canEscalateFrom(ticket.currentLevel);
      return paths.length > 0;
    },
  };
}
