# Workflow — Alertes éditoriales Telegram (System)

Owner éditorial : Claude (skill `rapport-telegram`, `docs/ALERT-EDITORIAL-CONTRACT.md`).
Runtime, planning et envoi : Codex (`services/alerts-runtime`, `ivan_alert_synthesize`).
Statut : contrat source ; parcours automatique pas encore vérifié de bout en bout (C10).

| # | Step | Who | Tokens |
|---|---|---|---|
| 1 | Collect Sentinelle / Secrétaire candidates; one shared SQLite queue; canonical URL dedupe | code | 0 |
| 2 | Read the page; excerpt ≤ 1200 (head or passages), `textChars`, dates, hash; unreadable → `review`, never summarised | code | 0 |
| 3 | Deterministic exclusions: paused/deferred topics, stale, future dates, injection patterns | code | 0 |
| 4 | **Jev gate** `alerts.pertinence.mac-v1`: keep / review / skip on public excerpt + fixed public context | Jev | cents |
| 5 | Brief for `keep` only: 1–3 facts by evidence index, utility, action, uncertainty | native isolated completion | ≤ 2 per pass |
| 6 | Code checks: exact quotes, numbers, lengths, mandatory limit on partial excerpts; failure → `review` | code | 0 |
| 7 | Delivery: silence / evening digest / immediate only for coded urgency; single receipt; no blind resend | code | 0 |
| 8 | Weekly sample scored on the 5-axis grid; independent corpus re-run after any contract or prompt change | Claude | premium, rare |

Never: summary from a title, private profile in context, transaction advice, third-party contact,
automatic action, two messages for one source, Career notification during the pause.

## Requests to Codex
See § 11 of the contract (A1–A8): passage excerpts and coverage, lossless digest, freshness by
source type, coded injection prefilter, public context v2, thousands separators, trailing-slash
dedupe, no urgency path until coded against a local inventory.
