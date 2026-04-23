<script setup>
import { ref, computed } from 'vue';
import { useTicketsStore } from '../../stores/tickets';
import { useUsersStore } from '../../stores/users';
import { useAuthStore } from '../../stores/auth';
import { useToastStore } from '../../stores/toasts';
import { ROLE_LABELS } from '../../utils/constants';
import Modal from '../common/Modal.vue';

const props = defineProps({
  ticketIds: { type: Array, required: true },
  open: { type: Boolean, required: true },
});
const emit = defineEmits(['close', 'done']);

const tickets = useTicketsStore();
const users = useUsersStore();
const auth = useAuthStore();
const toasts = useToastStore();

const groupId = ref(users.groups[0]?.id ?? null);
const agentId = ref(null);
const submitting = ref(false);

const eligibleAgents = computed(() =>
  users.agents.filter((u) => u.groupId === Number(groupId.value))
);

const submit = async () => {
  if (!auth.currentUser || !agentId.value) return;
  submitting.value = true;
  const group = users.groupById(Number(groupId.value));
  const agent = users.byId(Number(agentId.value));
  let ok = 0; let fail = 0;
  for (const id of props.ticketIds) {
    const t = tickets.byId(id);
    if (!t) { fail++; continue; }
    const now = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
    try {
      await tickets.updateTicket(id, {
        assignedGroupId: Number(groupId.value),
        assignedTo: Number(agentId.value),
        currentLevel: group?.level || t.currentLevel,
        history: [
          ...(t.history || []),
          {
            date: now,
            action: 'Bulk reassigned',
            performedBy: auth.currentUser.username,
            level: group?.level || t.currentLevel,
            notes: `Bulk reassigned to ${agent?.fullName} (${group?.name}).`,
          },
        ],
      });
      ok++;
    } catch { fail++; }
  }
  submitting.value = false;
  if (ok)   toasts.success(`Reassigned ${ok} ticket${ok > 1 ? 's' : ''} to ${agent?.fullName}.`);
  if (fail) toasts.error(`${fail} ticket${fail > 1 ? 's' : ''} failed to update.`);
  emit('done');
  emit('close');
};
</script>

<template>
  <Modal :open="open" title="Bulk Reassign" size="md" @close="$emit('close')">
    <div class="space-y-4">
      <div class="text-sm text-slate-600">
        Reassigning <span class="font-semibold text-slate-900">{{ ticketIds.length }}</span> ticket(s).
      </div>
      <div>
        <label class="label">Target Group</label>
        <select v-model="groupId" class="input">
          <option v-for="g in users.groups" :key="g.id" :value="g.id">
            {{ g.name }} ({{ g.level }})
          </option>
        </select>
      </div>
      <div>
        <label class="label">Assignee</label>
        <select v-model="agentId" class="input">
          <option :value="null" disabled>Select assignee…</option>
          <option v-for="u in eligibleAgents" :key="u.id" :value="u.id">
            {{ u.fullName }} — {{ ROLE_LABELS[u.role] }}
          </option>
        </select>
      </div>
    </div>
    <template #footer>
      <button class="btn-secondary" @click="$emit('close')">Cancel</button>
      <button class="btn-primary" :disabled="submitting || !agentId || !ticketIds.length" @click="submit">
        {{ submitting ? 'Reassigning…' : `Reassign ${ticketIds.length}` }}
      </button>
    </template>
  </Modal>
</template>
