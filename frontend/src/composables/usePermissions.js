import { computed } from 'vue';
import { useAuthStore } from '../stores/auth';

export function usePermissions() {
  const auth = useAuthStore();

  return {
    canCreateTicket: computed(() => auth.canCreateTicket),
    canEscalateTo: computed(() => auth.canEscalateTo),
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
  };
}
