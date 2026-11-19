import {extractPublicPage, fetchPublic} from './research-web.js';

const indices = [
  { url: 'https://www.insee.fr/fr/statistiques/2107840', article: /^\/fr\/statistiques\/\d{7}\/?$/, readLimit: 8 },
  { url: 'https://ec.europa.eu/eurostat/web/euro-indicators', article: /^\/eurostat\/web\/products-euro-indicators\/w\/[a-z\d-]+\/?$/, readLimit: 4 }
];

function inseePublication(html) {
  const date = /<span\b[^>]*\bdata-i18n=["']\[html\]produit\.bandeau-bleu\.paru-le-impression["'][^>]*>\s*Paru le\s*<\/span>\s*<\/span>\s*(\d\d)\/(\d\d)\/(\d{4})\b/i.exec(html);
  if (!date) return null;
  const stamp = `${date[3]}-${date[2]}-${date[1]}`;
  const parsed = new Date(stamp);
  return Number.isFinite(+parsed) && parsed.toISOString().startsWith(stamp) ? parsed.toISOString() : null;
}

export async function readPublicStatistics({ now = new Date(), fetchImpl = fetchPublic } = {}) {
  const feeds = await Promise.all(indices.map(async ({url, article, readLimit}) => {
    const host = new URL(url).hostname;
    try {
      const index = await fetchImpl(url, {maxBytes: 1200000, timeoutMs: 8000});
      const articles = new Set();
      for (const [, href] of index.text.matchAll(/\bhref=["']([^"'<>]+)["']/gi)) {
        let resolved;
        try { resolved = new URL(href, url); } catch { continue; }
        if (resolved.origin !== new URL(url).origin || !article.test(resolved.pathname) ||
            resolved.pathname === new URL(url).pathname) continue;
        articles.add(resolved.origin + resolved.pathname);
        if (articles.size === readLimit) break;
      }
      if (!articles.size) return { host, items: [], errors: ['PUBLIC_RESEARCH_STATISTICS_INDEX_EMPTY'] };
      const items = [], errors = [];
      for (const target of articles) {
        try {
          const response = await fetchImpl(target, {maxBytes: 1200000, timeoutMs: 6000});
          const page = extractPublicPage(response);
          const publishedAt = page.publishedAt ?? (host === 'www.insee.fr' ? inseePublication(response.text) : null);
          const age = now - Date.parse(publishedAt);
          if (page.url !== target || !Number.isFinite(age)) {
            errors.push('PUBLIC_RESEARCH_STATISTICS_DATE_UNVERIFIED');
            continue;
          }
          if (age < -300000 || age > 14 * 86400000) continue;
          const excerpt = page.text.slice(0, 1200);
          items.push({producer: 'official-statistics', scope: 'public', topic: 'finance', url: page.url,
            title: page.title.slice(0, 200), publishedAt, observedAt: now.toISOString(), readAt: page.readAt,
            sourceStatus: 'read', excerpt, textChars: page.text.length, excerptMode: 'head',
            excerptTruncated: page.text.length > excerpt.length});
          if (items.length === 2) break;
        } catch (error) { errors.push(error.code ?? 'PUBLIC_RESEARCH_STATISTICS_PAGE_UNAVAILABLE'); }
      }
      return {host, items, errors};
    } catch (error) {
      return {host, items: [], errors: [error.code ?? 'PUBLIC_RESEARCH_STATISTICS_UNAVAILABLE']};
    }
  }));
  return feeds;
}
