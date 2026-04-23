<script setup>
import { computed } from 'vue';
import { LEVEL_ORDER } from '../../utils/constants';

const props = defineProps({
  level: { type: String, required: true }, // 'L1' | 'L2' | 'L3'
});

const steps = ['L1', 'L2', 'L3'];
const currentIdx = computed(() => (LEVEL_ORDER[props.level] || 1) - 1);
</script>

<template>
  <div class="flex items-center gap-1.5">
    <template v-for="(s, i) in steps" :key="s">
      <span
        class="px-2 py-0.5 rounded-md text-[11px] font-semibold border"
        :class="i === currentIdx
          ? 'bg-brand-600 text-white border-brand-600'
          : i < currentIdx
            ? 'bg-slate-100 text-slate-600 border-slate-200'
            : 'bg-white text-slate-400 border-slate-200'"
      >{{ s }}</span>
      <svg v-if="i < steps.length - 1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
           class="w-3 h-3 text-slate-400">
        <path d="M9 6l6 6-6 6" stroke-linecap="round"/>
      </svg>
    </template>
  </div>
</template>
