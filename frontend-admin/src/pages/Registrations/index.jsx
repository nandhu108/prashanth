import { useCallback, useEffect, useState } from 'react';
import { eventApi } from '../../lib/eventApi';
import { registrationApi } from '../../lib/registrationApi';
import { formatCurrency, formatDateTime } from '../../lib/format';
import { LoadingState, ErrorState, EmptyState } from '../../components/ui/States';
import Badge from '../../components/ui/Badge';
import RegistrationDetail from './RegistrationDetail';

const STATUS_TONE = {
  pending_payment: 'warning',
  confirmed: 'success',
  cancelled: 'neutral',
  refunded: 'danger',
};

const STATUSES = ['', 'pending_payment', 'confirmed', 'cancelled', 'refunded'];

export default function Registrations() {
  const [events, setEvents] = useState(null);
  const [eventId, setEventId] = useState(null);
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    eventApi
      .list()
      .then((res) => {
        setEvents(res.data);
        if (res.data.length > 0) setEventId((id) => id || res.data[0].id);
      })
      .catch((err) => setError(err.message));
  }, []);

  const load = useCallback(() => {
    if (!eventId) return;
    setResult(null);
    const params = { event: eventId, limit: 50 };
    if (status) params.status = status;
    if (q.trim()) params.q = q.trim();
    registrationApi
      .list(params)
      .then((res) => setResult(res))
      .catch((err) => setError(err.message));
  }, [eventId, status, q]);

  useEffect(() => {
    const t = setTimeout(load, 300); // debounce search typing
    return () => clearTimeout(t);
  }, [load]);

  function handleUpdated(updated) {
    setResult((r) => ({ ...r, data: r.data.map((reg) => (reg.id === updated.id ? updated : reg)) }));
  }

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (events === null) return <LoadingState label="Loading events…" />;
  if (events.length === 0) {
    return <EmptyState title="No events yet" message="Create an event in the Event CMS first." />;
  }

  const registrations = result?.data || [];

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-header__title">Registrations</h2>
          <p className="page-header__subtitle">
            {result?.meta ? `${result.meta.total} total` : 'Search, filter and manage attendee registrations.'}
          </p>
        </div>
        {events.length > 1 && (
          <select className="field__select" value={eventId || ''} onChange={(e) => setEventId(e.target.value)}>
            {events.map((ev) => <option key={ev.id} value={ev.id}>{ev.title}</option>)}
          </select>
        )}
      </div>

      <div className="card" style={{ marginBottom: 'var(--space-5)' }}>
        <div className="card__body" style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap', padding: 'var(--space-4) var(--space-6)' }}>
          <input
            className="field__input"
            style={{ maxWidth: 280 }}
            placeholder="Search name, email, phone, code…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <select className="field__select" value={status} onChange={(e) => setStatus(e.target.value)}>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s ? s.replace('_', ' ') : 'All statuses'}</option>
            ))}
          </select>
        </div>
      </div>

      {result === null ? (
        <LoadingState label="Loading registrations…" />
      ) : registrations.length === 0 ? (
        <EmptyState title="No registrations found" message="Try a different filter or search term." />
      ) : (
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Attendee</th>
                <th>Pass</th>
                <th>Status</th>
                <th>Amount</th>
                <th>Registered</th>
              </tr>
            </thead>
            <tbody>
              {registrations.map((reg) => (
                <RegistrationRow
                  key={reg.id}
                  reg={reg}
                  expanded={expandedId === reg.id}
                  onToggle={() => setExpandedId((id) => (id === reg.id ? null : reg.id))}
                  onUpdated={handleUpdated}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function RegistrationRow({ reg, expanded, onToggle, onUpdated }) {
  return (
    <>
      <tr onClick={onToggle} style={{ cursor: 'pointer' }}>
        <td><strong>{reg.registrationCode}</strong></td>
        <td>{reg.attendee?.name}<br /><span style={{ color: 'var(--ink-500)', fontSize: 'var(--text-xs)' }}>{reg.attendee?.email}</span></td>
        <td>{reg.ticketType?.name}</td>
        <td><Badge tone={STATUS_TONE[reg.status] || 'neutral'} size="sm">{reg.status.replace('_', ' ')}</Badge></td>
        <td>{formatCurrency(reg.pricing?.totalAmount, reg.pricing?.currency)}</td>
        <td>{formatDateTime(reg.createdAt)}</td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={6} style={{ padding: 0, background: 'var(--ink-50)' }}>
            <RegistrationDetail reg={reg} onUpdated={onUpdated} />
          </td>
        </tr>
      )}
    </>
  );
}
