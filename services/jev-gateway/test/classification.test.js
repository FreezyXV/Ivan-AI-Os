import test from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import { createGatewayServer } from "../src/server.js";
import { createTrustedEvaluator } from "../src/trusted-evaluator.js";
import { classifyRequest, QUESTIONS, validateClassification, ClassificationInputError } from "../src/classification.js";
import { PRICED_MODEL } from "../src/budget.js";
import { testBudget } from "./helpers.js";
import { QUESTIONS as CLIENT_QUESTIONS, classify as classifyClient } from "../../../skills/jev-decision/scripts/classify.mjs";

const token = "synthetic-classification-token-for-tests-only";
const topic = { question: "sujet.captivant", input: { titre: "Robert Schuman", langue: "fr", vues: 1200, jours: 3 } };

test("gateway registry matches all registered client questions and refuses unknown or private inputs", () => {
  assert.deepEqual(Object.keys(QUESTIONS).sort(), Object.keys(CLIENT_QUESTIONS).sort());
  for (const [id, spec] of Object.entries(QUESTIONS)) assert.deepEqual(spec.fields, CLIENT_QUESTIONS[id].fields);
  assert.equal(Object.keys(QUESTIONS).length, 10);
  for (const input of [
    { ...topic.input, texte_prive: "no" }, { ...topic.input, titre: "x".repeat(501) },
    { ...topic.input, titre: "contact@example.org" }, { ...topic.input, titre: `Bearer ${"x".repeat(30)}` },
    { ...topic.input, titre: `apikey_${"x".repeat(30)}` },
    { ...topic.input, vues: "1200" }, { langue: "fr" }
  ]) assert.throws(() => validateClassification({ question: topic.question, input }), ClassificationInputError);
  assert.equal(validateClassification(topic).question, topic.question);
  assert.equal(validateClassification({ question: topic.question, input: { titre: "COP 2026-09-29" } }).question, topic.question);
  assert.throws(() => validateClassification({ question: "question.hors_catalogue", input: {} }), { status: 404 });
  const domains = Object.keys(QUESTIONS["sujet.domaine"].prompt.criteria).join(",");
  assert.equal(validateClassification({ question: "sujet.domaine", input: { titre: "Pile Volta", langue: "fr", domaines: domains } }).question, "sujet.domaine");
  assert.throws(() => validateClassification({ question: "sujet.domaine", input: { titre: "Pile Volta", domaines: "system" } }), ClassificationInputError);
});

test("registered classification uses Jev and the same durable budget; malformed answers fail closed", async t => {
  const saved = { provider: process.env.JEV_PROVIDER, key: process.env.TYPESAFE_API_KEY, model: process.env.JEV_MODEL };
  Object.assign(process.env, { JEV_PROVIDER: "jev", TYPESAFE_API_KEY: "synthetic-classification-key", JEV_MODEL: PRICED_MODEL });
  t.after(() => {
    for (const [name, value] of [["JEV_PROVIDER", saved.provider], ["TYPESAFE_API_KEY", saved.key], ["JEV_MODEL", saved.model]]) {
      if (value === undefined) delete process.env[name]; else process.env[name] = value;
    }
  });
  const { budget } = testBudget(t);
  const outbound = [];
  const fetchImpl = async (_url, options) => {
    outbound.push(JSON.parse(options.body));
    return { ok: true, json: async () => ({ model: PRICED_MODEL, usage: { input_tokens: 200 },
      answers: { classification: { type: "noul", noul: 0.83 } } }) };
  };
  const classified = await classifyRequest(topic, { budget, fetchImpl });
  assert.equal(classified.question, "sujet.captivant");
  assert.equal(classified.decision, 0.83);
  assert.ok(Math.abs(classified.confidence - 0.66) < 1e-12);
  assert.equal(classified.provider, "jev");
  assert.equal(outbound.length, 1);
  assert.deepEqual(Object.keys(outbound[0].questions), ["classification"]);
  assert.deepEqual(outbound[0].state, topic.input);
  assert.equal(budget.status().calls, 1);
  await assert.rejects(classifyRequest(topic, { budget, fetchImpl: async () => ({ ok: true, json: async () => ({
    model: PRICED_MODEL, usage: { input_tokens: 200 }, answers: { classification: { type: "noul", noul: 2, confidence: 0.9 } }
  }) }) }), /TYPESAFE_CLASSIFICATION_RESPONSE_INVALID/);
  const selected = await classifyRequest({ question: "constat.severite", input: { resume: "Une fonction renvoie un code erroné", type_preuve: "test reproductible" } },
    { budget, fetchImpl: async () => ({ ok: true, json: async () => ({ model: PRICED_MODEL, usage: { input_tokens: 200 },
      answers: { classification: { type: "choice", choice: "majeur", confidence: 0.86 } } }) }) });
  assert.equal(selected.decision, "majeur");
  assert.equal(budget.status().calls, 3);
});

test("HTTP client authenticates before parsing, journals metadata only and returns client contract", async t => {
  const saved = process.env.JEV_PROVIDER;
  process.env.JEV_PROVIDER = "jev";
  t.after(() => { if (saved === undefined) delete process.env.JEV_PROVIDER; else process.env.JEV_PROVIDER = saved; });
  const audit = [];
  const trustedEvaluator = createTrustedEvaluator({ token, audit: event => audit.push(event) });
  const server = createGatewayServer({ trustedEvaluator, classify: async payload => {
    validateClassification(payload);
    return { question: payload.question, decision: 0.8, confidence: 0.9, provider: "jev" };
  } });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  t.after(() => new Promise(resolve => server.close(resolve)));
  const gatewayUrl = `http://127.0.0.1:${server.address().port}`;
  const headers = { authorization: `Bearer ${token}`, "content-type": "application/json" };
  const post = body => fetch(`${gatewayUrl}/v1/classify`, { method: "POST", headers, body: JSON.stringify(body) });
  assert.equal((await fetch(`${gatewayUrl}/v1/classify`, { method: "POST", body: "{bad" })).status, 401);
  assert.equal(audit.length, 0);
  assert.equal((await post({ question: "unknown", input: {} })).status, 404);
  assert.equal((await post({ ...topic, input: { titre: "contact@example.org" } })).status, 400);
  const result = await classifyClient(topic.question, topic.input, { gatewayUrl, token });
  assert.equal(result.decision, 0.8);
  assert.equal(result.provider, "jev");
  assert.match(result.request_id, /^[a-f\d-]{36}$/);
  assert.equal(audit.length, 3);
  assert.equal(audit[2].question, topic.question);
  assert.equal(JSON.stringify(audit).includes(topic.input.titre), false);
  assert.equal(JSON.stringify(audit).includes("contact@example.org"), false);
});
