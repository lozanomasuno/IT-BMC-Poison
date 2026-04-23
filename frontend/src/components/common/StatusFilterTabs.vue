<script setup>
import { computed } from 'vue';
import { STATUS_FILTERS } from '../../utils/constants';

const props = defineProps({
  modelValue: { type: String, required: true },
  counts: { type: Object, required: true },
});
const emit = defineEmits(['update:modelValue']);

const filters = STATUS_FILTERS;
const select = (key) => emit('update:modelValue', key);
</script>

<template>
  <div class="flex flex-wrap gap-2">
    <button
      v-for="f in filters"
      :key="f.key"
      type="button"
      @click="select(f.key)"
      class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors"
      :class="modelValue === f.key
        ? 'bg-brand-600 text-white border-brand-600 shadow-soft'
        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'"
    >
      {{ f.label }}
      <span
        class="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
        :class="modelValue === f.key ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'"
      >{{ counts[f.key] ?? 0 }}</span>
    </button>
  </div>
</template>
