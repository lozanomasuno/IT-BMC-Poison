<script setup>
import { computed } from 'vue';

const props = defineProps({
  data: { type: Array, required: true }, // [{ label, value, color }]
  size: { type: Number, default: 180 },
});

const total = computed(() => props.data.reduce((s, d) => s + d.value, 0) || 1);

const segments = computed(() => {
  let acc = 0;
  const C = 2 * Math.PI * 45; // r=45
  return props.data.map((d) => {
    const len = (d.value / total.value) * C;
    const seg = {
      ...d,
      stroke: len,
      gap: C - len,
      offset: -acc,
    };
    acc += len;
    return seg;
  });
});
</script>

<template>
  <div class="flex items-center gap-6">
    <svg :width="size" :height="size" viewBox="0 0 100 100" class="-rotate-90">
      <circle cx="50" cy="50" r="45" fill="none" stroke="#f1f5f9" stroke-width="10" />
      <circle
        v-for="(s, i) in segments"
        :key="i"
        cx="50" cy="50" r="45" fill="none"
        :stroke="s.color"
        stroke-width="10"
        :stroke-dasharray="`${s.stroke} ${s.gap}`"
        :stroke-dashoffset="s.offset"
      />
    </svg>
    <ul class="space-y-1.5 text-sm">
      <li v-for="(d, i) in data" :key="i" class="flex items-center gap-2">
        <span class="w-2.5 h-2.5 rounded-sm" :style="{ backgroundColor: d.color }"></span>
        <span class="text-slate-700">{{ d.label }}</span>
        <span class="ml-auto font-semibold text-slate-900">{{ d.value }}</span>
      </li>
    </ul>
  </div>
</template>
