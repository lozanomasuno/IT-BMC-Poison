<script setup>
import { computed, ref } from 'vue';
import { useTicketsStore } from '../stores/tickets';
import { useUsersStore } from '../stores/users';
import { ROLE_LABELS } from '../utils/constants';
import ReassignDialog from '../components/tickets/ReassignDialog.vue';

const tickets = useTicketsStore();
const users = useUsersStore();
const reassignTarget = ref(null);

const STATUS_KEYS = ['new', 'assigned', 'in_progress', 'pending', 'resolved'];

const rows = computed(() =>
  users.agents.map((u) => {
    const mine = tickets.assignedTo(u.id);
    const counts = STATUS_KEYS.reduce((acc, k) => (acc[k] = 0, acc), {});
    let breached = 0;
    for (const t of mine) {
      counts[t.status] = (counts[t.status] || 0) + 1;
      if (t.breachedSla && !['resolved', 'closed', 'cancelled'].includes(t.status)) breached++;
    }
    const open = (counts.new || 0) + (counts.assigned || 0) + (counts.in_progress || 0) + (counts.pending || 0);
    return {
      user: u,
      group: users.groupById(u.groupId),
      total: mine.length,
      counts,
      open,
      breached,
    };
  }).sort((a, b) => b.open - a.open)
);

const totals = computed(() => {
  const t = { open: 0, breached: 0, total: 0 };
  rows.value.forEach((r) => { t.open += r.open; t.breached += r.breached; t.total += r.total; });
  return t;
});

const recentReassignable = computed(() =>
  [...tickets.tickets]
    .filter((t) => !['closed', 'cancelled', 'resolved'].includes(t.status))
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .slice(0, 8)
);
</script>

<template>
  <div class="space-y-6">
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div class="card p-4">
        <div class="text-xs uppercase font-semibold text-slate-500 dark:text-slate-400">Open Tickets</div>
        <div class="text-2xl font-bold text-slate-900 dark:text-white mt-1">{{ totals.open }}</div>
      </div>
      <div class="card p-4">
        <div class="text-xs uppercase font-semibold text-slate-500 dark:text-slate-400">SLA Breaches</div>
        <div class="text-2xl font-bold text-rose-600 mt-1">{{ totals.breached }}</div>
      </div>
      <div class="card p-4">
        <div class="text-xs uppercase font-semibold text-slate-500 dark:text-slate-400">Total Assigned</div>
        <div class="text-2xl font-bold text-slate-900 dark:text-white mt-1">{{ totals.total }}</div>
      </div>
    </div>

    <div class="card overflow-hidden">
      <div class="px-4 py-3 border-b border-slate-200 dark:border-slate-800">
        <h2 class="text-sm font-semibold text-slate-900 dark:text-white">Workload by Agent</h2>
        <p class="text-xs text-slate-500 dark:text-slate-400">All agents and their currently assigned tickets.</p>
      </div>
      <div class="overflow-x-auto">
        <table class="min-w-full text-sm">
          <thead>
            <tr>
              <th class="table-th">Agent</th>
              <th class="table-th">Role</th>
              <th class="table-th">Group</th>
              <th class="table-th text-center">New</th>
              <th class="table-th text-center">Assigned</th>
              <th class="table-th text-center">In Progress</th>
              <th class="table-th text-center">Pending</th>
              <th class="table-th text-center">Resolved</th>
              <th class="table-th text-center">Open</th>
              <th class="table-th text-center">Breaches</th>
              <th class="table-th text-center">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in rows" :key="r.user.id" class="hover:bg-slate-50 dark:hover:bg-slate-800/40">
              <td class="table-td font-medium text-slate-800 dark:text-slate-200">{{ r.user.fullName }}</td>
              <td class="table-td">{{ ROLE_LABELS[r.user.role] }}</td>
              <td class="table-td">{{ r.group?.name || '—' }}</td>
              <td class="table-td text-center">{{ r.counts.new || 0 }}</td>
              <td class="table-td text-center">{{ r.counts.assigned || 0 }}</td>
              <td class="table-td text-center">{{ r.counts.in_progress || 0 }}</td>
              <td class="table-td text-center">{{ r.counts.pending || 0 }}</td>
              <td class="table-td text-center">{{ r.counts.resolved || 0 }}</td>
              <td class="table-td text-center font-semibold text-brand-700">{{ r.open }}</td>
              <td class="table-td text-center" :class="r.breached ? 'text-rose-600 font-semibold' : ''">{{ r.breached }}</td>
              <td class="table-td text-center">{{ r.total }}</td>
            </tr>
            <tr v-if="!rows.length">
              <td colspan="11" class="text-center py-8 text-slate-400">No agents available.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="card overflow-hidden">
      <div class="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div>
          <h2 class="text-sm font-semibold text-slate-900 dark:text-white">Recently Updated Tickets</h2>
          <p class="text-xs text-slate-500 dark:text-slate-400">Quick reassign action.</p>
        </div>
      </div>
      <ul class="divide-y divide-slate-100 dark:divide-slate-800">
        <li v-for="t in recentReassignable" :key="t.id"
            class="px-4 py-3 flex items-center justify-between gap-4 text-sm">
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2">
              <span class="font-mono text-xs font-semibold text-brand-700">{{ t.ticketNumber }}</span>
              <span class="capitalize text-xs text-slate-500">{{ t.type }}</span>
              <span class="text-xs text-slate-400">·</span>
              <span class="text-xs text-slate-500">{{ users.byId(t.assignedTo)?.fullName || '—' }}</span>
            </div>
            <div class="font-medium text-slate-800 dark:text-slate-200 truncate">{{ t.title }}</div>
          </div>
          <button class="btn-secondary text-xs" @click="reassignTarget = t">Reassign</button>
        </li>
      </ul>
    </div>

    <ReassignDialog v-if="reassignTarget"
      :ticket="reassignTarget" :open="!!reassignTarget" @close="reassignTarget = null" />
  </div>
</template>
