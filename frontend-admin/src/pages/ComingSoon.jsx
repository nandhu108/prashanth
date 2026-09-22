/** Placeholder for a nav destination whose module hasn't landed yet. Swapped
 *  for the real page as each module in docs/BUILD-CHECKLIST.md is built. */
export default function ComingSoon({ title, module }) {
  return (
    <div className="card">
      <div className="card__body" style={{ textAlign: 'center', padding: '64px 24px' }}>
        <p
          style={{
            fontSize: 'var(--text-xs)',
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--accent-600)',
            marginBottom: 'var(--space-3)',
          }}
        >
          {module}
        </p>
        <h2 style={{ marginBottom: 'var(--space-2)' }}>{title}</h2>
        <p style={{ color: 'var(--ink-500)', margin: 0 }}>
          This section is being built next and will appear here shortly.
        </p>
      </div>
    </div>
  );
}
