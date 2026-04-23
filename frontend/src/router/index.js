import { createRouter, createWebHistory } from 'vue-router';
import DashboardLayout from '../layouts/DashboardLayout.vue';

const routes = [
  {
    path: '/',
    component: DashboardLayout,
    children: [
      { path: '',                name: 'dashboard',     component: () => import('../views/DashboardView.vue') },
      { path: 'create',          name: 'create-ticket', component: () => import('../views/CreateTicketView.vue') },
      { path: 'incidents',       name: 'incident-pool', component: () => import('../views/IncidentPoolView.vue') },
      { path: 'requests',        name: 'request-pool',  component: () => import('../views/RequestPoolView.vue') },
      { path: 'my-tickets',      name: 'my-tickets',    component: () => import('../views/MyTicketsView.vue') },
      { path: 'manager',         name: 'manager',       component: () => import('../views/ManagerView.vue') },
      { path: 'settings',        name: 'settings',      component: () => import('../views/SettingsView.vue') },
      { path: 'tickets/:id',     name: 'ticket-detail', component: () => import('../views/TicketDetailView.vue'), props: true },
    ],
  },
  { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('../views/NotFoundView.vue') },
];

export default createRouter({
  history: createWebHistory(),
  routes,
});
