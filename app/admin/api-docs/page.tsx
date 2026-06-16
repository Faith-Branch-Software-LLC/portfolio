import { Code, Globe, Zap, Terminal } from 'lucide-react';

const panelStyle = {
  background: '#ffffff',
  border: '2px solid #2E294E',
  borderRadius: '8px',
  boxShadow: '5px 5px 0 0 rgba(46,41,78,0.18)',
  padding: '20px 22px',
};

const exampleCurl = `curl -X POST https://api.faithbranch.com/v1/projects/{token}/tasks \\
  -H "Authorization: Bearer fbk_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{ "title": "New lead from website", "column": "Backlog", "priority": "Medium" }'`;

const exampleResponse = `{
  "id": "tsk_8f2a",
  "title": "New lead from website",
  "column": "Backlog",
  "priority": "Medium",
  "createdAt": "2026-06-15T18:14:00Z"
}`;

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
        <div style={{ maxWidth: '720px', display: 'flex', flexDirection: 'column', gap: '18px' }}>

          {/* Base URL */}
          <div style={panelStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <span style={{ color: '#1B998B', display: 'inline-flex' }}><Globe size={17} /></span>
              <h2
                style={{
                  fontFamily: 'Fraunces, serif',
                  fontWeight: 600,
                  fontSize: '17px',
                  margin: 0,
                  color: '#2E294E',
                }}
              >
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
              https://api.faithbranch.com/v1
            </pre>
            <p
              style={{
                fontFamily: 'Gelasio, serif',
                fontSize: '14px',
                color: '#3b3550',
                margin: 0,
                lineHeight: 1.5,
              }}
            >
              Authenticate every request with a project key in the header:{' '}
              <span
                style={{
                  fontFamily: "'Courier New', monospace",
                  background: '#2E294E',
                  color: '#fff',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontSize: '12px',
                }}
              >
                Authorization: Bearer fbk_live_…
              </span>
              . Find a project&apos;s key under <strong>Link up</strong> on its board.
            </p>
          </div>

          {/* Endpoints */}
          <div style={panelStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <span style={{ color: '#F46036', display: 'inline-flex' }}><Zap size={17} /></span>
              <h2
                style={{
                  fontFamily: 'Fraunces, serif',
                  fontWeight: 600,
                  fontSize: '17px',
                  margin: 0,
                  color: '#2E294E',
                }}
              >
                Endpoints
              </h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                { method: 'POST', path: '/projects/{token}/tasks', desc: 'Create a task', methodBg: '#1B998B' },
                { method: 'GET', path: '/projects/{token}', desc: 'Project + progress', methodBg: '#2E294E' },
                { method: 'GET', path: '/projects/{token}/tasks', desc: 'List tasks', methodBg: '#2E294E' },
              ].map(({ method, path, desc, methodBg }) => (
                <div
                  key={path}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '11px 13px',
                    background: '#F7F3EA',
                    border: '1.5px solid rgba(46,41,78,0.14)',
                    borderRadius: '7px',
                  }}
                >
                  <span
                    style={{
                      background: methodBg,
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
                  <span
                    style={{
                      fontFamily: "'Courier New', monospace",
                      fontSize: '12.5px',
                      color: '#2E294E',
                      flex: 1,
                    }}
                  >
                    {path}
                  </span>
                  <span style={{ fontSize: '12.5px', color: '#6b6580' }}>{desc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Create a task */}
          <div style={panelStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <span style={{ color: '#1B998B', display: 'inline-flex' }}><Terminal size={17} /></span>
              <h2
                style={{
                  fontFamily: 'Fraunces, serif',
                  fontWeight: 600,
                  fontSize: '17px',
                  margin: 0,
                  color: '#2E294E',
                }}
              >
                Create a task
              </h2>
            </div>

            <div
              style={{
                borderRadius: '8px',
                overflow: 'hidden',
                border: '1.5px solid rgba(46,41,78,0.2)',
                marginBottom: '14px',
              }}
            >
              <div
                style={{
                  background: '#001B20',
                  padding: '7px 13px',
                  fontFamily: "'Courier New', monospace",
                  fontSize: '11px',
                  color: '#93A1A1',
                  textTransform: 'uppercase' as const,
                  letterSpacing: '0.06em',
                  fontWeight: 600,
                }}
              >
                Request
              </div>
              <pre
                style={{
                  margin: 0,
                  background: '#002B36',
                  color: '#9fb4b0',
                  padding: '13px',
                  fontFamily: "'Courier New', monospace",
                  fontSize: '12px',
                  lineHeight: 1.6,
                  overflow: 'auto',
                  whiteSpace: 'pre',
                }}
              >
                {exampleCurl}
              </pre>
            </div>

            <div
              style={{
                borderRadius: '8px',
                overflow: 'hidden',
                border: '1.5px solid rgba(46,41,78,0.2)',
              }}
            >
              <div
                style={{
                  background: '#001B20',
                  padding: '7px 13px',
                  fontFamily: "'Courier New', monospace",
                  fontSize: '11px',
                  color: '#93A1A1',
                  textTransform: 'uppercase' as const,
                  letterSpacing: '0.06em',
                  fontWeight: 600,
                }}
              >
                200 OK
              </div>
              <pre
                style={{
                  margin: 0,
                  background: '#002B36',
                  color: '#9fb4b0',
                  padding: '13px',
                  fontFamily: "'Courier New', monospace",
                  fontSize: '12px',
                  lineHeight: 1.6,
                  overflow: 'auto',
                }}
              >
                {exampleResponse}
              </pre>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
