<script setup>
import { computed } from 'vue';

const props = defineProps({
  data: { type: Array, required: true }, // [{ label, value, color? }]
  height: { type: Number, default: 220 },
});

const max = computed(() => Math.max(1, ...props.data.map((d) => d.value)));
</script>

<template>
  <div class="flex items-end gap-3" :style="{ height: height + 'px' }">
    <div v-for="d in data" :key="d.label" class="flex-1 flex flex-col items-center gap-2">
      <div class="w-full flex items-end" :style="{ height: '100%' }">
        <div
          class="w-full rounded-t-md transition-all"
          :class="d.color || 'bg-brand-500'"
          :style="{ height: (d.value / max * 100) + '%' }"
          :title="`${d.label}: ${d.value}`"
        ></div>
      </div>
      <div class="text-[11px] font-medium text-slate-600 truncate w-full text-center">{{ d.label }}</div>
      <div class="text-xs font-bold text-slate-900">{{ d.value }}</div>
    </div>
  </div>
</template>
