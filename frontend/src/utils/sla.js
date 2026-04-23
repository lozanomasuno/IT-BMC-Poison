// SLA computation utilities.
//
// Single source of truth for:
//   - SLA windows by priority
//   - Deadline calculations from a ticket's createdAt
//   - SLA health status (ok / warning / breached)
//   - Time spent per support level (ownership)
//
// All times are kept in milliseconds; helpers convert to nice strings for the UI.

import { LEVEL_ORDER } from './constants';

export const TERMINAL_STATUSES = ['resolved', 'closed', 'cancelled'];

// firstResponse / resolution windows in MINUTES, per priority.
export const SLA_BY_PRIORITY = {
  low:      { firstResponseMin:  8 * 60, resolutionMin: 48 * 60 },
  medium:   { firstResponseMin:  4 * 60, resolutionMin: 24 * 60 },
  high:     { firstResponseMin:  2 * 60, resolutionMin:  8 * 60 },
  critical: { firstResponseMin: 30,      resolutionMin:  4 * 60 },
};

const WARN_THRESHOLD = 0.8;

export function slaConfigFor(priority) {
  return SLA_BY_PRIORITY[priority] || SLA_BY_PRIORITY.medium;
}

// Compute firstResponseDeadline / resolutionDeadline / slaDeadline / slaHours from createdAt + priority.
// Pure function — accepts overrides for already-set deadlines so existing values are preserved.
export function computeSlaDeadlines(createdAtIso, priority, existing = {}) {
  const cfg = slaConfigFor(priority);
  const created = new Date(createdAtIso).getTime();
  const firstResponse = existing.firstResponseDeadline
    ? new Date(existing.firstResponseDeadline).toISOString()
    : new Date(created + cfg.firstResponseMin * 60_000).toISOString();
  const resolution = existing.resolutionDeadline
    ? new Date(existing.resolutionDeadline).toISOString()
    : new Date(created + cfg.resolutionMin * 60_000).toISOString();
  return {
    slaHours: Math.round(cfg.resolutionMin / 60),
    firstResponseDeadline: firstResponse,
    resolutionDeadline: resolution,
    slaDeadline: resolution, // alias kept for legacy code
  };
}

// Returns { state: 'ok'|'warning'|'breached', percent: 0..100, remainingMs, label }.
export function slaStatusFor(deadlineIso, createdAtIso, now = Date.now()) {
  if (!deadlineIso || !createdAtIso) {
    return { state: 'ok', percent: 0, remainingMs: 0, label: '—' };
  }
  const start = new Date(createdAtIso).getTime();
  const end = new Date(deadlineIso).getTime();
  const total = Math.max(1, end - start);
  const elapsed = Math.max(0, now - start);
  const percent = Math.min(100, (elapsed / total) * 100);
  const remainingMs = end - now;

  let state = 'ok';
  if (remainingMs <= 0) state = 'breached';
  else if (percent >= WARN_THRESHOLD * 100) state = 'warning';

  return { state, percent, remainingMs, label: formatRemaining(remainingMs) };
}

// Returns the resolution-deadline status for a ticket. If the ticket is in a
// terminal state it short-circuits to 'ok' once resolved (no breach pressure).
export function ticketSlaStatus(ticket, now = Date.now()) {
  if (!ticket) return { state: 'ok', percent: 0, remainingMs: 0, label: '—' };
  if (TERMINAL_STATUSES.includes(ticket.status)) {
    // Use resolvedAt vs deadline to grade: breached if it took longer than allowed.
    const end = ticket.resolutionDeadline || ticket.slaDeadline;
    const at = ticket.resolvedAt || ticket.updatedAt;
    if (end && at && new Date(at).getTime() > new Date(end).getTime()) {
      return { state: 'breached', percent: 100, remainingMs: 0, label: 'Breached' };
    }
    return { state: 'ok', percent: 100, remainingMs: 0, label: 'Met' };
  }
  return slaStatusFor(ticket.resolutionDeadline || ticket.slaDeadline, ticket.createdAt, now);
}

