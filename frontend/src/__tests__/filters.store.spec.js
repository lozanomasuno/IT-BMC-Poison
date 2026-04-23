import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useFiltersStore } from '../stores/filters';

describe('filters store', () => {
  beforeEach(() => setActivePinia(createPinia()));

  it('returns defaults for a fresh view', () => {
    const f = useFiltersStore();
    expect(f.getStatus('x')).toBe('all');
    expect(f.getSearch('x')).toBe('');
    expect(f.getSort('x')).toEqual({ key: 'updatedAt', dir: 'desc' });
    expect(f.getPage('x')).toBe(1);
    expect(f.getPageSize('x')).toBe(25);
  });

  it('toggleSort flips dir on same key, resets dir when key changes', () => {
    const f = useFiltersStore();
    f.toggleSort('v', 'priority');
    expect(f.getSort('v')).toEqual({ key: 'priority', dir: 'asc' });
    f.toggleSort('v', 'priority');
    expect(f.getSort('v')).toEqual({ key: 'priority', dir: 'desc' });
    f.toggleSort('v', 'status');
    expect(f.getSort('v')).toEqual({ key: 'status', dir: 'asc' });
  });

  it('setSearch / setStatus / setAdvanced reset the page to 1', () => {
    const f = useFiltersStore();
    f.setPage('v', 5);
    f.setSearch('v', 'foo');
    expect(f.getPage('v')).toBe(1);

    f.setPage('v', 7);
    f.setStatus('v', 'open');
    expect(f.getPage('v')).toBe(1);

    f.setPage('v', 3);
    f.setAdvanced('v', { priority: 'high' });
    expect(f.getPage('v')).toBe(1);
  });

  it('reset clears all per-view state', () => {
    const f = useFiltersStore();
    f.setStatus('v', 'open');
    f.setSearch('v', 'q');
    f.setAdvanced('v', { priority: 'high' });
    f.setPage('v', 4);
    f.reset('v');
    expect(f.getStatus('v')).toBe('all');
    expect(f.getSearch('v')).toBe('');
    expect(f.getAdvanced('v').priority).toBe('');
    expect(f.getPage('v')).toBe(1);
  });
});
