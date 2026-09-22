import { useEffect, useState } from 'react';
import { useAuth } from '../lib/auth';

const QUICK_LINKS = [
  { to: '/event', label: 'Edit event content', desc: 'Hero, speakers, agenda, venue, sponsors' },
  { to: '/ticket-types', label: 'Manage ticket types', desc: 'Pricing, inventory, sales windows' },
  { to: '/registrations', label: 'View registrations', desc: 'Search, filter, resend tickets' },
  { to: '/checkin', label: 'Open check-in scanner', desc: 'Scan QR codes on event day' },
];

export default function DashboardOverview() {
  const { user } = useAuth();
  const [apiStatus, setApiStatus] = useState('checking');

  useEffect(() => {
    fetch('/api/v1/health')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((body) => setApiStatus(body?.data?.database === 'connected' ? 'ok' : 'degraded'))
      .catch(() => setApiStatus('down'));
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-header__title">
            {greeting}, {user?.name?.split(' ')[0]}
          </h2>
          <p className="page-header__subtitle">Here's what's happening across your events.</p>
        </div>
        <StatusPill status={apiStatus} />
      </div>

      <div className="stat-grid">
        <StatTile label="Registrations" value="—" meta="Live in Module 3" />
        <StatTile label="Revenue" value="—" meta="Live in Module 6" />
        <StatTile label="Checked in" value="—" meta="Live in Module 9" />
        <StatTile label="Avg. feedback" value="—" meta="Live in Module 12" />
      </div>

      <div className="card">
        <div className="card__header">
          <h3 className="card__title">Quick links</h3>
        </div>
        <div className="card__body" style={{ display: 'grid', gap: 'var(--space-3)' }}>
          {QUICK_LINKS.map((link) => (
            <a
              key={link.to}
              href={link.to}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: 'var(--space-4)',
                border: '1px solid var(--ink-200)',
                borderRadius: 'var(--radius-md)',
                color: 'inherit',
              }}
            >
              <span>
                <strong style={{ display: 'block', color: 'var(--ink-900)' }}>{link.label}</strong>
                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-500)' }}>{link.desc}</span>
              </span>
              <span aria-hidden="true" style={{ color: 'var(--brand-500)' }}>
                →
              </span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatTile({ label, value, meta }) {
  return (
    <div className="stat-tile">
      <p className="stat-tile__label">{label}</p>
      <p className="stat-tile__value">{value}</p>
      <p className="stat-tile__meta">{meta}</p>
    </div>
  );
}

function StatusPill({ status }) {
  const map = {
    checking: { label: 'Checking API…', color: 'var(--ink-500)', bg: 'var(--ink-100)' },
    ok: { label: 'All systems normal', color: 'var(--success-700)', bg: 'var(--success-100)' },
    degraded: { label: 'Database unavailable', color: 'var(--warning-700)', bg: 'var(--warning-100)' },
    down: { label: 'API unreachable', color: 'var(--danger-700)', bg: 'var(--danger-100)' },
  };
  const cfg = map[status] || map.checking;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 'var(--space-2)',
        padding: 'var(--space-2) var(--space-4)',
        borderRadius: 'var(--radius-full)',
        background: cfg.bg,
        color: cfg.color,
        fontSize: 'var(--text-sm)',
        fontWeight: 600,
      }}
    >
      <span
        style={{ width: 8, height: 8, borderRadius: '50%', background: 'currentColor', display: 'inline-block' }}
      />
      {cfg.label}
    </span>
  );
}
