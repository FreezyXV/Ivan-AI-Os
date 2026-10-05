# Adaptateur natif Codex

CLI local vérifié : 0.160.0, `features list` → `hooks stable true`.
Son schéma app-server inclut `hooks/list` et `PreToolUse`.
[Contrat officiel](https://learn.chatgpt.com/docs/hooks) consulté le 5 octobre 2026.

`pre-tool-use.mjs` traduit Bash et les en-têtes `apply_patch` vers la copie
**relue et épinglée** du hook Claude ; les règles ne sont pas recopiées.
Il ne transmet pas le contenu du patch au gateway. Il préserve les refus codés.
Mode par défaut : shadow. `IVAN_CODEX_HOOK_MODE=gate` reprend le gate partagé.
Codex ne supporte pas encore `permissionDecision: ask` dans PreToolUse :
l'adaptateur produit un refus explicite pour ce cas, jamais une fausse autorisation.
Une validation humaine reste à traiter par le mécanisme natif et une intégration
future liée à l'action exacte ; le hook ne prétend pas fournir ce mécanisme.

Exemple à préparer dans `.codex/hooks.json`, depuis une release immuable :

```json
{"hooks":{"PreToolUse":[{"matcher":"^(Bash|apply_patch)$","hooks":[{
"type":"command","command":"node /chemin/release/hooks/codex/pre-tool-use.mjs /chemin/claude-hook/277588c/hooks/claude/pre-tool-use.mjs","timeout":5
}]}]}}
```

Ce fichier n'est **pas installé** par la livraison source. Codex demande la
confiance sur la définition du hook via `/hooks`. Ne pas contourner cette étape,
ni remplacer les permissions du desktop. La découverte native et les tests du
traducteur ne prouvent pas son exécution dans une session de coding active.
Les outils hébergés et certains chemins spécialisés échappent aux hooks.

Vérification : `node --test hooks/codex/pre-tool-use.test.mjs`.
