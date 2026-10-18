// Business Engine ledger: deterministic cleanup between collection (LLM/web) and decisions.
// Signals and opportunities stay private in ~/.ivan-ai-os/business/ (0700/0600), outside Git.
// Usage:
//   node signals.mjs ajouter < signals.jsonl        add/dedupe public signals
//   node signals.mjs trier                          Jev signal.pertinent on untriaged signals
//   node signals.mjs sujets [--min 2]               recurring subjects, Jev-rejected signals excluded
//   node signals.mjs noter < opportunity.json       score /30, eliminators, Cash/Venture, decision
//   node signals.mjs rapport [--top 3]              Markdown brief of the best scored opportunities
// Env: IVAN_BUSINESS_DIR overrides the private directory (tests).
import { createHash } from "node:crypto";
import { appendFileSync, existsSync, lstatSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { classify, pool } from "../../jev-decision/scripts/classify.mjs";

export const TYPES = ["douleur", "demande", "offre", "tendance"];
export const CRITERES = ["demande", "paiement", "concurrence", "fit", "delai_mvp", "cout_acquisition"];
const PROFILE_CRITERIA = ["fit", "delai_mvp"];
export const ELIMINATOIRES = ["aucune_preuve_paiement", "plateforme_unique", "reglementation_lourde"];
const CREDENTIALS = /\b(?:sk|pk|rk)-[A-Za-z0-9_-]{16,}|\bgh[pousr]_[A-Za-z0-9]{20,}|\bBearer\s+[A-Za-z0-9._~+/-]{20,}/i;

export class BusinessError extends Error {}
const fail = code => { throw new BusinessError(code); };

export function privateDir(env = process.env) {
  const dir = env.IVAN_BUSINESS_DIR ?? path.join(homedir(), ".ivan-ai-os", "business");
  if (!path.isAbsolute(dir)) fail("BUSINESS_DIR_INVALID");
  mkdirSync(dir, { recursive: true, mode: 0o700 });
  const stat = lstatSync(dir);
  if (stat.isSymbolicLink() || !stat.isDirectory() || (stat.mode & 0o077)) fail("BUSINESS_DIR_NOT_PRIVATE");
  return realpathSync(dir);
}

const normalize = text => text.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
export function canonicalUrl(url) {
  let u;
  try { u = new URL(url); } catch { fail("URL_INVALID"); }
  if (!["http:", "https:"].includes(u.protocol)) fail("URL_INVALID");
  for (const key of [...u.searchParams.keys()]) if (/^(utm_|ref$|fbclid$|gclid$)/.test(key)) u.searchParams.delete(key);
  u.hash = "";
  return `${u.hostname.replace(/^www\./, "")}${u.pathname.replace(/\/$/, "")}${u.search}`.toLowerCase();
}
export const signalId = s => createHash("sha256").update(canonicalUrl(s.url)).digest("hex").slice(0, 16);

export function validateSignal(s) {
  if (!s || typeof s !== "object") fail("SIGNAL_INVALID");
  for (const k of ["source", "url", "titre", "sujet", "type", "date"]) if (typeof s[k] !== "string" || !s[k].trim()) fail(`SIGNAL_${k.toUpperCase()}_REQUIRED`);
  if (!TYPES.includes(s.type)) fail("SIGNAL_TYPE_INVALID");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s.date)) fail("SIGNAL_DATE_INVALID");
  if (!/^[a-z0-9][a-z0-9-]{1,60}$/.test(s.sujet)) fail("SIGNAL_SUJET_INVALID");
  if (s.extrait !== undefined && (typeof s.extrait !== "string" || s.extrait.length > 500)) fail("SIGNAL_EXTRAIT_TOO_LONG");
  if (CREDENTIALS.test(JSON.stringify(s))) fail("CREDENTIAL_REFUSED");
  canonicalUrl(s.url);
  return { source: s.source.trim(), url: s.url.trim(), titre: s.titre.trim().slice(0, 200), sujet: s.sujet, type: s.type, date: s.date,
    ...(s.extrait ? { extrait: s.extrait.trim() } : {}), preuve_paiement: s.preuve_paiement === true };
}

function readJsonl(file) {
  if (!existsSync(file)) return [];
  return readFileSync(file, "utf8").split("\n").filter(Boolean).map(line => JSON.parse(line));
}

// Dedupe by canonical URL, then by (sujet, normalized title): a repost is a recurrence, not news.
export function addSignals(dir, signals, now = new Date()) {
  const file = path.join(dir, "signals.jsonl");
  const known = readJsonl(file);
  const byId = new Map(known.map(s => [s.id, s]));
  const byTitle = new Map(known.map(s => [`${s.sujet}|${normalize(s.titre)}`, s]));
  let added = 0, duplicates = 0;
  const fresh = [];
  for (const raw of signals) {
    const s = validateSignal(raw), id = signalId(s), titleKey = `${s.sujet}|${normalize(s.titre)}`;
    if (byId.has(id) || byTitle.has(titleKey)) { duplicates++; continue; }
    const entry = { id, ...s, vu_le: now.toISOString().slice(0, 10) };
    byId.set(id, entry); byTitle.set(titleKey, entry); fresh.push(entry); added++;
  }
  if (fresh.length) appendFileSync(file, fresh.map(e => JSON.stringify(e)).join("\n") + "\n", { mode: 0o600 });
  return { added, duplicates, total: known.length + added };
}

