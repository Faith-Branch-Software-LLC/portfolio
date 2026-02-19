# Project Tracker — Requirements Spec

A personal project management app built as an admin section of my portfolio site (Next.js + Prisma). The goal: an easy way to keep track of all my projects so I can context-switch between jobs and pick up right where I left off. This was originally a project I started on Obsidian, but it never worked right for me, and I believe that was because there are major limitations with how it works. By putting this on my own site, I can do whatever I want with code.

---

## 1. Dashboard

The landing page after login. Shows everything I need to get started for the day.

### Sections

- **Project Overview**: Progress bar for each active project (auto-calculated from task completion: done tasks / total non-backlog tasks). Grouped by client. Click to open the project kanban.
- **Today**: Tasks currently in To Do or In Progress across all projects, grouped by project. This is what I should be working on right now.
- **Last Time**: What changed during my last session — tasks completed, tasks moved between columns. Shows me where I left off.
- **Upcoming Meetings**: Google Calendar meetings for the next 7 days with countdown (days away). Meetings happening today or tomorrow are highlighted.

### Acceptance Criteria

- Progress percentages update as tasks move between columns
- Completed/archived projects can be hidden via toggle
- Clicking a project navigates to its kanban board
- "Last Time" section auto-populates from the activity log

---

## 2. Clients

Organizational grouping for projects. A client can be an employer, a personal category, or just a label.

### Data Model

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | yes | Client name (e.g. "Acme Corp", "Personal", "Home") |
| color | string | no | Hex color for visual grouping on dashboard |
| created_at | datetime | auto | Creation timestamp |
| updated_at | datetime | auto | Last modification timestamp |

### Features

- Create, edit, delete clients
- Each client has many projects
- Dashboard groups projects under their client
- Client list/management page

### Acceptance Criteria

- Deleting a client requires reassigning or deleting its projects first
- Client color shows as an accent on project cards in the dashboard

---

## 3. Projects

A project belongs to a client and has a kanban board for task tracking.

### Data Model

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | yes | Project name |
| client | reference | yes | Parent client |
| status | enum | yes | Not Started, In Progress, On Hold, Completed |
| priority | enum | no | Low, Medium, High, Urgent |
| due | date | no | Target completion date |
| description | text | no | Project overview |
| created_at | datetime | auto | Creation timestamp |
| updated_at | datetime | auto | Last modification timestamp |

### Features

- Create, edit, archive, delete projects
- Creating a project auto-creates its kanban board with default columns
- Project page = its kanban board + list of progress reports
- Filter/sort projects by status, priority, client, due date

### Acceptance Criteria

- Progress is computed automatically from kanban task counts (not manually entered)
- Archiving a project hides it from the dashboard but preserves all data
- Projects can be re-activated from archive

---

## 4. Kanban Boards

The primary interface. One board per project. This is where all the work happens.

### Columns (fixed, in order)

1. **Backlog** — Ideas and tasks not yet prioritized
2. **To Do** — Prioritized tasks ready to pick up
3. **In Progress** — Actively being worked on
4. **Waiting** — Blocked or waiting on someone else
5. **Done** — Completed tasks

### Features

- Drag-and-drop tasks between columns
- Create tasks inline within a column
- Click task to expand detail view / edit
- Priority color coding on task cards
- Tag display on task cards (colored chips)
- Filter tasks by tag or priority
- Column task counts displayed in header

### Activity Log (hidden, automatic)

Every task movement is logged automatically in the background:
- Task created (which column)
- Task moved (from column → to column)
- Task edited (what changed)
- Task deleted

This log is never shown directly to the user. It powers the "Last Time" section on the dashboard and the auto-generated content in progress reports.

### Acceptance Criteria

- Dragging a task to Done marks it complete with a timestamp
- Dragging a task out of Done clears the completed timestamp
- Board is responsive — usable on mobile with horizontal scroll or vertical stack
- Column order is fixed and cannot be rearranged
- All task movements are recorded in the activity log with timestamps

---

## 5. Tasks

Individual work items that live on kanban boards.

