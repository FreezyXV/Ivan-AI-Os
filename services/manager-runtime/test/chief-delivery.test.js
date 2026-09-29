import test from "node:test";
import assert from "node:assert/strict";
import { addChiefDeliveryGuidance, CHIEF_COMPLETION_GUIDANCE } from "../src/chief-delivery.js";

test("existing Secretary instructions remain byte-for-byte as the prefix", () => {
  const original = "# Synthetic Secretary\r\nPersonality and memory references.\nNo final newline";
  const proposed = addChiefDeliveryGuidance(original);
  assert.equal(proposed.slice(0, original.length), original);
  assert.equal(addChiefDeliveryGuidance(proposed), proposed);
  assert.ok(proposed.includes(CHIEF_COMPLETION_GUIDANCE));
});
test("modified or duplicated managed blocks cannot silently be overwritten", () => {
  const proposed = addChiefDeliveryGuidance("Synthetic");
  assert.throws(() => addChiefDeliveryGuidance(proposed + proposed), /CHIEF_DELIVERY_BLOCK_CHANGED/);
  assert.throws(() => addChiefDeliveryGuidance(proposed.replace("route source courante", "unknown recipient")), /CHIEF_DELIVERY_BLOCK_CHANGED/);
});
