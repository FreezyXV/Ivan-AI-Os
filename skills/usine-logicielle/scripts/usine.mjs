// Engineering factory ledger: who builds what best, measured on real PR outcomes.
// History seed (reviewed PRs) ships in ../historique.jsonl; new outcomes go to the private
// ledger ~/.ivan-ai-os/engineering/ledger.jsonl (0700/0600). No LLM, no Jev: a computation.
// Usage:
//   node usine.mjs recommander <categorie> [--proprietaire claude|codex]
//                                               builder + reviewer; the agreed owner of the files wins
//   node usine.mjs enregistrer < outcome.json   append one reviewed-PR outcome
//   node usine.mjs tableau                      success table per category and builder
// Env: IVAN_ENGINEERING_DIR overrides the private directory (tests).
import { appendFileSync, existsSync, lstatSync, mkdirSync, readFileSync, realpathSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { isCliEntry } from "../../tools/cli.mjs";

export const CATEGORIES = ["frontend", "backend", "securite", "infra", "integration", "tests", "outillage", "architecture", "debug", "docs", "data"];
export const AGENTS = ["claude", "codex"];
export const RESULTATS = ["accepte", "corrige", "rejete"];
// Priors from the roadmap, used only until both builders have enough reviewed PRs in a category.
export const PRIORS = { frontend: "codex", tests: "codex", architecture: "claude", debug: "claude", securite: "claude", docs: "claude" };
export const MIN_SAMPLES = 3;
const SEED = fileURLToPath(new URL("../historique.jsonl", import.meta.url));

export class UsineError extends Error {}
const fail = code => { throw new UsineError(code); };

export function privateDir(env = process.env) {
  const dir = env.IVAN_ENGINEERING_DIR ?? path.join(homedir(), ".ivan-ai-os", "engineering");
  mkdirSync(dir, { recursive: true, mode: 0o700 });
  const s = lstatSync(dir);
  if (s.isSymbolicLink() || !s.isDirectory() || (s.mode & 0o077)) fail("ENGINEERING_DIR_NOT_PRIVATE");
  return realpathSync(dir);
}

export function validateOutcome(o) {
  if (!o || !Number.isInteger(o.pr) || o.pr < 1) fail("PR_INVALID");
  if (!CATEGORIES.includes(o.categorie)) fail("CATEGORIE_INVALIDE");
  if (!AGENTS.includes(o.constructeur) || !AGENTS.includes(o.relecteur) || o.constructeur === o.relecteur) fail("AGENTS_INVALIDES");
  if (!RESULTATS.includes(o.resultat)) fail("RESULTAT_INVALIDE");
  if (!Number.isInteger(o.bloquants) || o.bloquants < 0) fail("BLOQUANTS_INVALIDES");
  if (o.resultat === "accepte" && o.bloquants > 0) fail("ACCEPTE_AVEC_BLOQUANTS");
  return o;
}

const readJsonl = file => existsSync(file) ? readFileSync(file, "utf8").split("\n").filter(Boolean).map(l => JSON.parse(l)) : [];
// Latest record per PR wins (a PR re-recorded after a second pass replaces the first).
export function outcomes(dir) {
  const byPr = new Map();
  for (const o of [...readJsonl(SEED), ...(dir ? readJsonl(path.join(dir, "ledger.jsonl")) : [])]) byPr.set(o.pr, validateOutcome(o));
  return [...byPr.values()];
}

export function record(dir, o) {
  validateOutcome(o);
  appendFileSync(path.join(dir, "ledger.jsonl"), JSON.stringify(o) + "\n", { mode: 0o600 });
  return o;
}

// Success = accepted without blocking finding. Laplace smoothing keeps small samples humble.
export function stats(list) {
  const table = {};
  for (const c of CATEGORIES) for (const a of AGENTS) {
    const rows = list.filter(o => o.categorie === c && o.constructeur === a);
    const ok = rows.filter(o => o.resultat === "accepte").length;
    table[c] ??= {};
    table[c][a] = { n: rows.length, acceptes: ok, taux: Math.round(((ok + 1) / (rows.length + 2)) * 100) / 100 };
  }
  return table;
}

export function recommend(categorie, list, { proprietaire } = {}) {
  if (!CATEGORIES.includes(categorie)) fail("CATEGORIE_INVALIDE");
  if (proprietaire !== undefined && !AGENTS.includes(proprietaire)) fail("PROPRIETAIRE_INVALIDE");
  const s = stats(list)[categorie];
  // Agreed perimeters (CLAUDE.md, Codex/Claude split) outrank measurement and exploration.
  if (proprietaire) return { categorie, constructeur: proprietaire, relecteur: proprietaire === "claude" ? "codex" : "claude", raison: "périmètre du propriétaire des fichiers", ...s };
  const measured = AGENTS.every(a => s[a].n >= MIN_SAMPLES);
  let constructeur, raison;
  if (measured && s.claude.taux !== s.codex.taux) {
    constructeur = s.claude.taux > s.codex.taux ? "claude" : "codex";
    raison = `mesuré : claude ${s.claude.acceptes}/${s.claude.n}, codex ${s.codex.acceptes}/${s.codex.n}`;
  } else {
    constructeur = PRIORS[categorie] ?? (s.claude.n <= s.codex.n ? "claude" : "codex");
    raison = PRIORS[categorie] ? `a priori (roadmap), échantillon insuffisant (< ${MIN_SAMPLES} PR chacun)` : "alternance pour mesurer les deux constructeurs";
  }
  return { categorie, constructeur, relecteur: constructeur === "claude" ? "codex" : "claude", raison, ...s };
}

if (isCliEntry(import.meta.url)) {
  const [command, arg] = process.argv.slice(2);
  try {
    const dir = privateDir();
    const i = process.argv.indexOf("--proprietaire");
    if (command === "recommander") console.log(JSON.stringify(recommend(arg, outcomes(dir), { proprietaire: i > 0 ? process.argv[i + 1] : undefined }), null, 2));
    else if (command === "enregistrer") console.log(JSON.stringify(record(dir, JSON.parse(readFileSync(0, "utf8")))));
    else if (command === "tableau") {
      const t = stats(outcomes(dir));
      console.log("| Catégorie | Claude construit | Codex construit |\n|---|---|---|");
      for (const c of CATEGORIES) if (t[c].claude.n || t[c].codex.n) console.log(`| ${c} | ${t[c].claude.acceptes}/${t[c].claude.n} | ${t[c].codex.acceptes}/${t[c].codex.n} |`);
    } else fail("USAGE: recommander <categorie> | enregistrer < outcome.json | tableau");
  } catch (error) {
    console.error(error instanceof UsineError ? error.message : "USINE_ERROR");
    process.exitCode = 1;
  }
}
