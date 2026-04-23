import { defineStore } from 'pinia';

export const useFiltersStore = defineStore('filters', {
  state: () => ({
    // Per-view filter state, keyed by view name (e.g. 'incidentPool', 'requestPool', 'myTickets')
    statusByView: {},
    searchByView: {},
  }),
  actions: {
    setStatus(view, key) { this.statusByView[view] = key; },
    setSearch(view, q) { this.searchByView[view] = q; },
    getStatus(view) { return this.statusByView[view] || 'all'; },
    getSearch(view) { return this.searchByView[view] || ''; },
    reset(view) { this.statusByView[view] = 'all'; this.searchByView[view] = ''; },
  },
});
