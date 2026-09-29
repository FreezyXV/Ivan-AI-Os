import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildRequest, classify } from "../jev-decision/scripts/classify.mjs";
import { aggregate, eligible, gate, deficit } from "../encyclopedie-anakalypto/scripts/sujets.mjs";
import { cards, gate as publicationGate } from "../encyclopedie-anakalypto/scripts/porte_jev.mjs";

const VALIDATOR = fileURLToPath(new URL("../encyclopedie-anakalypto/scripts/valider_lot.py", import.meta.url));
const hasPython = spawnSync("python3", ["--version"]).status === 0;
function scratch(t) { const d = mkdtempSync(path.join(tmpdir(), "ivan-anakalypto-")); t.after(() => rmSync(d, { recursive: true, force: true })); return d; }
const words = n => Array.from({ length: n }, (_, i) => `mot${i}`).join(" ");
const card = (slug, { visuel = '{"type":"quiz","titre":"Testez-vous","donnees":[{"question":"a","choix":["x","y"],"bonne":0},{"question":"b","choix":["x","y"],"bonne":1},{"question":"c","choix":["x","y","z"],"bonne":2}]}', puces = 3, corps = 110 } = {}) =>
  `---\ntype: article\nslug: ${slug}\ntitre: Titre\ncategorie: energie\nresume: Une phrase.\naccroche: Saviez-vous que ?\n---\n## L'essentiel\n${Array.from({ length: puces }, (_, i) => `- idée ${i} ${words(5)}`).join("\n")}\n\n## En images\n\`\`\`anakalypto-visuel\n${visuel}\n\`\`\`\n\n## Pour aller plus loin\n${words(corps)}\n\n## Faits clés\n- 2020 : fait\n\n## Sources\n- A, t, https://a.example\n- B, t, https://b.example\n- C, t, https://c.example\n`;

test("Jev client refuses unknown questions, extra fields, long or secret inputs; 404 fails closed", async () => {
  assert.throws(() => buildRequest("inconnue", {}), /JEV_QUESTION_UNKNOWN/);
  assert.throws(() => buildRequest("sujet.captivant", { titre: "x", texte_prive: "y" }), /JEV_INPUT_FIELD_REFUSED_texte_prive/);
  assert.throws(() => buildRequest("sujet.captivant", { titre: "x".repeat(501) }), /JEV_INPUT_TOO_LONG_titre/);
  assert.throws(() => buildRequest("sujet.captivant", { titre: `Bearer ${"a".repeat(30)}` }), /JEV_INPUT_CREDENTIAL_REFUSED/);
  const ok = await classify("sujet.captivant", { titre: "Robert Schuman" }, { token: "t".repeat(40), fetchImpl: async () => ({ ok: true, status: 200, json: async () => ({ question: "sujet.captivant", decision: 0.8, confidence: 0.9, request_id: "r1" }) }) });
  assert.deepEqual([ok.decision, ok.request_id], [0.8, "r1"]);
  await assert.rejects(classify("sujet.captivant", { titre: "x" }, { token: "t".repeat(40), fetchImpl: async () => ({ ok: false, status: 404 }) }), /JEV_QUESTION_UNAVAILABLE/);
  await assert.rejects(classify("sujet.captivant", { titre: "x" }, { gatewayUrl: "http://example.com", token: "t".repeat(40) }), /JEV_GATEWAY_MUST_BE_LOOPBACK/);
});

test("topic discovery drops namespaces and lists, rewards sustained interest and skips covered topics", () => {
  for (const t of ["Wikipédia:Accueil_principal", "Spécial:Recherche", "Liste_de_sondages", "Cookie_(informatique)", "2026"]) assert.equal(eligible(t), false, t);
  const days = [[{ article: "Robert_Schuman", views: 1000 }, { article: "Pic", views: 5000 }], [{ article: "Robert_Schuman", views: 1000 }], [{ article: "Robert_Schuman", views: 1000 }, { article: "Metz", views: 900 }]];
  const ranked = aggregate(days, new Set(["metz"]));
  assert.deepEqual(ranked.map(t => [t.titre, t.jours]), [["Robert Schuman", 3], ["Pic", 1]]);
});

