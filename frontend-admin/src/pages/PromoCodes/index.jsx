import { useCallback, useEffect, useState } from 'react';
import { eventApi } from '../../lib/eventApi';
import { promoApi } from '../../lib/promoApi';
import { ticketTypeApi } from '../../lib/ticketTypeApi';
import { LoadingState, ErrorState, EmptyState } from '../../components/ui/States';
import Button from '../../components/ui/Button';
import PromoCodeCard from './PromoCodeCard';

export default function PromoCodes() {
  const [events, setEvents] = useState(null);
  const [eventId, setEventId] = useState(null);
  const [promos, setPromos] = useState(null);
  const [ticketTypes, setTicketTypes] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    eventApi
      .list()
      .then((res) => {
        setEvents(res.data);
        if (res.data.length > 0) setEventId((id) => id || res.data[0].id);
      })
      .catch((err) => setError(err.message));
  }, []);

  const loadPromos = useCallback(() => {
    if (!eventId) return;
    setPromos(null);
    Promise.all([promoApi.list(eventId), ticketTypeApi.list(eventId)])
      .then(([promoRes, ticketRes]) => {
        setPromos(promoRes.data);
        setTicketTypes(ticketRes.data);
      })
      .catch((err) => setError(err.message));
  }, [eventId]);

  useEffect(loadPromos, [loadPromos]);

  async function handleCreate() {
    const res = await promoApi.create({
      event: eventId,
      code: `SAVE${(promos?.length || 0) + 1}0`,
      type: 'percent',
      value: 10,
    });
    setPromos((list) => [res.data, ...(list || [])]);
  }

  function handleSaved(updated) {
    setPromos((list) => list.map((p) => ((p._id || p.id) === (updated._id || updated.id) ? updated : p)));
  }

  function handleDeleted(id) {
    setPromos((list) => list.filter((p) => (p._id || p.id) !== id));
  }

  if (error) return <ErrorState message={error} onRetry={loadPromos} />;
  if (events === null) return <LoadingState label="Loading events…" />;
  if (events.length === 0) {
    return <EmptyState title="No events yet" message="Create an event in the Event CMS first." />;
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-header__title">Promo Codes</h2>
          <p className="page-header__subtitle">Discount codes attendees can apply at checkout.</p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
          {events.length > 1 && (
            <select className="field__select" value={eventId || ''} onChange={(e) => setEventId(e.target.value)}>
              {events.map((ev) => <option key={ev.id} value={ev.id}>{ev.title}</option>)}
            </select>
          )}
          <Button variant="primary" size="sm" onClick={handleCreate}>
            + New code
          </Button>
        </div>
      </div>

      {promos === null ? (
        <LoadingState label="Loading promo codes…" />
      ) : promos.length === 0 ? (
        <EmptyState title="No promo codes yet" message="Create the first discount code for this event." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          {promos.map((p) => (
            <PromoCodeCard
              key={p._id || p.id}
              promo={p}
              ticketTypes={ticketTypes}
              onSaved={handleSaved}
              onDeleted={handleDeleted}
            />
          ))}
        </div>
      )}
    </div>
  );
}
