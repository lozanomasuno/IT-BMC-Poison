import { computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useTicketsStore } from '../stores/tickets';
import { useUsersStore } from '../stores/users';
import { useFiltersStore } from '../stores/filters';
import { STATUS_FILTERS } from '../utils/constants';
import { applyAdvancedFilters, sortTickets, paginate, ticketsToCsv, downloadCsv } from '../utils/table';

// Centralizes the chain: subset → search/status → advanced → sort → paginate
// for any view that displays tickets in a table.
export function usePoolView(viewKey, subsetGetter) {
  const tickets = useTicketsStore();
  const users = useUsersStore();
  const filters = useFiltersStore();
  const route = useRoute();

  const status = computed({
    get: () => filters.getStatus(viewKey),
    set: (v) => filters.setStatus(viewKey, v),
  });

  // Sync the active status filter from the route query (?status=open) so that
  // navigating from the sidebar submenu updates the table view.
  const syncFromQuery = () => {
    const q = route?.query?.status;
    if (typeof q === 'string' && STATUS_FILTERS.some((f) => f.key === q) && filters.getStatus(viewKey) !== q) {
      filters.setStatus(viewKey, q);
    }
  };
  syncFromQuery();
  watch(() => route?.query?.status, syncFromQuery);
  const search = computed({
    get: () => filters.getSearch(viewKey),
    set: (v) => filters.setSearch(viewKey, v),
  });
  const advanced = computed({
    get: () => filters.getAdvanced(viewKey),
    set: (v) => filters.setAdvanced(viewKey, v),
  });
  const sort = computed(() => filters.getSort(viewKey));
  const page = computed({
    get: () => filters.getPage(viewKey),
    set: (v) => filters.setPage(viewKey, v),
  });
  const pageSize = computed({
    get: () => filters.getPageSize(viewKey),
    set: (v) => filters.setPageSize(viewKey, v),
  });

  const subset = computed(() => subsetGetter());
  const counts = computed(() => tickets.countsFor(subset.value));

  const filtered = computed(() => {
    const base = tickets.filterAndSearch(subset.value, status.value, search.value, users);
    return applyAdvancedFilters(base, advanced.value);
  });

  const sorted = computed(() => sortTickets(filtered.value, sort.value.key, sort.value.dir, users));
  const paged = computed(() => paginate(sorted.value, page.value, pageSize.value));

  const onSort = (key) => filters.toggleSort(viewKey, key);
  const resetAdvanced = () => filters.resetAdvanced(viewKey);

  const exportCsv = (filename = `${viewKey}.csv`) => {
    const csv = ticketsToCsv(sorted.value, users);
    downloadCsv(filename, csv);
  };

  return {
    status, search, advanced, sort, page, pageSize,
    subset, counts, filtered, sorted, paged,
    onSort, resetAdvanced, exportCsv,
  };
}
