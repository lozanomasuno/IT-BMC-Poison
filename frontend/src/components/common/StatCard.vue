<script setup>
defineProps({
  title: { type: String, required: true },
  value: { type: [String, Number], required: true },
  hint: { type: String, default: '' },
  tone: { type: String, default: 'default' }, // default | success | warning | danger | info
  icon: { type: String, default: 'ticket' },
});

const toneMap = {
  default: 'bg-slate-50 text-slate-600',
  info:    'bg-sky-50 text-sky-600',
  success: 'bg-emerald-50 text-emerald-600',
  warning: 'bg-amber-50 text-amber-600',
  danger:  'bg-rose-50 text-rose-600',
};
</script>

<template>
  <div class="card p-5">
    <div class="flex items-start justify-between">
      <div>
        <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">{{ title }}</p>
        <div class="mt-2 text-3xl font-bold text-slate-900">{{ value }}</div>
        <p v-if="hint" class="mt-1 text-xs text-slate-500">{{ hint }}</p>
      </div>
      <div class="w-10 h-10 rounded-lg flex items-center justify-center" :class="toneMap[tone]">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="w-5 h-5">
          <template v-if="icon === 'ticket'">
            <path d="M3 9a2 2 0 012-2h14a2 2 0 012 2v2a2 2 0 100 4v2a2 2 0 01-2 2H5a2 2 0 01-2-2v-2a2 2 0 100-4V9z"/>
            <path d="M13 7v10"/>
          </template>
          <template v-else-if="icon === 'inbox'">
            <path d="M3 13l3-9h12l3 9"/>
            <path d="M3 13v6a2 2 0 002 2h14a2 2 0 002-2v-6h-6l-2 3h-4l-2-3H3z"/>
          </template>
          <template v-else-if="icon === 'clock'">
            <circle cx="12" cy="12" r="9"/>
            <path d="M12 7v5l3 2"/>
          </template>
          <template v-else-if="icon === 'check'">
            <circle cx="12" cy="12" r="9"/>
            <path d="m8 12 3 3 5-6"/>
          </template>
          <template v-else-if="icon === 'alert'">
            <path d="M12 3l10 17H2L12 3z"/>
            <path d="M12 10v4M12 17h.01"/>
          </template>
          <template v-else-if="icon === 'user'">
            <circle cx="12" cy="8" r="4"/>
            <path d="M4 21v-1a6 6 0 0112 0v1"/>
          </template>
        </svg>
      </div>
    </div>
  </div>
</template>
