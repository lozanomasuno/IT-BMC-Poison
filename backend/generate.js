// Generates a realistic db.json for an ITSM mock backend (JSON Server).
const fs = require('fs');
const path = require('path');

// ---------- Helpers ----------
let seed = 42;
const rand = () => {
  // Simple deterministic PRNG (mulberry32)
  seed |= 0; seed = seed + 0x6D2B79F5 | 0;
  let t = seed;
  t = Math.imul(t ^ t >>> 15, t | 1);
  t ^= t + Math.imul(t ^ t >>> 7, t | 61);
  return ((t ^ t >>> 14) >>> 0) / 4294967296;
};
const pick = arr => arr[Math.floor(rand() * arr.length)];
const pickN = (arr, n) => {
  const copy = [...arr];
  const out = [];
  for (let i = 0; i < n && copy.length; i++) out.push(copy.splice(Math.floor(rand() * copy.length), 1)[0]);
  return out;
};
const pad = (n, w = 6) => String(n).padStart(w, '0');
const iso = d => d.toISOString().replace(/\.\d{3}Z$/, 'Z');
const addHours = (d, h) => new Date(d.getTime() + h * 3600 * 1000);
const addMinutes = (d, m) => new Date(d.getTime() + m * 60 * 1000);
const daysAgo = d => new Date(Date.now() - d * 24 * 3600 * 1000);

// ---------- Groups ----------
const groups = [
  { id: 1, name: 'Help Desk',          level: 'L1', description: 'First line of support handling general issues and password resets.' },
  { id: 2, name: 'Service Desk',       level: 'L1', description: 'Front-line service request intake and routing.' },
  { id: 3, name: 'Application Support',level: 'L2', description: 'Application troubleshooting, configuration, and minor bug fixes.' },
  { id: 4, name: 'Network Team',       level: 'L2', description: 'Connectivity, VPN, firewall, switches and routers.' },
  { id: 5, name: 'Field Support',      level: 'L2', description: 'On-site hardware support, laptops, printers and peripherals.' },
  { id: 6, name: 'Security Team',      level: 'L3', description: 'Identity, access governance and security incidents.' },
];

// ---------- Locations ----------
const locations = [
  { country: 'USA',      city: 'New York' },
  { country: 'Colombia', city: 'Medellin' },
  { country: 'Mexico',   city: 'Monterrey' },
  { country: 'Spain',    city: 'Madrid' },
  { country: 'Canada',   city: 'Toronto' },
];

// ---------- Users ----------
const firstNames = ['Maria','John','Carlos','Sofia','Andres','Laura','David','Ana','Miguel','Elena','Diego','Camila','Daniel','Lucia','Pedro','Isabella','Javier','Valentina','Luis','Paula','Ricardo','Natalia','Tomas','Mariana','Felipe'];
const lastNames  = ['Smith','Gomez','Rodriguez','Martinez','Lopez','Garcia','Hernandez','Perez','Sanchez','Ramirez','Torres','Flores','Diaz','Reyes','Morales','Castro','Romero','Alvarez','Jimenez','Vargas','Mendoza','Ortiz','Silva','Rojas','Navarro'];

const users = [];
let userId = 1;
const mkUser = (role, supportLevel, groupId) => {
  const fn = pick(firstNames);
  const ln = pick(lastNames);
  const fullName = `${fn} ${ln}`;
  const username = `${fn}.${ln}`.toLowerCase();
  const loc = pick(locations);
  const u = {
    id: userId,
    employeeCode: `EMP${pad(1000 + userId, 5)}`,
    username,
    fullName,
    email: `${username}@contoso.com`,
    role,
    supportLevel,
    country: loc.country,
    city: loc.city,
    phone: `+1-555-${pad(Math.floor(rand() * 9999), 4)}`,
    groupId,
    avatar: `https://i.pravatar.cc/150?img=${userId}`,
    isActive: rand() > 0.05,
  };
  users.push(u);
  userId++;
  return u;
};

