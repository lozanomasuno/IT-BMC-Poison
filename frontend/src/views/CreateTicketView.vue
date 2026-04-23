<script setup>
import { computed, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useTicketsStore } from '../stores/tickets';
import { useUsersStore } from '../stores/users';
import { useAuthStore } from '../stores/auth';
import { TICKET_TYPES, PRIORITIES, IMPACTS, URGENCIES } from '../utils/constants';

const router = useRouter();
const tickets = useTicketsStore();
const users = useUsersStore();
const auth = useAuthStore();

const blocked = computed(() => !auth.canCreateTicket);

const form = reactive({
  type: 'incident',
  category: '',
  subcategory: '',
  title: '',
  description: '',
  requesterId: null,
  country: '',
  city: '',
  priority: 'medium',
  impact: 'medium',
  urgency: 'medium',
});

const submitting = ref(false);
const error = ref('');

const requesterOptions = computed(() => users.requesters);

const onRequesterChange = () => {
  const r = users.byId(Number(form.requesterId));
  if (r) {
    form.country = r.country;
    form.city = r.city;
  }
};

const submit = async () => {
  error.value = '';
  if (!form.title.trim() || !form.requesterId) {
    error.value = 'Please complete the required fields.';
    return;
  }
  submitting.value = true;
  try {
    const created = await tickets.createTicket(
      { ...form, requesterId: Number(form.requesterId) },
      auth.currentUser,
      users
    );
    router.push(`/tickets/${created.id}`);
  } catch (e) {
    error.value = e.message;
  } finally {
    submitting.value = false;
  }
};
</script>

<template>
  <div v-if="blocked" class="card p-8 text-center">
    <h2 class="text-lg font-semibold text-slate-900 mb-2">Restricted</h2>
    <p class="text-sm text-slate-600">Only L1 agents can create new tickets. Switch to an L1 user from the header.</p>
  </div>

  <form v-else @submit.prevent="submit" class="space-y-5">
    <div class="card p-5">
      <h2 class="text-base font-semibold text-slate-900">New Ticket</h2>
      <p class="text-xs text-slate-500">A ticket number, creation date, and assigned group will be generated automatically.</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
      <div class="card p-5 space-y-4">
        <h3 class="text-sm font-semibold text-slate-900">Classification</h3>
        <div>
          <label class="label">Ticket Type</label>
          <select v-model="form.type" class="input">
            <option v-for="t in TICKET_TYPES" :key="t" :value="t">{{ t }}</option>
          </select>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="label">Category</label>
            <input v-model="form.category" class="input" placeholder="e.g. Network" />
          </div>
          <div>
            <label class="label">Subcategory</label>
            <input v-model="form.subcategory" class="input" placeholder="e.g. VPN" />
          </div>
        </div>
        <div>
          <label class="label">Title *</label>
          <input v-model="form.title" class="input" placeholder="Short summary" required />
        </div>
        <div>
          <label class="label">Description</label>
          <textarea v-model="form.description" rows="4" class="input" placeholder="Detailed description…"></textarea>
        </div>
      </div>

      <div class="card p-5 space-y-4">
        <h3 class="text-sm font-semibold text-slate-900">Requester &amp; Location</h3>
        <div>
          <label class="label">Requester *</label>
          <select v-model="form.requesterId" @change="onRequesterChange" class="input" required>
            <option value="" disabled>Select a requester…</option>
            <option v-for="u in requesterOptions" :key="u.id" :value="u.id">
              {{ u.fullName }} — {{ u.email }}
            </option>
          </select>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="label">Country</label>
            <input v-model="form.country" class="input" />
          </div>
          <div>
            <label class="label">City</label>
            <input v-model="form.city" class="input" />
          </div>
        </div>

        <h3 class="text-sm font-semibold text-slate-900 pt-2">Impact &amp; Priority</h3>
        <div class="grid grid-cols-3 gap-3">
          <div>
            <label class="label">Priority</label>
            <select v-model="form.priority" class="input capitalize">
              <option v-for="p in PRIORITIES" :key="p" :value="p">{{ p }}</option>
            </select>
          </div>
          <div>
            <label class="label">Impact</label>
            <select v-model="form.impact" class="input capitalize">
              <option v-for="p in IMPACTS" :key="p" :value="p">{{ p }}</option>
            </select>
          </div>
          <div>
            <label class="label">Urgency</label>
            <select v-model="form.urgency" class="input capitalize">
              <option v-for="p in URGENCIES" :key="p" :value="p">{{ p }}</option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <div v-if="error" class="card p-3 text-sm text-rose-700 bg-rose-50 border-rose-200">{{ error }}</div>

    <div class="flex justify-end gap-2">
      <button type="button" class="btn-secondary" @click="router.back()">Cancel</button>
      <button type="submit" class="btn-primary" :disabled="submitting">
        {{ submitting ? 'Creating…' : 'Create Ticket' }}
      </button>
    </div>
  </form>
</template>
