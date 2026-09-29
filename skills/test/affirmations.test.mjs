import test from "node:test";
import assert from "node:assert/strict";
import { facts, summary, tier, verify, visuals } from "../verification-affirmations/scripts/affirmations.mjs";

const sources = [
  { id: "insee", url: "https://www.insee.fr/fr/statistiques/1", titre: "Population", auteur: "INSEE" },
  { id: "wiki", url: "https://fr.wikipedia.org/wiki/France", titre: "France" },
  { id: "blog", url: "https://mon-blog.example/france", titre: "Chiffres France" },
  { id: "blog2", url: "https://autre-site.example/fr", titre: "France en bref" }
];
const ledger = claims => ({ version: 1, sujet: "france", sources, affirmations: claims });

test("reliability tiers come from the domain", () => {
  assert.deepEqual([tier("https://www.insee.fr/x"), tier("https://ec.europa.eu/eurostat"), tier("https://fr.wikipedia.org/wiki/X"), tier("https://blog.example/x")], ["A", "A", "B", "C"]);
  assert.throws(() => tier("not a url"), /SOURCE_URL_INVALID/);
});

test("numbers and dates need two independent domains including a reliable one; divergence contests", () => {
  const r = verify(ledger([
    { id: "pop", type: "chiffre", texte: "68,4 millions d'habitants (2024)", preuves: [{ source: "insee", valeur: 68.4 }, { source: "wiki", valeur: 68.4 }] },
    { id: "pop1", type: "chiffre", texte: "68 millions", preuves: [{ source: "insee" }] },
    { id: "blogs", type: "date", texte: "fondée en 843", preuves: [{ source: "blog" }, { source: "blog2" }] },
    { id: "div", type: "chiffre", texte: "superficie", preuves: [{ source: "insee", valeur: 551695 }, { source: "wiki", valeur: 643801 }] },
    { id: "def", type: "definition", texte: "république", preuves: [{ source: "wiki" }] },
    { id: "ctx", type: "contexte", texte: "pays touristique", preuves: [{ source: "blog" }] }
  ]));
  assert.deepEqual(r.map(x => [x.id, x.statut]), [["pop", "confirme"], ["pop1", "a_verifier"], ["blogs", "a_verifier"], ["div", "conteste"], ["def", "confirme"], ["ctx", "a_verifier"]]);
  assert.deepEqual(summary(r), { total: 6, confirmees: 2, a_verifier: 3, contestees: 1, publiable: false });
});

test("only confirmed claims and their sources reach the article", () => {
  const md = facts(ledger([
    { id: "pop", type: "chiffre", texte: "68,4 millions d'habitants (2024)", preuves: [{ source: "insee" }, { source: "wiki" }] },
    { id: "faux", type: "chiffre", texte: "rumeur non sourcée", preuves: [{ source: "blog" }] }
  ]));
  assert.match(md, /68,4 millions/);
  assert.doesNotMatch(md, /rumeur/);
  assert.match(md, /- INSEE, Population, https:\/\/www\.insee\.fr/);
  assert.doesNotMatch(md, /mon-blog/);
});

test("visual router follows the verified structure", () => {
  const confirmed = (id, type, extra = {}) => ({ id, type, texte: id, preuves: [{ source: "insee" }, { source: "wiki" }], ...extra });
  const timeline = visuals(ledger(["a", "b", "c", "d", "e"].map(id => confirmed(id, "date"))));
  assert.equal(timeline[0].format, "timeline");
  const chart = visuals(ledger(["1", "2", "3"].map(id => confirmed(id, "chiffre", { serie: "population" }))));
  assert.equal(chart[0].format, "chart");
  assert.equal(visuals(ledger([confirmed("x", "definition")]))[0].format, "illustration");
  assert.throws(() => verify(ledger([{ id: "x", type: "chiffre", texte: "t", preuves: [{ source: "absente" }] }])), /SOURCE_INCONNUE_x_absente/);
});
