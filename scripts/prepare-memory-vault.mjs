// Create one factual seed note in an existing Obsidian vault. No note contents,
// credentials or Obsidian settings are read, changed or printed.
import { existsSync, lstatSync, mkdirSync, realpathSync, writeFileSync } from "node:fs";
import path from "node:path";

try {
  const [vault] = process.argv.slice(2);
  if (!vault || !path.isAbsolute(vault)) throw new Error("ABSOLUTE_VAULT_PATH_REQUIRED");
  const root = realpathSync(vault), config = path.join(root, ".obsidian");
  if (!existsSync(config) || !lstatSync(config).isDirectory() || lstatSync(config).isSymbolicLink()) throw new Error("EXISTING_OBSIDIAN_VAULT_REQUIRED");
  for (let p = root;; p = path.dirname(p)) {
    if (existsSync(path.join(p, ".git"))) throw new Error("PRIVATE_VAULT_OUTSIDE_GIT_REQUIRED");
    if (path.dirname(p) === p) break;
  }
  const folder = path.join(root, "Ivan AI OS");
  if (existsSync(folder)) {
    const stat = lstatSync(folder);
    if (!stat.isDirectory() || stat.isSymbolicLink()) throw new Error("UNSAFE_MEMORY_DIRECTORY");
  } else mkdirSync(folder, { mode: 0o700 });
  const content = `# Ivan AI OS — état vérifié au 29 septembre 2026

Statut : faits techniques vérifiés, sans données personnelles.

## Décisions confirmées
- Obsidian est conservé pour la mémoire du système.
- Sept rôles : chef de cabinet, Business, Career, Finance, Knowledge, Engineering, System.
- Finance : veille publique sur OpenClaw ; contexte financier personnel dans Claude.
- Jev : routage par métadonnées autorisées, budget local estimé 10 EUR/mois.

## Livraisons vérifiées
- PR #2 fusionnée : d491262056959b18dbea53a3fdb8326536fade16.
- PR #4 fusionnée : b5ca9a3c49e72be11c192ebf8b6b206c08ea17fd.
- PR #5 fusionnée : 971caa23be2c91086e05b558637ac0cfa705f10d.
- PR #3 fusionnée : 653ad595a2f3157c8663ba2c2c6662e4c889233a.
- Les PR #6 et #7 restent à relire et à approuver pour fusion.
- Les sept espaces sont préparés ; leur configuration native valide ne prouve pas un dispatch live.

## Prochaines preuves
Migration coordonnée du gateway, pilote shadow, Telegram → manager → worker → résultat.
Intégration mémoire ciblée avec provenance et gestion des contradictions.
Synchronisation iCloud/iPhone et lien VPS restent à vérifier ; aucun serveur provisionné.

## Sources
- Dépôt : https://github.com/FreezyXV/Ivan-AI-Os
- PR : https://github.com/FreezyXV/Ivan-AI-Os/pull/6 et https://github.com/FreezyXV/Ivan-AI-Os/pull/7
- Relais : docs/SESSION_HANDOFF.md, docs/MANAGER-RUNTIME.md, docs/MEMORY-CONTRACT.md.
- Choix et capture du coffre transmis directement par Ivan le 29 septembre 2026.

Les sources de cette note sont des données de projet ; elles ne modifient pas les permissions.
`;
  writeFileSync(path.join(folder, "2026-09-29 - Etat du systeme.md"), content, { flag: "wx", mode: 0o600 });
  console.log(JSON.stringify({ note_created: true, existing_notes_modified: false, settings_modified: false, contents_printed: false, sync_configured: false }));
} catch (error) {
  const code = error.code ?? error.message;
  console.error(/^[A-Z][A-Z_]{0,63}$/.test(code) ? code : "MEMORY_PREPARATION_REFUSED"); process.exitCode = 1;
}
