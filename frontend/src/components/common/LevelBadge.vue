<script setup>
import { LEVEL_BADGE } from '../../utils/constants';
defineProps({ level: { type: String, required: true } });
</script>

<template>
  <span
    class="inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-md border tracking-wide"
    :class="LEVEL_BADGE[level] || 'bg-slate-100 text-slate-600 border-slate-200'"
  >
    {{ level }}
  </span>
</template>
