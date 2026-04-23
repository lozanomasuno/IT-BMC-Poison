<script setup>
import { STATUS_BADGE, STATUS_LABELS } from '../../utils/constants';
defineProps({ status: { type: String, required: true } });
</script>

<template>
  <span
    class="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border"
    :class="STATUS_BADGE[status] || 'bg-slate-100 text-slate-600 border-slate-200'"
  >
    <span class="w-1.5 h-1.5 rounded-full bg-current opacity-70"></span>
    {{ STATUS_LABELS[status] || status }}
  </span>
</template>
