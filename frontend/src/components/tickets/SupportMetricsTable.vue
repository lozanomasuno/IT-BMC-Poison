<script setup>
import { computed } from 'vue';
import { useTicketsStore } from '../../stores/tickets';
import { formatDuration } from '../../utils/sla';

const tickets = useTicketsStore();
const rows = computed(() => tickets.metricsBySupportLevel);

const fmtPct = (v) => v == null ? '—' : `${v.toFixed(0)}%`;
const pctTone = (v) => {
  if (v == null) return 'text-slate-500';
  if (v >= 90) return 'text-emerald-700';
  if (v >= 70) return 'text-amber-700';
  return 'text-rose-700';
};
</script>

<template>
  <div class="card p-0 overflow-hidden">
    <div class="px-5 py-4 border-b border-slate-200 dark:border-slate-800">
      <h3 class="text-sm font-semibold text-slate-900 dark:text-white">Support Performance by Level</h3>
      <p class="text-xs text-slate-500 dark:text-slate-400">Volume, response, resolution, and SLA compliance.</p>
    </div>
    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr>
            <th class="table-th">Level</th>
            <th class="table-th text-right">Assigned</th>
            <th class="table-th text-right">Resolved</th>
            <th class="table-th text-right">Escalated</th>
            <th class="table-th text-right">Avg Response</th>
            <th class="table-th text-right">Avg Resolution</th>
            <th class="table-th text-right">SLA %</th>
            <th class="table-th text-right">Open</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in rows" :key="r.level" class="hover:bg-slate-50 dark:hover:bg-slate-800/50">
            <td class="table-td font-semibold">{{ r.level }}</td>
            <td class="table-td text-right">{{ r.received }}</td>
            <td class="table-td text-right">{{ r.resolved }}</td>
            <td class="table-td text-right">{{ r.escalated }}</td>
            <td class="table-td text-right">{{ formatDuration(r.avgResponseMs) }}</td>
            <td class="table-td text-right">{{ formatDuration(r.avgResolutionMs) }}</td>
            <td class="table-td text-right font-semibold" :class="pctTone(r.slaCompliance)">{{ fmtPct(r.slaCompliance) }}</td>
            <td class="table-td text-right">{{ r.open }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
