// Thematic topic sources for Anakalypto: science feeds (RSS/Atom) read by code, 0 token.
// Headlines are raw material; Jev (`sujet.captivant`, `sujet.domaine`) keeps the evergreen
// subjects and the writer turns a news item into a lasting topic.
import { readFileSync } from "node:fs";

export const SOURCES = JSON.parse(readFileSync(new URL("../sources.json", import.meta.url), "utf8"));

const ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };
export const decode = text => text.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").replace(/<[^>]+>/g, "")
  .replace(/&(#x[0-9a-f]+|#\d+|\w+);/gi, (m, e) => e[0] === "#" ? String.fromCodePoint(e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : Number(e.slice(1))) : ENTITIES[e.toLowerCase()] ?? m)
  .replace(/\s+/g, " ").trim();
const tag = (block, name) => {
  const m = new RegExp(`<${name}\\b[^>]*>([\\s\\S]*?)</${name}>`, "i").exec(block);
  return m ? decode(m[1]) : "";
};

// RSS <item> and Atom <entry>; Atom links are attributes.
export function parseFeed(xml) {
  return [...xml.matchAll(/<(item|entry)\b[\s\S]*?<\/\1>/gi)].map(([block]) => {
    const link = tag(block, "link") || /<link\b[^>]*href="([^"]+)"/i.exec(block)?.[1] || "";
    const date = tag(block, "pubDate") || tag(block, "updated") || tag(block, "published") || tag(block, "dc:date");
    const parsed = date ? new Date(date) : null;
    return { titre: tag(block, "title"), url: link.trim(), date: parsed && !isNaN(parsed) ? parsed.toISOString().slice(0, 10) : null };
  }).filter(i => i.titre && /^https?:\/\//.test(i.url));
}

// Shopping deals mixed into science feeds: dropped by code before any Jev call.
const COMMERCIAL = /\b(?:prix|promo(?:tion)?s?|bons?\s+plans?|soldes?|offre|réduction|remise|amazon|aliexpress|cdiscount|fnac|black\s+friday|code\s+promo|vevor)\b|€|-\s?\d+\s?%/i;
export const commercial = title => COMMERCIAL.test(title);
const key = t => t.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

export async function fetchFeeds({ fetchImpl = fetch, sources = SOURCES.flux, maxAgeDays = 14, today = new Date(), covered = new Set() } = {}) {
  const seen = new Set(), items = [], erreurs = [];
  await Promise.all(sources.map(async src => {
    try {
      const r = await fetchImpl(src.url, { headers: { "user-agent": "ivan-ai-os-anakalypto/1.0" }, redirect: "follow", signal: AbortSignal.timeout(15000) });
      if (!r.ok) throw new Error(`HTTP_${r.status}`);
      for (const it of parseFeed(await r.text())) items.push({ ...it, source: src.id, langue: src.langue });
    } catch (error) { erreurs.push({ source: src.id, code: error.message.startsWith("HTTP_") ? error.message : "INDISPONIBLE" }); }
  }));
  const fresh = items.filter(i => {
    const k = key(i.titre);
    if (seen.has(k) || covered.has(i.titre.toLowerCase()) || commercial(i.titre)) return false;
    seen.add(k);
    return !i.date || (today - new Date(`${i.date}T00:00:00Z`)) / 864e5 <= maxAgeDays;
  }).sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
  return { candidats: fresh.map(i => ({ titre: i.titre, source: i.source, langue: i.langue, url: i.url, date: i.date })), erreurs };
}
