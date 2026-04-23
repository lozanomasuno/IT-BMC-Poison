import { defineStore } from 'pinia';

const KEY_COLLAPSED = 'bmc.sidebar.collapsed';
const KEY_EXPANDED = 'bmc.sidebar.expandedMenus';

const DEFAULT_EXPANDED = { incidents: false, requests: false, myTickets: false };

function readExpanded() {
  try {
    const raw = localStorage.getItem(KEY_EXPANDED);
    if (!raw) return { ...DEFAULT_EXPANDED };
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_EXPANDED, ...parsed };
  } catch {
    return { ...DEFAULT_EXPANDED };
  }
}

export const useUiStore = defineStore('ui', {
  state: () => ({
    sidebarCollapsed: false,
    expandedMenus: { ...DEFAULT_EXPANDED },
  }),
  actions: {
    init() {
      this.sidebarCollapsed = localStorage.getItem(KEY_COLLAPSED) === '1';
      this.expandedMenus = readExpanded();
    },
    toggleSidebar() {
      this.sidebarCollapsed = !this.sidebarCollapsed;
      localStorage.setItem(KEY_COLLAPSED, this.sidebarCollapsed ? '1' : '0');
    },
    setSidebarCollapsed(v) {
      this.sidebarCollapsed = !!v;
      localStorage.setItem(KEY_COLLAPSED, this.sidebarCollapsed ? '1' : '0');
    },
    toggleMenu(key) {
      const cur = this.expandedMenus || { ...DEFAULT_EXPANDED };
      this.expandedMenus = { ...cur, [key]: !cur[key] };
      localStorage.setItem(KEY_EXPANDED, JSON.stringify(this.expandedMenus));
    },
    setMenuExpanded(key, v) {
      const cur = this.expandedMenus || { ...DEFAULT_EXPANDED };
      this.expandedMenus = { ...cur, [key]: !!v };
      localStorage.setItem(KEY_EXPANDED, JSON.stringify(this.expandedMenus));
    },
  },
});
