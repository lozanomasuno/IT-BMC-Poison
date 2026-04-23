import { PRIORITIES } from './constants';

const PRIORITY_RANK = { low: 0, medium: 1, high: 2, critical: 3 };
const STATUS_RANK = {
  new: 0, assigned: 1, in_progress: 2, pending: 3,
  resolved: 4, closed: 5, cancelled: 6,
};
const LEVEL_RANK = { L1: 0, L2: 1, L3: 2 };

export const SORTABLE_COLUMNS = [
  'ticketNumber', 'type', 'title', 'requester', 'status',
  'priority', 'currentLevel', 'assignedGroup', 'locationCountry',
  'locationCity', 'updatedAt',
];

export function compareTickets(a, b, key, dir, usersStore) {
  const sign = dir === 'desc' ? -1 : 1;
  let av, bv;

  switch (key) {
    case 'priority':
      av = PRIORITY_RANK[a.priority] ?? -1;
      bv = PRIORITY_RANK[b.priority] ?? -1;
      break;
    case 'status':
      av = STATUS_RANK[a.status] ?? 99;
      bv = STATUS_RANK[b.status] ?? 99;
      break;
    case 'currentLevel':
      av = LEVEL_RANK[a.currentLevel] ?? 99;
      bv = LEVEL_RANK[b.currentLevel] ?? 99;
      break;
    case 'requester':
      av = usersStore.byId(a.requesterId)?.fullName?.toLowerCase() || '';
      bv = usersStore.byId(b.requesterId)?.fullName?.toLowerCase() || '';
      break;
    case 'assignedGroup':
      av = usersStore.groupById(a.assignedGroupId)?.name?.toLowerCase() || '';
      bv = usersStore.groupById(b.assignedGroupId)?.name?.toLowerCase() || '';
      break;
    case 'updatedAt':
    case 'createdAt':
      av = new Date(a[key]).getTime();
      bv = new Date(b[key]).getTime();
      break;
    default:
      av = String(a[key] ?? '').toLowerCase();
      bv = String(b[key] ?? '').toLowerCase();
  }

  if (av < bv) return -1 * sign;
  if (av > bv) return  1 * sign;
  return 0;
}

export function sortTickets(list, key, dir, usersStore) {
  if (!key) return list;
  return [...list].sort((a, b) => compareTickets(a, b, key, dir, usersStore));
}

export function applyAdvancedFilters(list, filters) {
  return list.filter((t) => {
    if (filters.priority && t.priority !== filters.priority) return false;
    if (filters.groupId && t.assignedGroupId !== Number(filters.groupId)) return false;
    if (filters.level && t.currentLevel !== filters.level) return false;
    if (filters.from) {
      if (new Date(t.updatedAt) < new Date(filters.from)) return false;
    }
    if (filters.to) {
      // include the entire end-day
      const end = new Date(filters.to);
      end.setHours(23, 59, 59, 999);
      if (new Date(t.updatedAt) > end) return false;
    }
    return true;
  });
}

export const PRIORITY_OPTIONS = [{ value: '', label: 'Any priority' }]
  .concat(PRIORITIES.map((p) => ({ value: p, label: p[0].toUpperCase() + p.slice(1) })));

export const LEVEL_OPTIONS = [
  { value: '', label: 'Any level' },
  { value: 'L1', label: 'L1' },
  { value: 'L2', label: 'L2' },
  { value: 'L3', label: 'L3' },
];

export function paginate(list, page, pageSize) {
  const total = list.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;
  return {
    items: list.slice(start, start + pageSize),
    page: safePage,
    totalPages,
    total,
    start,
    end: Math.min(start + pageSize, total),
  };
}

export function ticketsToCsv(list, usersStore) {
  const headers = [
    'ticketNumber','type','title','status','priority','currentLevel',
    'requester','assignedGroup','country','city','createdAt','updatedAt','resolvedAt',
  ];
  const escape = (v) => {
    if (v == null) return '';
    const s = String(v).replace(/"/g, '""');
    return /[",\n]/.test(s) ? `"${s}"` : s;
  };
  const rows = list.map((t) => [
    t.ticketNumber, t.type, t.title, t.status, t.priority, t.currentLevel,
    usersStore.byId(t.requesterId)?.fullName || '',
    usersStore.groupById(t.assignedGroupId)?.name || '',
    t.locationCountry, t.locationCity,
    t.createdAt, t.updatedAt, t.resolvedAt || '',
  ].map(escape).join(','));
  return [headers.join(','), ...rows].join('\n');
}

export function downloadCsv(filename, csv) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