### Data Model

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| title | string | yes | Task name |
| description | text | no | Details, notes |
| priority | enum | no | Low, Medium, High, Urgent |
| due | date | no | Due date |
| tags | string[] | no | Custom tags (e.g. "map-editing", "bug", "feature") |
| project | reference | yes | Parent project |
| column | enum | yes | Current kanban column |
| order | integer | auto | Position within column (for drag ordering) |
| created_at | datetime | auto | Creation timestamp |
| completed_at | datetime | auto | When moved to Done |

### Acceptance Criteria

- Tasks can be created from the kanban board
- Completing a task records a timestamp
- Tasks can have multiple tags
- Task order within a column is preserved and adjustable via drag

---

## 6. Progress Reports

Project-specific reports that capture what changed since the last report. Stored permanently.

### Data Model

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| project | reference | yes | Which project this report belongs to |
| content | text | no | Manual notes — context, decisions, blockers, next steps |
| auto_summary | json | auto | Auto-generated changelog since last report |
| created_at | datetime | auto | When the report was created |

### Auto-Summary Contents (generated from activity log)

When creating a new progress report, the system queries the activity log for all events since the last report for that project and generates:

- **Tasks Completed**: Tasks moved to Done since last report
- **Tasks Created**: New tasks added since last report
- **Tasks Moved**: Tasks that changed columns (e.g. "Fix bug" moved from To Do → In Progress)
- **Tasks Deleted**: Tasks removed since last report

### Features

- Create a progress report from the project page (one-click)
- Auto-summary is pre-populated, then I can add manual notes on top
- Chronological list on the project page (newest first)
- Reports are read-only after creation (historical record)

### Acceptance Criteria

- Auto-summary accurately reflects all task activity since previous report
- If no previous report exists, auto-summary covers all activity since project creation
- Reports are viewable from the project page
- Once created, reports cannot be edited (immutable history)

---

## 7. Google Calendar Integration

Pull upcoming meetings from Google Calendar to display on the dashboard.

### Features

- OAuth connection to Google Calendar
- Pull meetings for the next 7 days
- Display on dashboard: title, date, time, countdown
- Meetings today or tomorrow are visually highlighted
- No push/write back to Google Calendar (read-only)

### Acceptance Criteria

- Google Calendar meetings sync automatically on page load
- Meetings appear on the dashboard without manual entry
- Calendar connection persists across sessions

---

## 8. Authentication

Private admin panel — only I need access.

### Requirements

- Authentication required to access any page
- Single user (no multi-user support needed)
- Part of existing portfolio site (shared auth or separate admin auth)
- Session persistence (stay logged in across browser sessions)

---

## 9. Data Storage (Prisma)

### Entities and Relationships

```
Client (1) ——< (many) Project
Project (1) ——< (many) Task
Project (1) ——< (many) ProgressReport
Task (many) >——< (many) Tag
Project (1) ——< (many) ActivityLogEntry
```

### Core Tables

- **clients**: id, name, color, created_at, updated_at
- **projects**: id, client_id, name, status, priority, due, description, created_at, updated_at
- **tasks**: id, project_id, title, description, priority, due, column, order, created_at, completed_at, updated_at
- **tags**: id, name, color
- **task_tags**: task_id, tag_id
- **activity_log**: id, project_id, task_id, action (created/moved/edited/deleted), from_column, to_column, details, created_at
- **progress_reports**: id, project_id, content, auto_summary, created_at

---

## 10. Mobile Support

- Responsive design — all views usable on phone and tablet
- Kanban boards: horizontal scroll on mobile
- Touch-friendly drag-and-drop for kanban tasks
- Dashboard fully functional on mobile

---

## 11. Color System

### Priority Colors

| Priority | Color |
|----------|-------|
| Urgent | Red (#ff0000) |
| High | Coral (#ff3b3b) |
| Medium | Orange (#ffaf00) |
| Low | Sky Blue (#00bfff) |

### Project Status Colors

| Status | Color |
|--------|-------|
| Not Started | Gray (#888888) |
| In Progress | Blue (#3498db) |
| On Hold | Orange (#e67e22) |
| Completed | Green (#2ecc71) |

### Progress Bar Colors

| Range | Gradient |
|-------|----------|
| 0-29% | #ff5555 → #ff7777 |
| 30-69% | #ffaa44 → #ffcc55 |
| 70-100% | #44bb44 → #66cc66 |
