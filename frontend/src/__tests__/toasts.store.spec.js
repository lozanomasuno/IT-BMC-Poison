import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useToastStore } from '../stores/toasts';

describe('toasts store', () => {
  beforeEach(() => setActivePinia(createPinia()));

  it('adds toast with assigned id', () => {
    const t = useToastStore();
    const id = t.push('Hello', 'info', 0);
    expect(typeof id).toBe('number');
    expect(t.items).toHaveLength(1);
    expect(t.items[0].message).toBe('Hello');
  });

  it('typed helpers set the right type', () => {
    const t = useToastStore();
    t.success('ok', 0);
    t.error('boom', 0);
    expect(t.items[0].type).toBe('success');
    expect(t.items[1].type).toBe('error');
  });

  it('dismiss removes by id', () => {
    const t = useToastStore();
    const id = t.push('msg', 'info', 0);
    t.dismiss(id);
    expect(t.items).toHaveLength(0);
  });
});
