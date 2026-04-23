<script setup>
import { ref, watch } from 'vue';
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
import ReassignDialog from '../components/tickets/ReassignDialog.vue';
import BulkReassignDialog from '../components/tickets/BulkReassignDialog.vue';

const VIEW_KEY = 'incidentPool';
const tickets = useTicketsStore();
const auth = useAuthStore();
const actions = useTicketActions();
const view = usePoolView(VIEW_KEY, () => tickets.incidents);

const selection = ref([]);
const bulkOpen = ref(false);
watch(() => auth.isManager, (v) => { if (!v) selection.value = []; });

const today = () => new Date().toISOString().slice(0, 10);
const onExport = () => view.exportCsv(`incidents-${today()}.csv`);
</script>

<template>
  <div class="space-y-5">
    <div class="card p-4 flex flex-col md:flex-row md:items-center gap-4 md:justify-between">
      <div>
        <h2 class="text-base font-semibold text-slate-900 dark:text-white">Incident Pool</h2>
        <p class="text-xs text-slate-500 dark:text-slate-400">Unplanned interruptions to a service.</p>
      </div>
      <div class="flex items-center gap-2 w-full md:w-auto">
        <SearchInput v-model="view.search.value" />
        <button class="btn-secondary text-xs" @click="onExport" title="Export current view to CSV">CSV</button>
      </div>
    </div>

    <StatusFilterTabs v-model="view.status.value" :counts="view.counts.value" />
    <AdvancedFilters v-model="view.advanced.value" @reset="view.resetAdvanced" />

    <div v-if="auth.isManager && selection.length"
         class="card p-3 flex items-center justify-between text-sm bg-brand-50/60 border-brand-200">
      <div class="text-slate-700"><span class="font-semibold">{{ selection.length }}</span> ticket(s) selected</div>
      <div class="flex items-center gap-2">
        <button class="btn-ghost text-xs" @click="selection = []">Clear</button>
        <button class="btn-primary text-xs" @click="bulkOpen = true">Bulk Reassign</button>
      </div>
    </div>

    <TicketTable
      :tickets="view.paged.value.items"
      :sort="view.sort.value"
      :selection="auth.isManager ? selection : null"
      :show-reassign="auth.isManager"
      @sort="view.onSort"
      @escalate="actions.openEscalate"
      @resolve="actions.openResolve"
      @close="actions.closeTicket"
      @reassign="actions.openReassign"
      @update:selection="(v) => selection = v"
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
    <ReassignDialog v-if="actions.reassignTarget.value"
      :ticket="actions.reassignTarget.value" :open="!!actions.reassignTarget.value" @close="actions.closeReassign" />
    <BulkReassignDialog v-if="bulkOpen"
      :ticket-ids="selection" :open="bulkOpen" @close="bulkOpen = false" @done="selection = []" />
  </div>
</template>
