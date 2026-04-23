<script setup>
import { PRIORITY_BADGE } from '../../utils/constants';
defineProps({ priority: { type: String, required: true } });
</script>

<template>
  <span
    class="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-md border capitalize"
    :class="PRIORITY_BADGE[priority] || 'bg-slate-100 text-slate-600 border-slate-200'"
  >
    {{ priority }}
  </span>
</template>
