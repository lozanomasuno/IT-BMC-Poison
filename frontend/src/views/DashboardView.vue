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
import SupportMetricsTable from '../components/tickets/SupportMetricsTable.vue';
import { STATUS_LABELS } from '../utils/constants';
import { relativeTime } from '../utils/format';
import { formatDuration } from '../utils/sla';

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
    { label: 'L1 - Help Desk',          value: l.L1, color: 'bg-emerald-500' },
    { label: 'L2 - App Support',        value: l.L2, color: 'bg-amber-500' },
    { label: 'L3 - Advanced / Field',   value: l.L3, color: 'bg-rose-500' },
  ];
});

const slaByLevelData = computed(() =>
  tickets.metricsBySupportLevel.map((m) => ({
    label: m.level,
    value: m.slaCompliance == null ? 0 : Math.round(m.slaCompliance),
    color: m.slaCompliance == null
      ? 'bg-slate-300'
      : m.slaCompliance >= 90 ? 'bg-emerald-500'
      : m.slaCompliance >= 70 ? 'bg-amber-500'
      : 'bg-rose-500',
  }))
);

const escalationVolumeData = computed(() =>
  tickets.metricsBySupportLevel.map((m) => ({
    label: `From ${m.level}`,
    value: m.escalated,
    color: 'bg-amber-500',
  }))
);

const slaCompliance = computed(() => tickets.slaComplianceGlobal);
const avgResolutionLabel = computed(() => formatDuration(tickets.averageResolutionMs));
const breachedCount = computed(() => tickets.breachedTickets.length);
const warningCount = computed(() => tickets.warningTickets.length);

const recent = computed(() =>
  [...tickets.tickets]
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .slice(0, 8)
);

const requesterName = (id) => users.byId(id)?.fullName || '—';

const showAlerts = computed(() => breachedCount.value > 0 || warningCount.value > 0);
</script>

<template>
  <div class="space-y-6">
    <div v-if="showAlerts" class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div v-if="breachedCount" class="card p-4 border-rose-200 bg-rose-50/60">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-5 h-5"><path d="M12 3l10 17H2L12 3z"/><path d="M12 10v4M12 17h.01"/></svg>
          </div>
          <div class="flex-1">
            <div class="text-sm font-semibold text-rose-700">{{ breachedCount }} ticket(s) past SLA</div>
            <div class="text-xs text-rose-600/80">Resolution deadline passed without resolution.</div>
          </div>
          <button class="btn-secondary text-xs" @click="router.push('/incidents')">Review</button>
        </div>
      </div>
      <div v-if="warningCount" class="card p-4 border-amber-200 bg-amber-50/60">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-5 h-5"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
          </div>
          <div class="flex-1">
            <div class="text-sm font-semibold text-amber-700">{{ warningCount }} ticket(s) approaching SLA</div>
            <div class="text-xs text-amber-600/80">More than 80% of the deadline window has elapsed.</div>
          </div>
          <button class="btn-secondary text-xs" @click="router.push('/incidents')">Review</button>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
      <StatCard title="Total Tickets" :value="tickets.tickets.length" icon="ticket" tone="info" />
      <StatCard title="Open" :value="tickets.openCount" icon="inbox" tone="info" />
      <StatCard title="Pending" :value="tickets.pendingCount" icon="clock" tone="warning" />
      <StatCard title="Resolved Today" :value="tickets.resolvedTodayCount" icon="check" tone="success" />
      <StatCard title="SLA Breaches" :value="breachedCount" icon="alert" tone="danger"
        :hint="warningCount ? `${warningCount} approaching` : ''" />
      <StatCard title="Avg Resolution" :value="avgResolutionLabel" icon="clock" tone="default"
        :hint="slaCompliance != null ? `SLA ${slaCompliance.toFixed(0)}%` : 'No data yet'" />
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
      <div class="card p-5">
        <h3 class="text-sm font-semibold text-slate-900 mb-1">SLA Compliance by Level</h3>
        <p class="text-xs text-slate-500 mb-4">% met against resolution deadline</p>
        <BarChart :data="slaByLevelData" :height="180" />
      </div>
      <div class="card p-5">
        <h3 class="text-sm font-semibold text-slate-900 mb-1">Escalation Volume</h3>
        <p class="text-xs text-slate-500 mb-4">Outgoing escalations originating at each level</p>
        <BarChart :data="escalationVolumeData" :height="180" />
      </div>
    </div>

    <SupportMetricsTable />

    <div class="card p-0 overflow-hidden">
      <div class="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
        <h3 class="text-sm font-semibold text-slate-900">Recent Activity</h3>
        <div class="flex items-center gap-2">
          <span class="text-xs text-slate-500">My open: {{ myTicketsCount }}</span>
          <button class="btn-ghost text-xs" @click="router.push('/incidents')">View all</button>
        </div>
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
</template>
