import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useUiStore } from '../stores/ui';

describe('ui store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
  });

  it('defaults to expanded', () => {
    const u = useUiStore();
    expect(u.sidebarCollapsed).toBe(false);
  });

  it('toggleSidebar flips state and persists', () => {
    const u = useUiStore();
    u.toggleSidebar();
    expect(u.sidebarCollapsed).toBe(true);
    expect(localStorage.getItem('bmc.sidebar.collapsed')).toBe('1');
    u.toggleSidebar();
    expect(u.sidebarCollapsed).toBe(false);
    expect(localStorage.getItem('bmc.sidebar.collapsed')).toBe('0');
  });

  it('init reads persisted value', () => {
    localStorage.setItem('bmc.sidebar.collapsed', '1');
    const u = useUiStore();
    u.init();
    expect(u.sidebarCollapsed).toBe(true);
  });
});
