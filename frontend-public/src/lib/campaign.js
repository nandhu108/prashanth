/* Campaign source attribution.
 *
 * The infographic's funnel starts at WhatsApp / Instagram / QR poster / direct
 * link. We capture whichever source brought the visitor in on their FIRST
 * landing and persist it for the session, so the registration module (Module 3)
 * can stamp it onto the registration record and the dashboard (Module 10) can
 * report "campaign source tracking" accurately.
 *
 * First-touch wins: if someone arrives via a QR poster and later re-opens a
 * WhatsApp reminder link, the original poster still gets the credit.
 */

const STORAGE_KEY = 'ph_campaign_attribution';

const SOURCE_LABELS = {
  whatsapp: 'WhatsApp Campaign',
  instagram: 'Instagram',
  facebook: 'Facebook',
  'qr-poster': 'QR Poster',
  qr: 'QR Poster',
  email: 'Email',
  sms: 'SMS',
  direct: 'Direct Link',
  referral: 'Referral',
};

function safeGet() {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null; // private mode / storage disabled
  }
}

function safeSet(value) {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    /* non-fatal: attribution degrades to 'direct' */
  }
}

function normalizeSource(raw) {
  if (!raw) return null;
  const key = String(raw).toLowerCase().trim();
  if (SOURCE_LABELS[key]) return key;
  if (key.includes('whatsapp') || key === 'wa') return 'whatsapp';
  if (key.includes('insta') || key === 'ig') return 'instagram';
  if (key.includes('facebook') || key === 'fb') return 'facebook';
  if (key.includes('qr')) return 'qr-poster';
  return key.replace(/[^a-z0-9-]/g, '').slice(0, 40) || null;
}

/** Infers the source from the referring domain when no UTM tag is present. */
function inferFromReferrer() {
  const ref = document.referrer || '';
  if (!ref) return null;
  try {
    const host = new URL(ref).hostname.replace(/^www\./, '');
    if (host === window.location.hostname) return null; // internal navigation
    if (host.includes('whatsapp')) return 'whatsapp';
    if (host.includes('instagram')) return 'instagram';
    if (host.includes('facebook') || host.includes('fb.')) return 'facebook';
    return 'referral';
  } catch {
    return null;
  }
}

/**
 * Reads campaign params from the URL, stores them on first touch and returns
 * the attribution record. Safe to call on every page load.
 */
export function captureCampaign() {
  if (typeof window === 'undefined') return null;

  const existing = safeGet();
  const params = new URLSearchParams(window.location.search);

  const source =
    normalizeSource(params.get('utm_source') || params.get('src') || params.get('source')) ||
    inferFromReferrer();

  // First touch already recorded — keep it.
  if (existing?.source) return existing;

  const record = {
    source: source || 'direct',
    medium: params.get('utm_medium') || '',
    campaign: params.get('utm_campaign') || '',
    content: params.get('utm_content') || '',
    term: params.get('utm_term') || '',
    referrer: document.referrer || '',
    landedAt: new Date().toISOString(),
    landingPath: window.location.pathname,
  };

  safeSet(record);
  return record;
}

export function getCampaign() {
  return safeGet() || { source: 'direct' };
}

export function getCampaignLabel(source) {
  return SOURCE_LABELS[source] || 'Direct Link';
}

/**
 * Appends the stored attribution to an outbound link (e.g. the Register CTA),
 * so it survives the hop into the registration flow.
 */
export function withCampaignParams(path) {
  const c = getCampaign();
  if (!c?.source || c.source === 'direct') return path;

  const [base, hash] = String(path).split('#');
  const sep = base.includes('?') ? '&' : '?';
  const params = new URLSearchParams({ src: c.source });
  if (c.campaign) params.set('utm_campaign', c.campaign);
  if (c.medium) params.set('utm_medium', c.medium);

  return `${base}${sep}${params.toString()}${hash ? `#${hash}` : ''}`;
}
