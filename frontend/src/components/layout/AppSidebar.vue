<script setup>
import { computed } from 'vue';
import { RouterLink, useRoute } from 'vue-router';
import { useTicketsStore } from '../../stores/tickets';
import { useAuthStore } from '../../stores/auth';
import { useUiStore } from '../../stores/ui';
import { STATUS_FILTERS } from '../../utils/constants';

const route = useRoute();
const tickets = useTicketsStore();
const auth = useAuthStore();
const ui = useUiStore();

const collapsed = computed(() => ui.sidebarCollapsed);

const myTickets = computed(() =>
  auth.currentUserId ? tickets.assignedTo(auth.currentUserId) : []
);

// Pool entries with status submenus. Children are derived from STATUS_FILTERS
// and the badge count is computed against the pool's subset for that status.
const pools = computed(() => [
  { key: 'incidents',  to: '/incidents',  label: 'Incident Pool', icon: 'alert', subset: tickets.incidents },
  { key: 'requests',   to: '/requests',   label: 'Request Pool',  icon: 'inbox', subset: tickets.requests },
  { key: 'myTickets',  to: '/my-tickets', label: 'My Tickets',    icon: 'user',  subset: myTickets.value },
]);

const countsByPool = computed(() => {
  const out = {};
  for (const p of pools.value) out[p.key] = tickets.countsFor(p.subset);
  return out;
});

const flatNav = computed(() => [
  { kind: 'link',  to: '/',        label: 'Dashboard',     icon: 'grid' },
  { kind: 'link',  to: '/create',  label: 'Create Ticket', icon: 'plus',   restricted: !auth.canCreateTicket },
  ...pools.value.map((p) => ({ kind: 'group', ...p })),
  { kind: 'link',  to: '/manager', label: 'Manager',       icon: 'shield', restricted: !auth.isManager },
  { kind: 'link',  to: '/settings',label: 'Settings',      icon: 'gear' },
]);

const isActivePath = (to) => to === '/' ? route.path === '/' : route.path.startsWith(to);
const activeStatus = computed(() => {
  const q = route.query?.status;
  return typeof q === 'string' && STATUS_FILTERS.some((f) => f.key === q) ? q : 'all';
});

const isChildActive = (poolTo, statusKey) =>
  isActivePath(poolTo) && activeStatus.value === statusKey;

// A group counts as expanded if (a) the user opened it, OR (b) we're navigated
// into one of its children — auto-expand for context.
const isGroupExpanded = (key, poolTo) =>
  !collapsed.value && (ui.expandedMenus[key] || isActivePath(poolTo));
</script>

