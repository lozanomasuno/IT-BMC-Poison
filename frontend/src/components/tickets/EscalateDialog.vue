<script setup>
import { ref } from 'vue';
import { useTicketsStore } from '../../stores/tickets';
import { useAuthStore } from '../../stores/auth';
import Modal from '../common/Modal.vue';

const props = defineProps({
  ticket: { type: Object, required: true },
  open: { type: Boolean, required: true },
});
const emit = defineEmits(['close', 'done']);

const tickets = useTicketsStore();
const auth = useAuthStore();

const targetLevel = ref(auth.canEscalateTo[0] || 'L2');
const notes = ref('');
const submitting = ref(false);

const submit = async () => {
  if (!auth.currentUser) return;
  submitting.value = true;
  try {
    await tickets.escalateTicket(props.ticket.id, targetLevel.value, auth.currentUser, useUsersStore_safe(), notes.value);
    emit('done');
    emit('close');
  } finally {
    submitting.value = false;
  }
};

// Lazy import to avoid cyclic concerns
import { useUsersStore } from '../../stores/users';
function useUsersStore_safe() { return useUsersStore(); }
</script>

<template>
  <Modal :open="open" title="Escalate Ticket" size="md" @close="$emit('close')">
    <div class="space-y-4">
      <div class="text-sm text-slate-600">
        Escalating <span class="font-mono font-semibold text-slate-900">{{ ticket.ticketNumber }}</span>
        from <span class="font-semibold">{{ ticket.currentLevel }}</span>.
      </div>
      <div>
        <label class="label">Target Level</label>
        <select v-model="targetLevel" class="input">
          <option v-for="l in auth.canEscalateTo" :key="l" :value="l">{{ l }}</option>
        </select>
      </div>
      <div>
        <label class="label">Escalation Notes</label>
        <textarea v-model="notes" rows="3" class="input" placeholder="Reason for escalation…"></textarea>
      </div>
    </div>
    <template #footer>
      <button class="btn-secondary" @click="$emit('close')">Cancel</button>
      <button class="btn-primary" :disabled="submitting" @click="submit">
        {{ submitting ? 'Escalating…' : 'Escalate' }}
      </button>
    </template>
  </Modal>
</template>