// Agents per group (so we can route tickets realistically)
const agentsByGroup = {};
const addAgents = (groupId, level, count) => {
  agentsByGroup[groupId] = [];
  const role = level === 'L1' ? 'l1_agent' : level === 'L2' ? 'l2_agent' : 'l3_agent';
  for (let i = 0; i < count; i++) agentsByGroup[groupId].push(mkUser(role, level, groupId));
};
addAgents(1, 'L1', 4); // Help Desk
addAgents(2, 'L1', 3); // Service Desk
addAgents(3, 'L2', 3); // Application Support
addAgents(4, 'L2', 3); // Network Team
addAgents(5, 'L2', 2); // Field Support
addAgents(6, 'L3', 3); // Security Team (L3)

// Add managers (one per group level tier)
const managers = [
  mkUser('manager', 'L1', 1),
  mkUser('manager', 'L2', 3),
  mkUser('manager', 'L3', 6),
];

// Requesters (end users) — no group assignment (groupId: null)
const requesters = [];
for (let i = 0; i < 30; i++) {
  const fn = pick(firstNames);
  const ln = pick(lastNames);
  const fullName = `${fn} ${ln}`;
  const username = `${fn}.${ln}`.toLowerCase() + (i < 10 ? '' : i);
  const loc = pick(locations);
  const u = {
    id: userId,
    employeeCode: `EMP${pad(1000 + userId, 5)}`,
    username,
    fullName,
    email: `${username}@contoso.com`,
    role: 'requester',
    supportLevel: null,
    country: loc.country,
    city: loc.city,
    phone: `+1-555-${pad(Math.floor(rand() * 9999), 4)}`,
    groupId: null,
    avatar: `https://i.pravatar.cc/150?img=${userId}`,
    isActive: rand() > 0.03,
  };
  users.push(u);
  requesters.push(u);
  userId++;
}

// ---------- Service Catalog ----------
const serviceCatalog = [
  { id: 1, name: 'New email account',        category: 'Accounts',     approvalRequired: true,  targetGroupId: 6, estimatedFulfillmentHours: 8  },
  { id: 2, name: 'Laptop request',           category: 'Hardware',     approvalRequired: true,  targetGroupId: 5, estimatedFulfillmentHours: 48 },
  { id: 3, name: 'VPN access',               category: 'Network',      approvalRequired: true,  targetGroupId: 4, estimatedFulfillmentHours: 12 },
  { id: 4, name: 'Software installation',    category: 'Software',     approvalRequired: false, targetGroupId: 3, estimatedFulfillmentHours: 6  },
  { id: 5, name: 'Printer replacement',      category: 'Hardware',     approvalRequired: true,  targetGroupId: 5, estimatedFulfillmentHours: 24 },
  { id: 6, name: 'Phone extension',          category: 'Telephony',    approvalRequired: false, targetGroupId: 4, estimatedFulfillmentHours: 4  },
  { id: 7, name: 'Shared folder access',     category: 'Access',       approvalRequired: true,  targetGroupId: 6, estimatedFulfillmentHours: 6  },
  { id: 8, name: 'New employee onboarding',  category: 'Onboarding',   approvalRequired: true,  targetGroupId: 2, estimatedFulfillmentHours: 72 },
];

// ---------- Catalogs for tickets ----------
const incidentCatalog = [
  { title: 'VPN connectivity issue',      category: 'Network',    subcategory: 'VPN',        groupId: 4, slaHours: 4 },
  { title: 'Computer does not power on',  category: 'Hardware',   subcategory: 'Workstation',groupId: 5, slaHours: 8 },
  { title: 'Email not syncing',           category: 'Email',      subcategory: 'Outlook',    groupId: 3, slaHours: 6 },
  { title: 'Application error on ERP',    category: 'Application',subcategory: 'ERP',        groupId: 3, slaHours: 6 },
  { title: 'Printer offline',             category: 'Hardware',   subcategory: 'Printer',    groupId: 5, slaHours: 8 },
  { title: 'Password reset',              category: 'Accounts',   subcategory: 'Password',   groupId: 1, slaHours: 2 },
  { title: 'Slow network performance',    category: 'Network',    subcategory: 'WAN',        groupId: 4, slaHours: 6 },
  { title: 'Access denied to shared drive',category:'Access',     subcategory: 'Permissions',groupId: 6, slaHours: 4 },
  { title: 'Report generation failure',   category: 'Application',subcategory: 'Reporting',  groupId: 3, slaHours: 8 },
  { title: 'Software corruption',         category: 'Software',   subcategory: 'Workstation',groupId: 5, slaHours: 12},
  { title: 'Cannot login to portal',      category: 'Accounts',   subcategory: 'SSO',        groupId: 1, slaHours: 2 },
  { title: 'Outlook crashes on startup',  category: 'Email',      subcategory: 'Outlook',    groupId: 3, slaHours: 6 },
  { title: 'Wi-Fi disconnects intermittently', category:'Network',subcategory: 'Wireless',   groupId: 4, slaHours: 8 },
  { title: 'BSOD on workstation',         category: 'Hardware',   subcategory: 'Workstation',groupId: 5, slaHours: 8 },
  { title: 'Unauthorized login alert',    category: 'Security',   subcategory: 'Identity',   groupId: 6, slaHours: 2 },
];

