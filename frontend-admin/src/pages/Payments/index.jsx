import { useCallback, useEffect, useState } from 'react';
import { paymentApi } from '../../lib/paymentApi';
import { formatCurrency, formatDateTime } from '../../lib/format';
import { LoadingState, ErrorState, EmptyState } from '../../components/ui/States';
import Badge from '../../components/ui/Badge';

const STATUS_TONE = { created: 'info', paid: 'success', failed: 'danger', refunded: 'warning' };
const STATUSES = ['', 'created', 'paid', 'failed', 'refunded'];

export default function Payments() {
  const [status, setStatus] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    setResult(null);
    const params = {};
    if (status) params.status = status;
    paymentApi
      .list(params)
      .then((res) => setResult(res))
      .catch((err) => setError(err.message));
  }, [status]);

  useEffect(load, [load]);

  if (error) return <ErrorState message={error} onRetry={load} />;

  const payments = result?.data || [];

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-header__title">Payments</h2>
          <p className="page-header__subtitle">
            {result?.meta ? `${result.meta.total} total` : 'Razorpay order ledger for reconciliation.'}
          </p>
        </div>
        <select className="field__select" value={status} onChange={(e) => setStatus(e.target.value)}>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s || 'All statuses'}</option>
          ))}
        </select>
      </div>

      {result === null ? (
        <LoadingState label="Loading payments…" />
      ) : payments.length === 0 ? (
        <EmptyState
          title="No payments yet"
          message="Payments appear here once attendees start checking out. Add RAZORPAY_KEY_ID/SECRET to backend/.env to enable online payments."
        />
      ) : (
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Registration</th>
                <th>Attendee</th>
                <th>Order ID</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p._id}>
                  <td>{p.registration?.registrationCode || '—'}</td>
                  <td>{p.registration?.attendee?.name || '—'}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: 'var(--text-xs)' }}>{p.razorpayOrderId}</td>
                  <td>{formatCurrency((p.amount || 0) / 100, p.currency)}</td>
                  <td>{p.method || '—'}</td>
                  <td><Badge tone={STATUS_TONE[p.status] || 'neutral'} size="sm">{p.status}</Badge></td>
                  <td>{formatDateTime(p.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
