import { defineStore } from 'pinia';

const DEFAULT_ADVANCED = { priority: '', groupId: '', level: '', from: '', to: '', breachedSla: '', type: '', country: '', city: '' };
const DEFAULT_SORT = { key: 'updatedAt', dir: 'desc' };

export const useFiltersStore = defineStore('filters', {
  state: () => ({
    // Per-view filter state, keyed by view name
    statusByView: {},
    searchByView: {},
    advancedByView: {},
    sortByView: {},
    pageByView: {},
    pageSizeByView: {},
  }),
  actions: {
    setStatus(view, key) { this.statusByView[view] = key; this.pageByView[view] = 1; },
    setSearch(view, q)   { this.searchByView[view] = q; this.pageByView[view] = 1; },
    setAdvanced(view, v) { this.advancedByView[view] = v; this.pageByView[view] = 1; },
    setSort(view, sort)  { this.sortByView[view] = sort; },
    setPage(view, p)     { this.pageByView[view] = p; },
    setPageSize(view, s) { this.pageSizeByView[view] = s; this.pageByView[view] = 1; },

    getStatus(view)   { return this.statusByView[view] || 'all'; },
    getSearch(view)   { return this.searchByView[view] || ''; },
    getAdvanced(view) { return this.advancedByView[view] || { ...DEFAULT_ADVANCED }; },
    getSort(view)     { return this.sortByView[view] || { ...DEFAULT_SORT }; },
    getPage(view)     { return this.pageByView[view] || 1; },
    getPageSize(view) { return this.pageSizeByView[view] || 25; },

    resetAdvanced(view) {
      this.advancedByView[view] = { ...DEFAULT_ADVANCED };
      this.pageByView[view] = 1;
    },
    reset(view) {
      this.statusByView[view] = 'all';
      this.searchByView[view] = '';
      this.advancedByView[view] = { ...DEFAULT_ADVANCED };
      this.sortByView[view] = { ...DEFAULT_SORT };
      this.pageByView[view] = 1;
    },
    toggleSort(view, key) {
      const cur = this.getSort(view);
      if (cur.key === key) {
        this.sortByView[view] = { key, dir: cur.dir === 'asc' ? 'desc' : 'asc' };
      } else {
        this.sortByView[view] = { key, dir: 'asc' };
      }
    },
  },
});
