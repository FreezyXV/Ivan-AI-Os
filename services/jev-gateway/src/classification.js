import { askTypeSafe, ProviderError } from "./provider.js";

// This is the gateway-owned registry. The client-side list is checked against it
// in tests; caller-supplied questions, criteria and model instructions are ignored.
const domains = [
  "alimentation-nutrition", "arts-culture", "automobile", "aeronautique",
  "communication-medias", "corps-humain-sante", "droit-justice",
  "environnement-climat", "espace-astronomie", "geographie-territoires",
  "industries", "intelligence-artificielle", "micro-informatique-informatique",
  "sciences-vivant-appliquees", "sciences-fondamentales",
  "sciences-humaines-sociales", "sport-sciences-mouvement",
  "technologies-ingenierie", "energie"
];

const yesNo = (instructions, positive, negative) => ({
  type: "noul", instructions, criteria: { true: positive, false: negative }
});
const choice = (instructions, criteria) => ({ type: "choice", instructions, criteria });

export const QUESTIONS = Object.freeze({
  "sujet.captivant": {
    fields: ["titre", "langue", "vues", "jours"], required: ["titre"],
    prompt: yesNo("Judge whether this public topic merits a short, durable educational article. Pageviews indicate interest, not factual quality. Do not reward a one-day spike by itself.",
      "Broad, lasting curiosity and a concrete learning angle.", "Transient, promotional or too narrow for an educational article.")
  },
  "sujet.domaine": {
    fields: ["titre", "langue", "domaines"], required: ["titre", "domaines"],
    prompt: choice("Choose exactly one subject domain for this public topic from the fixed catalogue. Use the title only; do not infer personal context.",
      Object.fromEntries(domains.map(domain => [domain, `The topic primarily belongs to ${domain}.`])))
  },
  "source.fiable": {
    fields: ["domaine", "titre", "extrait", "type_affirmation"], required: ["titre", "extrait"],
    prompt: choice("Assess whether the supplied public source excerpt supports the claim type. A plausible title alone is not verification.", {
      fiable: "Primary or authoritative source with relevant evidence.",
      incertaine: "Source or excerpt is incomplete; independent corroboration is needed.",
      non_fiable: "Promotional, unrelated or contradicted source."
    })
  },
  "publication.prete": {
    fields: ["slug", "resume_verification", "mots", "visuel", "validateur"], required: ["slug", "resume_verification", "validateur"],
    prompt: yesNo("Judge publication readiness from the public verification summary and format result only. Do not treat a claim as verified merely because a validator ran.",
      "All material claims are verified and the short article format is complete.",
      "Missing verification, incomplete format or unresolved material uncertainty.")
  },
  "signal.pertinent": {
    fields: ["titre", "extrait", "type"], required: ["titre", "extrait"],
    prompt: yesNo("Is this public signal worth investigating as a concrete business opportunity? Distinguish a customer problem from a generic trend.",
      "Concrete recurring problem or credible demand signal.", "Noise, promotion or no actionable customer need.")
  },
  "preuve.suffisante": {
    fields: ["critere", "note", "titre", "extrait"], required: ["critere", "extrait"],
    prompt: choice("Judge whether the public evidence excerpt supports the named criterion; do not invent missing evidence.", {
      suffisante: "Direct evidence supports the criterion.",
      incertaine: "Relevant but incomplete or ambiguous evidence.",
      insuffisante: "No relevant support for the criterion."
    })
  },
  "alerte.importante": {
    fields: ["indicateur", "ancien", "nouveau", "seuil"], required: ["indicateur", "ancien", "nouveau", "seuil"],
    prompt: yesNo("Determine if this public market-indicator change merits a concise informational alert. Do not recommend a transaction.",
      "Meaningful threshold crossing with decision relevance.", "Routine fluctuation or insufficient context for an alert.")
  },
  "memoire.contradiction": {
    fields: ["titre_a", "titre_b", "valeurs_a", "valeurs_b"], required: ["titre_a", "titre_b", "valeurs_a", "valeurs_b"],
    prompt: yesNo("Do the two short public or non-sensitive factual summaries materially contradict one another? Different dates or scopes are not automatically contradictions.",
      "Same claim and scope with incompatible values.", "Compatible statements or insufficient evidence of contradiction.")
  },
  "tache.categorie": {
    fields: ["titre", "extensions"], required: ["titre"],
    // Technical categories used by the engineering factory to pick a builder
    // (skills/usine-logicielle); manager routing already exists via /v1/route.
    prompt: choice("Choose the technical category of this public software task from its title and file-extension metadata only.", {
      frontend: "User interface, styling or client-side behaviour.", backend: "Server logic, APIs or data processing.",
      securite: "Authentication, secrets, permissions or hardening.", infra: "Deployment, services, runtime or operating system configuration.",
      integration: "Connecting two systems, plugins, hooks or adapters.", tests: "Test suites, fixtures or calibration corpora.",
      outillage: "Developer tooling, scripts, packaging or validators.", architecture: "Structure, contracts or cross-cutting design decisions.",
      debug: "Diagnosing and fixing a reported defect.", docs: "Documentation, READMEs or handoff notes.",
      data: "Datasets, schemas, migrations or data quality."
    })
  },
  "constat.severite": {
    fields: ["resume", "type_preuve"], required: ["resume", "type_preuve"],
    prompt: choice("Classify the severity of this public, content-free software review finding. Do not assume a vulnerability without a reproducer.", {
      critique: "Immediate loss or unauthorized action with direct evidence.",
      majeur: "Material correctness or security failure with convincing evidence.",
      mineur: "Limited impact or narrow defect.",
      information: "Observation without a demonstrated defect."
    })
  }
});

