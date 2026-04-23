<script setup>
import { useTicketsStore } from '../stores/tickets';
import { useAuthStore } from '../stores/auth';
import { usePoolView } from '../composables/usePoolView';
import { useTicketActions } from '../composables/useTicketActions';
import StatusFilterTabs from '../components/common/StatusFilterTabs.vue';
import SearchInput from '../components/common/SearchInput.vue';
import AdvancedFilters from '../components/common/AdvancedFilters.vue';
import Pagination from '../components/common/Pagination.vue';
import TicketTable from '../components/tickets/TicketTable.vue';
import EscalateDialog from '../components/tickets/EscalateDialog.vue';
import ResolveDialog from '../components/tickets/ResolveDialog.vue';

const VIEW_KEY = 'myTickets';
const tickets = useTicketsStore();
const auth = useAuthStore();
const actions = useTicketActions();

const view = usePoolView(VIEW_KEY, () =>
  auth.currentUserId ? tickets.assignedTo(auth.currentUserId) : []
);

const today = () => new Date().toISOString().slice(0, 10);
const onExport = () => view.exportCsv(`my-tickets-${today()}.csv`);
</script>

<template>
  <div class="space-y-5">
    <div class="card p-4 flex flex-col md:flex-row md:items-center gap-4 md:justify-between">
      <div>
        <h2 class="text-base font-semibold text-slate-900 dark:text-white">My Tickets</h2>
        <p class="text-xs text-slate-500 dark:text-slate-400">
          Tickets currently assigned to
          <span class="font-medium text-slate-700 dark:text-slate-300">{{ auth.currentUser?.fullName || '—' }}</span>.
        </p>
      </div>
      <div class="flex items-center gap-2 w-full md:w-auto">
        <SearchInput v-model="view.search.value" />
        <button class="btn-secondary text-xs" @click="onExport">CSV</button>
      </div>
    </div>

    <StatusFilterTabs v-model="view.status.value" :counts="view.counts.value" />
    <AdvancedFilters v-model="view.advanced.value" @reset="view.resetAdvanced" />

    <TicketTable
      :tickets="view.paged.value.items"
      :sort="view.sort.value"
      @sort="view.onSort"
      @escalate="actions.openEscalate"
      @resolve="actions.openResolve"
      @close="actions.closeTicket"
    >
      <template #footer>
        <Pagination
          :page="view.paged.value.page" :total-pages="view.paged.value.totalPages"
          :total="view.paged.value.total" :page-size="view.pageSize.value"
          :start="view.paged.value.start" :end="view.paged.value.end"
          @update:page="view.page.value = $event"
          @update:page-size="view.pageSize.value = $event" />
      </template>
    </TicketTable>

    <EscalateDialog v-if="actions.escalateTarget.value"
      :ticket="actions.escalateTarget.value" :open="!!actions.escalateTarget.value" @close="actions.closeEscalate" />
    <ResolveDialog v-if="actions.resolveTarget.value"
      :ticket="actions.resolveTarget.value" :open="!!actions.resolveTarget.value" @close="actions.closeResolve" />
  </div>
</template>
