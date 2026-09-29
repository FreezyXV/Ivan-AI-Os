import { constants, closeSync, fstatSync, lstatSync, openSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";

const BUSINESS_FILE = "opportunites.jsonl";
const FINANCE_FOLDER = "snapshots";
const FINANCE_IDS = new Set(["bce_taux_depot", "inflation_zone_euro", "inflation_sous_jacente", "eur_usd", "us_10_ans", "btc_eur", "eth_eur"]);
const text = (value, max) => typeof value === "string" && value.length > 0 && value.length <= max && !/[\x00-\x1f]/.test(value) ? value : null;
const number = (value, max = 1_000_000) => Number.isFinite(value) && Math.abs(value) <= max ? value : null;

export class BriefError extends Error { constructor(code) { super(code); this.code = code; } }
const refuse = () => { throw new BriefError("BRIEF_UNAVAILABLE"); };
function privateDirectory(directory) {
  if (typeof directory !== "string" || !path.isAbsolute(directory)) refuse();
  const stat = lstatSync(directory);
  if (!stat.isDirectory() || stat.isSymbolicLink() || stat.uid !== process.getuid?.() || stat.mode & 0o077) refuse();
  return directory;
}
function readPrivateFile(filename, maxBytes) {
  let fd;
  try {
    fd = openSync(filename, constants.O_RDONLY | constants.O_NOFOLLOW);
    const stat = fstatSync(fd);
    if (!stat.isFile() || stat.uid !== process.getuid?.() || stat.mode & 0o077 || stat.nlink !== 1 || stat.size > maxBytes) refuse();
    return readFileSync(fd, "utf8");
  } finally { if (fd !== undefined) closeSync(fd); }
}
function sourceUrl(value) {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password || !url.hostname) return null;
    return `${url.origin}${url.pathname}`.slice(0, 350);
  } catch { return null; }
}

export function businessBrief(directory) {
  privateDirectory(directory);
  let raw;
  try { raw = readPrivateFile(path.join(directory, BUSINESS_FILE), 1_000_000); }
  catch (error) { if (error?.code === "ENOENT") return { status: "EMPTY", opportunities: [], total_subjects: 0 }; throw error; }
  const lines = raw.split("\n").filter(Boolean);
  if (lines.length > 500) refuse();
  const latest = new Map();
  for (const line of lines) {
    const entry = JSON.parse(line);
    if (!/^[a-z0-9][a-z0-9-]{1,60}$/.test(entry.sujet ?? "") ||
        !Number.isInteger(entry.total) || entry.total < 0 || entry.total > 30 ||
        !["cash", "venture"].includes(entry.horizon) ||
        !["lancer", "creuser", "abandonner"].includes(entry.decision)) refuse();
    latest.set(entry.sujet, entry);
  }
  const opportunities = [...latest.values()].filter(entry => entry.decision !== "abandonner")
    .sort((a, b) => b.total - a.total).slice(0, 3).map(entry => ({
      sujet: entry.sujet, score_sur_30: entry.total, horizon: entry.horizon,
      decision: entry.decision, note_le: text(entry.note_le, 10),
      preuves_publiques: [...new Set(Object.values(entry.criteres ?? {}).map(c => sourceUrl(c?.preuve)).filter(Boolean))].slice(0, 4)
    }));
  return { status: "READY", total_subjects: latest.size, abandoned: [...latest.values()].filter(entry => entry.decision === "abandonner").length, opportunities };
}

function readSnapshot(folder, name) {
  const snapshot = JSON.parse(readPrivateFile(path.join(folder, name), 100_000));
  if (snapshot.version !== 1 || snapshot.date !== name.slice(0, 10) || !Array.isArray(snapshot.indicateurs) || snapshot.indicateurs.length > 7 ||
      !Array.isArray(snapshot.erreurs) || snapshot.erreurs.length > 7) refuse();
  return snapshot;
}
export function financeBrief(directory) {
  privateDirectory(directory);
  const folder = privateDirectory(path.join(directory, FINANCE_FOLDER));
  const files = readdirSync(folder).filter(name => /^\d{4}-\d{2}-\d{2}\.json$/.test(name)).sort();
  if (files.length > 400) refuse();
  if (!files.length) return { status: "EMPTY", indicateurs: [], erreurs: [] };
  const current = readSnapshot(folder, files.at(-1));
  const previous = files.length > 1 ? readSnapshot(folder, files.at(-2)) : null;
  const before = new Map((previous?.indicateurs ?? []).map(item => [item.id, item.valeur]));
  const indicateurs = current.indicateurs.map(item => {
    if (!FINANCE_IDS.has(item.id) || !text(item.libelle, 120) || number(item.valeur) === null || !/^\d{4}-\d{2}(?:-\d{2})?$/.test(item.date_obs ?? "")) refuse();
    return {
      id: item.id, libelle: item.libelle, valeur: item.valeur,
      unite: text(item.unite, 8), date_obs: item.date_obs, source: sourceUrl(item.source),
      ...(number(before.get(item.id)) !== null ? { valeur_precedente: before.get(item.id) } : {}),
      ...(item.extra && number(item.extra.variation_7j_pct, 1000) !== null ? { variation_7j_pct: item.extra.variation_7j_pct } : {})
    };
  });
  const erreurs = current.erreurs.map(item => ({
    id: FINANCE_IDS.has(item.id) ? item.id : "unknown",
    code: /^[A-Z_0-9]{1,40}$/.test(item.code ?? "") ? item.code : "INDISPONIBLE"
  }));
  return { status: "READY", date: current.date, previous_date: previous?.date ?? null, indicateurs, erreurs, personal_allocation_included: false };
}
