# Lifforge Habitudes

Suivi d'habitudes en matrice mensuelle, avec un compteur de sobriété.

## Fonctionnalités

**Habitudes**
- Matrice habitudes × jours du mois : fait, manqué, à faire aujourd'hui, à venir, non prévu
- Jours prévus par habitude (tous les jours, semaine, week-end, jours au choix)
- Tuiles : vue du mois (jours suivis, jours parfaits, moyenne par jour), % du jour, % de la semaine avec barres, régularité du mois
- Courbe de régularité quotidienne, analyse par habitude (taux, série en cours), top 5
- Navigation entre les mois

**Sobriété**
- Plusieurs compteurs (alcool, tabac, écrans…), chrono en direct jours / heures / minutes / secondes
- Paliers (24 h → 5 ans) avec progression vers le prochain palier
- Argent économisé selon le coût par jour, meilleure série, nombre de rechutes
- « J'ai rechuté » remet à zéro et garde la série dans l'historique

**Données**
- Enregistrées dans le navigateur (localStorage). Dans l'artifact claude.ai, elles sont aussi synchronisées dans un document privé propre à chaque personne.
- Export / import d'une sauvegarde JSON (menu ⋯)

## Fichiers

- `app.html` : source de la page (publiée telle quelle en artifact claude.ai)
- `index.html` : version autonome générée, à ouvrir directement dans un navigateur ou à héberger (GitHub Pages, Netlify…)
- `build.sh` : regénère `index.html` à partir de `app.html`

Ne modifie que `app.html`, puis lance `./habits/build.sh`.
