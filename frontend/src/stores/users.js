import { defineStore } from 'pinia';
import { api } from '../api/client';

export const useUsersStore = defineStore('users', {
  state: () => ({
    users: [],
    groups: [],
    serviceCatalog: [],
    loading: false,
  }),
  getters: {
    byId: (s) => (id) => s.users.find((u) => u.id === id) || null,
    groupById: (s) => (id) => s.groups.find((g) => g.id === id) || null,
    agents: (s) => s.users.filter((u) => u.role !== 'requester'),
    requesters: (s) => s.users.filter((u) => u.role === 'requester'),
  },
  actions: {
    async fetchUsers() {
      this.loading = true;
      try { this.users = await api.get('/users'); }
      finally { this.loading = false; }
    },
    async fetchGroups() {
      const [groups, services] = await Promise.all([api.get('/groups'), api.get('/serviceCatalog')]);
      this.groups = groups;
      this.serviceCatalog = services;
    },
  },
});
