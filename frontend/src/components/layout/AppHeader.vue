<script setup>
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../../stores/auth';
import { useUsersStore } from '../../stores/users';
import { useThemeStore } from '../../stores/theme';
import { ROLE_LABELS } from '../../utils/constants';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const users = useUsersStore();
const theme = useThemeStore();

const title = computed(() => {
  const map = {
    'dashboard': 'Dashboard',
    'create-ticket': 'Create Ticket',
    'incident-pool': 'Incident Pool',
    'request-pool': 'Request Pool',
    'my-tickets': 'My Tickets',
    'manager': 'Manager Console',
    'reports': 'Reports',
    'settings': 'Settings',
    'ticket-detail': 'Ticket Detail',
  };
  return map[route.name] || 'BMC Poison';
});

const onUserChange = (e) => {
  const id = Number(e.target.value);
  auth.setUser(id);
};
</script>

<template>
  <header class="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
    <div>
      <h1 class="text-lg font-semibold text-slate-900 dark:text-white">{{ title }}</h1>
      <p class="text-xs text-slate-500 dark:text-slate-400">Enterprise IT Service Management</p>
    </div>

    <div class="flex items-center gap-3">
      <button
        v-if="auth.canCreateTicket"
        @click="router.push('/create')"
        class="btn-primary hidden md:inline-flex"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4">
          <path d="M12 5v14M5 12h14" />
        </svg>
        New Ticket
      </button>

      <button class="btn-ghost p-2" @click="theme.toggle()" :title="theme.mode === 'dark' ? 'Switch to light' : 'Switch to dark'">
        <svg v-if="theme.mode === 'dark'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4">
          <circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>
        </svg>
        <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        </svg>
      </button>

      <div class="hidden lg:flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
        <span class="w-2 h-2 rounded-full bg-emerald-500"></span> JSON Server live
      </div>

      <div class="flex items-center gap-2 pl-3 border-l border-slate-200 dark:border-slate-800">
        <img
          v-if="auth.currentUser?.avatar"
          :src="auth.currentUser.avatar"
          :alt="auth.currentUser.fullName"
          class="w-9 h-9 rounded-full border border-slate-200 dark:border-slate-700"
        />
        <div class="hidden sm:block">
          <div class="text-sm font-semibold text-slate-800 dark:text-white leading-tight">
            {{ auth.currentUser?.fullName || 'Guest' }}
          </div>
          <div class="text-[11px] text-slate-500 dark:text-slate-400">
            {{ ROLE_LABELS[auth.role] || '—' }}
            <span v-if="auth.supportLevel" class="ml-1 text-slate-400">· {{ auth.supportLevel }}</span>
          </div>
        </div>
        <select
          :value="auth.currentUserId || ''"
          @change="onUserChange"
          class="ml-2 text-xs rounded-md border border-slate-300 bg-white px-2 py-1.5 max-w-[180px] dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200"
          title="Switch user (demo)"
        >
          <optgroup label="Agents">
            <option v-for="u in users.agents" :key="u.id" :value="u.id">
              {{ u.fullName }} ({{ ROLE_LABELS[u.role] }})
            </option>
          </optgroup>
        </select>
      </div>
    </div>
  </header>
</template>
