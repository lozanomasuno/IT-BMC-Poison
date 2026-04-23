import { defineStore } from 'pinia';

const STORAGE_KEY = 'bmc.auth.userId';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    currentUserId: null,
    users: [],
  }),
  getters: {
    currentUser: (s) => s.users.find((u) => u.id === s.currentUserId) || null,
    role: (s) => s.users.find((u) => u.id === s.currentUserId)?.role || null,
    supportLevel: (s) => s.users.find((u) => u.id === s.currentUserId)?.supportLevel || null,
    isManager() { return this.role === 'manager'; },
    isAgent() { return ['l1_agent', 'l2_agent', 'l3_agent'].includes(this.role); },
    canCreateTicket() { return this.role === 'l1_agent'; },
    canEscalateTo() {
      if (this.role === 'l1_agent') return ['L2', 'L3'];
      if (this.role === 'l2_agent') return ['L3'];
      return [];
    },
    canViewAll() { return this.isManager; },
  },
  actions: {
    bootstrap(users) {
      this.users = users;
      const stored = Number(localStorage.getItem(STORAGE_KEY));
      if (stored && users.some((u) => u.id === stored)) {
        this.currentUserId = stored;
      } else {
        // Default to first L1 agent
        const l1 = users.find((u) => u.role === 'l1_agent');
        this.currentUserId = l1?.id || users[0]?.id || null;
        if (this.currentUserId) localStorage.setItem(STORAGE_KEY, String(this.currentUserId));
      }
    },
    setUser(id) {
      this.currentUserId = id;
      localStorage.setItem(STORAGE_KEY, String(id));
    },
  },
});