const requestCatalog = [
  { title: 'New employee email creation',          category: 'Accounts',    subcategory: 'Email',        serviceId: 1, groupId: 6, slaHours: 8  },
  { title: 'New workstation request',              category: 'Hardware',    subcategory: 'Laptop',       serviceId: 2, groupId: 5, slaHours: 48 },
  { title: 'Architecture software installation',   category: 'Software',    subcategory: 'CAD',          serviceId: 4, groupId: 3, slaHours: 6  },
  { title: 'Printer replacement',                  category: 'Hardware',    subcategory: 'Printer',      serviceId: 5, groupId: 5, slaHours: 24 },
  { title: 'Additional monitor request',           category: 'Hardware',    subcategory: 'Peripherals',  serviceId: 2, groupId: 5, slaHours: 24 },
  { title: 'Shared drive permissions',             category: 'Access',      subcategory: 'Permissions',  serviceId: 7, groupId: 6, slaHours: 6  },
  { title: 'VPN access request',                   category: 'Network',     subcategory: 'VPN',          serviceId: 3, groupId: 4, slaHours: 12 },
  { title: 'New phone extension',                  category: 'Telephony',   subcategory: 'PBX',          serviceId: 6, groupId: 4, slaHours: 4  },
  { title: 'New employee onboarding',              category: 'Onboarding',  subcategory: 'HR',           serviceId: 8, groupId: 2, slaHours: 72 },
];

const priorities = ['low','medium','high','critical'];
const impacts    = ['low','medium','high'];
const urgencies  = ['low','medium','high'];
const sources    = ['phone','portal','email','chat'];

const priorityWeights = [['low',0.25],['medium',0.45],['high',0.22],['critical',0.08]];
const weightedPick = (pairs) => {
  const r = rand();
  let acc = 0;
  for (const [v, w] of pairs) { acc += w; if (r <= acc) return v; }
  return pairs[pairs.length - 1][0];
};

const groupAgentsByLevel = level => {
  const ids = groups.filter(g => g.level === level).map(g => g.id);
  return ids.flatMap(id => agentsByGroup[id] || []);
};
const l1Agents = groupAgentsByLevel('L1');
const l2Agents = groupAgentsByLevel('L2');
const l3Agents = groupAgentsByLevel('L3');

