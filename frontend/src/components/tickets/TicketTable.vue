<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useUsersStore } from '../../stores/users';
import { useAuthStore } from '../../stores/auth';
import StatusBadge from '../common/StatusBadge.vue';
import PriorityBadge from '../common/PriorityBadge.vue';
import LevelBadge from '../common/LevelBadge.vue';
import { relativeTime } from '../../utils/format';
import { usePermissions } from '../../composables/usePermissions';

const props = defineProps({
  tickets: { type: Array, required: true },
});
const emit = defineEmits(['escalate', 'resolve', 'close']);

const router = useRouter();
const users = useUsersStore();
const auth = useAuthStore();
const perms = usePermissions();

const view = (id) => router.push(`/tickets/${id}`);

const requesterName = (id) => users.byId(id)?.fullName || '—';
const groupName = (id) => users.groupById(id)?.name || '—';

const empty = computed(() => props.tickets.length === 0);
</script>

<template>
  <div class="card overflow-hidden">
    <div class="overflow-x-auto">
      <table class="min-w-full text-sm">
        <thead>
          <tr>
            <th class="table-th">Ticket #</th>
            <th class="table-th">Type</th>
            <th class="table-th">Title</th>
            <th class="table-th">Requester</th>
            <th class="table-th">Status</th>
            <th class="table-th">Priority</th>
            <th class="table-th">Level</th>
            <th class="table-th">Group</th>
            <th class="table-th">Country</th>
            <th class="table-th">City</th>
            <th class="table-th">Updated</th>
            <th class="table-th text-right pr-4">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="empty">
            <td colspan="12" class="text-center py-12 text-slate-400">
              <div class="text-sm">No tickets match the current filters.</div>
            </td>
          </tr>
          <tr
            v-for="t in tickets"
            :key="t.id"
            class="hover:bg-slate-50 transition-colors cursor-pointer"
            @click="view(t.id)"
          >
            <td class="table-td font-mono text-xs text-brand-700 font-semibold">{{ t.ticketNumber }}</td>
            <td class="table-td">
              <span class="text-xs px-1.5 py-0.5 rounded border capitalize"
                :class="t.type === 'incident' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-sky-50 text-sky-700 border-sky-200'">
                {{ t.type }}
              </span>
            </td>
            <td class="table-td max-w-xs">
              <div class="font-medium text-slate-800 truncate">{{ t.title }}</div>
              <div class="text-xs text-slate-500 truncate">{{ t.category }} · {{ t.subcategory }}</div>
            </td>
            <td class="table-td">{{ requesterName(t.requesterId) }}</td>
            <td class="table-td"><StatusBadge :status="t.status" /></td>
            <td class="table-td"><PriorityBadge :priority="t.priority" /></td>
            <td class="table-td"><LevelBadge :level="t.currentLevel" /></td>
            <td class="table-td">{{ groupName(t.assignedGroupId) }}</td>
            <td class="table-td">{{ t.locationCountry }}</td>
            <td class="table-td">{{ t.locationCity }}</td>
            <td class="table-td text-slate-500 whitespace-nowrap">{{ relativeTime(t.updatedAt) }}</td>
            <td class="table-td text-right pr-4 whitespace-nowrap" @click.stop>
              <div class="inline-flex items-center gap-1">
                <button class="btn-ghost px-2 py-1 text-xs" @click="view(t.id)" title="View">View</button>
                <button
                  v-if="perms.canEdit(t) && perms.canEscalateTo.value.length"
                  class="btn-ghost px-2 py-1 text-xs text-amber-700"
                  @click="emit('escalate', t)"
                  title="Escalate"
                >Escalate</button>
                <button
                  v-if="perms.canResolve(t) && !['resolved','closed','cancelled'].includes(t.status)"
                  class="btn-ghost px-2 py-1 text-xs text-emerald-700"
                  @click="emit('resolve', t)"
                  title="Resolve"
                >Resolve</button>
                <button
                  v-if="perms.canClose(t) && t.status !== 'closed' && t.status !== 'cancelled'"
                  class="btn-ghost px-2 py-1 text-xs text-slate-700"
                  @click="emit('close', t)"
                  title="Close"
                >Close</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
