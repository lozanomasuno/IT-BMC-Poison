// Status & filter constants shared across the UI.

export const STATUSES = ['new', 'assigned', 'in_progress', 'pending', 'resolved', 'closed', 'cancelled'];

// Filter tabs as required by the spec. "Open" maps to backend statuses new + assigned.
export const STATUS_FILTERS = [
  { key: 'all',         label: 'All',         match: () => true },
  { key: 'open',        label: 'Open',        match: (t) => t.status === 'new' || t.status === 'assigned' },
  { key: 'pending',     label: 'Pending',     match: (t) => t.status === 'pending' },
  { key: 'in_progress', label: 'In Progress', match: (t) => t.status === 'in_progress' },
  { key: 'resolved',    label: 'Resolved',    match: (t) => t.status === 'resolved' },
  { key: 'closed',      label: 'Closed',      match: (t) => t.status === 'closed' },
  { key: 'cancelled',   label: 'Cancelled',   match: (t) => t.status === 'cancelled' },
];

export const STATUS_LABELS = {
  new: 'New',
  assigned: 'Assigned',
  in_progress: 'In Progress',
  pending: 'Pending',
  resolved: 'Resolved',
  closed: 'Closed',
  cancelled: 'Cancelled',
};

export const STATUS_BADGE = {
  new:         'bg-sky-50 text-sky-700 border-sky-200',
  assigned:    'bg-indigo-50 text-indigo-700 border-indigo-200',
  in_progress: 'bg-amber-50 text-amber-700 border-amber-200',
  pending:     'bg-orange-50 text-orange-700 border-orange-200',
  resolved:    'bg-emerald-50 text-emerald-700 border-emerald-200',
  closed:      'bg-slate-100 text-slate-600 border-slate-200',
  cancelled:   'bg-rose-50 text-rose-700 border-rose-200',
};

export const PRIORITY_BADGE = {
  low:      'bg-slate-100 text-slate-700 border-slate-200',
  medium:   'bg-blue-50 text-blue-700 border-blue-200',
  high:     'bg-orange-50 text-orange-700 border-orange-200',
  critical: 'bg-rose-50 text-rose-700 border-rose-200',
};

export const LEVEL_BADGE = {
  L1: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  L2: 'bg-amber-50 text-amber-700 border-amber-200',
  L3: 'bg-rose-50 text-rose-700 border-rose-200',
};

export const ROLE_LABELS = {
  l1_agent: 'L1 Agent',
  l2_agent: 'L2 Agent',
  l3_agent: 'L3 Agent',
  manager: 'Manager',
  requester: 'Requester',
};

export const PRIORITIES = ['low', 'medium', 'high', 'critical'];
export const IMPACTS = ['low', 'medium', 'high'];
export const URGENCIES = ['low', 'medium', 'high'];
export const TICKET_TYPES = ['incident', 'request'];

// Escalation rules — what a given level may escalate to.
export const ESCALATION_PATHS = {
  L1: ['L2', 'L3'],
  L2: ['L3'],
  L3: [],
};

export const LEVEL_ORDER = { L1: 1, L2: 2, L3: 3 };
export const LEVEL_LABEL = { L1: 'L1 — Help Desk', L2: 'L2 — Application Support', L3: 'L3 — Advanced / Field Support' };

// Default group name to assign when a ticket is escalated/created at a level.
// The store will resolve the actual group id via name match.
export const DEFAULT_GROUP_BY_LEVEL = {
  L1: 'Help Desk',
  L2: 'Application Support',
  L3: 'Field Support',
};

// Category-driven routing overrides. Match on category OR subcategory (case-insensitive,
// substring). Lets L1 send hardware/network/app-bug tickets straight to the right group.
export const CATEGORY_ROUTING = [
  { match: /network|vpn|wifi|connectivity/i, level: 'L2', groupName: 'Network Team' },
  { match: /hardware|laptop|printer|peripheral|power/i, level: 'L3', groupName: 'Field Support' },
  { match: /application bug|app bug|software bug|defect/i, level: 'L3', groupName: 'Application Owners' },
  { match: /security|identity|access governance/i, level: 'L3', groupName: 'Security Team' },
];
