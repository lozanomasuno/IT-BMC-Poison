<script setup>
import { ref, computed } from 'vue';
import { useTicketsStore } from '../../stores/tickets';
import { useUsersStore } from '../../stores/users';
import { useAuthStore } from '../../stores/auth';
import { useToastStore } from '../../stores/toasts';
import { ROLE_LABELS } from '../../utils/constants';
import Modal from '../common/Modal.vue';

const props = defineProps({
  ticket: { type: Object, required: true },
  open: { type: Boolean, required: true },
});
const emit = defineEmits(['close', 'done']);

const tickets = useTicketsStore();
const users = useUsersStore();
const auth = useAuthStore();
const toasts = useToastStore();

const targetGroupId = ref(props.ticket.assignedGroupId);
const targetAgentId = ref(props.ticket.assignedTo);
const note = ref('');
const submitting = ref(false);

const eligibleAgents = computed(() =>
  users.agents.filter((u) => u.groupId === Number(targetGroupId.value))
);

const submit = async () => {
  if (!auth.currentUser) return;
  submitting.value = true;
  try {
    const group = users.groupById(Number(targetGroupId.value));
    const agent = users.byId(Number(targetAgentId.value));
    const now = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
    await tickets.updateTicket(props.ticket.id, {
      assignedGroupId: Number(targetGroupId.value),
      assignedTo: Number(targetAgentId.value),
      currentLevel: group?.level || props.ticket.currentLevel,
      history: [
        ...(props.ticket.history || []),
        {
          date: now,
          action: 'Reassigned',
          performedBy: auth.currentUser.username,
          level: group?.level || props.ticket.currentLevel,
          notes: `Reassigned to ${agent?.fullName} (${group?.name}). ${note.value}`.trim(),
        },
      ],
    });
    toasts.success(`Ticket ${props.ticket.ticketNumber} reassigned to ${agent?.fullName}.`);
    emit('done');
    emit('close');
  } catch (e) {
    toasts.error(`Reassign failed: ${e.message}`);
  } finally {
    submitting.value = false;
  }
};
</script>

<template>
  <Modal :open="open" title="Reassign Ticket" size="md" @close="$emit('close')">
    <div class="space-y-4">
      <div class="text-sm text-slate-600">
        Reassigning <span class="font-mono font-semibold text-slate-900">{{ ticket.ticketNumber }}</span>.
      </div>
      <div>
        <label class="label">Target Group</label>
        <select v-model="targetGroupId" class="input">
          <option v-for="g in users.groups" :key="g.id" :value="g.id">
            {{ g.name }} ({{ g.level }})
          </option>
        </select>
      </div>
      <div>
        <label class="label">Assignee</label>
        <select v-model="targetAgentId" class="input">
          <option v-for="u in eligibleAgents" :key="u.id" :value="u.id">
            {{ u.fullName }} — {{ ROLE_LABELS[u.role] }}
          </option>
        </select>
      </div>
      <div>
        <label class="label">Note</label>
        <textarea v-model="note" rows="2" class="input" placeholder="Optional handover note…"></textarea>
      </div>
    </div>
    <template #footer>
      <button class="btn-secondary" @click="$emit('close')">Cancel</button>
      <button class="btn-primary" :disabled="submitting" @click="submit">
        {{ submitting ? 'Saving…' : 'Reassign' }}
      </button>
    </template>
  </Modal>
</template>
