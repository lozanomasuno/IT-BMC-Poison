<script setup>
defineProps({
  modelValue: { type: String, default: '' },
  placeholder: { type: String, default: 'Search by ticket #, requester, category, group, city, country…' },
});
defineEmits(['update:modelValue']);
</script>

<template>
  <div class="relative w-full md:max-w-md">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
         class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
    <input
      :value="modelValue"
      @input="$emit('update:modelValue', $event.target.value)"
      :placeholder="placeholder"
      class="input pl-9"
    />
  </div>
</template>
