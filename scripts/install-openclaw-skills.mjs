// Install reviewed Claude skill sources as fresh, private OpenClaw packages.
// Never overwrite existing skills, mutate the source tree or print profile data.
import { chmodSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, realpathSync, renameSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

export async function installOpenClawSkills({ source, workspace, profile }) {
  if (![source, workspace, profile].every(p => typeof p === "string" && path.isAbsolute(p))) throw new Error("ABSOLUTE_PATHS_REQUIRED");
  const sourceRoot = realpathSync(source), workspaceRoot = realpathSync(workspace);
  if (workspaceRoot === sourceRoot || workspaceRoot.startsWith(sourceRoot + path.sep) || existsSync(path.join(workspaceRoot, ".git"))) throw new Error("RUNTIME_WORKSPACE_REQUIRED");
  const { buildRegistry, privateTermsFrom } = await import(pathToFileURL(path.join(sourceRoot, "skills/tools/registry.mjs")));
  const { packageSkills } = await import(pathToFileURL(path.join(sourceRoot, "skills/tools/package.mjs")));
  const privateTerms = privateTermsFrom(profile);
  const registry = buildRegistry(path.join(sourceRoot, "skills"), { privateTerms });
  if (!registry.ok) throw new Error("INVALID_SKILLS");
  const names = registry.results.filter(r => r.entry.statut === "actif" && ["career", "knowledge", "system"].includes(r.entry.manager)).map(r => r.entry.name);
  for (const result of registry.results.filter(r => names.includes(r.entry.name))) inspectTree(result.dir);
  const destination = path.join(workspaceRoot, "skills");
  if (existsSync(destination) && (!lstatSync(destination).isDirectory() || lstatSync(destination).isSymbolicLink())) throw new Error("UNSAFE_SKILL_DESTINATION");
  if (!existsSync(destination)) mkdirSync(destination, { mode: 0o700 });
  for (const name of names) if (existsSync(path.join(destination, name)) || (() => { try { lstatSync(path.join(destination, name)); return true; } catch { return false; } })()) throw new Error("EXISTING_SKILL_PRESERVED");
  const stage = mkdtempSync(path.join(workspaceRoot, ".ivan-skills-stage-"));
  const installed = [];
  try {
    const result = packageSkills({ out: stage, root: path.join(sourceRoot, "skills"), profile, names, openclaw: true });
    if (result.skipped.length || result.packaged.length !== names.length) throw new Error("INCOMPLETE_SKILL_PACKAGE");
    const guard = "\n\n## Adaptation OpenClaw par Codex\nLe profil autorisé est uniquement `profil.md` dans ce paquet. S'il manque, ne pas ouvrir le profil complet hors paquet. Clients et finances personnelles sont exclus.\nLes GO déjà accordés par Ivan restent valables pour les tâches réversibles dans leur périmètre.\nLes classifications Jev supplémentaires sont des propositions : ne pas inventer de catalogue ou d'endpoint. Le contrat enregistré de `ivan_route` est la référence ; aucun texte privé ne doit lui être confié.\n";
    for (const name of names) {
      const dir = path.join(stage, name), entrypoint = path.join(dir, "SKILL.md");
      writeFileSync(entrypoint, readFileSync(entrypoint, "utf8").replaceAll("~/.ivan-ai-os/profil.md", "profil.md") + guard, { mode: 0o600 });
      const profileFile = path.join(dir, "profil.md");
      if (existsSync(profileFile)) {
        const text = readFileSync(profileFile, "utf8");
        const headings = text.match(/^## .*$/gm) ?? [];
        const allowed = new Set(["## Positionnement professionnel", "## Expériences à mobiliser", "## Langues", "## Avantages distinctifs (idées de projets)"]);
        const sections = text.split(/(?=^## )/m);
        // Ivan's option A explicitly retains the public CV mission in the
        // professional experience section. This is not a blanket client exception.
        const privateMatch = privateTerms.some(term => sections.some(section =>
          section.toLowerCase().includes(term.toLowerCase()) &&
          !(term.toLowerCase() === "totalenergies" && section.startsWith("## Expériences à mobiliser\n"))));
        if (headings.some(h => !allowed.has(h)) || privateMatch) throw new Error("PRIVATE_PROFILE_REDUCTION_FAILED");
      }
      secureTree(dir);
    }
    const checked = buildRegistry(stage, { privateTerms });
    if (!checked.ok) throw new Error("INVALID_RUNTIME_SKILLS");
    for (const name of names) { renameSync(path.join(stage, name), path.join(destination, name)); installed.push(name); }
    return { installed, excluded: registry.results.filter(r => !names.includes(r.entry.name)).map(r => r.entry.name), source_modified: false, config_modified: false, gateway_restarted: false, confidential_sections_removed: true };
  } catch (error) {
    // Only directories created by this invocation can be removed on rollback.
    for (const name of installed) rmSync(path.join(destination, name), { recursive: true });
    throw error;
  } finally { rmSync(stage, { recursive: true, force: true }); }
}
function secureTree(dir) {
  const stat = lstatSync(dir);
  if (stat.isSymbolicLink()) throw new Error("SYMLINK_IN_SKILL_PACKAGE");
  if (stat.isDirectory()) { chmodSync(dir, 0o700); for (const entry of readdirSync(dir)) secureTree(path.join(dir, entry)); }
  else if (stat.isFile() && stat.nlink === 1) chmodSync(dir, 0o600);
  else throw new Error("UNSAFE_SKILL_PACKAGE");
}
function inspectTree(dir) {
  const stat = lstatSync(dir);
  if (stat.isSymbolicLink()) throw new Error("SYMLINK_IN_SKILL_SOURCE");
  if (stat.isDirectory()) for (const entry of readdirSync(dir)) inspectTree(path.join(dir, entry));
  else if (!stat.isFile() || stat.nlink !== 1) throw new Error("UNSAFE_SKILL_SOURCE");
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const [source, workspace, profile] = process.argv.slice(2);
    console.log(JSON.stringify(await installOpenClawSkills({ source, workspace, profile })));
  } catch (error) { const code = error.code ?? error.message; console.error(/^[A-Z][A-Z_]{0,63}$/.test(code) ? code : "SKILL_INSTALLATION_REFUSED"); process.exitCode = 1; }
}
