import { useEffect, useState } from 'react';
import Button from './ui/Button';
import './SiteHeader.css';

const NAV_ITEMS = [
  { id: 'about', label: 'About' },
  { id: 'speakers', label: 'Speakers' },
  { id: 'agenda', label: 'Agenda' },
  { id: 'tickets', label: 'Passes' },
  { id: 'venue', label: 'Venue' },
  { id: 'faq', label: 'FAQ' },
];

export default function SiteHeader({ event, onRegister, canRegister, availableSections }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('');

  const navItems = NAV_ITEMS.filter((item) => availableSections.includes(item.id));

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Scroll-spy: highlights the nav item for the section currently in view.
  useEffect(() => {
    if (!navItems.length) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActiveSection(visible.target.id);
      },
      { rootMargin: '-25% 0px -60% 0px', threshold: [0.1, 0.5] }
    );

    navItems.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navItems.length]);

  // Lock body scroll while the mobile drawer is open.
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  const handleNavClick = (e, id) => {
    e.preventDefault();
    setMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <header className={`site-header ${scrolled ? 'is-scrolled' : ''}`}>
      <div className="container site-header__inner">
        <a className="site-header__brand" href="#top" onClick={(e) => handleNavClick(e, 'top')}>
          <span className="site-header__mark" aria-hidden="true">
            <svg viewBox="0 0 32 32" width="30" height="30" fill="none">
              <path
                d="M16 3 5 8v8.5C5 23 9.7 28.2 16 29.5 22.3 28.2 27 23 27 16.5V8L16 3Z"
                fill="currentColor"
                opacity="0.14"
              />
              <path
                d="M16 3 5 8v8.5C5 23 9.7 28.2 16 29.5 22.3 28.2 27 23 27 16.5V8L16 3Z"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinejoin="round"
              />
              <path d="M16 10.5v9M11.5 15h9" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" />
            </svg>
          </span>
          <span className="site-header__brand-text">
            <strong>Prashanth</strong>
            <span>Hospitals</span>
          </span>
        </a>

        <nav className="site-header__nav" aria-label="Section navigation">
          {navItems.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className={`site-header__link ${activeSection === item.id ? 'is-active' : ''}`}
              onClick={(e) => handleNavClick(e, item.id)}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="site-header__actions">
          {canRegister && (
            <Button variant="accent" size="sm" onClick={onRegister} className="site-header__cta">
              Register Now
            </Button>
          )}
          <button
            className="site-header__burger"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            <span className={menuOpen ? 'is-open' : ''} />
          </button>
        </div>
      </div>

      {menuOpen && (
        <>
          <div className="site-header__scrim" onClick={() => setMenuOpen(false)} />
          <nav className="site-header__drawer" aria-label="Mobile navigation">
            {navItems.map((item) => (
              <a key={item.id} href={`#${item.id}`} onClick={(e) => handleNavClick(e, item.id)}>
                {item.label}
              </a>
            ))}
            {canRegister && (
              <Button variant="accent" fullWidth onClick={() => { setMenuOpen(false); onRegister(); }}>
                Register Now
              </Button>
            )}
          </nav>
        </>
      )}
    </header>
  );
}
