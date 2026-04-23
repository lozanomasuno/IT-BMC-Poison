<script setup>
import { useRouter } from 'vue-router';
const router = useRouter();
</script>

<template>
  <div class="card p-10 text-center">
    <h1 class="text-3xl font-bold text-slate-900 mb-2">404</h1>
    <p class="text-sm text-slate-600 mb-4">The page you’re looking for doesn’t exist.</p>
    <button class="btn-primary" @click="router.push('/')">Back to dashboard</button>
  </div>
</template>
