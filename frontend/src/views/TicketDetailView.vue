<script setup>
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useTicketsStore } from '../stores/tickets';
import { useUsersStore } from '../stores/users';
import { useAuthStore } from '../stores/auth';
import StatusBadge from '../components/common/StatusBadge.vue';
import PriorityBadge from '../components/common/PriorityBadge.vue';
import LevelBadge from '../components/common/LevelBadge.vue';
import EscalateDialog from '../components/tickets/EscalateDialog.vue';
import ResolveDialog from '../components/tickets/ResolveDialog.vue';
import { formatDate, relativeTime } from '../utils/format';
import { usePermissions } from '../composables/usePermissions';

const route = useRoute();
const router = useRouter();
const tickets = useTicketsStore();
const users = useUsersStore();
const auth = useAuthStore();
const perms = usePermissions();

const ticket = computed(() => tickets.byId(route.params.id));
const requester = computed(() => ticket.value ? users.byId(ticket.value.requesterId) : null);
const assignee = computed(() => ticket.value ? users.byId(ticket.value.assignedTo) : null);
const group = computed(() => ticket.value ? users.groupById(ticket.value.assignedGroupId) : null);

const escalations = computed(() =>
  (ticket.value?.history || []).filter((h) => h.action?.startsWith('Escalated'))
);

const showEscalate = ref(false);
const showResolve = ref(false);

const note = ref('');
const submittingNote = ref(false);
const addNote = async () => {
  if (!note.value.trim() || !ticket.value || !auth.currentUser) return;
  submittingNote.value = true;
  try {
    await tickets.addWorkNote(ticket.value.id, note.value.trim(), auth.currentUser);
    note.value = '';
  } finally {
    submittingNote.value = false;
  }
};

const closeIt = async () => {
  if (!ticket.value || !auth.currentUser) return;
  if (!confirm(`Close ticket ${ticket.value.ticketNumber}?`)) return;
  await tickets.closeTicket(ticket.value.id, auth.currentUser);
};
</script>

