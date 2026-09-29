// Mandatory Jev publication gate: for each card of a batch, ask Jev `publication.prete` with
// public, derived inputs only (slug, claim-check summary, word count, visual type, validator
// result) and write <lot>.jev.json next to the batch. Any Jev failure writes nothing: fail closed.
// Usage: node porte_jev.mjs <lot.md>   (expects <lot>.claims.json from verification-affirmations)
import { existsSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { classify, JevError } from "../../jev-decision/scripts/classify.mjs";
import { summary, verify } from "../../verification-affirmations/scripts/affirmations.mjs";

const BLOC = /^---\ntype: article\n([\s\S]*?)\n---\n([\s\S]*?)(?=^---\ntype: |(?![\s\S]))/gm;
const VISUEL = /```anakalypto-visuel\n([\s\S]*?)\n```/;

export function cards(text) {
  return [...text.matchAll(BLOC)].map(([, fm, body]) => {
    const slug = /^slug:\s*(.+)$/m.exec(fm)?.[1].trim();
    let visuel = "absent";
    try { visuel = JSON.parse(VISUEL.exec(body)?.[1] ?? "null")?.type ?? "absent"; } catch {}
    return { slug, mots: body.replace(VISUEL, "").split(/\s+/).filter(Boolean).length, visuel };
  });
}

export async function gate(lot, { classifyImpl = classify, draftCheck } = {}) {
  const text = readFileSync(lot, "utf8");
  const claimsFile = lot.replace(/\.md$/, ".claims.json");
  if (!existsSync(claimsFile)) throw new Error("CLAIMS_LEDGER_REQUIRED");
  const s = summary(verify(JSON.parse(readFileSync(claimsFile, "utf8"))));
  if (!s.publiable) throw new Error("CLAIMS_NOT_CONFIRMED");
  const validator = draftCheck ?? (() => spawnSync("python3", [fileURLToPath(new URL("./valider_lot.py", import.meta.url)), lot, "--brouillon"]).status === 0);
  const formatOk = validator();
  if (!formatOk) throw new Error("FORMAT_INVALID");
  const decisions = {};
  for (const c of cards(text)) {
    const r = await classifyImpl("publication.prete", { slug: c.slug, resume_verification: `${s.confirmees}/${s.total} affirmations confirmées`,
      mots: c.mots, visuel: c.visuel, validateur: "format ok" });
    decisions[c.slug] = { "publication.prete": { decision: r.decision, confidence: r.confidence, request_id: r.request_id } };
  }
  const out = lot.replace(/\.md$/, ".jev.json");
  writeFileSync(out, JSON.stringify(decisions, null, 2) + "\n");
  return { fichier: out, fiches: Object.keys(decisions).length, pretes: Object.values(decisions).filter(d => d["publication.prete"].decision >= 0.7).length };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === realpathSync(process.argv[1])) {
  try {
    const lot = process.argv[2];
    if (!lot?.endsWith(".md")) throw new Error("USAGE: node porte_jev.mjs <lot.md>");
    console.log(JSON.stringify(await gate(lot)));
  } catch (error) {
    console.error(error instanceof JevError ? `${error.message} — lot non publiable (Jev obligatoire)` : error.message);
    process.exitCode = 1;
  }
}
