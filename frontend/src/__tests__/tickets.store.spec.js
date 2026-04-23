import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useTicketsStore } from '../stores/tickets';

const usersStore = {
  byId: (id) => ({ 1: { fullName: 'Alice' } }[id] || null),
  groupById: (id) => ({ 10: { name: 'Service Desk' } }[id] || null),
};

const seed = [
  { id: 1, ticketNumber: 'INC-100', type: 'incident', title: 'Email down', category: 'mail', subcategory: 'inbox',
    status: 'new', priority: 'high', currentLevel: 'L1', requesterId: 1, assignedGroupId: 10, assignedTo: 5,
    locationCountry: 'MX', locationCity: 'CDMX', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  { id: 2, ticketNumber: 'INC-101', type: 'incident', title: 'VPN slow', category: 'network', subcategory: 'vpn',
    status: 'resolved', priority: 'low', currentLevel: 'L2', requesterId: 1, assignedGroupId: 10, assignedTo: 5,
    locationCountry: 'US', locationCity: 'NYC', createdAt: '2024-01-02', updatedAt: '2024-01-02' },
  { id: 3, ticketNumber: 'REQ-200', type: 'request',  title: 'Laptop request', category: 'hw', subcategory: 'laptop',
    status: 'in_progress', priority: 'medium', currentLevel: 'L1', requesterId: 1, assignedGroupId: 10, assignedTo: 7,
    locationCountry: 'MX', locationCity: 'CDMX', createdAt: '2024-01-03', updatedAt: '2024-01-03' },
];

describe('tickets store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('partitions incidents and requests', () => {
    const t = useTicketsStore();
    t.tickets = seed;
    expect(t.incidents).toHaveLength(2);
    expect(t.requests).toHaveLength(1);
  });

  it('countsFor counts each status filter on a subset', () => {
    const t = useTicketsStore();
    t.tickets = seed;
    const c = t.countsFor(t.incidents);
    expect(c.all).toBe(2);
  });

  it('filterAndSearch matches by title (case-insensitive)', () => {
    const t = useTicketsStore();
    t.tickets = seed;
    const r = t.filterAndSearch(t.tickets, 'all', 'vpn', usersStore);
    expect(r).toHaveLength(1);
    expect(r[0].id).toBe(2);
  });

  it('assignedTo returns only that user\'s tickets', () => {
    const t = useTicketsStore();
    t.tickets = seed;
    expect(t.assignedTo(5)).toHaveLength(2);
    expect(t.assignedTo(7)).toHaveLength(1);
    expect(t.assignedTo(99)).toHaveLength(0);
  });
});
