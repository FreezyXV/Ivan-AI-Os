// Memory gardener: finds duplicates, possible contradictions, stale proposals and recurring sources
// in the agents' area of the vault. Read-only by default; `--proposer` writes ONE proposal note in
// inbox/ through memoire.mjs. Never modifies, moves or deletes a note.
// Usage: node jardinier.mjs [--proposer] [--aujourdhui AAAA-MM-JJ]
import { readFileSync, realpathSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { AGENT_ROOT, add, notesUnder, parseNote, resolveVault } from "../../memoire-obsidian/scripts/memoire.mjs";

const STOP = new Set(["de", "du", "des", "la", "le", "les", "et", "en", "un", "une", "a", "au", "aux", "sur", "pour", "par", "the", "of", "and"]);
const words = title => new Set(title.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().split(/[^a-z0-9]+/).filter(w => w.length > 1 && !STOP.has(w)));
const jaccard = (a, b) => { const inter = [...a].filter(w => b.has(w)).length; return inter / (a.size + b.size - inter || 1); };
// Figures stated in the body: heading lines and bare years (context, not values) are ignored.
const numbers = text => text.split("\n").filter(l => !l.startsWith("#")).join(" ")
  .match(/\b\d+(?:[.,]\d+)?\s?(?:%|€|eur|km|kg|ans|millions?|milliards?)?/gi)?.map(n => n.replace(",", ".").replace(/\s/g, "").toLowerCase())
  .filter(n => !/^(1[5-9]|20)\d{2}$/.test(n)) ?? [];
const days = (from, to) => Math.round((new Date(`${to}T00:00:00Z`) - new Date(`${from}T00:00:00Z`)) / 864e5);

export function loadNotes(vault) {
  return notesUnder(path.join(vault, AGENT_ROOT)).flatMap(file => {
    const note = parseNote(readFileSync(file, "utf8"));
    return note ? [{ chemin: path.relative(vault, file), ...note.data, corps: note.body, mots: words(String(note.data.titre ?? "")) }] : [];
  });
}

export function garden(notes, today) {
  const findings = { doublons: [], contradictions: [], perimees: [], sources_recurrentes: [], incompletes: [] };
  const facts = notes.filter(n => n.type !== "journal");
  for (let i = 0; i < facts.length; i++) for (let j = i + 1; j < facts.length; j++) {
    const [a, b] = [facts[i], facts[j]];
    const sim = jaccard(a.mots, b.mots);
    const sameSource = (a.sources ?? []).some(s => (b.sources ?? []).includes(s));
    if (sim >= 0.6 || (sim >= 0.4 && sameSource)) {
      // Same subject: differing figures are a possible contradiction, otherwise a duplicate.
      const [na, nb] = [new Set(numbers(a.corps)), new Set(numbers(b.corps))];
      const differ = na.size && nb.size && ![...na].some(n => nb.has(n));
      (differ ? findings.contradictions : findings.doublons).push({ notes: [a.chemin, b.chemin], similarite: Math.round(sim * 100) / 100 });
    }
  }
  for (const n of notes) {
    if (!n.cree) continue;
    const age = days(n.cree, today);
    if (n.statut === "propose" && age > 30) findings.perimees.push({ note: n.chemin, raison: `proposition non validée depuis ${age} j` });
    if (n.type === "journal" && age > 90) findings.perimees.push({ note: n.chemin, raison: `journal de ${age} j : à résumer dans un bilan mensuel` });
    if (n.type === "connaissance" && n.statut === "valide" && age > 365) findings.perimees.push({ note: n.chemin, raison: `fait validé il y a ${age} j : à revérifier` });
    const missing = ["sources", "sensibilite", "statut"].filter(k => !n[k] || (Array.isArray(n[k]) && !n[k].length));
    if (missing.length) findings.incompletes.push({ note: n.chemin, manque: missing });
  }
  // A source cited by several notes is a signal of importance (roadmap: "appears in 6 searches").
  const bySource = new Map();
  for (const n of notes) for (const s of n.sources ?? []) bySource.set(s, [...(bySource.get(s) ?? []), n.chemin]);
  for (const [source, list] of bySource) if (list.length >= 3) findings.sources_recurrentes.push({ source, notes: list.length });
  return findings;
}

export function report(findings, total) {
  const section = (title, items, fmt) => items.length ? [`## ${title} (${items.length})`, "", ...items.map(fmt), ""] : [];
  return [`# Jardin de la mémoire — ${total} note(s) examinée(s)`, "",
    ...section("Doublons probables", findings.doublons, d => `- ${d.notes.join(" ↔ ")} (similarité ${d.similarite}) → fusionner en une note qui cite les deux`),
    ...section("Contradictions possibles", findings.contradictions, d => `- ${d.notes.join(" ↔ ")} : chiffres différents → trancher avec une source primaire`),
    ...section("À revoir", findings.perimees, p => `- ${p.note} : ${p.raison}`),
    ...section("Notes incomplètes", findings.incompletes, p => `- ${p.note} : manque ${p.manque.join(", ")}`),
    ...section("Sources récurrentes", findings.sources_recurrentes, s => `- ${s.source} : citée par ${s.notes} notes → sujet important`),
    Object.values(findings).every(v => !v.length) ? "Rien à signaler : la mémoire est propre." : "_Propositions seulement : aucune note n'a été modifiée._"
  ].join("\n");
}

if (process.argv[1] && fileURLToPath(import.meta.url) === realpathSync(process.argv[1])) {
  const args = process.argv.slice(2);
  const i = args.indexOf("--aujourdhui");
  const today = i >= 0 ? args[i + 1] : new Date().toISOString().slice(0, 10);
  try {
    const vault = resolveVault();
    const notes = loadNotes(vault), findings = garden(notes, today), md = report(findings, notes.length);
    console.log(md);
    const count = Object.values(findings).reduce((s, v) => s + v.length, 0);
    if (args.includes("--proposer") && count) {
      const note = add(vault, { type: "decision", titre: `Jardin de la mémoire ${today}`, sources: ["skills/system-steward/scripts/jardinier.mjs"],
        sensibilite: "interne", agent: "system-steward", body: md });
      console.log(`\nProposition écrite : ${note}`);
    }
  } catch (error) {
    console.error(error.message ?? "JARDINIER_ERROR");
    process.exitCode = 1;
  }
}
