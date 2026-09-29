# <Projet> — contexte Claude (garder < 80 lignes)

## Quoi
<Une phrase : pour qui, quel problème.>

## Stack
Next.js App Router · TypeScript strict · Prisma/PostgreSQL (Neon) · Vercel · Vitest · Playwright

## Commandes
- dev : `npm run dev` · tests : `npm test` · e2e : `npx playwright test` · lint : `npm run lint` · build : `npm run build`

## Carte du code
- `src/app/` routes · `src/components/` UI · `src/lib/` logique métier · `prisma/` schéma · `docs/` architecture et tickets

## Conventions
- Composants serveur par défaut ; `"use client"` seulement si interaction.
- Styles uniquement via `src/styles/tokens.css` (jamais de couleur en dur).
- Toute logique métier testée dans `src/lib/**/*.test.ts`.

## Autonomie
<Choisir : "Lecture seule par défaut, GO requis pour écrire hors _travail/." OU "Autonomie complète : env, migrations, déploiement" + créer le fichier `.claude/autonomie`.>

## À lire seulement si besoin
`docs/ARCHITECTURE.md` · `docs/TICKETS.md`
