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

const resolution = ref('');
const submitting = ref(false);

const submit = async () => {
  if (!resolution.value.trim() || !auth.currentUser) return;
  submitting.value = true;
  try {
    await tickets.resolveTicket(props.ticket.id, resolution.value.trim(), auth.currentUser);
    emit('done');
    emit('close');
  } finally {
    submitting.value = false;
  }
};
</script>

<template>
  <Modal :open="open" title="Resolve Ticket" size="md" @close="$emit('close')">
    <div class="space-y-4">
      <div class="text-sm text-slate-600">
        Resolving <span class="font-mono font-semibold text-slate-900">{{ ticket.ticketNumber }}</span>.
      </div>
      <div>
        <label class="label">Resolution Notes</label>
        <textarea v-model="resolution" rows="4" class="input" placeholder="Describe how the issue was resolved…"></textarea>
      </div>
    </div>
    <template #footer>
      <button class="btn-secondary" @click="$emit('close')">Cancel</button>
      <button class="btn-primary" :disabled="submitting || !resolution.trim()" @click="submit">
        {{ submitting ? 'Saving…' : 'Mark Resolved' }}
      </button>
    </template>
  </Modal>
</template>
