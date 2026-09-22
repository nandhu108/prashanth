import { useState } from 'react';
import { promoApi } from '../../lib/promoApi';
import { useSaveBar } from '../../components/SaveBar';
import { toDateTimeLocal, fromDateTimeLocal } from '../../lib/format';
import Badge from '../../components/ui/Badge';

export default function PromoCodeCard({ promo, ticketTypes, onSaved, onDeleted }) {
  const [form, setForm] = useState({
    code: promo.code,
    description: promo.description || '',
    type: promo.type,
    value: promo.value,
    maxUses: promo.maxUses,
    validFrom: toDateTimeLocal(promo.validFrom),
    validTo: toDateTimeLocal(promo.validTo),
    applicableTicketTypes: (promo.applicableTicketTypes || []).map(String),
    isActive: promo.isActive,
  });
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const { SaveBar } = useSaveBar(async () => {
    const res = await promoApi.update(promo._id || promo.id, {
      ...form,
      value: Number(form.value) || 0,
      maxUses: Number(form.maxUses) || 0,
      validFrom: fromDateTimeLocal(form.validFrom),
      validTo: fromDateTimeLocal(form.validTo),
    });
    onSaved(res.data);
  });

  async function handleDelete() {
    if (!window.confirm(`Delete promo code "${promo.code}"?`)) return;
    setDeleting(true);
    setDeleteError('');
    try {
      await promoApi.remove(promo._id || promo.id);
      onDeleted(promo._id || promo.id);
    } catch (err) {
      setDeleteError(err.message);
      setDeleting(false);
    }
  }

  function toggleTicketType(id) {
    setForm((f) => ({
      ...f,
      applicableTicketTypes: f.applicableTicketTypes.includes(id)
        ? f.applicableTicketTypes.filter((t) => t !== id)
        : [...f.applicableTicketTypes, id],
    }));
  }

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const usesRemaining = promo.maxUses > 0 ? Math.max(promo.maxUses - promo.usedCount, 0) : null;

  return (
    <div className="card">
      <div className="card__header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <h3 className="card__title" style={{ fontFamily: 'var(--font-body)', letterSpacing: '0.03em' }}>
            {promo.code}
          </h3>
          <Badge tone={promo.isValidNow ? 'success' : 'neutral'} size="sm">
            {promo.isValidNow ? 'Redeemable' : 'Not active'}
          </Badge>
        </div>
        <div style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-500)' }}>
          <strong style={{ color: 'var(--ink-800)' }}>{promo.usedCount}</strong> used
          {usesRemaining !== null && (
            <> · <strong style={{ color: 'var(--ink-800)' }}>{usesRemaining}</strong> remaining</>
          )}
        </div>
      </div>

      <div className="card__body">
        <div className="field-row">
          <label className="field"><span className="field__label">Code</span>
            <input className="field__input" value={form.code} onChange={set('code')} style={{ textTransform: 'uppercase' }} /></label>
          <label className="field"><span className="field__label">Type</span>
            <select className="field__select" value={form.type} onChange={set('type')}>
              <option value="percent">Percent off</option>
              <option value="flat">Flat amount off</option>
            </select>
          </label>
          <label className="field"><span className="field__label">Value {form.type === 'percent' ? '(%)' : '(₹)'}</span>
            <input type="number" min="0" className="field__input" value={form.value} onChange={set('value')} /></label>
        </div>

        <label className="field"><span className="field__label">Description (internal note)</span>
          <input className="field__input" value={form.description} onChange={set('description')} /></label>

        <div className="field-row">
          <label className="field"><span className="field__label">Max uses</span>
            <input type="number" min="0" className="field__input" value={form.maxUses} onChange={set('maxUses')} />
            <span className="field__hint">0 = unlimited</span>
          </label>
          <label className="field"><span className="field__label">Valid from</span>
            <input type="datetime-local" className="field__input" value={form.validFrom} onChange={set('validFrom')} /></label>
          <label className="field"><span className="field__label">Valid to</span>
            <input type="datetime-local" className="field__input" value={form.validTo} onChange={set('validTo')} /></label>
        </div>

        {ticketTypes.length > 0 && (
          <div className="field">
            <span className="field__label">Applies to (leave all unchecked for every pass)</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
              {ticketTypes.map((t) => (
                <label key={t._id || t.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-sm)' }}>
                  <input
                    type="checkbox"
                    checked={form.applicableTicketTypes.includes(String(t._id || t.id))}
                    onChange={() => toggleTicketType(String(t._id || t.id))}
                  />
                  {t.name}
                </label>
              ))}
            </div>
          </div>
        )}

        <label className="field__label">
          <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} style={{ marginRight: 'var(--space-2)' }} />
          Active
        </label>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'var(--space-6)', paddingTop: 'var(--space-5)', borderTop: '1px solid var(--ink-100)' }}>
          {SaveBar}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            {deleteError && <span className="tab-save-bar__status tab-save-bar__status--error">{deleteError}</span>}
            <button type="button" className="btn btn--ghost btn--sm" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
