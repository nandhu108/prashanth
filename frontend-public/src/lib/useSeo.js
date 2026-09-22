import { useEffect } from 'react';

/* Injects document title, meta tags, Open Graph / Twitter cards and JSON-LD.
 *
 * WhatsApp is the primary sharing channel for these campaigns, and it reads
 * og:title / og:description / og:image — so those are set explicitly rather
 * than left to defaults. Tags are tracked and removed on unmount so navigating
 * between events never leaves stale tags behind.
 *
 * Note: this is client-side rendering. For crawlers that don't execute JS,
 * the NGINX config includes a prerender hook point (see nginx/README).
 */

function upsertMeta(attr, key, content, registry) {
  if (!content) return;
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
    registry.push(el);
  }
  el.setAttribute('content', content);
}

function upsertLink(rel, href, registry) {
  if (!href) return;
  let el = document.head.querySelector(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
    registry.push(el);
  }
  el.setAttribute('href', href);
}

export function useSeo(seo, jsonLd) {
  useEffect(() => {
    if (!seo) return undefined;

    const created = [];
    const previousTitle = document.title;

    if (seo.metaTitle) document.title = seo.metaTitle;

    upsertMeta('name', 'description', seo.metaDescription, created);
    if (seo.keywords?.length) {
      upsertMeta('name', 'keywords', seo.keywords.join(', '), created);
    }
    if (seo.noIndex) {
      upsertMeta('name', 'robots', 'noindex,nofollow', created);
    }

    // Open Graph — drives WhatsApp, Facebook and LinkedIn previews.
    upsertMeta('property', 'og:type', 'website', created);
    upsertMeta('property', 'og:title', seo.metaTitle, created);
    upsertMeta('property', 'og:description', seo.metaDescription, created);
    upsertMeta('property', 'og:url', seo.canonicalUrl, created);
    upsertMeta('property', 'og:site_name', 'Prashanth Hospitals', created);
    if (seo.ogImageUrl) {
      upsertMeta('property', 'og:image', seo.ogImageUrl, created);
      upsertMeta('property', 'og:image:alt', seo.metaTitle, created);
    }

    // Twitter/X card.
    upsertMeta('name', 'twitter:card', seo.ogImageUrl ? 'summary_large_image' : 'summary', created);
    upsertMeta('name', 'twitter:title', seo.metaTitle, created);
    upsertMeta('name', 'twitter:description', seo.metaDescription, created);
    if (seo.ogImageUrl) upsertMeta('name', 'twitter:image', seo.ogImageUrl, created);

    upsertLink('canonical', seo.canonicalUrl, created);

    // schema.org structured data for rich search results.
    let ldScript;
    if (jsonLd) {
      ldScript = document.createElement('script');
      ldScript.type = 'application/ld+json';
      ldScript.textContent = JSON.stringify(jsonLd);
      document.head.appendChild(ldScript);
    }

    return () => {
      document.title = previousTitle;
      created.forEach((el) => el.remove());
      if (ldScript) ldScript.remove();
    };
  }, [seo, jsonLd]);
}
