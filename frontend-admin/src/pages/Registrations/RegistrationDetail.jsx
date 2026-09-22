import { useState } from 'react';
import { registrationApi } from '../../lib/registrationApi';
import { formatCurrency, formatDateTime } from '../../lib/format';
import Button from '../../components/ui/Button';

export default function RegistrationDetail({ reg, onUpdated }) {
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState('');
  const canCancel = reg.status === 'pending_payment' || reg.status === 'confirmed';

  async function handleCancel() {
    const reason = window.prompt('Reason for cancelling (optional):') || '';
    if (reason === null) return;
    setCancelling(true);
    setError('');
    try {
      const res = await registrationApi.cancel(reg.id, reason);
      onUpdated(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setCancelling(false);
    }
  }

  return (
    <div style={{ padding: 'var(--space-5) var(--space-6)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-6)' }}>
      <div>
        <p className="stat-tile__label">Attendee</p>
        <p style={{ margin: 0 }}>{reg.attendee?.name}</p>
        <p style={{ margin: 0, color: 'var(--ink-500)', fontSize: 'var(--text-sm)' }}>{reg.attendee?.email}</p>
        <p style={{ margin: 0, color: 'var(--ink-500)', fontSize: 'var(--text-sm)' }}>{reg.attendee?.phone}</p>
        {reg.attendee?.participantType && (
          <p style={{ margin: 0, color: 'var(--ink-500)', fontSize: 'var(--text-sm)' }}>{reg.attendee.participantType}</p>
        )}
      </div>

      <div>
        <p className="stat-tile__label">Pricing</p>
        <p style={{ margin: 0 }}>Base: {formatCurrency(reg.pricing?.basePrice, reg.pricing?.currency)}</p>
        {reg.pricing?.discountAmount > 0 && (
          <p style={{ margin: 0, color: 'var(--success-700)' }}>Discount: -{formatCurrency(reg.pricing.discountAmount)}</p>
        )}
        <p style={{ margin: 0 }}>Tax: {formatCurrency(reg.pricing?.taxAmount, reg.pricing?.currency)}</p>
        <p style={{ margin: 0, fontWeight: 700 }}>Total: {formatCurrency(reg.pricing?.totalAmount, reg.pricing?.currency)}</p>
      </div>

      <div>
        <p className="stat-tile__label">Meta</p>
        <p style={{ margin: 0 }}>Source: {reg.campaignSource || 'direct'}</p>
        <p style={{ margin: 0 }}>Checked in: {reg.checkedInAt ? formatDateTime(reg.checkedInAt) : 'Not yet'}</p>
        <p style={{ margin: 0 }}>Certificate: {reg.certificateIssuedAt ? formatDateTime(reg.certificateIssuedAt) : '—'}</p>
        {reg.notes && <p style={{ margin: 0, color: 'var(--ink-500)', fontSize: 'var(--text-sm)' }}>{reg.notes}</p>}
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
        {error && <span className="tab-save-bar__status tab-save-bar__status--error">{error}</span>}
        {canCancel && (
          <Button variant="ghost" size="sm" onClick={handleCancel} disabled={cancelling}>
            {cancelling ? 'Cancelling…' : 'Cancel registration'}
          </Button>
        )}
      </div>
    </div>
  );
}
