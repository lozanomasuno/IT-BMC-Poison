<script setup>
import { computed } from 'vue';
import { useNow } from '../../composables/useNow';
import { ticketSlaStatus, ticketResponseStatus, formatRemaining } from '../../utils/sla';

const props = defineProps({
  ticket: { type: Object, required: true },
  variant: { type: String, default: 'resolution' }, // 'resolution' | 'response'
  compact: { type: Boolean, default: false },
});

const now = useNow();

const status = computed(() => props.variant === 'response'
  ? ticketResponseStatus(props.ticket, now.value)
  : ticketSlaStatus(props.ticket, now.value));

const tone = computed(() => ({
  ok:       { bar: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50', ring: 'ring-emerald-200' },
  warning:  { bar: 'bg-amber-500',   text: 'text-amber-700',   bg: 'bg-amber-50',   ring: 'ring-amber-200'   },
  breached: { bar: 'bg-rose-500',    text: 'text-rose-700',    bg: 'bg-rose-50',    ring: 'ring-rose-200'    },
}[status.value.state]));

const label = computed(() => {
  if (status.value.state === 'breached') {
    return status.value.remainingMs < 0
      ? `Breached ${formatRemaining(status.value.remainingMs)}`
      : 'Breached';
  }
  if (status.value.state === 'warning') return `${status.value.label} left · warning`;
  return `${status.value.label} left`;
});
</script>

<template>
  <div :class="['rounded-lg border ring-1', tone.bg, tone.ring, compact ? 'p-2' : 'p-3']">
    <div class="flex items-center justify-between text-xs font-semibold mb-1.5" :class="tone.text">
      <span>{{ variant === 'response' ? 'First Response SLA' : 'Resolution SLA' }}</span>
      <span>{{ label }}</span>
    </div>
    <div class="w-full h-2 rounded-full bg-white/70 overflow-hidden">
      <div class="h-full rounded-full transition-all duration-300"
           :class="tone.bar"
           :style="{ width: Math.min(100, status.percent) + '%' }">
      </div>
    </div>
  </div>
</template>
