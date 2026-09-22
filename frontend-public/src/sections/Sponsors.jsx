import './Sponsors.css';

const TIER_ORDER = ['title', 'platinum', 'gold', 'silver', 'bronze', 'partner'];
const TIER_LABEL = {
  title: 'Title Sponsor',
  platinum: 'Platinum Sponsors',
  gold: 'Gold Sponsors',
  silver: 'Silver Sponsors',
  bronze: 'Bronze Sponsors',
  partner: 'Supporting Partners',
};

export default function Sponsors({ sponsors }) {
  if (!sponsors?.length) return null;

  // Group by tier, preserving the canonical tier order.
  const grouped = TIER_ORDER.map((tier) => ({
    tier,
    label: TIER_LABEL[tier],
    items: sponsors.filter((s) => s.tier === tier),
  })).filter((g) => g.items.length);

  return (
    <section className="section section--tight sponsors" id="sponsors">
      <div className="container">
        <div className="section-head section-head--center">
          <span className="section-eyebrow">With thanks to</span>
          <h2 className="section-title">Sponsors &amp; partners</h2>
        </div>

        {grouped.map((group) => (
          <div className={`sponsors__tier sponsors__tier--${group.tier}`} key={group.tier}>
            <h3 className="sponsors__tier-label">{group.label}</h3>
            <ul className="sponsors__list">
              {group.items.map((s) => {
                const inner = s.logoUrl ? (
                  <img src={s.logoUrl} alt={s.name} loading="lazy" />
                ) : (
                  <span className="sponsors__name">{s.name}</span>
                );

                return (
                  <li className="sponsors__item" key={s.id}>
                    {s.websiteUrl ? (
                      <a href={s.websiteUrl} target="_blank" rel="noopener noreferrer" title={s.name}>
                        {inner}
                      </a>
                    ) : (
                      inner
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
