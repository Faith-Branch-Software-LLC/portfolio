import { Plug } from 'lucide-react';

export default function ConnectionsPage() {
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
          <Plug size={22} />
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
            Connections
          </h1>
          <p
            style={{
              margin: '2px 0 0',
              fontFamily: "'Courier New', monospace",
              fontSize: '12.5px',
              color: '#6b6580',
            }}
          >
            sync projects and calendars into the workshop
          </p>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '40px 26px' }}>
        <div style={{ maxWidth: '720px' }}>
          <div
            style={{
              background: '#fff',
              border: '2px solid #2E294E',
              borderRadius: '10px',
              boxShadow: '5px 5px 0 0 rgba(46,41,78,0.18)',
              padding: '32px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: '#2E294E',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                color: '#C5D86D',
              }}
            >
              <Plug size={24} />
            </div>
            <h2
              style={{
                fontFamily: 'Fraunces, serif',
                fontWeight: 600,
                fontSize: '20px',
                margin: '0 0 8px',
                color: '#2E294E',
              }}
            >
              Connections coming soon
            </h2>
            <p
              style={{
                fontFamily: 'Gelasio, serif',
                fontSize: '15px',
                color: '#6b6580',
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              Connect Basecamp projects and calendars (Google, Outlook, Apple) to sync
              your work into the workshop.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
