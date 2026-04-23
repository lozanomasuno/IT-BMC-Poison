<script setup>
import { onMounted } from 'vue';
import { useAuthStore } from './stores/auth';
import { useUsersStore } from './stores/users';
import { useTicketsStore } from './stores/tickets';

const auth = useAuthStore();
const users = useUsersStore();
const tickets = useTicketsStore();

onMounted(async () => {
  await Promise.all([users.fetchUsers(), users.fetchGroups(), tickets.fetchTickets()]);
  auth.bootstrap(users.users);
});
</script>

<template>
  <RouterView />
</template>
