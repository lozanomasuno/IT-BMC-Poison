<script setup>
import { useToastStore } from '../../stores/toasts';
const toasts = useToastStore();

const toneClass = (type) => ({
  success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
  error:   'bg-rose-50 border-rose-200 text-rose-800',
  warning: 'bg-amber-50 border-amber-200 text-amber-800',
  info:    'bg-sky-50 border-sky-200 text-sky-800',
}[type] || 'bg-slate-50 border-slate-200 text-slate-800');
</script>

<template>
  <Teleport to="body">
    <div class="fixed top-4 right-4 z-[60] flex flex-col gap-2 w-[320px] max-w-[calc(100vw-2rem)]">
      <transition-group name="toast" tag="div" class="flex flex-col gap-2">
        <div v-for="t in toasts.items" :key="t.id"
             class="rounded-lg border shadow-card px-4 py-3 text-sm flex items-start gap-3"
             :class="toneClass(t.type)">
          <div class="flex-1">{{ t.message }}</div>
          <button class="text-slate-400 hover:text-slate-700" @click="toasts.dismiss(t.id)">×</button>
        </div>
      </transition-group>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-enter-active, .toast-leave-active { transition: all .2s ease; }
.toast-enter-from { opacity: 0; transform: translateX(20px); }
.toast-leave-to   { opacity: 0; transform: translateX(20px); }
</style>
