import { defineStore } from 'pinia';

const KEY = 'bmc.theme';

export const useThemeStore = defineStore('theme', {
  state: () => ({ mode: 'light' }),
  actions: {
    init() {
      const saved = localStorage.getItem(KEY);
      const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
      this.mode = saved || (prefersDark ? 'dark' : 'light');
      this.apply();
    },
    apply() {
      document.documentElement.classList.toggle('dark', this.mode === 'dark');
    },
    toggle() {
      this.mode = this.mode === 'dark' ? 'light' : 'dark';
      localStorage.setItem(KEY, this.mode);
      this.apply();
    },
  },
});