// Recurrence across distinct sources is the cheapest importance signal.
// Jev triage (`signal.pertinent`, public title/excerpt/type only): decisions are appended to
// jev.jsonl; a signal already triaged is never sent twice. Failures stay untriaged (retried later).
export async function triage(dir, { classifyImpl = classify, concurrency = 4 } = {}) {
  const decided = new Set(readJsonl(path.join(dir, "jev.jsonl")).map(d => d.id));
  // Offers prove that people pay (supply side); they are payment evidence, not a customer
  // problem, so they are not submitted to a "problem" relevance question.
  const todo = readJsonl(path.join(dir, "signals.jsonl")).filter(s => !decided.has(s.id) && s.type !== "offre");
  const results = await pool(todo, s => classifyImpl("signal.pertinent",
    { titre: s.titre, extrait: s.extrait ?? s.titre, type: s.type }), concurrency);
  const lines = results.flatMap((r, i) => r.ok ? [{ id: todo[i].id, pertinent: r.value.decision, confidence: r.value.confidence, request_id: r.value.request_id }] : []);
  if (lines.length) appendFileSync(path.join(dir, "jev.jsonl"), lines.map(l => JSON.stringify(l)).join("\n") + "\n", { mode: 0o600 });
  return { tries: lines.length, en_attente_jev: results.filter(r => !r.ok).length, deja_tries: decided.size };
}

// Demand signals Jev rejects (< rejet) stop counting; 0.4-0.6 is Jev's hesitation band, kept but
// flagged. Offers are counted apart as payment evidence and never as demand.
export const JEV_BANDS = { rejet: 0.4, confiant: 0.6 };
export function subjects(dir, min = 2) {
  const groups = new Map();
  const jev = new Map(readJsonl(path.join(dir, "jev.jsonl")).map(d => [d.id, d.pertinent]));
  for (const s of readJsonl(path.join(dir, "signals.jsonl"))) {
    const score = jev.get(s.id);
    if (s.type !== "offre" && score !== undefined && score < JEV_BANDS.rejet) continue;
    if (s.type === "offre") {
      const g = groups.get(s.sujet) ?? { sujet: s.sujet, signaux: 0, sources: new Set(), types: {}, preuve_paiement: false, dernier: s.date };
      g.offres = (g.offres ?? 0) + 1; g.preuve_paiement ||= s.preuve_paiement;
      groups.set(s.sujet, g);
      continue;
    }
    const g = groups.get(s.sujet) ?? { sujet: s.sujet, signaux: 0, sources: new Set(), types: {}, preuve_paiement: false, dernier: s.date };
    g.signaux++; g.sources.add(new URL(s.url).hostname.replace(/^www\./, ""));
    if (score !== undefined && score < JEV_BANDS.confiant) g.incertains = (g.incertains ?? 0) + 1;
    if (score === undefined) g.non_tries = (g.non_tries ?? 0) + 1;
    g.types[s.type] = (g.types[s.type] ?? 0) + 1;
    g.preuve_paiement ||= s.preuve_paiement; if (s.date > g.dernier) g.dernier = s.date;
    groups.set(s.sujet, g);
  }
  return [...groups.values()].map(g => ({ ...g, sources: g.sources.size, offres: g.offres ?? 0, incertains: g.incertains ?? 0, non_tries: g.non_tries ?? 0 }))
    .filter(g => g.signaux >= min).sort((a, b) => b.sources - a.sources || b.signaux - a.signaux);
}

