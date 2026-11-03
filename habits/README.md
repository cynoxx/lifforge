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

- **Aujourd'hui** : to-do du jour (tâches pour aujourd'hui ou demain, prioritaires, report des tâches non faites), liste des habitudes du jour à cocher (déclencheur et version minimale sous chaque habitude), objectif du jour, aides automatiques (« ne manque jamais deux fois », habitude qui coince, déclencheur manquant, paliers de série), mot du coach et discussion avec le coach.
- **Habitudes** : matrice du mois, % du jour / de la semaine / du mois, courbe de régularité, analyse par habitude, classement.
- **Objectifs** : chaque horizon avec son échéance, le temps écoulé, les habitudes reliées, « Atteint », « Relancer », historique, bilan du coach.
- **Sobriété** : compteur en direct, paliers, économies, record, rechutes. Le bouton « J'ai une envie » ouvre une aide d'urgence (respiration guidée, minuteur de 10 minutes, ta raison, idées concrètes, lignes d'écoute).

Chaque habitude a un **plan pour tenir** : déclencheur « Après…, je… », version minimale, plan « Si…, alors… », récompense, objectif servi. Le coach peut remplir ce plan et donner des conseils personnalisés.

## Coach IA

Dans l'artifact claude.ai, le coach utilise Claude sur le compte de la personne (elle donne son accord au premier appel). En dehors de Claude (fichier `index.html` ouvert directement), les suggestions, les conseils et les aides fonctionnent sans IA, à partir d'une bibliothèque intégrée.

## Données et synchronisation

Toutes les données sont gardées dans le navigateur (localStorage) **et**, dans l'artifact claude.ai, synchronisées dans l'espace privé de la personne. Personne d'autre n'y a accès, même pas les gens avec qui l'artifact est partagé. L'espace contient plusieurs documents :

- `core` : profil, objectifs, habitudes et leurs plans, compteurs de sobriété, suppressions
- `chat` : conversation avec le coach
- `log-AAAA-MM` : cases cochées d'un mois (un document par mois, pour ne jamais atteindre la taille maximale d'un document)

Chaque élément porte sa date de modification et chaque case cochée un horodatage signé (+ fait, − décoché). Quand deux appareils modifient en même temps, même hors ligne, leurs changements sont **fusionnés** au lieu de s'écraser. Ce qui n'a pas pu partir reste sur l'appareil et repart au retour de la connexion, quand l'app repasse au premier plan, ou via le menu ⋯ › Synchroniser maintenant. « Tout effacer » et « Importer » se propagent aussi aux autres appareils. Les données de l'ancien format (un seul document `state`) sont migrées automatiquement.

L'indicateur en haut affiche Synchronisé, Envoi…, Hors ligne · N en attente, ou Local (fichier ouvert hors de Claude : pas de synchronisation).

Le menu ⋯ permet aussi d'exporter ou d'importer une sauvegarde JSON, et de passer du noir au blanc.

## Fichiers

- `app.html` : source de la page (publiée telle quelle en artifact claude.ai)
- `index.html` : version autonome générée, à ouvrir dans un navigateur ou à héberger
- `build.sh` : regénère `index.html` à partir de `app.html`

Ne modifie que `app.html`, puis lance `./habits/build.sh`.
