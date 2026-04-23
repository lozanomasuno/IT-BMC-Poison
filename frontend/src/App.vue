<script setup>
import { onMounted } from 'vue';
import { useAuthStore } from './stores/auth';
import { useUsersStore } from './stores/users';
import { useTicketsStore } from './stores/tickets';
import { useThemeStore } from './stores/theme';
import Toaster from './components/common/Toaster.vue';

const auth = useAuthStore();
const users = useUsersStore();
const tickets = useTicketsStore();
const theme = useThemeStore();

theme.init();

onMounted(async () => {
  await Promise.all([users.fetchUsers(), users.fetchGroups(), tickets.fetchTickets()]);
  auth.bootstrap(users.users);
});
</script>

<template>
  <RouterView />
  <Toaster />
</template>
