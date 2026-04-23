<script setup>
import { computed } from 'vue';
import { RouterLink, useRoute } from 'vue-router';
import { useTicketsStore } from '../../stores/tickets';
import { useAuthStore } from '../../stores/auth';

const route = useRoute();
const tickets = useTicketsStore();
const auth = useAuthStore();

const myCount = computed(() =>
  auth.currentUserId ? tickets.assignedTo(auth.currentUserId).length : 0
);

const nav = computed(() => [
  { to: '/',           label: 'Dashboard',     icon: 'grid' },
  { to: '/create',     label: 'Create Ticket', icon: 'plus',    badge: null, restricted: !auth.canCreateTicket },
  { to: '/incidents',  label: 'Incident Pool', icon: 'alert',   badge: tickets.incidents.length },
  { to: '/requests',   label: 'Request Pool',  icon: 'inbox',   badge: tickets.requests.length },
  { to: '/my-tickets', label: 'My Tickets',    icon: 'user',    badge: myCount.value },
  { to: '/manager',    label: 'Manager',       icon: 'shield',  restricted: !auth.isManager },
  { to: '/settings',   label: 'Settings',      icon: 'gear' },
]);

const isActive = (to) => to === '/' ? route.path === '/' : route.path.startsWith(to);
</script>

<template>
  <aside class="w-64 shrink-0 bg-slate-900 text-slate-200 flex flex-col">
    <div class="px-6 py-5 border-b border-slate-800 flex items-center gap-3">
      <div class="w-9 h-9 rounded-lg bg-brand-600 flex items-center justify-center font-bold text-white">B</div>
      <div>
        <div class="text-sm font-semibold text-white tracking-wide">BMC Poison</div>
        <div class="text-[11px] text-slate-400 uppercase tracking-wider">ITSM Service Desk</div>
      </div>
    </div>

    <nav class="flex-1 overflow-y-auto px-3 py-4 space-y-1">
      <template v-for="item in nav" :key="item.to">
        <RouterLink
          v-if="!item.restricted"
          :to="item.to"
          class="group flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors"
          :class="isActive(item.to)
            ? 'bg-brand-600 text-white shadow-soft'
            : 'text-slate-300 hover:bg-slate-800 hover:text-white'"
        >
          <span class="flex items-center gap-3">
            <span class="w-5 h-5 inline-flex items-center justify-center">
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
                <template v-else-if="item.icon === 'alert'">
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
                <template v-else-if="item.icon === 'chart'">
                  <path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>
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
            {{ item.label }}
          </span>
          <span
            v-if="item.badge != null"
            class="text-[10px] font-semibold px-2 py-0.5 rounded-full"
            :class="isActive(item.to)
              ? 'bg-white/20 text-white'
              : 'bg-slate-800 text-slate-300 group-hover:bg-slate-700'"
          >
            {{ item.badge }}
          </span>
        </RouterLink>
      </template>
    </nav>

    <div class="px-4 py-4 border-t border-slate-800 text-[11px] text-slate-500">
      <div>v1.0.0 · Mock ITSM</div>
    </div>
  </aside>
</template>
