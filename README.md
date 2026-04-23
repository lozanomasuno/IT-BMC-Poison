# IT-BMC-Poison

A modern enterprise-style **IT Service Management (ITSM)** help-desk application —
built with **Vite + Vue 3 (Composition API) + Pinia + Vue Router + Tailwind CSS**,
consuming a local **JSON Server** mock backend.

> Inspired by enterprise service-desk software (BMC Helix, ServiceNow, Jira Service Management).

---

## Features

- Professional dashboard layout (sidebar + header + content)
- Create incidents and service requests (L1 only)
- Incident Pool, Request Pool and My Tickets views
- Status filter tabs with live counts: **All / Open / Pending / In Progress / Resolved / Closed / Cancelled**
- Search by ticket #, requester, category, group, city, country
- Ticket detail view with activity timeline, work notes, escalation history, attachments placeholder, resolution notes
- Escalation workflow (L1 → L2/L3, L2 → L3) with role-based permissions
- Resolve / close lifecycle
- Dashboard cards: Total, Open, Pending, Resolved Today, SLA Breaches, My Assigned
- Charts: status, priority and support level distributions
- Manager view with full visibility
- Pinia stores for tickets, users, filters, auth
- Demo user switcher in header to test all roles

---

## Project Structure

```
backend/
  db.json            # 200 tickets, 51 users, groups, service catalog
  generate.js        # Seed regenerator
  package.json       # json-server runner
frontend/
  index.html
  vite.config.js     # Proxies /api → http://localhost:3001
  tailwind.config.js
  src/
    api/client.js
    components/
      common/        # StatusBadge, PriorityBadge, LevelBadge, StatCard, BarChart, DonutChart, Modal, SearchInput, StatusFilterTabs
      layout/        # AppSidebar, AppHeader
      tickets/       # TicketTable, EscalateDialog, ResolveDialog
    composables/
      usePermissions.js
      useTicketActions.js
    layouts/DashboardLayout.vue
    router/index.js
    stores/
      auth.js  filters.js  tickets.js  users.js
    utils/
      constants.js  format.js
    views/
      DashboardView.vue
      CreateTicketView.vue
      IncidentPoolView.vue
      RequestPoolView.vue
      MyTicketsView.vue
      TicketDetailView.vue
      ReportsView.vue
      SettingsView.vue
      NotFoundView.vue
    App.vue  main.js  style.css
```

---

## Getting Started

### 1. Backend (JSON Server)

```bash
cd backend
npm install
npm start            # http://localhost:3001
```

Endpoints exposed: `/users`, `/groups`, `/serviceCatalog`, `/tickets`.

To regenerate the mock dataset:

```bash
npm run generate
```

### 2. Frontend (Vite + Vue 3)

```bash
cd frontend
npm install
npm run dev          # http://localhost:5173
```

The dev server proxies `/api/*` to `http://localhost:3001`, so the SPA uses `fetch('/api/tickets')`.

### Build

```bash
cd frontend
npm run build
npm run preview
```

---

## Roles

| Role        | Create | Update assigned | Escalate to | View all |
|-------------|--------|-----------------|-------------|----------|
| L1 Agent    | ✅     | ✅              | L2, L3      | ❌       |
| L2 Agent    | ❌     | ✅              | L3          | ❌       |
| L3 Agent    | ❌     | ✅              | —           | ❌       |
| Manager     | ❌     | ✅              | —           | ✅       |

Switch the active user from the header (top-right) to test.

---

## Branch Strategy

- `main`            → stable
- `chore/backend-seed` → backend seed dataset
- `feat/frontend-scaffold` → full Vue 3 frontend