test("Jev gate is mandatory: retained topics carry two Jev decisions and follow domain deficit; outage fails closed", async () => {
  const candidates = [{ titre: "Pile de Volta", vues: 10, jours: 1, score: 50 }, { titre: "Marée", vues: 10, jours: 1, score: 60 }, { titre: "Potin", vues: 99, jours: 1, score: 99 }];
  const answers = { "Pile de Volta": ["sciences-fondamentales"], "Marée": ["geographie-territoires"] };
  const fake = async (q, input) => q === "sujet.captivant"
    ? { decision: input.titre === "Potin" ? 0.1 : 0.9, confidence: 0.9, request_id: `c-${input.titre}` }
    : { decision: answers[input.titre][0], confidence: 0.8, request_id: `d-${input.titre}` };
  const out = await gate(candidates, { classifyImpl: fake });
  assert.deepEqual(out.map(t => [t.titre, t.statut, t.domaine ?? null]), [["Marée", "retenu", "geographie-territoires"], ["Pile de Volta", "retenu", "sciences-fondamentales"], ["Potin", "ecarte_par_jev", null]]);
  assert.equal(out[0].priorite, deficit("geographie-territoires"));
  const down = await gate(candidates, { classifyImpl: async () => { const { JevError } = await import("../jev-decision/scripts/classify.mjs"); throw new JevError("JEV_QUESTION_UNAVAILABLE"); } });
  assert.ok(down.every(t => t.statut === "en_attente_jev"));
});

test("v2 validator: short visual card passes as draft, publication needs a Jev decision per card", t => {
  if (!hasPython) return t.skip("python3 unavailable");
  const d = scratch(t), lot = path.join(d, "lot-1.md");
  writeFileSync(lot, card("pile-volta") + card("maree", { visuel: '{"type":"timeline","titre":"Marées","donnees":[{"date":"1687","texte":"Newton"}]}' }));
  const run = (...a) => spawnSync("python3", [VALIDATOR, lot, ...a], { encoding: "utf8" });
  assert.equal(run("--brouillon").status, 0);
  const noJev = run();
  assert.equal(noJev.status, 1);
  assert.match(noJev.stdout, /lot non publiable sans décision Jev/);
  writeFileSync(path.join(d, "lot-1.jev.json"), JSON.stringify({ "pile-volta": { "publication.prete": { decision: 0.9, request_id: "r1" } }, "maree": { "publication.prete": { decision: 0.4, request_id: "r2" } } }));
  assert.match(run().stdout, /maree: Jev juge la fiche non prête/);
  const bad = path.join(d, "lot-2.md");
  writeFileSync(bad, card("x", { visuel: '{"type":"quiz","titre":"q","donnees":[{"question":"a","choix":["x"],"bonne":3}]}', puces: 7, corps: 600 }));
  const out = spawnSync("python3", [VALIDATOR, bad, "--brouillon"], { encoding: "utf8" }).stdout;
  for (const e of ["quiz invalide", "7 puces", "mots hors visuel", "Pour aller plus loin > 120 mots"]) assert.ok(out.includes(e), e);
});

test("a comparison visual needs numbers, not prose values", () => {
  // Found live on 2026-09-29: a comparateur with "moins de 3" as a value could not be drawn, and Jev scored the card below 0.7.
  const d = mkdtempSync(path.join(tmpdir(), "anak-"));
  const lot = path.join(d, "lot.md");
  writeFileSync(lot, card("x", { visuel: '{"type":"comparateur","titre":"t","donnees":[{"etiquette":"avant","valeur":18.3},{"etiquette":"après","valeur":"moins de 3"}]}' }));
  const out = spawnSync("python3", [VALIDATOR, lot, "--brouillon"], { encoding: "utf8" }).stdout;
  assert.match(out, /valeur non numérique/);
});

