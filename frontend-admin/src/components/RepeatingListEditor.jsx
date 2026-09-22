import Button from './ui/Button';

/**
 * Shared add/remove/reorder shell for the CMS's flat embedded-array tabs
 * (speakers, sponsors, faqs, announcements). Each tab supplies its own field
 * layout via `renderItem` — this component only owns list mechanics.
 */
export default function RepeatingListEditor({ items, onChange, newItem, itemLabel, renderItem }) {
  function updateAt(index, patch) {
    const next = items.slice();
    next[index] = { ...next[index], ...patch };
    onChange(next);
  }

  function removeAt(index) {
    onChange(items.filter((_, i) => i !== index));
  }

  function move(index, dir) {
    const target = index + dir;
    if (target < 0 || target >= items.length) return;
    const next = items.slice();
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  function add() {
    onChange([...items, newItem()]);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      {items.length === 0 && (
        <p style={{ color: 'var(--ink-500)' }}>No {itemLabel.toLowerCase()}s yet.</p>
      )}

      {items.map((item, index) => (
        <div
          key={item._id || item.id || index}
          className="card"
          style={{ padding: 'var(--space-5)' }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 'var(--space-4)',
            }}
          >
            <strong style={{ color: 'var(--ink-500)', fontSize: 'var(--text-sm)' }}>
              {itemLabel} {index + 1}
            </strong>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <button
                type="button"
                className="icon-btn"
                onClick={() => move(index, -1)}
                disabled={index === 0}
                aria-label="Move up"
              >
                ↑
              </button>
              <button
                type="button"
                className="icon-btn"
                onClick={() => move(index, 1)}
                disabled={index === items.length - 1}
                aria-label="Move down"
              >
                ↓
              </button>
              <button
                type="button"
                className="icon-btn"
                onClick={() => removeAt(index)}
                aria-label={`Remove ${itemLabel.toLowerCase()}`}
              >
                ✕
              </button>
            </div>
          </div>

          {renderItem(item, (patch) => updateAt(index, patch))}
        </div>
      ))}

      <Button variant="secondary" size="sm" onClick={add} type="button">
        + Add {itemLabel.toLowerCase()}
      </Button>
    </div>
  );
}
