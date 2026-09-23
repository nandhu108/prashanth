import { useAuth } from '../../lib/auth';

const TASKS = [
  {
    title: 'Find a specific attendee',
    body: 'Registrations → search box matches name, email, phone or registration code.',
    to: '/registrations',
  },
  {
    title: 'Check someone in without scanning',
    body: 'Check-in → paste their registration code or QR token into the manual-entry box.',
    to: '/checkin',
  },
  {
    title: "Resend someone's ticket",
    body: 'Registrations → expand their row → "Resend ticket (WhatsApp)". If WhatsApp isn\'t configured yet, copy their ticket link and send it manually.',
    to: '/registrations',
  },
  {
    title: 'Cancel a registration',
    body: 'Registrations → expand the row → "Cancel registration". This releases the pass/seat correctly — never edit the database directly.',
    to: '/registrations',
  },
  {
    title: 'Add or reset an admin user',
    body: 'Users & roles → create a new account, or use the 🔑 icon to reset a password. checkin_staff accounts can only reach Check-in.',
    to: '/users',
    roles: ['superadmin'],
  },
  {
    title: 'See who changed what',
    body: 'Audit Log lists every admin action — who, what, when — across the whole dashboard.',
    to: '/audit-log',
    roles: ['superadmin'],
  },
];

const TROUBLESHOOTING = [
  {
    q: '"Online payments are not configured yet" on the registration page',
    a: 'Expected until Razorpay keys are added to the server. The registration still succeeds as "pending payment" — nothing is lost.',
  },
  {
    q: "WhatsApp tickets aren't sending",
    a: 'Expected if WhatsApp credentials aren\'t configured yet — sends are logged, not sent, rather than failing. Use the ticket link directly in the meantime.',
  },
  {
    q: 'A payment succeeded but the registration still shows "pending payment"',
    a: 'The payment webhook can lag a few seconds behind checkout. If it\'s been longer than a minute, this needs a developer to check the server logs.',
  },
  {
    q: '"This pass just sold out" but the numbers look wrong',
    a: 'Check Ticket Types for the sold/held split — a high "held" count is usually abandoned checkouts that will release automatically within the hold window.',
  },
];

export default function Help() {
  const { user } = useAuth();

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-header__title">Help</h2>
          <p className="page-header__subtitle">
            Quick answers for common tasks. For anything not covered here, see{' '}
            <code>docs/SUPPORT.md</code> in the repository, or contact a developer.
          </p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="card__header"><h3 className="card__title">Common tasks</h3></div>
        <div className="card__body" style={{ display: 'grid', gap: 'var(--space-3)' }}>
          {TASKS.filter((t) => !t.roles || t.roles.includes(user?.role)).map((task) => (
            <a
              key={task.title}
              href={task.to}
              style={{
                display: 'block',
                padding: 'var(--space-4)',
                border: '1px solid var(--ink-200)',
                borderRadius: 'var(--radius-md)',
                color: 'inherit',
              }}
            >
              <strong style={{ display: 'block', color: 'var(--ink-900)', marginBottom: 4 }}>{task.title}</strong>
              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-500)' }}>{task.body}</span>
            </a>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="card__header"><h3 className="card__title">Troubleshooting</h3></div>
        <div className="card__body" style={{ display: 'grid', gap: 'var(--space-5)' }}>
          {TROUBLESHOOTING.map((item) => (
            <div key={item.q}>
              <p style={{ margin: '0 0 4px', fontWeight: 600, color: 'var(--ink-900)' }}>{item.q}</p>
              <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--ink-600)' }}>{item.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
