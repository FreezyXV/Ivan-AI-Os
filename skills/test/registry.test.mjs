import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SKILLS_ROOT, buildRegistry, parseSkill, privateTermsFrom, validateSkill } from "../tools/registry.mjs";
import { packageSkills, withoutClients } from "../tools/package.mjs";

const meta = (extra = "") => `metadata:
  version: "1.0.0"
  famille: test
  manager: system
  risque: lecture
  profil: "non"
  statut: actif
  provenance: "synthetic fixture"${extra}`;

function scratch(t) {
  const dir = mkdtempSync(path.join(tmpdir(), "ivan-skills-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  return dir;
}
function skill(root, name, { front = `name: ${name}\ndescription: Synthetic skill.\n${meta()}`, body = "# Body\n" } = {}) {
  mkdirSync(path.join(root, name), { recursive: true });
  writeFileSync(path.join(root, name, "SKILL.md"), `---\n${front}\n---\n${body}`);
  return path.join(root, name);
}

test("every skill in the repository passes the registry rules", () => {
  const { ok, results } = buildRegistry();
  assert.ok(results.length >= 14);
  assert.equal(ok, true, results.filter(r => r.errors.length).map(r => `${path.basename(r.dir)}: ${r.errors}`).join("\n"));
  assert.equal(new Set(results.map(r => r.entry.name)).size, results.length);
});

test("frontmatter parser keeps colons in descriptions and nested metadata", () => {
  const { data } = parseSkill(`---\nname: x\ndescription: A: b "c"\n${meta()}\n---\nbody`);
  assert.equal(data.description, 'A: b "c"');
  assert.equal(data.metadata.profil, "non");
  assert.throws(() => parseSkill("no frontmatter"), /missing frontmatter/);
});

test("invalid names, metadata, links and profile references are rejected", t => {
  const root = scratch(t);
  const cases = {
    "wrong-dir": [{ front: `name: other\ndescription: d\n${meta()}` }, /name must equal directory/],
    "no-meta": [{ front: "name: no-meta\ndescription: d" }, /metadata.version required/],
    "bad-enum": [{ front: `name: bad-enum\ndescription: d\n${meta().replace("system", "sales")}` }, /metadata.manager must be one of/],
    "extra-key": [{ front: `name: extra-key\ndescription: d\nmodel: x\n${meta()}` }, /unknown frontmatter key: model/],
    "broken-link": [{ body: "See [ref](missing.md)" }, /broken link: missing.md/],
    "profile-silent": [{ front: `name: profile-silent\ndescription: d\n${meta().replace('profil: "non"', 'profil: "oui"')}` }, /profil.md/]
  };
  for (const [name, [options, pattern]] of Object.entries(cases)) {
    const { errors } = validateSkill(skill(root, name, options));
    assert.ok(errors.some(e => pattern.test(e)), `${name}: ${errors}`);
  }
});

test("credentials, personal identifiers and private client names are refused", t => {
  const root = scratch(t);
  const profile = path.join(root, "profil.md");
  writeFileSync(profile, "## Clients et données confidentielles\nClients : Synthetic Corp, Acme.\n");
  assert.deepEqual(privateTermsFrom(profile), ["Synthetic Corp", "Acme"]);
  for (const [name, body] of [["key", "sk-" + "a".repeat(24)], ["mail", "ivan.synthetic@example.org"], ["phone", "+33 6 12 34 56 78"], ["client", "Mission at synthetic corp"]]) {
    const { errors } = validateSkill(skill(root, name, { body }), { privateTerms: privateTermsFrom(profile) });
    assert.ok(errors.some(e => /forbidden content|private profile term/.test(e)), `${name}: ${errors}`);
  }
  assert.deepEqual(privateTermsFrom(path.join(root, "absent.md")), []);
});

test("packaging injects the private profile outside the repository only", t => {
  const root = scratch(t), out = path.join(scratch(t), "dist");
  skill(root, "plain");
  skill(root, "personal", { front: `name: personal\ndescription: d\n${meta().replace('profil: "non"', 'profil: "oui"')}`, body: "Lire `profil.md`." });
  const profile = path.join(root, "profil.md");
  writeFileSync(profile, "# synthetic profile\n");
  assert.deepEqual(packageSkills({ out, root, profile: path.join(root, "absent.md") }).skipped, ["personal"]);
  const result = packageSkills({ out, root, profile });
  assert.deepEqual(result.packaged.sort(), ["personal", "plain"]);
  assert.equal(readFileSync(path.join(out, "personal", "profil.md"), "utf8"), "# synthetic profile\n");
  assert.equal(statSync(path.join(out, "personal", "profil.md")).mode & 0o777, 0o600);
  assert.equal(existsSync(path.join(out, "plain", "profil.md")), false);
  assert.throws(() => packageSkills({ out: path.join(SKILLS_ROOT, "tmp-dist"), root, profile }), /OUTPUT_INSIDE_REPOSITORY/);
  rmSync(path.join(SKILLS_ROOT, "tmp-dist"), { recursive: true, force: true });
});

test("Anakalypto batch validator accepts a conforming article and flags defects", t => {
  const python = spawnSync("python3", ["--version"]);
  if (python.status !== 0) return t.skip("python3 unavailable");
  const script = fileURLToPath(new URL("../encyclopedie-anakalypto/scripts/valider_lot.py", import.meta.url));
  const dir = scratch(t);
  const words = n => Array.from({ length: n }, (_, i) => `mot${i}`).join(" ");
  const article = (slug, body) => `---\ntype: article\nslug: ${slug}\ntitre: Titre\ncategorie: cat\nresume: Résumé court.\n---\n${body}`;
  const good = article("bon", `## Résumé\n${words(300)}\n## Section\n${words(600)}\n## Faits clés\n- 2020 : fait\n## Chronologie\n- 2020 : x\n## Sources\n- A, t, https://a.example\n- B, t, https://b.example\n- C, t, https://c.example\n`);
  const bad = article("mauvais", "## Résumé\ncourt TODO\n## Sources\n- https://a.example\n");
  writeFileSync(path.join(dir, "good.md"), good);
  writeFileSync(path.join(dir, "bad.md"), bad);
  assert.equal(spawnSync("python3", [script, path.join(dir, "good.md")]).status, 0);
  const result = spawnSync("python3", [script, path.join(dir, "bad.md")], { encoding: "utf8" });
  assert.equal(result.status, 1);
  for (const expected of ["section absente '## Faits clés'", "mots (cible", "moins de 3 sources", "marqueur non résolu"]) {
    assert.ok(result.stdout.includes(expected), expected);
  }
});

test("OpenClaw packages can drop the confidential clients section", () => {
  const text = "# P\n## Positionnement\nBA\n## Clients et données confidentielles\nClients : Acme.\n## Langues\nFR\n";
  const reduced = withoutClients(text);
  assert.equal(reduced.includes("Acme"), false);
  assert.ok(reduced.includes("## Positionnement\nBA") && reduced.includes("## Langues\nFR"));
  assert.equal(withoutClients("# P\n## Clients\nClients : Acme.\n").includes("Acme"), false);
});
