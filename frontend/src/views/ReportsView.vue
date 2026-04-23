<script setup>
import { computed } from 'vue';
import { useTicketsStore } from '../stores/tickets';
import { useUsersStore } from '../stores/users';
import StatCard from '../components/common/StatCard.vue';
import BarChart from '../components/common/BarChart.vue';
import DonutChart from '../components/common/DonutChart.vue';
import { STATUS_LABELS } from '../utils/constants';

const tickets = useTicketsStore();
const users = useUsersStore();

const byCountry = computed(() => {
  const m = {};
  for (const t of tickets.tickets) m[t.locationCountry] = (m[t.locationCountry] || 0) + 1;
  return Object.entries(m).map(([label, value]) => ({ label, value, color: 'bg-brand-500' }));
});

const byCategory = computed(() => {
  const m = {};
  for (const t of tickets.tickets) m[t.category] = (m[t.category] || 0) + 1;
  return Object.entries(m)
    .map(([label, value]) => ({ label, value, color: 'bg-indigo-500' }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);
});

const byGroup = computed(() => {
  const m = {};
  for (const t of tickets.tickets) {
    const g = users.groupById(t.assignedGroupId);
    if (!g) continue;
    m[g.name] = (m[g.name] || 0) + 1;
  }
  return Object.entries(m).map(([label, value]) => ({ label, value, color: 'bg-emerald-500' }));
});

const statusDonut = computed(() => {
  const colors = {
    new: '#0ea5e9', assigned: '#6366f1', in_progress: '#f59e0b',
    pending: '#f97316', resolved: '#10b981', closed: '#94a3b8', cancelled: '#f43f5e',
  };
  const stats = tickets.byStatus;
  return Object.keys(STATUS_LABELS).map((k) => ({
    label: STATUS_LABELS[k], value: stats[k] || 0, color: colors[k],
  }));
});
</script>

<template>
  <div class="space-y-5">
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatCard title="Total" :value="tickets.tickets.length" tone="info" icon="ticket" />
      <StatCard title="Resolved" :value="(tickets.byStatus.resolved || 0) + (tickets.byStatus.closed || 0)" tone="success" icon="check" />
      <StatCard title="In Progress" :value="tickets.inProgressCount" tone="warning" icon="clock" />
      <StatCard title="SLA Breaches" :value="tickets.breachedCount" tone="danger" icon="alert" />
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <div class="card p-5">
        <h3 class="text-sm font-semibold text-slate-900 mb-3">Status Distribution</h3>
        <DonutChart :data="statusDonut" />
      </div>
      <div class="card p-5">
        <h3 class="text-sm font-semibold text-slate-900 mb-3">Tickets by Country</h3>
        <BarChart :data="byCountry" />
      </div>
      <div class="card p-5">
        <h3 class="text-sm font-semibold text-slate-900 mb-3">Top Categories</h3>
        <BarChart :data="byCategory" />
      </div>
      <div class="card p-5">
        <h3 class="text-sm font-semibold text-slate-900 mb-3">Workload by Group</h3>
        <BarChart :data="byGroup" />
      </div>
    </div>
  </div>
</template>