const descriptionFor = (title) => {
  const map = {
    'VPN connectivity issue': 'User reports being unable to establish a VPN tunnel from the corporate client. Authentication succeeds but no internal resources are reachable.',
    'Computer does not power on': 'Workstation shows no LED activity when pressing power button. Power outlet verified working.',
    'Email not syncing': 'Outlook client stuck on "Updating Inbox". OWA works correctly.',
    'Application error on ERP': 'User receives error code ERP-5021 when posting invoices in the ERP module.',
    'Printer offline': 'Network printer shows offline in Windows. Printer panel reports ready.',
    'Password reset': 'User locked out after multiple failed login attempts.',
    'Slow network performance': 'High latency reported when accessing internal SharePoint. Pings spike above 500ms.',
    'Access denied to shared drive': 'User cannot open the Finance shared folder. Was working yesterday.',
    'Report generation failure': 'BI report times out after 10 minutes. Affecting end-of-month closing.',
    'Software corruption': 'Microsoft Office randomly closes. Repair attempted without success.',
    'Cannot login to portal': 'SSO returns 401 when trying to access the company portal.',
    'Outlook crashes on startup': 'Outlook 2019 crashes immediately after splash screen. Safe mode works.',
    'Wi-Fi disconnects intermittently': 'Wireless drops every 10-15 minutes on floor 4.',
    'BSOD on workstation': 'Blue screen "MEMORY_MANAGEMENT" several times per day.',
    'Unauthorized login alert': 'SIEM raised alert for login attempt from unrecognized geolocation.',
    'New employee email creation': 'Please create an Exchange mailbox for incoming employee starting next Monday.',
    'New workstation request': 'New hire needs a standard developer laptop image.',
    'Architecture software installation': 'Install AutoCAD 2025 on workstation including license activation.',
    'Printer replacement': 'Existing printer is end-of-life and needs replacement with current model.',
    'Additional monitor request': 'Request for a second 27" monitor to improve productivity.',
    'Shared drive permissions': 'Grant read/write access to \\\\fileserver\\Projects\\Alpha for the requester.',
    'VPN access request': 'Provision VPN access profile for remote work.',
    'New phone extension': 'Assign a new internal extension and configure handset.',
    'New employee onboarding': 'Full onboarding package: account, equipment, access, and training.',
  };
  return map[title] || 'Issue reported by end user. Pending triage.';
};

const resolutionFor = (title) => {
  const map = {
    'VPN connectivity issue': 'Reset VPN profile and pushed updated split-tunnel routes. User confirmed access restored.',
    'Computer does not power on': 'Replaced faulty power supply unit. Workstation boots correctly.',
    'Email not syncing': 'Recreated Outlook profile and rebuilt OST. Mail flowing normally.',
    'Application error on ERP': 'Applied vendor patch ERP-2026.04. Posting now successful.',
    'Printer offline': 'Reinstalled print driver and reconfigured TCP/IP port.',
    'Password reset': 'Account unlocked and temporary password issued through self-service.',
    'Slow network performance': 'Replaced faulty SFP on edge switch. Latency restored to baseline.',
    'Access denied to shared drive': 'Re-added user to FIN-RW security group. Access verified.',
    'Report generation failure': 'Optimized SQL query and increased report timeout. Job completes in 2 minutes.',
    'Software corruption': 'Reinstalled Microsoft Office from SCCM package. Stable after reboot.',
    'Cannot login to portal': 'Cleared stale SSO session and re-synced AD attributes.',
    'Outlook crashes on startup': 'Disabled corrupted COM add-in and updated Outlook to latest CU.',
    'Wi-Fi disconnects intermittently': 'Replaced access point on floor 4 and adjusted channel plan.',
    'BSOD on workstation': 'Replaced defective RAM module identified via memtest.',
    'Unauthorized login alert': 'Confirmed false positive after user travel. Whitelisted geolocation temporarily.',
  };
  return map[title] || 'Issue addressed and verified with the end user.';
};

// ---------- Ticket builder ----------
let ticketCounter = 1;
const tickets = [];

