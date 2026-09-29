// Private DCA module: drift vs target and a buy-only split of the next contribution. Pure
// arithmetic, no LLM, no network. Reads ~/.ivan-ai-os/finance/allocation.json (0600, never Git,
// never OpenClaw or Jev). Proposals only: buying remains Ivan's manual action.
// Usage: node dca.mjs derive [--valeur <total_eur>] | repartir [montant_eur] --valeur <total_eur>
// Defaults: montant = versement_mensuel_eur; valeur = valeur_portefeuille_eur (current value).
import { lstatSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { realpathSync } from "node:fs";

export class DcaError extends Error {}
const fail = code => { throw new DcaError(code); };
const round2 = v => Math.round(v * 100) / 100;

export function validateAllocation(a) {
  if (!a || a.version !== 1 || !Array.isArray(a.lignes) || !a.lignes.length) fail("ALLOCATION_INVALID");
  const ids = new Set();
  for (const l of a.lignes) {
    if (typeof l.id !== "string" || !l.id.trim() || ids.has(l.id)) fail("LIGNE_ID_INVALID");
    ids.add(l.id);
    for (const k of ["reel_pct", "cible_pct"]) if (!Number.isFinite(l[k]) || l[k] < 0 || l[k] > 100) fail(`LIGNE_${k.toUpperCase()}_INVALID`);
  }
  for (const k of ["reel_pct", "cible_pct"]) {
    const sum = a.lignes.reduce((s, l) => s + l[k], 0);
    if (Math.abs(sum - 100) > 0.5) fail(`SOMME_${k.toUpperCase()}_${round2(sum)}`);
  }
  return a;
}

export function readAllocation(file = path.join(homedir(), ".ivan-ai-os", "finance", "allocation.json")) {
  const s = lstatSync(file);
  if (s.isSymbolicLink() || !s.isFile() || (s.mode & 0o077)) fail("ALLOCATION_NOT_PRIVATE");
  return validateAllocation(JSON.parse(readFileSync(file, "utf8")));
}

// Drift in percentage points; |drift| >= 5 pts is the conventional rebalancing band.
export function drift(a, bande = 5) {
  return a.lignes.map(l => ({ id: l.id, reel_pct: l.reel_pct, cible_pct: l.cible_pct, ecart_pts: round2(l.reel_pct - l.cible_pct),
    hors_bande: Math.abs(l.reel_pct - l.cible_pct) >= bande }));
}

// Buy-only split: fill the lines furthest below target first, then follow the target weights.
// Never proposes a sale. `valeur` is the current portfolio value.
export function split(a, montant = a.versement_mensuel_eur, valeur = a.valeur_portefeuille_eur) {
  if (!Number.isFinite(montant) || montant <= 0) fail("MONTANT_INVALID");
  if (!Number.isFinite(valeur) || valeur <= 0) fail("VALEUR_PORTEFEUILLE_REQUIRED");
  const total = valeur + montant;
  const lines = a.lignes.map(l => ({ id: l.id, actuel: (valeur * l.reel_pct) / 100, cible: (total * l.cible_pct) / 100 }));
  const deficits = lines.map(l => Math.max(0, l.cible - l.actuel));
  const sumDeficit = deficits.reduce((s, d) => s + d, 0);
  // If the contribution cannot close every gap, share it pro rata of the gaps; otherwise close
  // all gaps and spread the rest along target weights.
  const achats = lines.map((l, i) => sumDeficit >= montant
    ? (montant * deficits[i]) / sumDeficit
    : deficits[i] + ((montant - sumDeficit) * a.lignes[i].cible_pct) / 100);
  const rounded = achats.map(round2);
  rounded[rounded.indexOf(Math.max(...rounded))] += round2(montant - rounded.reduce((s, v) => s + v, 0)); // cents to the largest
  return lines.map((l, i) => {
    const apres = l.actuel + rounded[i];
    return { id: l.id, achat_eur: round2(rounded[i]), apres_pct: round2((apres / total) * 100), cible_pct: a.lignes[i].cible_pct };
  });
}

// Contribution needed to reach every target without selling.
export function toTarget(a, valeur = a.valeur_portefeuille_eur) {
  if (!Number.isFinite(valeur) || valeur <= 0) return null;
  const needed = Math.max(...a.lignes.map(l => (valeur * l.reel_pct) / l.cible_pct)) - valeur;
  return round2(Math.max(0, needed));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === realpathSync(process.argv[1])) {
  const [command, ...args] = process.argv.slice(2);
  const opt = flag => { const i = args.indexOf(flag); return i < 0 ? undefined : Number(args[i + 1]); };
  try {
    const a = readAllocation(process.env.IVAN_ALLOCATION_PATH);
    const valeur = opt("--valeur") ?? a.valeur_portefeuille_eur;
    if (command === "derive") console.log(JSON.stringify({ lignes: drift(a), versement_pour_cible_sans_vente_eur: toTarget(a, valeur) }, null, 2));
    else if (command === "repartir") console.log(JSON.stringify(split(a, args[0] && !args[0].startsWith("--") ? Number(args[0]) : a.versement_mensuel_eur, valeur), null, 2));
    else fail("USAGE: derive | repartir <montant_eur> [--valeur <total_eur>]");
  } catch (error) {
    console.error(error instanceof DcaError ? error.message : "DCA_ERROR");
    process.exitCode = 1;
  }
}
