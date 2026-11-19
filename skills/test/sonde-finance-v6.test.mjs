import test from "node:test";
import assert from "node:assert/strict";
import { rejouer } from "../rapport-telegram/scripts/sonde-finance-v6.mjs";

test("faithful French translations of the two refused Finance proofs pass renderBrief without a model", () => {
  const r = Object.fromEntries(rejouer());
  for (const ok of ["FRED, traduction fidèle", "Ansa, traduction fidèle 1", "Ansa, traduction fidèle 2"]) assert.equal(r[ok], "ACCEPTÉ", ok);
  assert.match(r["FRED, écart calculé en points de base"], /ALERT_FACT_UNSUPPORTED/, "derived numbers stay refused by design");
});
