import { useCallback, useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';
import { eventApi } from '../../lib/eventApi';
import { reportApi } from '../../lib/reportApi';
import { formatCurrency } from '../../lib/format';
import { LoadingState, ErrorState, EmptyState } from '../../components/ui/States';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';

export default function Reports() {
  const [events, setEvents] = useState(null);
  const [eventId, setEventId] = useState(null);
  const [overview, setOverview] = useState(null);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState('');

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
    setOverview(null);
    reportApi.overview(eventId).then((res) => setOverview(res.data)).catch((err) => setError(err.message));
  }, [eventId]);

  useEffect(load, [load]);

  async function handleExport(type) {
    setExporting(type);
    try {
      if (type === 'registrations') await reportApi.exportRegistrations(eventId);
      else await reportApi.exportPayments(eventId);
    } catch (err) {
      setError(err.message);
    } finally {
      setExporting('');
    }
  }

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (events === null) return <LoadingState label="Loading events…" />;
  if (events.length === 0) return <EmptyState title="No events yet" message="Create an event in the Event CMS first." />;

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-header__title">Reports</h2>
          <p className="page-header__subtitle">How this event is performing, and full data exports.</p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
          {events.length > 1 && (
            <select className="field__select" value={eventId || ''} onChange={(e) => setEventId(e.target.value)}>
              {events.map((ev) => <option key={ev.id} value={ev.id}>{ev.title}</option>)}
            </select>
          )}
          <Button variant="secondary" size="sm" onClick={() => handleExport('registrations')} disabled={exporting === 'registrations'}>
            {exporting === 'registrations' ? 'Exporting…' : 'Export registrations CSV'}
          </Button>
          <Button variant="secondary" size="sm" onClick={() => handleExport('payments')} disabled={exporting === 'payments'}>
            {exporting === 'payments' ? 'Exporting…' : 'Export payments CSV'}
          </Button>
        </div>
      </div>

      {overview === null ? (
        <LoadingState label="Loading report…" />
      ) : (
        <>
          <div className="stat-grid">
            <StatTile label="Confirmed" value={overview.registrations.confirmed} />
            <StatTile label="Pending payment" value={overview.registrations.pending} />
            <StatTile label="Cancelled / refunded" value={overview.registrations.cancelled} />
            <StatTile label="Total revenue" value={formatCurrency(overview.revenue)} />
          </div>

          <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
            <div className="card__header">
              <h3 className="card__title">Revenue by pass</h3>
              <Badge tone="info" size="sm">{overview.checkIn.rate}% checked in</Badge>
            </div>
            <div className="card__body">
              {overview.byTicketType.length === 0 ? (
                <EmptyState title="No confirmed registrations yet" message="Revenue breakdown appears once passes are confirmed." />
              ) : overview.revenue === 0 ? (
                // Every confirmed pass is free — a bar chart with an all-zero
                // dataset has no real scale to draw (recharts would otherwise
                // fabricate a 0-4 axis that reads as currency and misleads).
                <EmptyState
                  title="No paid revenue yet"
                  message={`${overview.registrations.confirmed} confirmed registration${overview.registrations.confirmed === 1 ? '' : 's'}, all on free passes.`}
                />
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={overview.byTicketType} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--ink-100)" vertical={false} />
                    <XAxis dataKey="name" tick={{ fill: 'var(--ink-500)', fontSize: 12 }} axisLine={{ stroke: 'var(--ink-200)' }} tickLine={false} />
                    <YAxis tick={{ fill: 'var(--ink-500)', fontSize: 12 }} axisLine={false} tickLine={false} width={64} tickFormatter={(v) => formatCurrency(v)} />
                    <Tooltip
                      cursor={{ fill: 'var(--brand-50)' }}
                      contentStyle={{ border: '1px solid var(--ink-200)', borderRadius: 8, fontSize: 13 }}
                      formatter={(value) => [formatCurrency(value), 'Revenue']}
                    />
                    <Bar dataKey="revenue" fill="var(--brand-600)" radius={[4, 4, 0, 0]} maxBarSize={56} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function StatTile({ label, value }) {
  return (
    <div className="stat-tile">
      <p className="stat-tile__label">{label}</p>
      <p className="stat-tile__value">{value}</p>
    </div>
  );
}
