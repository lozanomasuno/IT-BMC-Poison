import { defineStore } from 'pinia';
import { api } from '../api/client';
import { STATUS_FILTERS } from '../utils/constants';
import { isToday, nextTicketNumber } from '../utils/format';

export const useTicketsStore = defineStore('tickets', {
  state: () => ({
    tickets: [],
    loading: false,
    error: null,
  }),
  getters: {
    byId: (s) => (id) => s.tickets.find((t) => t.id === Number(id)) || null,
    byNumber: (s) => (num) => s.tickets.find((t) => t.ticketNumber === num) || null,
    incidents: (s) => s.tickets.filter((t) => t.type === 'incident'),
    requests: (s) => s.tickets.filter((t) => t.type === 'request'),

    counts: (s) => {
      const out = {};
      for (const f of STATUS_FILTERS) out[f.key] = 0;
      for (const t of s.tickets) {
        for (const f of STATUS_FILTERS) if (f.match(t)) out[f.key]++;
      }
      return out;
    },

    countsFor: (s) => (subset) => {
      const out = {};
      for (const f of STATUS_FILTERS) out[f.key] = 0;
      for (const t of subset) {
        for (const f of STATUS_FILTERS) if (f.match(t)) out[f.key]++;
      }
      return out;
    },

    breachedCount: (s) => s.tickets.filter((t) => t.breachedSla && !['closed', 'resolved', 'cancelled'].includes(t.status)).length,
    resolvedTodayCount: (s) => s.tickets.filter((t) => t.status === 'resolved' && isToday(t.resolvedAt)).length,
    openCount: (s) => s.tickets.filter((t) => t.status === 'new' || t.status === 'assigned').length,
    pendingCount: (s) => s.tickets.filter((t) => t.status === 'pending').length,
    inProgressCount: (s) => s.tickets.filter((t) => t.status === 'in_progress').length,

    byPriority: (s) => {
      const out = { low: 0, medium: 0, high: 0, critical: 0 };
      for (const t of s.tickets) if (out[t.priority] != null) out[t.priority]++;
      return out;
    },
    byLevel: (s) => {
      const out = { L1: 0, L2: 0, L3: 0 };
      for (const t of s.tickets) if (out[t.currentLevel] != null) out[t.currentLevel]++;
      return out;
    },
    byStatus: (s) => {
      const out = {};
      for (const t of s.tickets) out[t.status] = (out[t.status] || 0) + 1;
      return out;
    },

    assignedTo: (s) => (userId) => s.tickets.filter((t) => t.assignedTo === userId),
  },
  actions: {
    async fetchTickets() {
      this.loading = true;
      this.error = null;
      try {
        this.tickets = await api.get('/tickets');
      } catch (e) {
        this.error = e.message;
      } finally {
        this.loading = false;
      }
    },

    filterAndSearch(subset, statusKey, search, usersStore) {
      const filter = STATUS_FILTERS.find((f) => f.key === statusKey) || STATUS_FILTERS[0];
      const q = (search || '').trim().toLowerCase();
      return subset.filter((t) => {
        if (!filter.match(t)) return false;
        if (!q) return true;
        const requester = usersStore.byId(t.requesterId);
        const group = usersStore.groupById(t.assignedGroupId);
        return [
          t.ticketNumber,
          t.title,
          t.category,
          requester?.fullName,
          group?.name,
          t.locationCity,
          t.locationCountry,
        ].some((v) => v && String(v).toLowerCase().includes(q));
      });
    },

    async createTicket(payload, currentUser, usersStore) {
      const number = nextTicketNumber(payload.type, this.tickets);
      const now = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');

      // Determine routing group from category if possible.
      const targetGroup = usersStore.groups.find((g) => g.level === 'L1') || usersStore.groups[0];

      const newTicket = {
        ticketNumber: number,
        type: payload.type,
        category: payload.category,
        subcategory: payload.subcategory,
        title: payload.title,
        description: payload.description,
        priority: payload.priority,
        impact: payload.impact,
        urgency: payload.urgency,
        status: 'new',
        requesterId: payload.requesterId,
        assignedTo: currentUser.id,
        assignedGroupId: targetGroup.id,
        currentLevel: 'L1',
        source: 'portal',
        createdAt: now,
        updatedAt: now,
        resolvedAt: null,
        resolution: null,
        locationCountry: payload.country,
        locationCity: payload.city,
        slaHours: payload.priority === 'critical' ? 2 : payload.priority === 'high' ? 4 : payload.priority === 'medium' ? 8 : 24,
        breachedSla: false,
        relatedService: null,
        history: [
          {
            date: now,
            action: 'Ticket created',
            performedBy: currentUser.username,
            level: 'L1',
            notes: `Opened via portal by ${currentUser.fullName}.`,
          },
        ],
      };

      const created = await api.post('/tickets', newTicket);
      this.tickets.push(created);
      return created;
    },

    async updateTicket(id, patch) {
      const now = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
      const merged = { ...patch, updatedAt: now };
      const updated = await api.patch(`/tickets/${id}`, merged);
      const idx = this.tickets.findIndex((t) => t.id === id);
      if (idx !== -1) this.tickets[idx] = updated;
      return updated;
    },

    async addHistory(id, entry) {
      const ticket = this.byId(id);
      if (!ticket) return null;
      const history = [...(ticket.history || []), entry];
      return this.updateTicket(id, { history });
    },

    async escalateTicket(id, toLevel, currentUser, usersStore, notes = '') {
      const ticket = this.byId(id);
      if (!ticket) throw new Error('Ticket not found');
      const targetGroup = usersStore.groups.find((g) => g.level === toLevel);
      if (!targetGroup) throw new Error(`No group found for level ${toLevel}`);
      const now = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
      const entry = {
        date: now,
        action: `Escalated to ${toLevel}`,
        performedBy: currentUser.username,
        level: ticket.currentLevel,
        notes: notes || `Escalated from ${ticket.currentLevel} to ${toLevel}.`,
      };
      return this.updateTicket(id, {
        currentLevel: toLevel,
        assignedGroupId: targetGroup.id,
        status: ticket.status === 'new' ? 'assigned' : ticket.status,
        history: [...(ticket.history || []), entry],
      });
    },

    async resolveTicket(id, resolutionNotes, currentUser) {
      const ticket = this.byId(id);
      if (!ticket) throw new Error('Ticket not found');
      const now = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
      const entry = {
        date: now,
        action: 'Resolved',
        performedBy: currentUser.username,
        level: ticket.currentLevel,
        notes: resolutionNotes,
      };
      return this.updateTicket(id, {
        status: 'resolved',
        resolvedAt: now,
        resolution: resolutionNotes,
        history: [...(ticket.history || []), entry],
      });
    },

    async closeTicket(id, currentUser) {
      const ticket = this.byId(id);
      if (!ticket) throw new Error('Ticket not found');
      const now = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
      const entry = {
        date: now,
        action: 'Closed',
        performedBy: currentUser.username,
        level: ticket.currentLevel,
        notes: 'Ticket closed.',
      };
      return this.updateTicket(id, {
        status: 'closed',
        history: [...(ticket.history || []), entry],
      });
    },

    async addWorkNote(id, note, currentUser) {
      const ticket = this.byId(id);
      if (!ticket) throw new Error('Ticket not found');
      const now = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
      const entry = {
        date: now,
        action: 'Work note',
        performedBy: currentUser.username,
        level: ticket.currentLevel,
        notes: note,
      };
      return this.updateTicket(id, {
        history: [...(ticket.history || []), entry],
      });
    },

    async deleteTicket(id) {
      await api.delete(`/tickets/${id}`);
      this.tickets = this.tickets.filter((t) => t.id !== id);
    },
  },
});