const buildTicket = ({ type, item, requester, status, currentLevel, ageDays }) => {
  const ticketNumber = `INC${pad(ticketCounter, 6)}`;
  const reqNumber    = `REQ${pad(ticketCounter, 6)}`;
  const number = type === 'incident' ? ticketNumber : reqNumber;

  const createdAt = daysAgo(ageDays + rand() * 0.9);
  const priority  = type === 'incident' ? weightedPick(priorityWeights) : pick(['low','medium','high']);
  const impact    = pick(impacts);
  const urgency   = pick(urgencies);
  const source    = pick(sources);
  const slaHours  = item.slaHours;

  // Routing
  let assignedGroupId = item.groupId;
  let agentPool = agentsByGroup[assignedGroupId] || [];
  let assignedTo = null;
  let resolvedAt = null;
  let resolution = null;

  // History timeline
  const history = [];
  history.push({
    date: iso(createdAt),
    action: 'Ticket created',
    performedBy: requester.username,
    level: 'L1',
    notes: `Opened via ${source}.`,
  });

  let cursor = addMinutes(createdAt, 5 + Math.floor(rand() * 25));
  let updatedAt = cursor;

  // Initial L1 assignment for incidents; service requests can land directly in target group.
  if (type === 'incident') {
    const l1Agent = pick(l1Agents);
    history.push({
      date: iso(cursor),
      action: 'Assigned to Help Desk',
      performedBy: 'system',
      level: 'L1',
      notes: `Auto-assigned to ${l1Agent.fullName}.`,
    });
    assignedTo = l1Agent.id;
    assignedGroupId = l1Agent.groupId;
    cursor = addMinutes(cursor, 10 + Math.floor(rand() * 60));

    if (currentLevel === 'L2' || currentLevel === 'L3') {
      // Escalate to L2
      const l2Agent = pick(l2Agents);
      history.push({
        date: iso(cursor),
        action: 'Escalated to L2',
        performedBy: l1Agent.username,
        level: 'L1',
        notes: 'Issue requires application/network specialist review.',
      });
      assignedTo = l2Agent.id;
      assignedGroupId = l2Agent.groupId;
      cursor = addHours(cursor, 1 + rand() * 4);
    }
    if (currentLevel === 'L3') {
      const l3Agent = pick(l3Agents);
      history.push({
        date: iso(cursor),
        action: 'Escalated to L3',
        performedBy: users.find(u => u.id === assignedTo).username,
        level: 'L2',
        notes: 'Requires deep technical / security analysis.',
      });
      assignedTo = l3Agent.id;
      assignedGroupId = l3Agent.groupId;
      cursor = addHours(cursor, 2 + rand() * 6);
    }
  } else {
    // Service request: assign directly to target group
    const agent = pick(agentPool.length ? agentPool : l2Agents);
    assignedTo = agent.id;
    assignedGroupId = agent.groupId;
    history.push({
      date: iso(cursor),
      action: 'Assigned to fulfillment group',
      performedBy: 'system',
      level: agent.supportLevel,
      notes: `Routed to ${groups.find(g => g.id === agent.groupId).name}.`,
    });
    cursor = addHours(cursor, 0.5 + rand() * 3);
  }

  // Status progression
  const performer = users.find(u => u.id === assignedTo);
  if (status === 'new') {
    // leave as new
  } else if (status === 'assigned') {
    history.push({
      date: iso(cursor), action: 'Acknowledged', performedBy: performer.username,
      level: currentLevel, notes: 'Agent acknowledged the ticket.',
    });
  } else if (status === 'in_progress') {
    history.push({
      date: iso(cursor), action: 'Work started', performedBy: performer.username,
      level: currentLevel, notes: 'Investigation in progress.',
    });
    cursor = addHours(cursor, 1 + rand() * 4);
  } else if (status === 'pending') {
    history.push({
      date: iso(cursor), action: 'Pending user response', performedBy: performer.username,
      level: currentLevel, notes: 'Awaiting additional information from requester.',
    });
    cursor = addHours(cursor, 2 + rand() * 8);
  } else if (status === 'resolved' || status === 'closed') {
    history.push({
      date: iso(cursor), action: 'Work started', performedBy: performer.username,
      level: currentLevel, notes: 'Investigation in progress.',
    });
    cursor = addHours(cursor, 1 + rand() * Math.max(1, slaHours));
    resolvedAt = cursor;
    resolution = type === 'incident' ? resolutionFor(item.title) : 'Service request fulfilled successfully.';
    history.push({
      date: iso(cursor), action: 'Resolved', performedBy: performer.username,
      level: currentLevel, notes: resolution,
    });
    if (status === 'closed') {
      cursor = addHours(cursor, 24 + rand() * 48);
      history.push({
        date: iso(cursor), action: 'Closed', performedBy: requester.username,
        level: currentLevel, notes: 'Requester confirmed resolution.',
      });
    }
  } else if (status === 'cancelled') {
    history.push({
      date: iso(cursor), action: 'Cancelled', performedBy: requester.username,
      level: currentLevel, notes: 'Requester cancelled the ticket.',
    });
  }
  updatedAt = cursor;

  const breachedSla = (() => {
    if (resolvedAt) {
      const elapsed = (resolvedAt - createdAt) / 3600000;
      return elapsed > slaHours;
    }
    const elapsed = (Date.now() - createdAt.getTime()) / 3600000;
    return elapsed > slaHours;
  })();

  const ticket = {
    id: ticketCounter,
    ticketNumber: number,
    type,
    category: item.category,
    subcategory: item.subcategory,
    title: item.title,
    description: descriptionFor(item.title),
    priority,
    impact,
    urgency,
    status,
    requesterId: requester.id,
    assignedTo,
    assignedGroupId,
    currentLevel,
    source,
    createdAt: iso(createdAt),
    updatedAt: iso(updatedAt),
    resolvedAt: resolvedAt ? iso(resolvedAt) : null,
    resolution,
    locationCountry: requester.country,
    locationCity: requester.city,
    slaHours,
    breachedSla,
    relatedService: type === 'request' ? (serviceCatalog.find(s => s.id === item.serviceId)?.name ?? null) : null,
    history,
  };
  tickets.push(ticket);
  ticketCounter++;
};

