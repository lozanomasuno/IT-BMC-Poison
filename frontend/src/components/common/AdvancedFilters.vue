<script setup>
import { computed } from 'vue';
import { useUsersStore } from '../../stores/users';
import { useTicketsStore } from '../../stores/tickets';
import { PRIORITY_OPTIONS, LEVEL_OPTIONS } from '../../utils/table';

const props = defineProps({
  modelValue: { type: Object, required: true }, // { priority, groupId, level, from, to, breachedSla, type, country, city }
});
const emit = defineEmits(['update:modelValue', 'reset']);

const users = useUsersStore();
const tickets = useTicketsStore();
const groupOptions = computed(() => [
  { value: '', label: 'Any group' },
  ...users.groups.map((g) => ({ value: g.id, label: `${g.name} (${g.level})` })),
]);

const countryOptions = computed(() => {
  const set = new Set(tickets.tickets.map((t) => t.locationCountry).filter(Boolean));
  return [{ value: '', label: 'Any country' }, ...[...set].sort().map((v) => ({ value: v, label: v }))];
});
const cityOptions = computed(() => {
  const set = new Set(tickets.tickets
    .filter((t) => !props.modelValue.country || t.locationCountry === props.modelValue.country)
    .map((t) => t.locationCity).filter(Boolean));
  return [{ value: '', label: 'Any city' }, ...[...set].sort().map((v) => ({ value: v, label: v }))];
});

const update = (patch) => emit('update:modelValue', { ...props.modelValue, ...patch });

const hasAny = computed(() =>
  Object.values(props.modelValue).some((v) => v !== '' && v != null)
);
</script>

<template>
  <div class="card p-4 grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-3 items-end">
    <div>
      <label class="label">Priority</label>
      <select :value="modelValue.priority || ''" @change="update({ priority: $event.target.value })" class="input">
        <option v-for="o in PRIORITY_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</option>
      </select>
    </div>
    <div>
      <label class="label">Type</label>
      <select :value="modelValue.type || ''" @change="update({ type: $event.target.value })" class="input">
        <option value="">Any type</option>
        <option value="incident">Incident</option>
        <option value="request">Request</option>
      </select>
    </div>
    <div>
      <label class="label">Group</label>
      <select :value="modelValue.groupId || ''" @change="update({ groupId: $event.target.value })" class="input">
        <option v-for="o in groupOptions" :key="o.value" :value="o.value">{{ o.label }}</option>
      </select>
    </div>
    <div>
      <label class="label">Level</label>
      <select :value="modelValue.level || ''" @change="update({ level: $event.target.value })" class="input">
        <option v-for="o in LEVEL_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</option>
      </select>
    </div>
    <div>
      <label class="label">SLA</label>
      <select :value="modelValue.breachedSla || ''" @change="update({ breachedSla: $event.target.value })" class="input">
        <option value="">Any SLA state</option>
        <option value="yes">Breached</option>
        <option value="warning">Approaching (≥80%)</option>
        <option value="no">Within SLA</option>
      </select>
    </div>
    <div>
      <label class="label">Country</label>
      <select :value="modelValue.country || ''" @change="update({ country: $event.target.value, city: '' })" class="input">
        <option v-for="o in countryOptions" :key="o.value" :value="o.value">{{ o.label }}</option>
      </select>
    </div>
    <div>
      <label class="label">City</label>
      <select :value="modelValue.city || ''" @change="update({ city: $event.target.value })" class="input">
        <option v-for="o in cityOptions" :key="o.value" :value="o.value">{{ o.label }}</option>
      </select>
    </div>
    <div>
      <label class="label">Updated From</label>
      <input type="date" :value="modelValue.from || ''" @change="update({ from: $event.target.value })" class="input" />
    </div>
    <div class="flex gap-2">
      <div class="flex-1">
        <label class="label">Updated To</label>
        <input type="date" :value="modelValue.to || ''" @change="update({ to: $event.target.value })" class="input" />
      </div>
      <button v-if="hasAny" type="button" class="btn-secondary self-end" @click="$emit('reset')" title="Reset filters">
        Reset
      </button>
    </div>
  </div>
</template>