const CREDENTIALS = /\b(?:sk|pk|rk)-[A-Za-z0-9_-]{16,}|\bgh[pousr]_[A-Za-z0-9]{20,}|\bapikey_[A-Za-z0-9_]{20,}|\bBearer\s+\S{20,}|-----BEGIN [A-Z ]*PRIVATE KEY-----/i;
const CONTACT = /[\w.+-]+@[\w.-]+\.[a-z]{2,}|\+\d[\d .()-]{8,}\d|\b0[1-9](?:[ .-]?\d{2}){4}\b/i;
const NUMERIC_FIELDS = new Set(["vues", "jours", "mots", "ancien", "nouveau", "seuil", "note"]);

export class ClassificationInputError extends Error {
  constructor(code, status = 400) { super(code); this.code = code; this.status = status; }
}

export function validateClassification(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload) ||
      Object.keys(payload).sort().join() !== "input,question") throw new ClassificationInputError("INVALID_CLASSIFICATION_REQUEST");
  const { question, input } = payload;
  if (typeof question !== "string" || !Object.hasOwn(QUESTIONS, question)) throw new ClassificationInputError("QUESTION_UNKNOWN", 404);
  const spec = QUESTIONS[question];
  if (!input || typeof input !== "object" || Array.isArray(input) ||
      Object.keys(input).some(key => !spec.fields.includes(key)) ||
      spec.required.some(key => !Object.hasOwn(input, key))) throw new ClassificationInputError("INVALID_CLASSIFICATION_INPUT");
  for (const [key, value] of Object.entries(input)) {
    if (NUMERIC_FIELDS.has(key) ?
      !(typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 1_000_000) :
      !(typeof value === "string" && value.length > 0 && value.length <= 500 &&
        !CREDENTIALS.test(value) && !CONTACT.test(value))) throw new ClassificationInputError("INVALID_CLASSIFICATION_INPUT");
    if (key === "domaines" && value !== domains.join(",")) throw new ClassificationInputError("INVALID_CLASSIFICATION_INPUT");
  }
  return { question, input, spec };
}

export async function classifyRequest(payload, { budget, fetchImpl } = {}) {
  const { question, input, spec } = validateClassification(payload);
  if ((process.env.JEV_PROVIDER || "mock") !== "jev") throw new ProviderError("JEV_UNAVAILABLE");
  const raw = await askTypeSafe(input, { classification: spec.prompt }, { budget, fetchImpl });
  const answer = raw?.answers?.classification;
  if (!answer || answer.type !== spec.prompt.type) throw new ProviderError("TYPESAFE_CLASSIFICATION_RESPONSE_INVALID");
  const decision = answer.type === "noul" ? answer.noul : answer.choice;
  if (answer.type === "noul" ? !Number.isFinite(decision) || decision < 0 || decision > 1 :
      !Object.hasOwn(spec.prompt.criteria, decision)) throw new ProviderError("TYPESAFE_CLASSIFICATION_RESPONSE_INVALID");
  // TypeSafe's NoulAnswer carries only `noul`, unlike ChoiceAnswer. Express
  // certainty as distance from an even yes/no split for the common client API.
  const confidence = answer.type === "noul" ? Math.abs(2 * decision - 1) : answer.confidence;
  if (!Number.isFinite(confidence) || confidence < 0 || confidence > 1) throw new ProviderError("TYPESAFE_CLASSIFICATION_RESPONSE_INVALID");
  return { question, decision, confidence, provider: "jev" };
}
