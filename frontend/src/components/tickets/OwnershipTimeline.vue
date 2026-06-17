<script setup>
import { computed } from 'vue';
import { useNow } from '../../composables/useNow';
import { ownershipByLevel, formatDuration } from '../../utils/sla';

const props = defineProps({
  ticket: { type: Object, required: true },
});

const now = useNow();
const ownership = computed(() => ownershipByLevel(props.ticket, now.value));
const totalMs = computed(() =>
  Object.values(ownership.value).reduce((s, x) => s + x, 0)
);

const rows = computed(() => {
  const t = totalMs.value || 1;
  return ['L1', 'L2', 'L3'].map((l) => ({
    level: l,
    ms: ownership.value[l],
    pct: (ownership.value[l] / t) * 100,
  }));
});

const colorByLevel = { L1: 'bg-emerald-500', L2: 'bg-amber-500', L3: 'bg-rose-500' };
</script>

<template>
  <div>
    <div class="flex items-center justify-between text-xs text-slate-500 mb-2">
      <span>Time per support level</span>
      <span class="font-medium text-slate-700">Total {{ formatDuration(totalMs) }}</span>
    </div>
    <div class="flex w-full h-2 rounded-full overflow-hidden bg-slate-100">
      <div v-for="r in rows" :key="r.level"
           :class="colorByLevel[r.level]"
           :style="{ width: r.pct + '%' }"
           :title="`${r.level}: ${formatDuration(r.ms)}`"></div>
    </div>
    <ul class="mt-3 grid grid-cols-3 gap-3 text-xs">
      <li v-for="r in rows" :key="r.level" class="flex items-center gap-2">
        <span class="w-2.5 h-2.5 rounded-full" :class="colorByLevel[r.level]"></span>
        <div>
          <div class="font-semibold text-slate-700">{{ r.level }}</div>
          <div class="text-slate-500">{{ formatDuration(r.ms) }}</div>
        </div>
      </li>
    </ul>
  </div>
</template>
