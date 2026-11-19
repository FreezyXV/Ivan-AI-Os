// Assemble fixtures.jsonl + labels.json into the single-file corpus read by Codex's
// scripts/evaluate-alert-corpus.mjs (role "evaluation-independante", cas/entree/attendu),
// without changing the separated sources. Usage: node assembler.mjs > corpus.json
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

export function assembler(dir = new URL("./", import.meta.url)) {
  const raw = readFileSync(new URL("fixtures.jsonl", dir));
  const labels = JSON.parse(readFileSync(new URL("labels.json", dir), "utf8"));
  if (createHash("sha256").update(raw).digest("hex") !== labels.fixturesSha256) throw new Error("FIXTURES_CHANGED_SINCE_LABELLING");
  const byId = new Map(labels.labels.map(l => [l.id, l]));
  const cas = raw.toString().split("\n").filter(Boolean).map(line => JSON.parse(line)).map(f => {
    const l = byId.get(f.id);
    return { id: f.id, reel: f.reel, categorie: l.raison ?? l.selection ?? "demande",
      entree: f.item ? { source: { ...f.item, lecture: f.lecture } } : { demande: f.demande },
      attendu: l.selection ? { selection: l.selection, livraison: l.livraison, ...(l.raison ? { raison: l.raison } : {}) } : { decoupage: l.argument } };
  });
  return { version: 1, role: "evaluation-independante", fixturesSha256: labels.fixturesSha256, contexte: labels.contexte,
    avertissement: "Assemblé depuis pertinence-v1 ; seuls les champs item sont transmis au sélecteur.", cas };
}

// Optional argument: another corpus directory with the same fixtures/labels layout (e.g. ../controle-v2/).
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const dir = process.argv[2] ? pathToFileURL(path.resolve(process.argv[2]) + "/") : undefined;
  process.stdout.write(JSON.stringify(assembler(dir), null, 1) + "\n");
}