<template>
  <aside
    class="shrink-0 bg-slate-900 text-slate-200 flex flex-col transition-[width] duration-200 ease-in-out"
    :class="collapsed ? 'w-[68px]' : 'w-64'"
  >
    <div
      class="px-4 py-5 border-b border-slate-800 flex items-center gap-3"
      :class="collapsed ? 'justify-center' : ''"
    >
      <div class="w-9 h-9 shrink-0 rounded-lg bg-brand-600 flex items-center justify-center font-bold text-white">B</div>
      <div v-if="!collapsed" class="overflow-hidden">
        <div class="text-sm font-semibold text-white tracking-wide truncate">BMC Poison</div>
        <div class="text-[11px] text-slate-400 uppercase tracking-wider truncate">ITSM Service Desk</div>
      </div>
    </div>

    <button
      type="button"
      class="mx-3 my-2 flex items-center justify-center gap-2 rounded-lg px-2 py-1.5 text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
      :title="collapsed ? 'Expand sidebar' : 'Collapse sidebar'"
      @click="ui.toggleSidebar()"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4 transition-transform"
           :class="collapsed ? 'rotate-180' : ''">
        <path d="M15 18l-6-6 6-6"/>
      </svg>
      <span v-if="!collapsed">Collapse</span>
    </button>

    <nav class="flex-1 overflow-y-auto px-3 py-2 space-y-1">
      <template v-for="item in flatNav" :key="(item.kind === 'group' ? 'g:' : 'l:') + (item.to || item.key)">
        <!-- Plain link items -->
        <RouterLink
          v-if="item.kind === 'link' && !item.restricted"
          :to="item.to"
          :title="collapsed ? item.label : undefined"
          class="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors"
          :class="[
            isActivePath(item.to) ? 'bg-brand-600 text-white shadow-soft'
                                  : 'text-slate-300 hover:bg-slate-800 hover:text-white',
            collapsed ? 'justify-center px-2' : '',
          ]"
        >
          <span class="w-5 h-5 shrink-0 inline-flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="w-5 h-5">
              <template v-if="item.icon === 'grid'">
                <rect x="3" y="3" width="7" height="7" rx="1.5"/>
                <rect x="14" y="3" width="7" height="7" rx="1.5"/>
                <rect x="3" y="14" width="7" height="7" rx="1.5"/>
                <rect x="14" y="14" width="7" height="7" rx="1.5"/>
              </template>
              <template v-else-if="item.icon === 'plus'">
                <circle cx="12" cy="12" r="9"/>
                <path d="M12 8v8M8 12h8"/>
              </template>
              <template v-else-if="item.icon === 'gear'">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19 12a7 7 0 00-.1-1.2l2-1.5-2-3.4-2.4.9a7 7 0 00-2-1.2L14 3h-4l-.5 2.6a7 7 0 00-2 1.2l-2.4-.9-2 3.4 2 1.5A7 7 0 005 12c0 .4 0 .8.1 1.2l-2 1.5 2 3.4 2.4-.9a7 7 0 002 1.2L10 21h4l.5-2.6a7 7 0 002-1.2l2.4.9 2-3.4-2-1.5c.1-.4.1-.8.1-1.2z"/>
              </template>
              <template v-else-if="item.icon === 'shield'">
                <path d="M12 3l8 3v6c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V6l8-3z"/>
              </template>
            </svg>
          </span>
          <span v-if="!collapsed" class="truncate">{{ item.label }}</span>
        </RouterLink>

        <!-- Expandable pool group -->
        <template v-else-if="item.kind === 'group' && !item.restricted">
          <!-- Collapsed sidebar: render parent as a direct link to ?status=all (no submenu) -->
          <RouterLink
            v-if="collapsed"
            :to="{ path: item.to, query: { status: 'all' } }"
            :title="item.label"
            class="group flex items-center justify-center gap-3 rounded-lg px-2 py-2.5 text-sm font-medium transition-colors"
            :class="isActivePath(item.to) ? 'bg-brand-600 text-white shadow-soft'
                                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'"
          >
            <span class="w-5 h-5 shrink-0 inline-flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="w-5 h-5">
                <template v-if="item.icon === 'alert'">
                  <path d="M12 3l10 17H2L12 3z"/>
                  <path d="M12 10v4M12 17h.01"/>
                </template>
                <template v-else-if="item.icon === 'inbox'">
                  <path d="M3 13l3-9h12l3 9"/>
                  <path d="M3 13v6a2 2 0 002 2h14a2 2 0 002-2v-6h-6l-2 3h-4l-2-3H3z"/>
                </template>
                <template v-else-if="item.icon === 'user'">
                  <circle cx="12" cy="8" r="4"/>
                  <path d="M4 21v-1a6 6 0 0112 0v1"/>
                </template>
              </svg>
            </span>
          </RouterLink>

          <!-- Expanded sidebar: parent toggle button + submenu -->
          <template v-else>
            <button
              type="button"
              class="group w-full flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors"
              :class="isActivePath(item.to) ? 'bg-brand-600/15 text-white'
                                            : 'text-slate-300 hover:bg-slate-800 hover:text-white'"
              :aria-expanded="isGroupExpanded(item.key, item.to)"
              @click="ui.toggleMenu(item.key)"
            >
              <span class="flex items-center gap-3 min-w-0">
                <span class="w-5 h-5 shrink-0 inline-flex items-center justify-center">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="w-5 h-5">
                    <template v-if="item.icon === 'alert'">
                      <path d="M12 3l10 17H2L12 3z"/>
                      <path d="M12 10v4M12 17h.01"/>
                    </template>
                    <template v-else-if="item.icon === 'inbox'">
                      <path d="M3 13l3-9h12l3 9"/>
                      <path d="M3 13v6a2 2 0 002 2h14a2 2 0 002-2v-6h-6l-2 3h-4l-2-3H3z"/>
                    </template>
                    <template v-else-if="item.icon === 'user'">
                      <circle cx="12" cy="8" r="4"/>
                      <path d="M4 21v-1a6 6 0 0112 0v1"/>
                    </template>
                  </svg>
                </span>
                <span class="truncate">{{ item.label }}</span>
              </span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                   class="w-4 h-4 shrink-0 transition-transform"
                   :class="isGroupExpanded(item.key, item.to) ? 'rotate-90' : ''">
                <path d="M9 6l6 6-6 6"/>
              </svg>
            </button>

            <ul v-show="isGroupExpanded(item.key, item.to)" class="mt-1 mb-1 ml-7 pl-3 border-l border-slate-800 space-y-0.5">
              <li v-for="f in STATUS_FILTERS" :key="f.key">
                <RouterLink
                  :to="{ path: item.to, query: { status: f.key } }"
                  class="group flex items-center justify-between gap-2 rounded-md px-2.5 py-1.5 text-[12.5px] transition-colors"
                  :class="isChildActive(item.to, f.key)
                    ? 'bg-brand-600 text-white shadow-soft'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'"
                >
                  <span class="truncate">{{ f.label }}</span>
                  <span
                    class="text-[10px] font-semibold px-1.5 py-0.5 rounded-full min-w-[20px] text-center"
                    :class="isChildActive(item.to, f.key)
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-800 text-slate-300 group-hover:bg-slate-700'"
                  >
                    {{ countsByPool[item.key]?.[f.key] ?? 0 }}
                  </span>
                </RouterLink>
              </li>
            </ul>
          </template>
        </template>
      </template>
    </nav>

    <div
      class="px-4 py-4 border-t border-slate-800 text-[11px] text-slate-500"
      :class="collapsed ? 'text-center' : ''"
    >
      <div v-if="!collapsed">v1.0.0 · Mock ITSM</div>
      <div v-else>v1.0</div>
    </div>
  </aside>
</template>
