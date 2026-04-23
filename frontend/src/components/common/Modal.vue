<script setup>
defineProps({
  open: { type: Boolean, required: true },
  title: { type: String, default: '' },
  size: { type: String, default: 'md' }, // sm | md | lg
});
defineEmits(['close']);
</script>

<template>
  <Teleport to="body">
    <transition name="fade">
      <div v-if="open" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" @click="$emit('close')"></div>
        <div
          class="relative card w-full p-0 overflow-hidden"
          :class="{
            'max-w-md': size === 'sm',
            'max-w-xl': size === 'md',
            'max-w-3xl': size === 'lg',
          }"
        >
          <div class="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
            <h3 class="text-base font-semibold text-slate-900">{{ title }}</h3>
            <button class="text-slate-400 hover:text-slate-700" @click="$emit('close')">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-5 h-5">
                <path d="M6 6l12 12M18 6l-12 12" />
              </svg>
            </button>
          </div>
          <div class="p-5">
            <slot />
          </div>
          <div v-if="$slots.footer" class="px-5 py-3 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity .15s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
