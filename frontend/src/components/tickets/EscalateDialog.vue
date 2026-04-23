<script setup>
import { ref, computed, watch } from 'vue';
import { useTicketsStore } from '../../stores/tickets';
import { useAuthStore } from '../../stores/auth';
import { useUsersStore } from '../../stores/users';
import { useToastStore } from '../../stores/toasts';
import { usePermissions } from '../../composables/usePermissions';
import { CATEGORY_ROUTING, DEFAULT_GROUP_BY_LEVEL, LEVEL_LABEL } from '../../utils/constants';
import Modal from '../common/Modal.vue';

const props = defineProps({
  ticket: { type: Object, required: true },
  open: { type: Boolean, required: true },
});
const emit = defineEmits(['close', 'done']);

const tickets = useTicketsStore();
const auth = useAuthStore();
const users = useUsersStore();
const toasts = useToastStore();
const perms = usePermissions();

// Only forward levels from the ticket's current level are offered.
const validTargets = computed(() => perms.canEscalateFrom(props.ticket.currentLevel));
const targetLevel = ref(validTargets.value[0] || 'L2');
const notes = ref('');
const submitting = ref(false);

watch(() => props.open, (o) => {
  if (o) {
    targetLevel.value = validTargets.value[0] || 'L2';
    notes.value = '';
  }
});

// Mirror the store's routing logic so the user sees where the ticket will go.
const projectedGroupName = computed(() => {
  const t = props.ticket;
  const haystack = `${t.category || ''} ${t.subcategory || ''} ${t.title || ''}`;
  const rule = CATEGORY_ROUTING.find((r) => r.level === targetLevel.value && r.match.test(haystack));
  if (rule) return `${rule.groupName} (category routing)`;
  return DEFAULT_GROUP_BY_LEVEL[targetLevel.value] || '—';
});

const submit = async () => {
  if (!auth.currentUser) return;
  submitting.value = true;
  try {
    await tickets.escalateTicket(
      props.ticket.id,
      targetLevel.value,
      auth.currentUser,
      users,
      notes.value,
      { force: auth.isManager },
    );
    toasts.success(`Ticket ${props.ticket.ticketNumber} escalated to ${targetLevel.value}.`);
    emit('done');
    emit('close');
  } catch (e) {
    toasts.error(`Escalation failed: ${e.message}`);
  } finally {
    submitting.value = false;
  }
};
</script>

<template>
  <Modal :open="open" title="Escalate Ticket" size="md" @close="$emit('close')">
    <div class="space-y-4">
      <div class="text-sm text-slate-600">
        Escalating <span class="font-mono font-semibold text-slate-900">{{ ticket.ticketNumber }}</span>
        from <span class="font-semibold">{{ ticket.currentLevel }}</span>.
      </div>

      <div v-if="!validTargets.length" class="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-md p-3">
        No further escalation is possible from {{ ticket.currentLevel }}.
      </div>

      <template v-else>
        <div>
          <label class="label">Target Level</label>
          <select v-model="targetLevel" class="input">
            <option v-for="l in validTargets" :key="l" :value="l">{{ LEVEL_LABEL[l] || l }}</option>
          </select>
        </div>

        <div class="rounded-md border border-slate-200 bg-slate-50 p-3 text-xs">
          <div class="font-semibold text-slate-700 mb-1">Routing preview</div>
          <div class="text-slate-600">
            Will be assigned to group: <span class="font-medium text-slate-900">{{ projectedGroupName }}</span>
          </div>
          <div class="text-slate-500 mt-1">Status will move to <span class="font-medium">assigned</span> and the previous individual assignee will be cleared.</div>
        </div>

        <div>
          <label class="label">Escalation Notes</label>
          <textarea v-model="notes" rows="3" class="input" placeholder="Reason for escalation…"></textarea>
        </div>
      </template>
    </div>
    <template #footer>
      <button class="btn-secondary" @click="$emit('close')">Cancel</button>
      <button class="btn-primary" :disabled="submitting || !validTargets.length" @click="submit">
        {{ submitting ? 'Escalating…' : 'Escalate' }}
      </button>
    </template>
  </Modal>
</template>
