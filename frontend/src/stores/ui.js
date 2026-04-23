import { defineStore } from 'pinia';

const KEY = 'bmc.sidebar.collapsed';

export const useUiStore = defineStore('ui', {
  state: () => ({
    sidebarCollapsed: false,
  }),
  actions: {
    init() {
      this.sidebarCollapsed = localStorage.getItem(KEY) === '1';
    },
    toggleSidebar() {
      this.sidebarCollapsed = !this.sidebarCollapsed;
      localStorage.setItem(KEY, this.sidebarCollapsed ? '1' : '0');
    },
    setSidebarCollapsed(v) {
      this.sidebarCollapsed = !!v;
      localStorage.setItem(KEY, this.sidebarCollapsed ? '1' : '0');
    },
  },
});
