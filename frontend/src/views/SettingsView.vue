<script setup>
import { useAuthStore } from '../stores/auth';
import { useUsersStore } from '../stores/users';
import { ROLE_LABELS } from '../utils/constants';

const auth = useAuthStore();
const users = useUsersStore();
</script>

<template>
  <div class="space-y-5">
    <div class="card p-5">
      <h2 class="text-base font-semibold text-slate-900">Settings</h2>
      <p class="text-xs text-slate-500">Demo session settings.</p>
    </div>

    <div class="card p-5">
      <h3 class="text-sm font-semibold text-slate-900 mb-3">Active User</h3>
      <div v-if="auth.currentUser" class="flex items-center gap-4">
        <img :src="auth.currentUser.avatar" class="w-14 h-14 rounded-full border" />
        <div>
          <div class="text-sm font-semibold text-slate-800">{{ auth.currentUser.fullName }}</div>
          <div class="text-xs text-slate-500">{{ auth.currentUser.email }}</div>
          <div class="text-xs text-slate-500">{{ ROLE_LABELS[auth.role] }} · {{ auth.supportLevel || '—' }}</div>
        </div>
      </div>
    </div>

    <div class="card p-0 overflow-hidden">
      <div class="px-5 py-4 border-b border-slate-200">
        <h3 class="text-sm font-semibold text-slate-900">Switch Role (demo)</h3>
        <p class="text-xs text-slate-500">Pick any agent or manager to test role behavior.</p>
      </div>
      <ul class="divide-y divide-slate-100 max-h-[420px] overflow-y-auto">
        <li v-for="u in users.agents" :key="u.id"
            class="px-5 py-3 flex items-center gap-3 hover:bg-slate-50 cursor-pointer"
            @click="auth.setUser(u.id)">
          <img :src="u.avatar" class="w-9 h-9 rounded-full border" />
          <div class="flex-1 min-w-0">
            <div class="text-sm font-medium text-slate-800">{{ u.fullName }}</div>
            <div class="text-xs text-slate-500">{{ ROLE_LABELS[u.role] }} · {{ u.supportLevel }}</div>
          </div>
          <span v-if="u.id === auth.currentUserId" class="text-[11px] text-brand-700 font-semibold">ACTIVE</span>
        </li>
      </ul>
    </div>
  </div>
</template>
