import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';
import { useAuth } from '../lib/auth';
import { eventApi } from '../lib/eventApi';
import { reportApi } from '../lib/reportApi';
import { formatCurrency } from '../lib/format';
import { LoadingState } from '../components/ui/States';

const QUICK_LINKS = [
  { to: '/event', label: 'Edit event content', desc: 'Hero, speakers, agenda, venue, sponsors' },
  { to: '/ticket-types', label: 'Manage ticket types', desc: 'Pricing, inventory, sales windows' },
  { to: '/registrations', label: 'View registrations', desc: 'Search, filter, resend tickets' },
  { to: '/checkin', label: 'Open check-in scanner', desc: 'Scan QR codes on event day' },
];

export default function DashboardOverview() {
  const { user } = useAuth();
  const [apiStatus, setApiStatus] = useState('checking');
  const [eventId, setEventId] = useState(null);
  const [overview, setOverview] = useState(null);

  useEffect(() => {
    fetch('/api/v1/health')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((body) => setApiStatus(body?.data?.database === 'connected' ? 'ok' : 'degraded'))
      .catch(() => setApiStatus('down'));
  }, []);

  useEffect(() => {
    eventApi
      .list()
      .then((res) => {
        if (res.data.length > 0) setEventId(res.data[0].id);
        else setOverview(false);
      })
      .catch(() => setOverview(false));
  }, []);

  useEffect(() => {
    if (!eventId) return;
    reportApi.overview(eventId).then((res) => setOverview(res.data)).catch(() => setOverview(false));
  }, [eventId]);

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
        <StatTile
          label="Registrations"
          value={overview ? overview.registrations.confirmed : '—'}
          meta={overview ? `${overview.registrations.pending} pending payment` : 'Loading…'}
        />
        <StatTile
          label="Revenue"
          value={overview ? formatCurrency(overview.revenue) : '—'}
          meta="Confirmed registrations"
        />
        <StatTile
          label="Checked in"
          value={overview ? `${overview.checkIn.checkedIn} / ${overview.checkIn.total}` : '—'}
          meta={overview ? `${overview.checkIn.rate}% of confirmed` : 'Loading…'}
        />
        <StatTile label="Avg. feedback" value="—" meta="Live in Module 12" />
      </div>

      {overview === null && <LoadingState label="Loading overview…" />}

      {overview && overview.byTicketType.length > 0 && (
        <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
          <div className="card__header">
            <h3 className="card__title">Registrations by pass</h3>
          </div>
          <div className="card__body">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={overview.byTicketType} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--ink-100)" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fill: 'var(--ink-500)', fontSize: 12 }}
                  axisLine={{ stroke: 'var(--ink-200)' }}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: 'var(--ink-500)', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  width={32}
                />
                <Tooltip
                  cursor={{ fill: 'var(--brand-50)' }}
                  contentStyle={{
                    border: '1px solid var(--ink-200)',
                    borderRadius: 8,
                    fontSize: 13,
                  }}
                  formatter={(value, name) => [value, name === 'count' ? 'Registrations' : name]}
                />
                <Bar dataKey="count" fill="var(--brand-600)" radius={[4, 4, 0, 0]} maxBarSize={56} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

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