test("publication gate requires confirmed claims and writes Jev decisions only when every call succeeds", async t => {
  const d = scratch(t), lot = path.join(d, "lot-1.md");
  writeFileSync(lot, card("pile-volta"));
  assert.deepEqual(cards(readFileSync(lot, "utf8")).map(c => [c.slug, c.visuel]), [["pile-volta", "quiz"]]);
  await assert.rejects(publicationGate(lot, { draftCheck: () => true }), /CLAIMS_LEDGER_REQUIRED/);
  const src = [{ id: "a", url: "https://www.insee.fr/x", titre: "a" }, { id: "b", url: "https://fr.wikipedia.org/wiki/x", titre: "b" }];
  writeFileSync(path.join(d, "lot-1.claims.json"), JSON.stringify({ version: 1, sujet: "x", sources: src, affirmations: [{ id: "c", type: "date", texte: "1800", preuves: [{ source: "a" }, { source: "b" }] }] }));
  await assert.rejects(publicationGate(lot, { draftCheck: () => true, classifyImpl: async () => { throw new Error("JEV_UNAVAILABLE"); } }), /JEV_UNAVAILABLE/);
  assert.equal(existsSync(path.join(d, "lot-1.jev.json")), false, "nothing written when Jev fails");
  const r = await publicationGate(lot, { draftCheck: () => true, classifyImpl: async () => ({ decision: 0.85, confidence: 0.9, request_id: "rq" }) });
  assert.deepEqual([r.fiches, r.pretes], [1, 1]);
});

import { commercial, decode, fetchFeeds, parseFeed } from "../encyclopedie-anakalypto/scripts/flux.mjs";

test("science feeds: RSS and Atom parsed, entities decoded, deals and duplicates dropped, outages tolerated", async () => {
  const rss = `<rss><channel><item><title><![CDATA[Le volcan &amp; sa lumière bleue]]></title><link>https://a.example/volcan</link><pubDate>Mon, 28 Sep 2026 10:00:00 GMT</pubDate></item>
    <item><title>Friteuse : le prix s'effondre sur Amazon</title><link>https://a.example/deal</link><pubDate>Mon, 28 Sep 2026 10:00:00 GMT</pubDate></item></channel></rss>`;
  const atom = `<feed><entry><title>Le volcan &amp; sa lumière bleue</title><link href="https://b.example/v"/><updated>2026-09-27T00:00:00Z</updated></entry>
    <entry><title>Pile de Volta : 1800</title><link href="https://b.example/volta"/><updated>2026-09-26T00:00:00Z</updated></entry></feed>`;
  assert.deepEqual(parseFeed(rss)[0], { titre: "Le volcan & sa lumière bleue", url: "https://a.example/volcan", date: "2026-09-28" });
  assert.equal(parseFeed(atom)[1].url, "https://b.example/volta");
  assert.equal(decode("&#233;t&#xE9;"), "été");
  assert.equal(commercial("AliExpress : -40 % sur la trottinette"), true);
  assert.equal(commercial("La pile de Volta a 226 ans"), false);
  const bodies = { "https://r.example": rss, "https://a.example": atom };
  const fetchImpl = async url => url === "https://down.example" ? { ok: false, status: 503 } : { ok: true, text: async () => bodies[url] };
  const { candidats, erreurs } = await fetchFeeds({ fetchImpl, today: new Date("2026-09-29T00:00:00Z"),
    sources: [{ id: "r", url: "https://r.example", langue: "fr" }, { id: "a", url: "https://a.example", langue: "fr" }, { id: "down", url: "https://down.example", langue: "fr" }] });
  assert.deepEqual(candidats.map(c => c.titre), ["Le volcan & sa lumière bleue", "Pile de Volta : 1800"]);
  assert.deepEqual(erreurs, [{ source: "down", code: "HTTP_503" }]);
});
