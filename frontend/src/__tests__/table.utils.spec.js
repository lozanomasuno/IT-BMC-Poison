import { describe, it, expect } from 'vitest';
import { sortTickets, applyAdvancedFilters, paginate, ticketsToCsv } from '../utils/table';

const usersStore = {
  byId: (id) => ({
    1: { fullName: 'Alice' },
    2: { fullName: 'Bob' },
  }[id] || null),
  groupById: (id) => ({
    10: { name: 'Service Desk' },
    20: { name: 'Network L2' },
  }[id] || null),
};

const sample = [
  { id: 1, ticketNumber: 'INC-100', type: 'incident', title: 'A', status: 'new',         priority: 'low',     currentLevel: 'L1', requesterId: 1, assignedGroupId: 10, locationCountry: 'MX', locationCity: 'CDMX',  createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-05T00:00:00Z' },
  { id: 2, ticketNumber: 'INC-101', type: 'incident', title: 'B', status: 'in_progress', priority: 'critical',currentLevel: 'L2', requesterId: 2, assignedGroupId: 20, locationCountry: 'US', locationCity: 'NYC',   createdAt: '2024-01-02T00:00:00Z', updatedAt: '2024-01-10T00:00:00Z' },
  { id: 3, ticketNumber: 'REQ-200', type: 'request',  title: 'C', status: 'resolved',    priority: 'high',    currentLevel: 'L3', requesterId: 1, assignedGroupId: 10, locationCountry: 'MX', locationCity: 'GDL',   createdAt: '2024-01-03T00:00:00Z', updatedAt: '2024-01-15T00:00:00Z' },
];

describe('sortTickets', () => {
  it('sorts by priority descending using rank', () => {
    const r = sortTickets(sample, 'priority', 'desc', usersStore);
    expect(r.map((t) => t.priority)).toEqual(['critical', 'high', 'low']);
  });

  it('sorts by requester name ascending', () => {
    const r = sortTickets(sample, 'requester', 'asc', usersStore);
    expect(r[0].requesterId).toBe(1);
  });

  it('sorts by updatedAt descending', () => {
    const r = sortTickets(sample, 'updatedAt', 'desc', usersStore);
    expect(r[0].id).toBe(3);
  });
});

describe('applyAdvancedFilters', () => {
  it('filters by priority', () => {
    expect(applyAdvancedFilters(sample, { priority: 'critical' })).toHaveLength(1);
  });
  it('filters by group id', () => {
    expect(applyAdvancedFilters(sample, { groupId: 10 })).toHaveLength(2);
  });
  it('filters by level', () => {
    expect(applyAdvancedFilters(sample, { level: 'L2' })).toHaveLength(1);
  });
  it('filters by date range (inclusive end)', () => {
    const r = applyAdvancedFilters(sample, { from: '2024-01-09', to: '2024-01-10' });
    expect(r.map((t) => t.id)).toEqual([2]);
  });
  it('returns all when no filters provided', () => {
    expect(applyAdvancedFilters(sample, {})).toHaveLength(3);
  });
});

describe('paginate', () => {
  it('clamps page to last page', () => {
    const r = paginate(sample, 99, 2);
    expect(r.page).toBe(2);
    expect(r.items).toHaveLength(1);
  });
  it('returns correct slice and totals', () => {
    const r = paginate(sample, 1, 2);
    expect(r.total).toBe(3);
    expect(r.totalPages).toBe(2);
    expect(r.items).toHaveLength(2);
    expect(r.start).toBe(0);
    expect(r.end).toBe(2);
  });
});

describe('ticketsToCsv', () => {
  it('produces a header row plus one row per ticket', () => {
    const csv = ticketsToCsv(sample, usersStore);
    const lines = csv.split('\n');
    expect(lines).toHaveLength(sample.length + 1);
    expect(lines[0]).toContain('ticketNumber');
    expect(lines[1]).toContain('INC-100');
  });

  it('escapes commas, quotes, and newlines', () => {
    const tricky = [{ ...sample[0], title: 'Hello, "world"\nbreak' }];
    const csv = ticketsToCsv(tricky, usersStore);
    expect(csv).toMatch(/"Hello, ""world""\nbreak"/);
  });
});