// ---------- Distribution ----------
const makeIncidents = (count, status, currentLevel, ageRange) => {
  for (let i = 0; i < count; i++) {
    const item = pick(incidentCatalog);
    const requester = pick(requesters);
    const ageDays = ageRange[0] + rand() * (ageRange[1] - ageRange[0]);
    buildTicket({ type: 'incident', item, requester, status, currentLevel, ageDays });
  }
};

// 40 incidents resolved by L1
makeIncidents(28, 'resolved', 'L1', [1, 30]);
makeIncidents(12, 'closed',   'L1', [10, 60]);

// 30 incidents resolved by L2
makeIncidents(20, 'resolved', 'L2', [1, 45]);
makeIncidents(10, 'closed',   'L2', [15, 75]);

// 20 incidents resolved by L3
makeIncidents(14, 'resolved', 'L3', [2, 60]);
makeIncidents(6,  'closed',   'L3', [20, 90]);

// 20 incidents currently open in L1
makeIncidents(7, 'new',         'L1', [0, 2]);
makeIncidents(7, 'assigned',    'L1', [0, 3]);
makeIncidents(4, 'in_progress', 'L1', [0, 4]);
makeIncidents(2, 'pending',     'L1', [1, 5]);

// 20 incidents currently open in L2
makeIncidents(5, 'assigned',    'L2', [0, 4]);
makeIncidents(9, 'in_progress', 'L2', [0, 6]);
makeIncidents(4, 'pending',     'L2', [1, 7]);
makeIncidents(2, 'new',         'L2', [0, 1]);

// 15 incidents currently open in L3
makeIncidents(4, 'assigned',    'L3', [0, 5]);
makeIncidents(7, 'in_progress', 'L3', [1, 10]);
makeIncidents(4, 'pending',     'L3', [2, 12]);

// 55 service requests in multiple statuses
const requestStatusPlan = [
  ['new', 8],
  ['assigned', 8],
  ['in_progress', 12],
  ['pending', 6],
  ['resolved', 10],
  ['closed', 8],
  ['cancelled', 3],
];
for (const [status, count] of requestStatusPlan) {
  for (let i = 0; i < count; i++) {
    const item = pick(requestCatalog);
    const requester = pick(requesters);
    const ageDays = (status === 'new') ? rand() * 1.5
                  : (status === 'closed') ? 5 + rand() * 30
                  : rand() * 14;
    const currentLevel = (groups.find(g => g.id === item.groupId)?.level) || 'L2';
    buildTicket({ type: 'request', item, requester, status, currentLevel, ageDays });
  }
}

// ---------- Output ----------
const db = { users, groups, serviceCatalog, tickets };
const outPath = path.join(__dirname, 'db.json');
fs.writeFileSync(outPath, JSON.stringify(db, null, 2), 'utf8');
console.log(`Wrote ${tickets.length} tickets, ${users.length} users to ${outPath}`);