export function ticketResponseStatus(ticket, now = Date.now()) {
  if (!ticket) return { state: 'ok', percent: 0, remainingMs: 0, label: '—' };
  // First-response window closes when the ticket leaves "new" status (a human acted on it).
  const reachedAssign = (ticket.history || []).find((h) =>
    /assigned|status changed to in progress|escalated/i.test(h.action)
  );
  if (reachedAssign) {
    const respondedAt = new Date(reachedAssign.date).getTime();
    const dl = new Date(ticket.firstResponseDeadline || ticket.slaDeadline || ticket.createdAt).getTime();
    return respondedAt <= dl
      ? { state: 'ok', percent: 100, remainingMs: 0, label: 'Met' }
      : { state: 'breached', percent: 100, remainingMs: 0, label: 'Breached' };
  }
  return slaStatusFor(ticket.firstResponseDeadline, ticket.createdAt, now);
}

export function formatRemaining(ms) {
  if (ms == null || Number.isNaN(ms)) return '—';
  const negative = ms < 0;
  const abs = Math.abs(ms);
  const totalMin = Math.floor(abs / 60_000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  const str = h > 0 ? `${h}h ${m}m` : `${m}m`;
  return negative ? `-${str}` : str;
}

export function formatDuration(ms) {
  if (ms == null || Number.isNaN(ms) || ms <= 0) return '0m';
  const totalMin = Math.floor(ms / 60_000);
  const d = Math.floor(totalMin / 1440);
  const h = Math.floor((totalMin % 1440) / 60);
  const m = totalMin % 60;
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

// Walk a ticket's history and compute time spent at each support level.
// Strategy: each entry that escalates flips the active level; otherwise the
// level stays. End boundary is resolvedAt (or now for open tickets).
export function ownershipByLevel(ticket, now = Date.now()) {
  const out = { L1: 0, L2: 0, L3: 0 };
  if (!ticket || !ticket.createdAt) return out;

  const events = (ticket.history || [])
    .map((h) => ({ ...h, ts: new Date(h.date).getTime() }))
    .sort((a, b) => a.ts - b.ts);

  let cursor = new Date(ticket.createdAt).getTime();
  let level = 'L1';
  for (const e of events) {
    if (e.ts < cursor) continue;
    if (out[level] != null) out[level] += e.ts - cursor;
    cursor = e.ts;
    if (e.action?.startsWith('Escalated to ') && e.newLevel && out[e.newLevel] != null) {
      level = e.newLevel;
    } else if (e.action?.startsWith('Escalated to ')) {
      // Fallback for legacy entries without newLevel.
      const m = e.action.match(/Escalated to (L[123])/);
      if (m && out[m[1]] != null) level = m[1];
    }
  }
  const endTs = ticket.resolvedAt ? new Date(ticket.resolvedAt).getTime() : now;
  if (endTs > cursor && out[level] != null) out[level] += endTs - cursor;
  return out;
}

// Aggregate KPIs per support level across a list of tickets.
export function metricsByLevel(tickets, now = Date.now()) {
  const levels = ['L1', 'L2', 'L3'];
  const base = () => ({
    received: 0,        // tickets that ever sat at this level
    open: 0,            // currently sitting at this level and not terminal
    resolvedAtLevel: 0, // resolved while sitting here
    escalatedFrom: 0,   // outgoing escalations originating at this level
    responseTimes: [],  // ms to first response while at level
    resolutionTimes: [],// ms total resolution for tickets resolved while at this level
    slaMet: 0,
    slaTotal: 0,        // tickets whose deadline already passed (or were resolved)
  });
  const acc = Object.fromEntries(levels.map((l) => [l, base()]));

  for (const t of tickets) {
    const visited = new Set(['L1']);
    const escalations = (t.history || []).filter((h) => h.action?.startsWith('Escalated to '));
    for (const e of escalations) {
      const next = e.newLevel || (e.action.match(/Escalated to (L[123])/) || [])[1];
      if (next) visited.add(next);
      const from = e.previousLevel || (LEVEL_ORDER[next] ? Object.keys(LEVEL_ORDER).find((k) => LEVEL_ORDER[k] === LEVEL_ORDER[next] - 1) : null);
      if (from && acc[from]) acc[from].escalatedFrom += 1;
    }
    for (const l of visited) if (acc[l]) acc[l].received += 1;

    if (!TERMINAL_STATUSES.includes(t.status) && acc[t.currentLevel]) {
      acc[t.currentLevel].open += 1;
    }

    if (t.status === 'resolved' || t.status === 'closed') {
      const lvl = t.currentLevel;
      if (acc[lvl]) {
        acc[lvl].resolvedAtLevel += 1;
        if (t.createdAt && t.resolvedAt) {
          acc[lvl].resolutionTimes.push(new Date(t.resolvedAt).getTime() - new Date(t.createdAt).getTime());
        }
      }
    }

    // First response time: createdAt → first non-creation history entry.
    const firstResp = (t.history || []).find((h) =>
      /assigned|status changed to in progress|escalated/i.test(h.action)
    );
    if (firstResp && t.createdAt) {
      const resp = new Date(firstResp.date).getTime() - new Date(t.createdAt).getTime();
      // Attribute response time to L1 (the receiving level).
      acc.L1.responseTimes.push(Math.max(0, resp));
    }

    // SLA scoring: if resolved → met or breached vs resolutionDeadline; if open and deadline passed → breached.
    const dl = t.resolutionDeadline || t.slaDeadline;
    const lvl = t.currentLevel;
    if (acc[lvl] && dl) {
      if (t.status === 'resolved' || t.status === 'closed') {
        const at = t.resolvedAt || t.updatedAt;
        acc[lvl].slaTotal += 1;
        if (at && new Date(at).getTime() <= new Date(dl).getTime()) acc[lvl].slaMet += 1;
      } else if (now > new Date(dl).getTime()) {
        acc[lvl].slaTotal += 1; // breached, slaMet stays 0 for this ticket
      }
    }
  }

  const avg = (arr) => (arr.length ? arr.reduce((s, x) => s + x, 0) / arr.length : 0);
  return levels.map((l) => {
    const a = acc[l];
    const compliance = a.slaTotal ? (a.slaMet / a.slaTotal) * 100 : null;
    return {
      level: l,
      received: a.received,
      open: a.open,
      resolved: a.resolvedAtLevel,
      escalated: a.escalatedFrom,
      avgResponseMs: avg(a.responseTimes),
      avgResolutionMs: avg(a.resolutionTimes),
      slaCompliance: compliance,
    };
  });
}

// Global SLA compliance % across all resolved-or-deadline-passed tickets.
export function globalSlaCompliance(tickets, now = Date.now()) {
  let met = 0, total = 0;
  for (const t of tickets) {
    const dl = t.resolutionDeadline || t.slaDeadline;
    if (!dl) continue;
    if (t.status === 'resolved' || t.status === 'closed') {
      total += 1;
      const at = t.resolvedAt || t.updatedAt;
      if (at && new Date(at).getTime() <= new Date(dl).getTime()) met += 1;
    } else if (now > new Date(dl).getTime()) {
      total += 1;
    }
  }
  return total ? (met / total) * 100 : null;
}

// Average resolution time across resolved tickets (ms).
export function averageResolutionMs(tickets) {
  const durations = tickets
    .filter((t) => (t.status === 'resolved' || t.status === 'closed') && t.createdAt && t.resolvedAt)
    .map((t) => new Date(t.resolvedAt).getTime() - new Date(t.createdAt).getTime());
  if (!durations.length) return 0;
  return durations.reduce((s, x) => s + x, 0) / durations.length;
}
