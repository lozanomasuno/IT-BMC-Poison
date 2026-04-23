<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useTicketsStore } from '../stores/tickets';
import { useUsersStore } from '../stores/users';
import { useAuthStore } from '../stores/auth';
import StatCard from '../components/common/StatCard.vue';
import BarChart from '../components/common/BarChart.vue';
import DonutChart from '../components/common/DonutChart.vue';
import StatusBadge from '../components/common/StatusBadge.vue';
import PriorityBadge from '../components/common/PriorityBadge.vue';
import { STATUS_LABELS } from '../utils/constants';
import { relativeTime } from '../utils/format';

const router = useRouter();
const tickets = useTicketsStore();
const users = useUsersStore();
const auth = useAuthStore();

const myTicketsCount = computed(() =>
  auth.currentUserId ? tickets.assignedTo(auth.currentUserId).length : 0
);

const statusChartData = computed(() => {
  const stats = tickets.byStatus;
  const colors = {
    new: '#0ea5e9', assigned: '#6366f1', in_progress: '#f59e0b',
    pending: '#f97316', resolved: '#10b981', closed: '#94a3b8', cancelled: '#f43f5e',
  };
  return Object.keys(STATUS_LABELS).map((k) => ({
    label: STATUS_LABELS[k],
    value: stats[k] || 0,
    color: colors[k],
  }));
});

const priorityChartData = computed(() => {
  const p = tickets.byPriority;
  return [
    { label: 'Low', value: p.low, color: 'bg-slate-400' },
    { label: 'Medium', value: p.medium, color: 'bg-blue-500' },
    { label: 'High', value: p.high, color: 'bg-orange-500' },
    { label: 'Critical', value: p.critical, color: 'bg-rose-500' },
  ];
});

const levelChartData = computed(() => {
  const l = tickets.byLevel;
  return [
    { label: 'L1 - Help Desk', value: l.L1, color: 'bg-emerald-500' },
    { label: 'L2 - Specialist', value: l.L2, color: 'bg-amber-500' },
    { label: 'L3 - Expert',     value: l.L3, color: 'bg-rose-500' },
  ];
});

const recent = computed(() =>
  [...tickets.tickets]
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .slice(0, 8)
);

const requesterName = (id) => users.byId(id)?.fullName || '—';
</script>

<template>
  <div class="space-y-6">
    <div class="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
      <StatCard title="Total Tickets" :value="tickets.tickets.length" icon="ticket" tone="info" />
      <StatCard title="Open" :value="tickets.openCount" icon="inbox" tone="info" />
      <StatCard title="Pending" :value="tickets.pendingCount" icon="clock" tone="warning" />
      <StatCard title="Resolved Today" :value="tickets.resolvedTodayCount" icon="check" tone="success" />
      <StatCard title="SLA Breaches" :value="tickets.breachedCount" icon="alert" tone="danger" />
      <StatCard title="My Tickets" :value="myTicketsCount" icon="user" tone="default"
        :hint="auth.currentUser?.fullName || ''" />
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="card p-5 lg:col-span-2">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h3 class="text-sm font-semibold text-slate-900">Tickets by Status</h3>
            <p class="text-xs text-slate-500">Distribution across the lifecycle</p>
          </div>
        </div>
        <DonutChart :data="statusChartData" />
      </div>

      <div class="card p-5">
        <h3 class="text-sm font-semibold text-slate-900 mb-1">Tickets by Priority</h3>
        <p class="text-xs text-slate-500 mb-4">Severity breakdown</p>
        <BarChart :data="priorityChartData" :height="180" />
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="card p-5">
        <h3 class="text-sm font-semibold text-slate-900 mb-1">Tickets by Support Level</h3>
        <p class="text-xs text-slate-500 mb-4">Where work currently sits</p>
        <BarChart :data="levelChartData" :height="180" />
      </div>

      <div class="card p-0 lg:col-span-2 overflow-hidden">
        <div class="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <h3 class="text-sm font-semibold text-slate-900">Recent Activity</h3>
          <button class="btn-ghost text-xs" @click="router.push('/incidents')">View all</button>
        </div>
        <ul class="divide-y divide-slate-100">
          <li v-for="t in recent" :key="t.id"
              class="px-5 py-3 flex items-center gap-3 hover:bg-slate-50 cursor-pointer"
              @click="router.push(`/tickets/${t.id}`)">
            <div class="font-mono text-xs text-brand-700 font-semibold w-24 shrink-0">{{ t.ticketNumber }}</div>
            <div class="flex-1 min-w-0">
              <div class="text-sm font-medium text-slate-800 truncate">{{ t.title }}</div>
              <div class="text-xs text-slate-500">{{ requesterName(t.requesterId) }} · {{ t.locationCity }}</div>
            </div>
            <PriorityBadge :priority="t.priority" />
            <StatusBadge :status="t.status" />
            <div class="text-xs text-slate-400 w-20 text-right">{{ relativeTime(t.updatedAt) }}</div>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>
