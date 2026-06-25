import { Code, Globe, Zap, Terminal, RefreshCw, Link, Bot } from 'lucide-react';

const panelStyle = {
  background: '#ffffff',
  border: '2px solid #2E294E',
  borderRadius: '8px',
  boxShadow: '5px 5px 0 0 rgba(46,41,78,0.18)',
  padding: '20px 22px',
};

function MethodBadge({ method, color = '#2E294E' }: { method: string; color?: string }) {
  return (
    <span
      style={{
        background: color,
        color: '#fff',
        fontFamily: "'Courier New', monospace",
        fontSize: '11px',
        fontWeight: 700,
        padding: '3px 9px',
        borderRadius: '5px',
        flexShrink: 0,
      }}
    >
      {method}
    </span>
  );
}

const methodColor: Record<string, string> = {
  GET: '#2E294E',
  POST: '#1B998B',
  PATCH: '#F46036',
  DELETE: '#c0392b',
};

function EndpointRow({
  method,
  path,
  desc,
  response,
  body,
}: {
  method: string;
  path: string;
  desc: string;
  response?: string;
  body?: string;
}) {
  return (
    <div
      style={{
        padding: '13px 14px',
        background: '#F7F3EA',
        border: '1.5px solid rgba(46,41,78,0.14)',
        borderRadius: '7px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: response || body ? '10px' : 0 }}>
        <MethodBadge method={method} color={methodColor[method] ?? '#2E294E'} />
        <span style={{ fontFamily: "'Courier New', monospace", fontSize: '12.5px', color: '#2E294E', flex: 1 }}>
          {path}
        </span>
        <span style={{ fontSize: '12.5px', color: '#6b6580', flexShrink: 0 }}>{desc}</span>
      </div>
      {body && (
        <div style={{ marginBottom: '8px' }}>
          <div style={{ fontFamily: "'Courier New', monospace", fontSize: '11px', color: '#9990b0', marginBottom: '4px' }}>REQUEST BODY</div>
          <pre style={{ margin: 0, background: '#002B36', color: '#9fb4b0', padding: '10px 12px', borderRadius: '6px', fontFamily: "'Courier New', monospace", fontSize: '11.5px', overflow: 'auto', lineHeight: 1.5 }}>
            {body}
          </pre>
        </div>
      )}
      {response && (
        <div>
          <div style={{ fontFamily: "'Courier New', monospace", fontSize: '11px', color: '#9990b0', marginBottom: '4px' }}>RESPONSE</div>
          <pre style={{ margin: 0, background: '#002B36', color: '#9fb4b0', padding: '10px 12px', borderRadius: '6px', fontFamily: "'Courier New', monospace", fontSize: '11.5px', overflow: 'auto', lineHeight: 1.5 }}>
            {response}
          </pre>
        </div>
      )}
    </div>
  );
}

export default function ApiDocsPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '11px',
          padding: '18px 26px',
          background: 'rgba(255,255,255,0.55)',
          borderBottom: '2px solid #2E294E',
          flexShrink: 0,
        }}
      >
        <span style={{ color: '#2E294E', display: 'inline-flex' }}>
          <Code size={22} />
        </span>
        <div>
          <h1
            style={{
              fontFamily: 'Fraunces, serif',
              fontWeight: 600,
              fontSize: '25px',
              margin: 0,
              color: '#2E294E',
            }}
          >
            API Docs
          </h1>
          <p
            style={{
              margin: '2px 0 0',
              fontFamily: "'Courier New', monospace",
              fontSize: '12.5px',
              color: '#6b6580',
            }}
          >
            push work into your boards from anywhere
          </p>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '24px 26px' }}>
        <div style={{ maxWidth: '760px', display: 'flex', flexDirection: 'column', gap: '18px' }}>

          {/* Base URL */}
          <div style={panelStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <span style={{ color: '#1B998B', display: 'inline-flex' }}><Globe size={17} /></span>
              <h2 style={{ fontFamily: 'Fraunces, serif', fontWeight: 600, fontSize: '17px', margin: 0, color: '#2E294E' }}>
                Base URL &amp; auth
              </h2>
            </div>
            <pre
              style={{
                margin: '0 0 12px',
                background: '#002B36',
                color: '#9fb4b0',
                padding: '12px 14px',
                borderRadius: '7px',
                fontFamily: "'Courier New', monospace",
                fontSize: '12.5px',
                overflow: 'auto',
              }}
            >
              https://faithbranch.com/api/v1
            </pre>
            <p style={{ fontFamily: 'Gelasio, serif', fontSize: '14px', color: '#3b3550', margin: 0, lineHeight: 1.5 }}>
              Authenticate every request with a project token:{' '}
              <code style={{ fontFamily: "'Courier New', monospace", background: '#2E294E', color: '#fff', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }}>
                Authorization: Bearer fbk_live_…
              </code>
              . Generate a token under <strong>Link up</strong> on any project board.
            </p>
          </div>

          {/* Project routes */}
          <div style={panelStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <span style={{ color: '#2E294E', display: 'inline-flex' }}><Globe size={17} /></span>
              <h2 style={{ fontFamily: 'Fraunces, serif', fontWeight: 600, fontSize: '17px', margin: 0, color: '#2E294E' }}>
                Project
              </h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <EndpointRow
                method="GET"
                path="/projects/{token}"
                desc="Project info + task counts"
                response={`{
  "id": "clx...",
  "name": "Mobile App Redesign",
  "status": "IN_PROGRESS",
  "priority": "HIGH",
  "due": "2026-09-01T00:00:00.000Z",
  "client": { "name": "Acme Corp", "color": "#1B998B" },
  "taskCounts": {
    "BACKLOG": 4, "TODO": 2, "IN_PROGRESS": 1,
    "WAITING": 0, "DONE": 12
  }
}`}
              />
            </div>
          </div>

          {/* Task routes */}
          <div style={panelStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <span style={{ color: '#F46036', display: 'inline-flex' }}><Zap size={17} /></span>
              <h2 style={{ fontFamily: 'Fraunces, serif', fontWeight: 600, fontSize: '17px', margin: 0, color: '#2E294E' }}>
                Tasks
              </h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <EndpointRow
                method="GET"
                path="/projects/{token}/tasks"
                desc="List tasks (optional ?column=BACKLOG)"
                response={`[
  {
    "id": "tsk_8f2a",
    "title": "New lead from website",
    "description": null,
    "column": "BACKLOG",
    "priority": "MEDIUM",
    "due": null,
    "completedAt": null,
    "createdAt": "2026-06-15T18:14:00Z",
    "tags": []
  }
]`}
              />
              <EndpointRow
                method="POST"
                path="/projects/{token}/tasks"
                desc="Create a task"
                body={`{
  "title": "New lead from website",   // required
  "description": "From contact form",  // optional
  "column": "Backlog",                 // optional, default BACKLOG
  "priority": "Medium",                // optional
  "due": "2026-07-01"                  // optional ISO date
}`}
                response={`201 Created
{
  "id": "tsk_8f2a",
  "title": "New lead from website",
  "column": "BACKLOG",
  "priority": "MEDIUM",
  "createdAt": "2026-06-15T18:14:00Z"
}`}
              />
              <EndpointRow
                method="PATCH"
                path="/projects/{token}/tasks/{taskId}"
                desc="Update a task"
                body={`{
  "title": "Updated title",    // optional
  "description": "New notes",  // optional
  "column": "IN_PROGRESS",     // optional — moves the task
  "priority": "HIGH",          // optional
  "due": "2026-08-15"          // optional, null to clear
}`}
                response={`{
  "id": "tsk_8f2a",
  "title": "Updated title",
  "column": "IN_PROGRESS",
  "priority": "HIGH",
  "due": "2026-08-15T00:00:00.000Z",
  "completedAt": null,
  "updatedAt": "2026-06-17T10:00:00Z"
}`}
              />
              <EndpointRow
                method="DELETE"
                path="/projects/{token}/tasks/{taskId}"
                desc="Delete a task"
                response="204 No Content"
              />
            </div>
          </div>

          {/* Integration routes */}
          <div style={panelStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <span style={{ color: '#1B998B', display: 'inline-flex' }}><Link size={17} /></span>
              <h2 style={{ fontFamily: 'Fraunces, serif', fontWeight: 600, fontSize: '17px', margin: 0, color: '#2E294E' }}>
                Integrations
              </h2>
            </div>
            <p style={{ fontFamily: 'Gelasio, serif', fontSize: '13px', color: '#6b6580', margin: '0 0 12px', lineHeight: 1.5 }}>
              These routes require an admin session (cookie) or, for sync endpoints, an{' '}
              <code style={{ background: '#2E294E', color: '#fff', padding: '1px 5px', borderRadius: '3px', fontSize: '11px' }}>x-cron-secret</code> header matching <code style={{ background: '#2E294E', color: '#fff', padding: '1px 5px', borderRadius: '3px', fontSize: '11px' }}>CRON_SECRET</code> env var.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <EndpointRow
                method="POST"
                path="/api/integrations/basecamp/configure"
                desc="Save Basecamp token"
                body={`{ "token": "your-personal-access-token", "accountId": "12345678" }`}
                response={`{ "ok": true }`}
              />
              <EndpointRow
                method="DELETE"
                path="/api/integrations/basecamp/configure"
                desc="Disconnect Basecamp"
                response={`{ "ok": true }`}
              />
              <EndpointRow
                method="GET"
                path="/api/integrations/basecamp/projects"
                desc="List Basecamp projects + todolists"
                response={`[
  {
    "id": "12345678",
    "name": "Client Website",
    "todolists": [
      { "id": 99887766, "title": "Sprint 1" }
    ]
  }
]`}
              />
              <EndpointRow
                method="POST"
                path="/api/integrations/basecamp/sync"
                desc="Sync all linked boards with Basecamp"
                response={`{ "ok": true, "created": 3, "updated": 1, "pushed": 2 }`}
              />
              <EndpointRow
                method="POST"
                path="/api/integrations/testflight/configure"
                desc="Save TestFlight credentials"
                body={`{
  "issuerId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "keyId": "XXXXXXXXXX",
  "privateKey": "-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----",
  "appId": "1234567890",
  "targetProjectId": "clx..."
}`}
                response={`{ "ok": true }`}
              />
              <EndpointRow
                method="DELETE"
                path="/api/integrations/testflight/configure"
                desc="Disconnect TestFlight"
                response={`{ "ok": true }`}
              />
              <EndpointRow
                method="POST"
                path="/api/integrations/testflight/sync"
                desc="Pull new feedback, delete completed"
                response={`{ "ok": true, "created": 5, "deleted": 2 }`}
              />
            </div>
          </div>

          {/* Curl example */}
          <div style={panelStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <span style={{ color: '#1B998B', display: 'inline-flex' }}><Terminal size={17} /></span>
              <h2 style={{ fontFamily: 'Fraunces, serif', fontWeight: 600, fontSize: '17px', margin: 0, color: '#2E294E' }}>
                Example: create a task
              </h2>
            </div>
            <div style={{ borderRadius: '8px', overflow: 'hidden', border: '1.5px solid rgba(46,41,78,0.2)', marginBottom: '14px' }}>
              <div style={{ background: '#001B20', padding: '7px 13px', fontFamily: "'Courier New', monospace", fontSize: '11px', color: '#93A1A1', textTransform: 'uppercase' as const, letterSpacing: '0.06em', fontWeight: 600 }}>
                Request
              </div>
              <pre style={{ margin: 0, background: '#002B36', color: '#9fb4b0', padding: '13px', fontFamily: "'Courier New', monospace", fontSize: '12px', lineHeight: 1.6, overflow: 'auto', whiteSpace: 'pre' }}>
{`curl -X POST https://faithbranch.com/api/v1/projects/fbk_live_... \\
  -H "Authorization: Bearer fbk_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{ "title": "New lead from website", "column": "Backlog", "priority": "Medium" }'`}
              </pre>
            </div>
            <div style={{ borderRadius: '8px', overflow: 'hidden', border: '1.5px solid rgba(46,41,78,0.2)' }}>
              <div style={{ background: '#001B20', padding: '7px 13px', fontFamily: "'Courier New', monospace", fontSize: '11px', color: '#93A1A1', textTransform: 'uppercase' as const, letterSpacing: '0.06em', fontWeight: 600 }}>
                201 Created
              </div>
              <pre style={{ margin: 0, background: '#002B36', color: '#9fb4b0', padding: '13px', fontFamily: "'Courier New', monospace", fontSize: '12px', lineHeight: 1.6, overflow: 'auto' }}>
{`{
  "id": "tsk_8f2a",
  "title": "New lead from website",
  "column": "BACKLOG",
  "priority": "MEDIUM",
  "createdAt": "2026-06-17T18:14:00Z"
}`}
              </pre>
            </div>
          </div>

          {/* MCP Server */}
          <div style={panelStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <span style={{ color: '#CC785C', display: 'inline-flex' }}><Bot size={17} /></span>
              <h2 style={{ fontFamily: 'Fraunces, serif', fontWeight: 600, fontSize: '17px', margin: 0, color: '#2E294E' }}>
                Claude MCP Server
              </h2>
            </div>
            <p style={{ fontFamily: 'Gelasio, serif', fontSize: '14px', color: '#3b3550', margin: '0 0 12px', lineHeight: 1.6 }}>
              The MCP server lets Claude Code read and write your admin data directly — tasks, calendar, timers, integrations.
              Auth uses a bearer token stored in{' '}
              <code style={{ fontFamily: "'Courier New', monospace", background: '#2E294E', color: '#fff', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }}>
                AdminSetting[mcp_api_key]
              </code>.
              Generate a key in <strong>Connections → Claude MCP</strong>.
            </p>
            <pre
              style={{
                margin: '0 0 14px',
                background: '#002B36',
                color: '#9fb4b0',
                padding: '12px 14px',
                borderRadius: '7px',
                fontFamily: "'Courier New', monospace",
                fontSize: '12.5px',
                overflow: 'auto',
              }}
            >
              POST /api/mcp
            </pre>
            <p style={{ fontFamily: 'Gelasio, serif', fontSize: '13px', color: '#3b3550', margin: '0 0 14px', lineHeight: 1.5 }}>
              Add to{' '}
              <code style={{ fontFamily: "'Courier New', monospace", background: '#eee', padding: '2px 5px', borderRadius: '3px', fontSize: '12px' }}>
                ~/.claude/mcp.json
              </code>:
            </p>
            <pre style={{ margin: '0 0 16px', background: '#002B36', color: '#9fb4b0', padding: '12px 14px', borderRadius: '7px', fontFamily: "'Courier New', monospace", fontSize: '12px', overflow: 'auto', lineHeight: 1.5 }}>
{`{
  "mcpServers": {
    "portfolio-admin": {
      "type": "http",
      "url": "https://faithbranch.com/api/mcp",
      "headers": {
        "Authorization": "Bearer <your-mcp-api-key>"
      }
    }
  }
}`}
            </pre>
            <div style={{ fontFamily: 'Fraunces, serif', fontWeight: 600, fontSize: '14px', color: '#2E294E', marginBottom: '10px' }}>Available tools</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { name: 'list_projects', desc: 'List all projects (filter: status, archived)', args: 'status?, archived?' },
                { name: 'list_tasks', desc: 'List tasks (filter: projectId, column, priority)', args: 'projectId?, column?, priority?' },
                { name: 'get_task', desc: 'Get a single task by ID', args: 'taskId' },
                { name: 'create_task', desc: 'Create a task in a project', args: 'title, projectId, column?, description?, priority?, due?' },
                { name: 'move_task', desc: 'Move a task to a different kanban column', args: 'taskId, column' },
                { name: 'update_task', desc: 'Edit task title, description, priority, or due date', args: 'taskId, projectId, title?, description?, priority?, due?' },
                { name: 'list_portfolio_items', desc: 'List all public portfolio items in display order', args: '—' },
                { name: 'create_portfolio_item', desc: 'Create a new public portfolio item', args: 'title, description, url, images?, isRed?, noteRot?, tapeColor?, order?' },
                { name: 'update_portfolio_item', desc: 'Update an existing portfolio item', args: 'id, title?, description?, url?, images?, isRed?, noteRot?, tapeColor?, order?' },
                { name: 'delete_portfolio_item', desc: 'Delete a portfolio item by ID', args: 'id' },
                { name: 'list_calendar_events', desc: 'Upcoming events from cache (default 14 days)', args: 'daysAhead?, includeAllDay?' },
                { name: 'refresh_calendar', desc: 'Re-fetch from all Google + Apple calendar integrations', args: '—' },
                { name: 'sync_basecamp', desc: 'Pull latest todos from Basecamp', args: '—' },
                { name: 'sync_testflight', desc: 'Pull latest TestFlight feedback as tasks', args: '—' },
                { name: 'get_active_timers', desc: 'All currently running timers', args: '—' },
                { name: 'clock_in', desc: 'Start a timer on a task', args: 'taskId' },
                { name: 'clock_out', desc: 'Stop a running timer', args: 'timerId' },
                { name: 'get_time_summary', desc: 'Time totals for a client by period', args: 'clientId, period?, projectId?' },
                { name: 'list_clients', desc: 'All clients with project counts', args: '—' },
                { name: 'generate_report', desc: 'Auto-summary of recent activity for a client', args: 'clientId' },
              ].map(({ name, desc, args }) => (
                <div key={name} style={{ padding: '10px 12px', background: '#F7F3EA', border: '1.5px solid rgba(46,41,78,0.14)', borderRadius: '7px' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', flexWrap: 'wrap' }}>
                    <code style={{ fontFamily: "'Courier New', monospace", fontSize: '12.5px', color: '#2E294E', fontWeight: 700 }}>{name}</code>
                    <span style={{ fontFamily: "'Courier New', monospace", fontSize: '11px', color: '#9990b0' }}>{args}</span>
                    <span style={{ fontSize: '12.5px', color: '#6b6580', flex: 1 }}>{desc}</span>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: '14px' }}>
              <div style={{ fontFamily: 'Fraunces, serif', fontWeight: 600, fontSize: '14px', color: '#2E294E', marginBottom: '8px' }}>Resources</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ padding: '8px 12px', background: '#F7F3EA', border: '1.5px solid rgba(46,41,78,0.14)', borderRadius: '7px', display: 'flex', alignItems: 'baseline', gap: '10px' }}>
                  <code style={{ fontFamily: "'Courier New', monospace", fontSize: '12.5px', color: '#2E294E', fontWeight: 700 }}>portfolio://dashboard</code>
                  <span style={{ fontSize: '12.5px', color: '#6b6580' }}>Active tasks + today&apos;s events + running timers</span>
                </div>
                <div style={{ padding: '8px 12px', background: '#F7F3EA', border: '1.5px solid rgba(46,41,78,0.14)', borderRadius: '7px', display: 'flex', alignItems: 'baseline', gap: '10px' }}>
                  <code style={{ fontFamily: "'Courier New', monospace", fontSize: '12.5px', color: '#2E294E', fontWeight: 700 }}>portfolio://projects</code>
                  <span style={{ fontSize: '12.5px', color: '#6b6580' }}>All active projects with client info</span>
                </div>
              </div>
            </div>
            <p style={{ fontFamily: 'Gelasio, serif', fontSize: '13px', color: '#6b6580', margin: '14px 0 0', lineHeight: 1.5 }}>
              <strong>Note:</strong> <code style={{ fontFamily: "'Courier New', monospace", fontSize: '11.5px', background: '#eee', padding: '1px 4px', borderRadius: '3px' }}>sync_basecamp</code>,{' '}
              <code style={{ fontFamily: "'Courier New', monospace", fontSize: '11.5px', background: '#eee', padding: '1px 4px', borderRadius: '3px' }}>sync_testflight</code>, and{' '}
              <code style={{ fontFamily: "'Courier New', monospace", fontSize: '11.5px', background: '#eee', padding: '1px 4px', borderRadius: '3px' }}>refresh_calendar</code>{' '}
              require a <code style={{ fontFamily: "'Courier New', monospace", fontSize: '11.5px', background: '#eee', padding: '1px 4px', borderRadius: '3px' }}>CRON_SECRET</code> env var to be set.
            </p>
          </div>

          {/* Cron note */}
          <div style={panelStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <span style={{ color: '#F46036', display: 'inline-flex' }}><RefreshCw size={17} /></span>
              <h2 style={{ fontFamily: 'Fraunces, serif', fontWeight: 600, fontSize: '17px', margin: 0, color: '#2E294E' }}>
                Automated sync (cron)
              </h2>
            </div>
            <p style={{ fontFamily: 'Gelasio, serif', fontSize: '14px', color: '#3b3550', margin: '0 0 10px', lineHeight: 1.6 }}>
              To sync TestFlight feedback on a schedule, call the sync endpoint with a <code style={{ background: '#2E294E', color: '#fff', padding: '2px 5px', borderRadius: '3px', fontSize: '12px' }}>CRON_SECRET</code> env var set, then hit the endpoint from your cron:
            </p>
            <pre style={{ margin: 0, background: '#002B36', color: '#9fb4b0', padding: '12px 14px', borderRadius: '7px', fontFamily: "'Courier New', monospace", fontSize: '12px', lineHeight: 1.6, overflow: 'auto' }}>
{`curl -X POST https://faithbranch.com/api/integrations/testflight/sync \\
  -H "x-cron-secret: your-cron-secret"`}
            </pre>
          </div>

        </div>
      </div>
    </div>
  );
}
