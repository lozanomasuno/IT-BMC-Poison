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
  sort: { type: Object, default: () => ({ key: 'updatedAt', dir: 'desc' }) },
  selection: { type: Array, default: null },
  showReassign: { type: Boolean, default: false },
});
const emit = defineEmits(['escalate', 'resolve', 'close', 'reassign', 'sort', 'update:selection']);

const router = useRouter();
const users = useUsersStore();
const auth = useAuthStore();
const perms = usePermissions();

const view = (id) => router.push(`/tickets/${id}`);
const requesterName = (id) => users.byId(id)?.fullName || '—';
const groupName = (id) => users.groupById(id)?.name || '—';
const empty = computed(() => props.tickets.length === 0);
const selectionEnabled = computed(() => Array.isArray(props.selection));

const allSelected = computed(() =>
  selectionEnabled.value && props.tickets.length > 0
    && props.tickets.every((t) => props.selection.includes(t.id))
);
const someSelected = computed(() =>
  selectionEnabled.value && props.tickets.some((t) => props.selection.includes(t.id))
);

const toggleAll = () => {
  if (!selectionEnabled.value) return;
  if (allSelected.value) {
    const remaining = props.selection.filter((id) => !props.tickets.some((t) => t.id === id));
    emit('update:selection', remaining);
  } else {
    const ids = new Set(props.selection);
    props.tickets.forEach((t) => ids.add(t.id));
    emit('update:selection', [...ids]);
  }
};
const toggleOne = (id) => {
  if (!selectionEnabled.value) return;
  const set = new Set(props.selection);
  set.has(id) ? set.delete(id) : set.add(id);
  emit('update:selection', [...set]);
};

const cols = [
  { key: 'ticketNumber',    label: 'Ticket #',  sortable: true },
  { key: 'type',            label: 'Type',      sortable: true },
  { key: 'title',           label: 'Title',     sortable: true },
  { key: 'requester',       label: 'Requester', sortable: true },
  { key: 'status',          label: 'Status',    sortable: true },
  { key: 'priority',        label: 'Priority',  sortable: true },
  { key: 'currentLevel',    label: 'Level',     sortable: true },
  { key: 'assignedGroup',   label: 'Group',     sortable: true },
  { key: 'locationCountry', label: 'Country',   sortable: true },
  { key: 'locationCity',    label: 'City',      sortable: true },
  { key: 'updatedAt',       label: 'Updated',   sortable: true },
];

const onSort = (k) => emit('sort', k);
const sortIcon = (k) => {
  if (props.sort.key !== k) return '↕';
  return props.sort.dir === 'asc' ? '↑' : '↓';
};
</script>

<template>
  <div class="card overflow-hidden">
    <div class="overflow-x-auto">
      <table class="min-w-full text-sm">
        <thead>
          <tr>
            <th v-if="selectionEnabled" class="table-th w-10">
              <input type="checkbox" :checked="allSelected"
                     :indeterminate.prop="!allSelected && someSelected"
                     @change="toggleAll" />
            </th>
            <th v-for="c in cols" :key="c.key" class="table-th"
                :class="c.sortable ? 'cursor-pointer select-none hover:bg-slate-100' : ''"
                @click="c.sortable && onSort(c.key)">
              <span class="inline-flex items-center gap-1">
                {{ c.label }}
                <span v-if="c.sortable" class="text-[10px] text-slate-400">{{ sortIcon(c.key) }}</span>
              </span>
            </th>
            <th class="table-th text-right pr-4">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="empty">
            <td :colspan="selectionEnabled ? cols.length + 2 : cols.length + 1"
                class="text-center py-12 text-slate-400">
              <div class="text-sm">No tickets match the current filters.</div>
            </td>
          </tr>
          <tr v-for="t in tickets" :key="t.id"
              class="hover:bg-slate-50 transition-colors cursor-pointer"
              :class="selectionEnabled && selection.includes(t.id) ? 'bg-brand-50/40' : ''"
              @click="view(t.id)">
            <td v-if="selectionEnabled" class="table-td w-10" @click.stop>
              <input type="checkbox" :checked="selection.includes(t.id)" @change="toggleOne(t.id)" />
            </td>
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
                <button class="btn-ghost px-2 py-1 text-xs" @click="view(t.id)">View</button>
                <button v-if="showReassign && auth.isManager"
                        class="btn-ghost px-2 py-1 text-xs text-indigo-700"
                        @click="$emit('reassign', t)">Reassign</button>
                <button v-if="perms.canEdit(t) && perms.canEscalateTo.value.length"
                        class="btn-ghost px-2 py-1 text-xs text-amber-700"
                        @click="$emit('escalate', t)">Escalate</button>
                <button v-if="perms.canResolve(t) && !['resolved','closed','cancelled'].includes(t.status)"
                        class="btn-ghost px-2 py-1 text-xs text-emerald-700"
                        @click="$emit('resolve', t)">Resolve</button>
                <button v-if="perms.canClose(t) && t.status !== 'closed' && t.status !== 'cancelled'"
                        class="btn-ghost px-2 py-1 text-xs text-slate-700"
                        @click="$emit('close', t)">Close</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <slot name="footer" />
  </div>
</template>
