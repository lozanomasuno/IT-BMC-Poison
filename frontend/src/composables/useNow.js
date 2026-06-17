// Shared reactive "now" tick — anything that wants to live-update SLA
// progress can import `now` and use it in computed expressions.
import { ref, onScopeDispose } from 'vue';

const now = ref(Date.now());
let timer = null;
let refCount = 0;

function start() {
  if (timer) return;
  timer = setInterval(() => { now.value = Date.now(); }, 30_000); // 30s tick is plenty for SLA
}

function stop() {
  if (timer && refCount === 0) {
    clearInterval(timer);
    timer = null;
  }
}

export function useNow() {
  refCount += 1;
  start();
  onScopeDispose(() => {
    refCount = Math.max(0, refCount - 1);
    stop();
  });
  return now;
}
