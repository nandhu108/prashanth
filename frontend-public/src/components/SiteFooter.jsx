import './SiteFooter.css';

export default function SiteFooter({ event }) {
  const year = new Date().getFullYear();
  const contact = event?.contact || {};

  return (
    <footer className="site-footer">
      <div className="container site-footer__inner">
        <div className="site-footer__brand">
          <span className="site-footer__mark" aria-hidden="true">
            <svg viewBox="0 0 32 32" width="34" height="34" fill="none">
              <path
                d="M16 3 5 8v8.5C5 23 9.7 28.2 16 29.5 22.3 28.2 27 23 27 16.5V8L16 3Z"
                fill="currentColor"
                opacity="0.18"
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
          <div>
            <p className="site-footer__name">Prashanth Hospitals</p>
            <p className="site-footer__tagline">Care · Compassion · Life</p>
          </div>
        </div>

        <p className="site-footer__promise">
          Healthier Women &nbsp;|&nbsp; Stronger Families &nbsp;|&nbsp; Brighter Tomorrows
        </p>

        {(contact.email || contact.phone) && (
          <div className="site-footer__contact">
            {contact.email && <a href={`mailto:${contact.email}`}>{contact.email}</a>}
            {contact.phone && <a href={`tel:${contact.phone.replace(/\s/g, '')}`}>{contact.phone}</a>}
          </div>
        )}
      </div>

      <div className="site-footer__bottom">
        <div className="container site-footer__bottom-inner">
          <p>© {year} Prashanth Hospitals. All rights reserved.</p>
          <p className="site-footer__signature">More Than Care — A Healthier Future</p>
        </div>
      </div>
    </footer>
  );
}
