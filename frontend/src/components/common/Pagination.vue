<script setup>
import { computed } from 'vue';

const props = defineProps({
  page: { type: Number, required: true },
  totalPages: { type: Number, required: true },
  total: { type: Number, required: true },
  pageSize: { type: Number, required: true },
  start: { type: Number, default: 0 },
  end: { type: Number, default: 0 },
  pageSizes: { type: Array, default: () => [10, 25, 50, 100] },
});
const emit = defineEmits(['update:page', 'update:pageSize']);

const pages = computed(() => {
  const out = [];
  const cur = props.page;
  const last = props.totalPages;
  const add = (n) => out.push(n);
  add(1);
  if (cur - 2 > 2) out.push('…');
  for (let i = Math.max(2, cur - 1); i <= Math.min(last - 1, cur + 1); i++) add(i);
  if (cur + 2 < last - 1) out.push('…');
  if (last > 1) add(last);
  return out;
});

const goto = (n) => { if (n >= 1 && n <= props.totalPages && n !== props.page) emit('update:page', n); };
</script>

<template>
  <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3 border-t border-slate-200 bg-slate-50">
    <div class="text-xs text-slate-500">
      Showing <span class="font-semibold text-slate-700">{{ total === 0 ? 0 : start + 1 }}–{{ end }}</span>
      of <span class="font-semibold text-slate-700">{{ total }}</span>
    </div>
    <div class="flex items-center gap-3">
      <div class="flex items-center gap-1.5 text-xs text-slate-600">
        <span>Per page</span>
        <select :value="pageSize" @change="$emit('update:pageSize', Number($event.target.value))"
                class="rounded-md border border-slate-300 bg-white px-1.5 py-1 text-xs">
          <option v-for="s in pageSizes" :key="s" :value="s">{{ s }}</option>
        </select>
      </div>
      <div class="inline-flex items-center gap-1">
        <button class="btn-ghost px-2 py-1 text-xs" :disabled="page === 1" @click="goto(page - 1)">‹ Prev</button>
        <button v-for="(p, i) in pages" :key="i"
                class="px-2.5 py-1 text-xs rounded-md border"
                :class="p === page
                  ? 'bg-brand-600 text-white border-brand-600'
                  : p === '…'
                    ? 'border-transparent text-slate-400 cursor-default'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'"
                :disabled="p === '…'"
                @click="typeof p === 'number' && goto(p)">{{ p }}</button>
        <button class="btn-ghost px-2 py-1 text-xs" :disabled="page === totalPages" @click="goto(page + 1)">Next ›</button>
      </div>
    </div>
  </div>
</template>