<template>
  <div v-if="!ticket" class="card p-8 text-center text-slate-500">Loading ticket…</div>

  <div v-else class="space-y-5">
    <div class="flex items-center gap-3">
      <button class="btn-ghost text-sm" @click="router.back()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4">
          <path d="m15 18-6-6 6-6"/>
        </svg>
        Back
      </button>
      <div class="font-mono text-sm text-brand-700 font-semibold">{{ ticket.ticketNumber }}</div>
      <StatusBadge :status="ticket.status" />
      <PriorityBadge :priority="ticket.priority" />
      <LevelBadge :level="ticket.currentLevel" />
      <span v-if="ticket.breachedSla" class="text-xs px-2 py-0.5 rounded-md border bg-rose-50 text-rose-700 border-rose-200">SLA breached</span>

      <div class="ml-auto flex items-center gap-2">
        <button v-if="perms.canEdit(ticket) && perms.canEscalateTo.value.length"
                class="btn-secondary text-amber-700" @click="showEscalate = true">Escalate</button>
        <button v-if="perms.canResolve(ticket) && !['resolved','closed','cancelled'].includes(ticket.status)"
                class="btn-secondary text-emerald-700" @click="showResolve = true">Resolve</button>
        <button v-if="perms.canClose(ticket) && !['closed','cancelled'].includes(ticket.status)"
                class="btn-primary" @click="closeIt">Close</button>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <div class="lg:col-span-2 space-y-5">
        <div class="card p-5">
          <h2 class="text-lg font-semibold text-slate-900">{{ ticket.title }}</h2>
          <p class="text-xs text-slate-500 mt-0.5">{{ ticket.category }} · {{ ticket.subcategory }}</p>
          <p class="mt-4 text-sm text-slate-700 whitespace-pre-wrap">{{ ticket.description }}</p>
        </div>

        <div class="card p-5">
          <h3 class="text-sm font-semibold text-slate-900 mb-3">Activity Timeline</h3>
          <ol class="relative border-l border-slate-200 pl-5 space-y-4">
            <li v-for="(h, i) in ticket.history" :key="i" class="relative">
              <span class="absolute -left-[27px] top-1 w-3 h-3 rounded-full bg-brand-500 ring-4 ring-brand-50"></span>
              <div class="text-sm font-medium text-slate-800">{{ h.action }}</div>
              <div class="text-xs text-slate-500">
                {{ h.performedBy }} · {{ formatDate(h.date) }} · <span class="font-medium">{{ h.level }}</span>
              </div>
              <div v-if="h.notes" class="mt-1 text-sm text-slate-600">{{ h.notes }}</div>
            </li>
          </ol>
        </div>

        <div class="card p-5">
          <h3 class="text-sm font-semibold text-slate-900 mb-3">Work Notes</h3>
          <div v-if="perms.canEdit(ticket)" class="space-y-2 mb-4">
            <textarea v-model="note" rows="3" class="input" placeholder="Add a work note…"></textarea>
            <div class="flex justify-end">
              <button class="btn-primary" :disabled="submittingNote || !note.trim()" @click="addNote">
                {{ submittingNote ? 'Saving…' : 'Add Note' }}
              </button>
            </div>
          </div>
          <ul class="space-y-2">
            <li v-for="(h, i) in ticket.history.filter((x) => x.action === 'Work note')" :key="i"
                class="rounded-lg border border-slate-200 p-3 bg-slate-50">
              <div class="text-xs text-slate-500">{{ h.performedBy }} · {{ formatDate(h.date) }}</div>
              <div class="text-sm text-slate-700 mt-1">{{ h.notes }}</div>
            </li>
            <li v-if="!ticket.history.some((x) => x.action === 'Work note')" class="text-xs text-slate-400">
              No work notes yet.
            </li>
          </ul>
        </div>

        <div v-if="ticket.resolution" class="card p-5">
          <h3 class="text-sm font-semibold text-slate-900 mb-2">Resolution Notes</h3>
          <p class="text-sm text-slate-700 whitespace-pre-wrap">{{ ticket.resolution }}</p>
          <p class="text-xs text-slate-500 mt-2">Resolved {{ relativeTime(ticket.resolvedAt) }}</p>
        </div>

        <div class="card p-5">
          <h3 class="text-sm font-semibold text-slate-900 mb-2">Escalation History</h3>
          <ul v-if="escalations.length" class="space-y-2">
            <li v-for="(e, i) in escalations" :key="i" class="text-sm text-slate-700">
              <span class="font-medium">{{ e.action }}</span>
              <span class="text-xs text-slate-500"> · {{ e.performedBy }} · {{ formatDate(e.date) }}</span>
              <div class="text-xs text-slate-500">{{ e.notes }}</div>
            </li>
          </ul>
          <p v-else class="text-xs text-slate-400">No escalations recorded.</p>
        </div>

        <div class="card p-5">
          <h3 class="text-sm font-semibold text-slate-900 mb-2">Attachments</h3>
          <div class="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center text-xs text-slate-400">
            Attachments are not enabled in the demo backend.
          </div>
        </div>
      </div>

      <aside class="space-y-5">
        <div class="card p-5">
          <h3 class="text-sm font-semibold text-slate-900 mb-3">Details</h3>
          <dl class="text-sm space-y-2.5">
            <div class="flex justify-between gap-3">
              <dt class="text-slate-500">Type</dt>
              <dd class="capitalize text-slate-800">{{ ticket.type }}</dd>
            </div>
            <div class="flex justify-between gap-3">
              <dt class="text-slate-500">Source</dt>
              <dd class="capitalize text-slate-800">{{ ticket.source }}</dd>
            </div>
            <div class="flex justify-between gap-3">
              <dt class="text-slate-500">Impact</dt>
              <dd class="capitalize text-slate-800">{{ ticket.impact }}</dd>
            </div>
            <div class="flex justify-between gap-3">
              <dt class="text-slate-500">Urgency</dt>
              <dd class="capitalize text-slate-800">{{ ticket.urgency }}</dd>
            </div>
            <div class="flex justify-between gap-3">
              <dt class="text-slate-500">SLA (h)</dt>
              <dd class="text-slate-800">{{ ticket.slaHours }}</dd>
            </div>
            <div class="flex justify-between gap-3">
              <dt class="text-slate-500">Created</dt>
              <dd class="text-slate-800">{{ formatDate(ticket.createdAt) }}</dd>
            </div>
            <div class="flex justify-between gap-3">
              <dt class="text-slate-500">Updated</dt>
              <dd class="text-slate-800">{{ relativeTime(ticket.updatedAt) }}</dd>
            </div>
          </dl>
        </div>

        <div class="card p-5">
          <h3 class="text-sm font-semibold text-slate-900 mb-3">Requester</h3>
          <div v-if="requester" class="flex items-center gap-3">
            <img :src="requester.avatar" :alt="requester.fullName" class="w-10 h-10 rounded-full border" />
            <div>
              <div class="text-sm font-medium text-slate-800">{{ requester.fullName }}</div>
              <div class="text-xs text-slate-500">{{ requester.email }}</div>
              <div class="text-xs text-slate-500">{{ requester.city }}, {{ requester.country }}</div>
            </div>
          </div>
        </div>

        <div class="card p-5">
          <h3 class="text-sm font-semibold text-slate-900 mb-3">Assignment</h3>
          <div v-if="assignee" class="flex items-center gap-3 mb-3">
            <img :src="assignee.avatar" :alt="assignee.fullName" class="w-10 h-10 rounded-full border" />
            <div>
              <div class="text-sm font-medium text-slate-800">{{ assignee.fullName }}</div>
              <div class="text-xs text-slate-500">{{ assignee.email }}</div>
            </div>
          </div>
          <div class="text-xs text-slate-500">Group</div>
          <div class="text-sm text-slate-800">{{ group?.name || '—' }} <span class="text-xs text-slate-500">({{ group?.level }})</span></div>
        </div>
      </aside>
    </div>

    <EscalateDialog v-if="showEscalate" :ticket="ticket" :open="showEscalate" @close="showEscalate = false" />
    <ResolveDialog v-if="showResolve" :ticket="ticket" :open="showResolve" @close="showResolve = false" />
  </div>
</template>
