<script setup>
import { computed } from 'vue';
import { useTicketsStore } from '../stores/tickets';
import { useUsersStore } from '../stores/users';
import { useAuthStore } from '../stores/auth';
import { useFiltersStore } from '../stores/filters';
import StatusFilterTabs from '../components/common/StatusFilterTabs.vue';
import SearchInput from '../components/common/SearchInput.vue';
import TicketTable from '../components/tickets/TicketTable.vue';
import EscalateDialog from '../components/tickets/EscalateDialog.vue';
import ResolveDialog from '../components/tickets/ResolveDialog.vue';
import { useTicketActions } from '../composables/useTicketActions';

const VIEW_KEY = 'myTickets';

const tickets = useTicketsStore();
const users = useUsersStore();
const auth = useAuthStore();
const filters = useFiltersStore();
const actions = useTicketActions();

const status = computed({
  get: () => filters.getStatus(VIEW_KEY),
  set: (v) => filters.setStatus(VIEW_KEY, v),
});
const search = computed({
  get: () => filters.getSearch(VIEW_KEY),
  set: (v) => filters.setSearch(VIEW_KEY, v),
});

const mine = computed(() => auth.currentUserId ? tickets.assignedTo(auth.currentUserId) : []);
const counts = computed(() => tickets.countsFor(mine.value));
const filtered = computed(() => tickets.filterAndSearch(mine.value, status.value, search.value, users));
</script>

<template>
  <div class="space-y-5">
    <div class="card p-4 flex flex-col md:flex-row md:items-center gap-4 md:justify-between">
      <div>
        <h2 class="text-base font-semibold text-slate-900">My Tickets</h2>
        <p class="text-xs text-slate-500">
          Tickets currently assigned to <span class="font-medium text-slate-700">{{ auth.currentUser?.fullName || '—' }}</span>.
        </p>
      </div>
      <SearchInput v-model="search" />
    </div>

    <StatusFilterTabs v-model="status" :counts="counts" />

    <TicketTable
      :tickets="filtered"
      @escalate="actions.openEscalate"
      @resolve="actions.openResolve"
      @close="actions.closeTicket"
    />

    <EscalateDialog v-if="actions.escalateTarget.value"
      :ticket="actions.escalateTarget.value" :open="!!actions.escalateTarget.value"
      @close="actions.closeEscalate" />
    <ResolveDialog v-if="actions.resolveTarget.value"
      :ticket="actions.resolveTarget.value" :open="!!actions.resolveTarget.value"
      @close="actions.closeResolve" />
  </div>
</template>
