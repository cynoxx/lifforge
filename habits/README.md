# Lifforge Habitudes

Coach d'habitudes en noir et blanc : profil, objectifs par horizon, habitudes avec plan pour tenir, coach IA et compteur de sobriété.

## Parcours d'accueil

L'app part de zéro et pose les questions dans l'ordre :

1. **Qui es-tu ?** Prénom, âge, quelques lignes sur toi, domaines à améliorer.
2. **Objectifs** à 1 jour, 1 semaine, 1 mois, 3 mois, 6 mois, 9 mois, 1 an, 3 ans et 5 ans.
3. **Habitudes** suggérées selon tes domaines, ou proposées par le coach IA selon tes objectifs, plus les tiennes.
4. **Sobriété** (facultatif) : un compteur pour ce que tu veux arrêter.
5. **Récapitulatif**, puis c'est parti.

## Vues

- **Aujourd'hui** : liste du jour à cocher (déclencheur et version minimale sous chaque habitude), objectif du jour, aides automatiques (« ne manque jamais deux fois », habitude qui coince, déclencheur manquant, paliers de série), mot du coach et discussion avec le coach.
- **Habitudes** : matrice du mois, % du jour / de la semaine / du mois, courbe de régularité, analyse par habitude, classement.
- **Objectifs** : chaque horizon avec son échéance, le temps écoulé, les habitudes reliées, « Atteint », « Relancer », historique, bilan du coach.
- **Sobriété** : compteur en direct, paliers, économies, record, rechutes. Le bouton « J'ai une envie » ouvre une aide d'urgence (respiration guidée, minuteur de 10 minutes, ta raison, idées concrètes, lignes d'écoute).

Chaque habitude a un **plan pour tenir** : déclencheur « Après…, je… », version minimale, plan « Si…, alors… », récompense, objectif servi. Le coach peut remplir ce plan et donner des conseils personnalisés.

## Coach IA

Dans l'artifact claude.ai, le coach utilise Claude sur le compte de la personne (elle donne son accord au premier appel). En dehors de Claude (fichier `index.html` ouvert directement), les suggestions, les conseils et les aides fonctionnent sans IA, à partir d'une bibliothèque intégrée.

## Données

Elles sont enregistrées dans le navigateur (localStorage). Dans l'artifact claude.ai, elles sont aussi synchronisées dans un document privé propre à chaque personne. Le menu ⋯ permet d'exporter ou d'importer une sauvegarde JSON, et de passer du noir au blanc.

## Fichiers

- `app.html` : source de la page (publiée telle quelle en artifact claude.ai)
- `index.html` : version autonome générée, à ouvrir dans un navigateur ou à héberger
- `build.sh` : regénère `index.html` à partir de `app.html`

Ne modifie que `app.html`, puis lance `./habits/build.sh`.
