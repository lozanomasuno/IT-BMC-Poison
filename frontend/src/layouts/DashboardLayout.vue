<script setup>
import { computed } from 'vue';
import { RouterView, useRoute, useRouter } from 'vue-router';
import AppSidebar from '../components/layout/AppSidebar.vue';
import AppHeader from '../components/layout/AppHeader.vue';
import { useAuthStore } from '../stores/auth';

const auth = useAuthStore();
const route = useRoute();
const router = useRouter();

const showFab = computed(() => auth.canCreateTicket && route.path !== '/create');
</script>

<template>
  <div class="flex h-full min-h-screen bg-slate-50">
    <AppSidebar />
    <div class="flex flex-col flex-1 min-w-0">
      <AppHeader />
      <main class="flex-1 overflow-y-auto relative">
        <div class="max-w-[1500px] mx-auto p-6 lg:p-8">
          <RouterView v-slot="{ Component }">
            <transition name="fade" mode="out-in">
              <component :is="Component" />
            </transition>
          </RouterView>
        </div>

        <transition name="fab">
          <button
            v-if="showFab"
            type="button"
            class="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white shadow-lg shadow-brand-900/30 flex items-center justify-center transition-colors focus:outline-none focus:ring-4 focus:ring-brand-500/40"
            title="Create ticket"
            aria-label="Create ticket"
            @click="router.push('/create')"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="w-6 h-6">
              <path d="M12 5v14M5 12h14" stroke-linecap="round"/>
            </svg>
          </button>
        </transition>
      </main>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.15s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.fab-enter-active, .fab-leave-active { transition: opacity 0.18s ease, transform 0.18s ease; }
.fab-enter-from, .fab-leave-to { opacity: 0; transform: scale(0.8) translateY(8px); }
</style>
