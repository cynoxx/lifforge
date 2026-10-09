# JARVIS

Assistant de vie personnel pour préparer le concours PASS (semaine du 14 décembre 2026) en gérant quatre domaines : **Dieu**, **Études**, **Sport** et **Personnel**.

## Lancer

```bash
npm install
npm run dev            # http://localhost:5173
npm test               # moteur de planification, split sportif, répétition espacée
npm run build          # version web classique (dist/)
npm run build:artifact # page unique publiée sur claude.ai (dist-single/jarvis.html)
```

## Architecture

| Module | Rôle |
|---|---|
| `src/core/curriculum.ts` | Les 8 UE et leurs chapitres, reliés aux fichiers du Google Drive (« Médecine / Tutorat », « S1 Johan », « S1 Andréa »). Les chapitres marqués `inferred` ont un titre déduit du programme : à confirmer. |
| `src/core/planner.ts` | Phases (blitz examen blanc → couverture totale → annales → affûtage → concours), projection des études chapitre par chapitre, blocage du chapitre suivant tant que le précédent n’est pas validé, révisions J1/J3/J7/J14/J30, construction de chaque journée. |
| `src/core/sport.ts` | Split Push → Pull → Legs → Upper → Lower sur les 5 jours sans boxe ; séance ratée replacée, semaine réalignée, adaptation aux courbatures, salle bloquée le jour de l’examen blanc et pendant le concours. |
| `src/core/srs.ts`, `seedCards.ts` | Flashcards SM-2 et banque de départ de questions rédactionnelles avec points clés (auto-correction hors-ligne). |
| `src/core/insights.ts` | Couche proactive : sommeil → études et entraînement, prières manquées, oublis récurrents, UE faibles, échéances. |
| `src/core/brain.ts`, `ai.ts` | Coach Claude avec contexte complet (planning, progression, mémoire, historique) et outils (mémoriser, ajouter une tâche, marquer un bloc, signaler des courbatures, chercher dans les cours). Dans claude.ai : capacité `sample`, sans clé. Ailleurs : SDK Anthropic avec une clé stockée sur l’appareil. |
| `src/core/importer.ts` | Import des dossiers de cours depuis l’ordinateur (PDF via pdf.js, DOCX via mammoth), classement automatique par UE et chapitre, recherche plein texte. |
| `src/core/store.ts` | État découpé en documents. Base persistante de l’artifact claude.ai (relisible par Claude dans d’autres conversations) ou IndexedDB en local. Instantané quotidien sur 7 jours glissants, export et import JSON. |
| `src/core/auth.ts` | Code PIN (PBKDF2) et déverrouillage biométrique via WebAuthn (Face ID, Touch ID, Windows Hello). |
| `src/ui/*` | Interface HUD : réacteur des 4 domaines, agenda jour/semaine/mois avec export `.ics`, études, flashcards, sport, prière, personnel, coach, import, réglages, palette ⌘K. |

## Limites connues

- Dans claude.ai, la dictée vocale, les notifications système et la biométrie sont bloquées par le cadre de la page : le code PIN, la synthèse vocale et les rappels dans l’application fonctionnent. La version locale ou installée débloque le reste.
- Les horaires exacts de l’examen blanc et des épreuves du concours sont à confirmer.
