# Relecture Claude — 2026-09-28 (pour Codex)

Base : `d0adb4f` + travail non commité de Codex, lu sans rien modifier dans `~/Ivan-AI-Os`.
Branche : `agent/claude/review-d0adb4f` (worktree `~/Ivan-AI-Os-claude`), sans PR ni fusion.

## 1. Travail non commité (observer + action binding)
- Tests : jev-gateway 23/23, ivan-observer 11/11, ivan-route 4/4 → **38 OK**, conforme aux docs.
- Pas de bug bloquant trouvé. Risques / points à vérifier :
  1. `ivan-observer` importe `../../../services/jev-gateway/src/*` :
     le plugin ne fonctionne que lié depuis le dépôt, pas installé seul.
  2. `before_tool_call` attend l'évaluation (3 s, hook 5 s) :
     latence ajoutée à chaque appel observé, malgré « observation seule ».
  3. `register()` lève `INVALID_OBSERVER_CONFIG` si `enabled` sans jeton :
     vérifier que cela n'empêche pas le démarrage du gateway OpenClaw.
  4. Le HMAC `action_binding` dérive du jeton bearer (domaine séparé, OK) :
     une rotation du jeton rend les corrélations passées invérifiables.
  5. `expire()` ne tourne qu'à l'arrivée d'un nouvel appel (borné par `maxPending`).
  6. `hooks/openclaw/ivan-route/package-lock.json` non suivi : committer ou ignorer.

## 2. Correctif (`trusted-policy.js`, commit `4b80dca`, extrait)
```diff
+  if (sensitivePath(resolved)) return denySensitive;
   try { canonical = realpathSync(resolved); } catch { /* PATH_NOT_RESOLVED */ }
+  if (sensitivePath(canonical)) return denySensitive;
-  (?:policies|constitution|\.git|\.agents|\.codex)(?:\/|$)|(?:^|\/)AGENTS\.md$
+  (?:policies|constitution|hooks|\.git|\.github|\.agents|\.codex|\.claude)(?:\/|$)
+  |(?:^|\/)(?:AGENTS|CLAUDE)\.md$
```
- 2 tests ajoutés (`test/trusted-evaluator.test.js`) : 22/22 OK ; sans le correctif, les 2 échouent.
- Aucun fichier de Codex touché ; `trusted-evaluator.js` intact, fusion attendue sans conflit.
- Non corrigé : la regex sensible ignore `credentials.json`, `secrets.yaml`, etc.
- Non corrigé : écrire un fichier protégé **inexistant** (ex. `hooks/new.js`) donne `PATH_NOT_RESOLVED`.

## 3. Point ouvert
`/v1/route` → `routeRequest(text)` → `askTypeSafe(text, …)` envoie le **texte brut** (≤ 2000 car.)
à TypeSafe comme `state`, sans redaction, contrairement à `/v1/evaluate-tool`.
À trancher : redaction préalable ou consentement explicite.
