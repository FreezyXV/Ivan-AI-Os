import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { linkSync, lstatSync, readdirSync, realpathSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, symlinkSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SKILLS_ROOT, buildRegistry, parseSkill, privateTermsFrom, validateSkill } from "../tools/registry.mjs";
import { OPENCLAW_DROPPED_SECTIONS, packageSkills, withoutSections } from "../tools/package.mjs";

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
  assert.deepEqual(packageSkills({ out: `${out}-noprofile`, root, profile: path.join(root, "absent.md") }).skipped, ["personal"]);
  const result = packageSkills({ out, root, profile });
  assert.deepEqual(result.packaged.sort(), ["personal", "plain"]);
  assert.equal(readFileSync(path.join(out, "personal", "profil.md"), "utf8"), "# synthetic profile\n");
  assert.equal(statSync(path.join(out, "personal", "profil.md")).mode & 0o777, 0o600);
  assert.equal(existsSync(path.join(out, "plain", "profil.md")), false);
  assert.throws(() => packageSkills({ out: path.join(SKILLS_ROOT, "tmp-dist"), root, profile }), /OUTPUT_INSIDE_REPOSITORY/);
  assert.equal(existsSync(path.join(SKILLS_ROOT, "tmp-dist")), false);
  assert.throws(() => packageSkills({ out, root, profile }), /OUTPUT_NOT_FRESH/);
});

test("packaging never follows planted or source links (Codex review finding)", t => {
  const dir = scratch(t), root = path.join(dir, "source"), out = path.join(dir, "out");
  skill(root, "personal", { front: `name: personal\ndescription: d\n${meta().replace('profil: "non"', 'profil: "oui"')}`, body: "Lire `profil.md`." });
  const profile = path.join(dir, "profile"), victim = path.join(dir, "sentinel");
  writeFileSync(profile, "SYNTHETIC_PRIVATE_PROFILE"); writeFileSync(victim, "ORIGINAL");
  mkdirSync(path.join(out, "personal"), { recursive: true });
  symlinkSync(victim, path.join(out, "personal", "profil.md"));
  assert.throws(() => packageSkills({ root, out, profile, openclaw: true }), /OUTPUT_NOT_FRESH/);
  symlinkSync(out, path.join(dir, "linked-out"));
  assert.throws(() => packageSkills({ root, out: path.join(dir, "linked-out"), profile }), /OUTPUT_NOT_FRESH/);
  assert.equal(readFileSync(victim, "utf8"), "ORIGINAL");
  symlinkSync(victim, path.join(root, "personal", "extra.md"));
  assert.throws(() => packageSkills({ root, out: path.join(dir, "fresh"), profile }), /SOURCE_LINK_REFUSED/);
  rmSync(path.join(root, "personal", "extra.md"));
  linkSync(victim, path.join(root, "personal", "hard.md"));
  assert.throws(() => packageSkills({ root, out: path.join(dir, "fresh2"), profile }), /SOURCE_LINK_REFUSED/);
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

test("OpenClaw packages drop clients and personal finances", t => {
  const text = "# P\n## Positionnement\nBA\n## Clients et données confidentielles\nClients : Acme.\n## Langues\nFR\n## Cadre d'investissement\nDCA\n";
  const reduced = withoutSections(text, OPENCLAW_DROPPED_SECTIONS);
  assert.equal(/Acme|DCA|Clients|Cadre/.test(reduced), false);
  assert.ok(reduced.includes("## Positionnement\nBA") && reduced.includes("## Langues\nFR"));
  const root = scratch(t), out = path.join(scratch(t), "dist"), profile = path.join(root, "profil.md");
  writeFileSync(profile, text);
  skill(root, "money", { front: `name: money\ndescription: d\n${meta().replace("system", "finance")}` });
  skill(root, "career", { front: `name: career\ndescription: d\n${meta().replace('profil: "non"', 'profil: "oui"')}`, body: "Lire `profil.md`." });
  const result = packageSkills({ out, root, profile, openclaw: true });
  assert.deepEqual([result.packaged, result.skipped], [["career"], ["money"]]);
  assert.equal(/Acme|DCA/.test(readFileSync(path.join(out, "career", "profil.md"), "utf8")), false);
});

test("OpenClaw packages of the real registry never point to the full local profile", t => {
  const dir = scratch(t), profile = path.join(dir, "profil.md");
  writeFileSync(profile, "## Positionnement\nsynthetic\n");
  const result = packageSkills({ out: path.join(dir, "out"), profile, openclaw: true });
  assert.ok(result.packaged.includes("job-application-optimizer"));
  for (const name of result.packaged) {
    assert.equal(readFileSync(path.join(dir, "out", name, "SKILL.md"), "utf8").includes(".ivan-ai-os/profil.md"), false, name);
  }
  const full = packageSkills({ out: path.join(dir, "full"), profile });
  assert.ok(readFileSync(path.join(dir, "full", "job-application-optimizer", "SKILL.md"), "utf8").includes(".ivan-ai-os/profil.md"));
  assert.ok(full.packaged.includes("veille-investissements"));
});

test("runtime skill links (.claude, .agents) resolve and stay engineering/system only", () => {
  const repo = path.resolve(SKILLS_ROOT, "..");
  const entries = new Map(buildRegistry().results.map(r => [r.entry.name, r.entry]));
  for (const runtime of [".claude/skills", ".agents/skills"]) {
    const dir = path.join(repo, runtime);
    const links = readdirSync(dir);
    assert.ok(links.length >= 6, runtime);
    for (const name of links) {
      assert.ok(lstatSync(path.join(dir, name)).isSymbolicLink(), `${runtime}/${name}`);
      assert.equal(realpathSync(path.join(dir, name)), realpathSync(path.join(SKILLS_ROOT, name)), `${runtime}/${name}`);
      assert.ok(["engineering", "system"].includes(entries.get(name)?.manager), `${runtime}/${name}`);
      assert.equal(entries.get(name).profil, "non", `${runtime}/${name} must not need the private profile`);
    }
  }
});

test("priority skills carry trigger evaluations pointing at real skills", t => {
  const { results } = buildRegistry();
  const withEvals = results.filter(r => r.evals).map(r => r.entry.name).sort();
  assert.deepEqual(withEvals, ["dev-studio", "job-application-optimizer", "orchestrateur-ia", "rapport-telegram", "revue-croisee"]);
  const root = scratch(t);
  const dir = skill(root, "evald");
  writeFileSync(path.join(dir, "evals.json"), JSON.stringify({ skill: "evald", version: 1, positifs: ["only one positive prompt"], negatifs: [{ demande: "a near miss request", attendu: "evald" }], livrable: "" }));
  const { errors } = validateSkill(dir);
  for (const expected of [/3 positifs/, /2 negatifs/, /livrable required/]) assert.ok(errors.some(e => expected.test(e)), `${expected}: ${errors}`);
});
