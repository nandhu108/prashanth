import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import SiteHeader from '../components/SiteHeader';
import SiteFooter from '../components/SiteFooter';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { LoadingState, ErrorState, NotFoundState } from '../components/ui/States';

import { api } from '../lib/api';
import { formatDate, formatTime } from '../lib/format';
import './TicketPage.css';

const BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

export default function TicketPage() {
  const { qrToken } = useParams();
  const [state, setState] = useState({ status: 'loading', data: null, error: null });

  useEffect(() => {
    setState({ status: 'loading', data: null, error: null });
    api
      .getTicket(qrToken)
      .then((res) => setState({ status: 'ready', data: res.data, error: null }))
      .catch((err) => setState({ status: err.status === 404 ? 'not-found' : 'error', data: null, error: err }));
  }, [qrToken]);

  if (state.status === 'loading') return <LoadingState />;
  if (state.status === 'not-found') {
    return <NotFoundState message="This ticket link is invalid or has expired." />;
  }
  if (state.status === 'error') {
    return <ErrorState message={state.error?.message} onRetry={() => setState({ status: 'loading', data: null, error: null })} />;
  }

  const ticket = state.data;
  const qrImageUrl = `${BASE_URL}/api/v1/tickets/${qrToken}/qr.png`;
  const pdfUrl = `${BASE_URL}/api/v1/tickets/${qrToken}/pdf`;
  const certificateUrl = `${BASE_URL}/api/v1/tickets/${qrToken}/certificate.pdf`;
  const eventCompleted = ticket.event.status === 'completed';

  return (
    <>
      <SiteHeader event={ticket.event} canRegister={false} availableSections={[]} />
      <main id="main" className="ticket-page">
        <div className="container ticket-page__grid">
          <div className="ticket-card">
            <div className="ticket-card__brand">
              <span>PRASHANTH HOSPITALS</span>
              <span>DIGITAL TICKET</span>
            </div>

            <h1 className="ticket-card__event">{ticket.event.title}</h1>
            <p className="ticket-card__datetime">
              {formatDate(ticket.event.startDate)} · {formatTime(ticket.event.startDate)}
            </p>
            {ticket.event.venue?.name && <p className="ticket-card__venue">{ticket.event.venue.name}</p>}

            <div className="ticket-card__divider" />

            <div className="ticket-card__body">
              <div>
                <p className="ticket-card__label">Attendee</p>
                <p className="ticket-card__value">{ticket.attendee.name}</p>
                <p className="ticket-card__label" style={{ marginTop: 12 }}>Pass</p>
                <p className="ticket-card__value">{ticket.ticketType.name}</p>
                <p className="ticket-card__label" style={{ marginTop: 12 }}>Reference</p>
                <p className="ticket-card__value">{ticket.registrationCode}</p>

                <div style={{ marginTop: 20 }}>
                  {ticket.checkedInAt ? (
                    <Badge tone="success">Checked in</Badge>
                  ) : (
                    <Badge tone="info">Not checked in yet</Badge>
                  )}
                </div>
              </div>

              <div className="ticket-card__qr">
                <img src={qrImageUrl} alt="Ticket QR code" width={180} height={180} />
                <p>Present this at check-in</p>
              </div>
            </div>

            <div className="ticket-card__actions">
              <Button variant="primary" href={pdfUrl} external>
                Download PDF ticket
              </Button>
              {eventCompleted && (
                <Button variant="secondary" href={certificateUrl} external>
                  Download certificate
                </Button>
              )}
              <Button variant="ghost" href={`/feedback/${qrToken}`}>
                Give feedback
              </Button>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter event={ticket.event} />
    </>
  );
}
