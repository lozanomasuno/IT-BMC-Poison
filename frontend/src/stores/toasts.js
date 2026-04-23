import { defineStore } from 'pinia';

let nextId = 1;

export const useToastStore = defineStore('toasts', {
  state: () => ({
    items: [], // { id, type, message, timeout }
  }),
  actions: {
    push(message, type = 'info', timeout = 3500) {
      const id = nextId++;
      this.items.push({ id, type, message, timeout });
      if (timeout > 0) {
        setTimeout(() => this.dismiss(id), timeout);
      }
      return id;
    },
    success(msg, t) { return this.push(msg, 'success', t); },
    error(msg, t)   { return this.push(msg, 'error', t ?? 5000); },
    info(msg, t)    { return this.push(msg, 'info', t); },
    warning(msg, t) { return this.push(msg, 'warning', t); },
    dismiss(id) { this.items = this.items.filter((i) => i.id !== id); },
  },
});