export function scoreOpportunity(o) {
  if (!o || typeof o !== "object" || !/^[a-z0-9][a-z0-9-]{1,60}$/.test(o.sujet ?? "")) fail("OPPORTUNITY_SUJET_INVALID");
  if (typeof o.cible !== "string" || !o.cible.trim() || typeof o.douleur !== "string" || !o.douleur.trim()) fail("OPPORTUNITY_CIBLE_DOULEUR_REQUIRED");
  const criteres = o.criteres ?? {};
  let total = 0;
  for (const c of CRITERES) {
    const v = criteres[c];
    if (!v || !Number.isInteger(v.note) || v.note < 0 || v.note > 5) fail(`CRITERE_${c.toUpperCase()}_INVALID`);
    // Evidence-first: a score above 1 needs a link. Fit and MVP delay depend on Ivan himself,
    // so the private profile is an accepted source for those two criteria only.
    const internal = PROFILE_CRITERIA.includes(c) && v.preuve === "profil";
    if (v.note > 1 && !internal && !(typeof v.preuve === "string" && /^https?:\/\//.test(v.preuve))) fail(`CRITERE_${c.toUpperCase()}_PREUVE_REQUIRED`);
    total += v.note;
  }
  const eliminatoires = (o.eliminatoires ?? []).filter(e => ELIMINATOIRES.includes(e));
  if (criteres.paiement.note === 0 && !eliminatoires.includes("aucune_preuve_paiement")) eliminatoires.push("aucune_preuve_paiement");
  if (!Number.isInteger(o.jours_premier_euro) || o.jours_premier_euro < 1) fail("JOURS_PREMIER_EURO_REQUIRED");
  // Cash = first euro within 30 days (service, freelance, arbitrage); Venture = longer horizon.
  const horizon = o.jours_premier_euro <= 30 ? "cash" : "venture";
  const decision = eliminatoires.length ? "abandonner" : total >= 22 ? "lancer" : total >= 16 ? "creuser" : "abandonner";
  return { sujet: o.sujet, cible: o.cible.trim(), douleur: o.douleur.trim(), total, sur: 30, horizon, decision, eliminatoires,
    ...(o.monetisation ? { monetisation: String(o.monetisation) } : {}), ...(o.validation_7j ? { validation_7j: String(o.validation_7j) } : {}),
    criteres, jours_premier_euro: o.jours_premier_euro };
}

export function recordOpportunity(dir, o, now = new Date()) {
  const scored = scoreOpportunity(o);
  const file = path.join(dir, "opportunites.jsonl");
  appendFileSync(file, JSON.stringify({ ...scored, note_le: now.toISOString().slice(0, 10) }) + "\n", { mode: 0o600 });
  return scored;
}

// Latest score per subject wins; the brief is short enough for Telegram and Obsidian.
export function report(dir, top = 3) {
  const latest = new Map();
  for (const o of readJsonl(path.join(dir, "opportunites.jsonl"))) latest.set(o.sujet, o);
  const ranked = [...latest.values()].filter(o => o.decision !== "abandonner").sort((a, b) => b.total - a.total).slice(0, top);
  // A demand score must be backed by the triaged ledger: confident demand signals (Jev >= 0.6 or
  // untriaged are not enough). Otherwise the score is flagged, never silently trusted.
  const backing = new Map(subjects(dir, 1).map(g => [g.sujet, g.signaux - g.incertains - g.non_tries]));
  const lines = ["# Business Engine — opportunités", ""];
  for (const h of ["cash", "venture"]) {
    const list = ranked.filter(o => o.horizon === h);
    lines.push(`## ${h === "cash" ? "Cash (1er euro ≤ 30 j)" : "Venture (horizon long)"}`, "");
    if (!list.length) lines.push("Aucune opportunité retenue.", "");
    for (const o of list) {
      lines.push(`### ${o.sujet} — ${o.total}/30 → ${o.decision}`, `- Cible : ${o.cible}`, `- Douleur : ${o.douleur}`);
      const confirmed = backing.get(o.sujet) ?? 0;
      if (o.criteres.demande.note >= 3 && confirmed < 2) lines.push(`- ⚠ Demande notée ${o.criteres.demande.note}/5 mais seulement ${confirmed} signal(aux) de demande confirmé(s) par Jev : à revoir`);
      if (o.monetisation) lines.push(`- Monétisation : ${o.monetisation}`);
      if (o.validation_7j) lines.push(`- Validation 7 j : ${o.validation_7j}`);
      lines.push(`- Preuves : ${[...new Set(CRITERES.map(c => o.criteres[c].preuve).filter(p => p && p !== "profil"))].join(" · ")}`, "");
    }
  }
  const abandoned = [...latest.values()].filter(o => o.decision === "abandonner").length;
  lines.push(`_${latest.size} sujet(s) notés, ${abandoned} abandonné(s). Information, pas une promesse de revenu._`);
  return lines.join("\n");
}

if (process.argv[1] && fileURLToPath(import.meta.url) === realpathSync(process.argv[1])) {
  const [command, ...args] = process.argv.slice(2);
  const opt = (flag, fallback) => { const i = args.indexOf(flag); return i < 0 ? fallback : Number(args[i + 1]); };
  try {
    const dir = privateDir();
    let input = "";
    if (["ajouter", "noter"].includes(command)) for await (const chunk of process.stdin) input += chunk;
    if (command === "ajouter") console.log(JSON.stringify(addSignals(dir, input.split("\n").filter(l => l.trim()).map(l => JSON.parse(l)))));
    else if (command === "trier") console.log(JSON.stringify(await triage(dir)));
    else if (command === "sujets") console.log(JSON.stringify(subjects(dir, opt("--min", 2)), null, 2));
    else if (command === "noter") console.log(JSON.stringify(recordOpportunity(dir, JSON.parse(input)), null, 2));
    else if (command === "rapport") console.log(report(dir, opt("--top", 3)));
    else fail("USAGE: ajouter | trier | sujets | noter | rapport");
  } catch (error) {
    console.error(error instanceof BusinessError ? error.message : error instanceof SyntaxError ? "JSON_INVALID" : "BUSINESS_ERROR");
    process.exitCode = 1;
  }
}
