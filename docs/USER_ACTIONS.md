## État courant — 9 octobre 2026

Le parcours dossier Obsidian → Telegram → choix explicite Ivan → nouvelle fiche
est observé pour 6ab5272ce301. Ivan choisit tester, avec recherche publique de
témoignages indépendants avant toute offre ; reçu dans Codex, pas dans Telegram.
Les commandes natives /opportunite et /decision sont activées, mais leur entrée
Telegram réelle reste à vérifier. Voir OPPORTUNITY-DECISION-LOOP.md et le relais.
Career demeure en pause : la mention career matching du cadrage général
ci-dessous ne constitue pas une demande de réactivation. Aucun VPS à provisionner.

## Historique — 5 octobre 2026

Le pilote Mac est actif ; aucune nouvelle clé ou reprovisionnement n'est requis
pour poursuivre les tâches présentes. Voir SESSION_HANDOFF.md pour les versions
vérifiées et CLAUDE-NEXT-ACTIONS-2026-10-05.md pour le travail parallèle.
Career est en pause, OVH différé, Knowledge/Anakalypto finalisé en dernier.
Les demandes de provisionnement ci-dessous sont historiques ; ne pas les rejouer.

# Human inputs and confirmed decisions

## Decision confirmed on 2026-10-08 — local-first pilot

For the first months, Ivan will run Ivan AI OS on his Mac, using ChatGPT, Cowork, Codex, Claude, OpenClaw and the local Obsidian vault. Jev remains available where it measurably improves classification, selection or review; it is not a mandatory call for every routine task. No OVH, IONOS or other VPS is to be provisioned for this pilot. Preserve the working local Jev and memory integrations; this decision does not revoke their existing bounded use.

Prioritize a few complete local workflows: evidence-backed opportunity briefs, career matching, finance information, and an Obsidian decision record with Telegram delivery. Observe usefulness, false positives, time and token/API costs before adding more agents or services. Jobs that rely on the Mac will stop or defer when it is off; a future 24/7 VPS requires a separate decision and purchase by Ivan. The approval boundary for payments, transactions, external contact and publication still applies.


Confirmed on 2026-09-28:
- Ivan has a TypeSafe/Jev API key. The Mac smoke test succeeded on 2026-09-28 (HTTP 200; Jev returned `ROUTED` for a synthetic engineering request). The script takes the key through a hidden prompt and does not persist it; no always-on runtime is configured yet.
- OpenClaw 2026.9.5 (commit ec9c1a13) runs as a Mac LaunchAgent, with a local Gateway and a Telegram channel. The effective default model was verified locally: `openai/gpt-5.6-terra`, fallback `openai/gpt-5.6-sol`.
- The Telegram channel is routed to the `main` agent; private DMs use an allowlist. Host `exec` was ultimately denied at the tool level. Do not assume a plugin can run shell commands on the Mac.
- The linked `ivan-ai-os-route` plugin was installed on the Mac and inspected with `Status: loaded` and `Tools: ivan_route`; OpenClaw reported its deferred state migration completed. A direct OpenClaw Gateway `tools.invoke` call with `--timeout 45000` returned `ok: true`, `source: plugin`, and a live Jev engineering route. A real Telegram DM also succeeded at 19:26 UTC with explicit dynamic-tool discovery; the actual tool result contains `provider: jev`. See `docs/TELEGRAM-VERIFICATION.md`.
- Obsidian vault name: `Obsidian Notes` (filesystem path and sync arrangement unknown).
- A 24/7 VPS around €10–15/month is acceptable in principle. Provider, exact plan and any purchase remain to be selected/approved.

## Next inputs

1. Telegram verification is complete. An inactive native observer and authenticated shadow evaluator now correlate captured calls. The follow-up review branch has 43 passing tests, plus isolated checks against the installed hook runner and native loader. A live pilot still needs private secret provisioning and replacement of the previously exposed credentials; exact-action approvals remain unimplemented. See `docs/TRUSTED-EVALUATION.md`, `hooks/openclaw/ivan-observer/README.md` and `docs/RESPONSE-TO-CLAUDE-2026-09-29.md`. The latter contains concrete, unapplied shared-policy proposals and two options for each pending Ivan decision; source work need not stop while those are reviewed.
2. Model, tools policy, plugin registration and channel connection were inspected locally. No config dump is needed; avoid sharing channel credentials or raw sessions.
3. Provide the local path to the `Obsidian Notes` vault when we connect it. The name is enough for current planning.
4. VPS purchase and billing stay with Ivan. Prepare a specific deployment proposal before purchase.

## Existing credential exposure

A Telegram bot credential appeared in the shared terminal transcript and a Gateway credential was visible in a screenshot. Replace both before connecting the AI OS to additional tools or exposing the Gateway. Do not copy either credential into this repository.

## Approval boundary

Research, source changes and drafts can proceed. Ivan approves purchases, payments, transactions and third-party contact.

## Decisions confirmed on 2026-09-29

Ivan chose enumerated routing metadata, a 10 EUR/month Jev budget without a 500-call ceiling,
and coordinated activation after provisioning. Local accounting is an estimate, not an invoice cap.
OpenClaw skill packages exclude clients and personal investments; the public career mission remains
as chosen in option A. The full private profile stays outside Git and is reserved for Claude.
The complete virtual enterprise remains the target: chief of staff, six managers and ephemeral
workers. Source contracts and seven definitions must be followed by observed runtime dispatch.

Ivan subsequently chose Finance on both Claude and OpenClaw: public macro, information and
opportunities on Telegram; personal assets and objectives remain in Claude. Seven private
workspaces are prepared and their native configuration validated, not activated. Cross-reviews
are complete for PR #2/#3/#4/#5; their reserved merge GO and coordinated activation remain pending.
