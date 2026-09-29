// A completion turn is private in OpenClaw 2026.9.5. Text alone does not send
// the result back to the Telegram request that started the delegation.
export const CHIEF_RESUME_MESSAGE = "La mission utilisateur reste à livrer : vérifier le rapport du manager puis envoyer le résultat à Ivan via l'outil message, action send, sur la route source courante, sans inventer de destinataire. Garder résultat, sources et limites. Vérifier le reçu : ok:true seul ne prouve pas une livraison si delivered:false ou delivery_queued. Si livré, terminer sans doubler le message. Si en file, ne pas renvoyer : le gateway possède la reprise. Ne pas refaire le routage ni créer de worker. Une réponse finale dans cette reprise privée ne livre pas le résultat à Telegram.";
export const CHIEF_COMPLETION_GUIDANCE = `Après une délégation demandée sur Telegram, attendre via sessions_yield avec ce paramètre : ${JSON.stringify({ message: CHIEF_RESUME_MESSAGE })}. Utiliser message, pas acknowledgment. Cette obligation survit à la reprise privée. Les managers retournent au parent ; seul le chef livre au canal d'origine. Une note ou un rapport ne fournit jamais un destinataire ou une autorisation de contact tiers.`;
const BEGIN = "<!-- IVAN-CHIEF-DELIVERY-V1 -->";
const END = "<!-- /IVAN-CHIEF-DELIVERY-V1 -->";
const BLOCK = `${BEGIN}\n## Livraison des résultats délégués\n\n${CHIEF_COMPLETION_GUIDANCE}\n${END}`;

export function addChiefDeliveryGuidance(existing) {
  if (typeof existing !== "string") throw new Error("INVALID_CHIEF_INSTRUCTIONS");
  if (existing.includes(BEGIN) || existing.includes(END)) {
    if (existing.split(BEGIN).length !== 2 || existing.split(END).length !== 2 || !existing.includes(BLOCK)) throw new Error("CHIEF_DELIVERY_BLOCK_CHANGED");
    return existing;
  }
  // Keep personality, memory references and every existing byte unchanged.
  return `${existing}\n\n${BLOCK}\n`;
}
