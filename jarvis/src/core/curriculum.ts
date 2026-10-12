// PASS curriculum, built from the user's 8 UE folders and the course files
// found in their Google Drive ("Médecine / Tutorat", "S1 Johan", "S1 Andréa").
// Chapters marked `inferred` exist as numbered folders/files in the Drive but
// their title could not be read from the file name: confirm them in the app.
//
// Histology: the "Histo" folder from last year numbers 13 chapters (épithéliums
// split in two, cartilage before adipeux). The 2026-2027 tutorat merges the two
// épithélium chapters, so last year's chap. N maps to this year's chap. N-1
// from the osseux onward (chap. 13 hématopoïèse → 12). The professor's polys
// use a third numbering ("6-face" is this year's embryology chap. 9).

export interface DriveRef { label: string; id: string; folder?: boolean }

export interface Chapter {
  id: string;
  ueId: string;
  n: number;
  title: string;
  hours: number; // first-pass learning estimate (J0 + TD)
  drive?: DriveRef[];
  inferred?: boolean;
}

export interface UE {
  id: string;
  code: string;
  name: string;
  short: string;
  hue: number; // HUD hue for the subject
  mineure: boolean; // priority subjects ("mineures") worked first
  inExamBlanc: boolean;
  weight: number; // relative weight in the concours
  folder?: DriveRef;
  tds?: DriveRef[];
  chapters: Chapter[];
}

export const driveUrl = (r: DriveRef) =>
  r.folder ? `https://drive.google.com/drive/folders/${r.id}` : `https://drive.google.com/file/d/${r.id}/view`;

const ch = (ueId: string, n: number, title: string, hours: number, drive?: DriveRef[], inferred?: boolean): Chapter => ({
  id: `${ueId}-c${n}`, ueId, n, title, hours, drive, inferred,
});

export const UES: UE[] = [
  {
    id: 'ue1', code: 'UE1', name: 'Chimie générale & organique', short: 'Chimie', hue: 28, mineure: true, inExamBlanc: true, weight: 1,
    folder: { label: 'UE1 Chimie Mineure', id: '1VjYLfS1Nw97n3PE9EpMI6XGFCtEjC1zS', folder: true },
    tds: [
      { label: 'TD Chimie G — Graziani', id: '1QuDao00ylBq5WV48nchZyTP34zVuh2Su', folder: true },
      { label: 'TD Chimie G — Tomi', id: '1FRofwjt6qj9oI6qM7RCqQjo2kx7IIaZW', folder: true },
      { label: 'TD Chimie O', id: '1M57ucDdIlXN8LysVfYaPXN9_KbmZd1uY', folder: true },
      { label: 'TD stage pré-rentrée (TD1, TD2)', id: '1mmci7t1kmX4DOKC0CAjuqupkIMY15X-N', folder: true },
    ],
    chapters: [
      ch('ue1', 1, 'Chimie G — Atomistique & classification périodique', 3, [{ label: 'Chimie Gé (S1 Johan)', id: '1ULwqX3dYm2WsrI7FSY6Afq20gJ6QyhS8', folder: true }]),
      ch('ue1', 2, 'Chimie G — Liaisons chimiques & géométrie (Lewis, VSEPR, hybridation)', 3),
      ch('ue1', 3, 'Chimie G — Thermodynamique chimique', 3),
      ch('ue1', 4, 'Chimie G — Équilibres & cinétique', 3),
      ch('ue1', 5, 'Chimie G — Acides/bases, pH & solutions tampons', 3),
      ch('ue1', 6, 'Chimie G — Oxydoréduction', 2.5),
      ch('ue1', 7, 'Chimie O — Nomenclature & groupes fonctionnels', 2.5, [
        { label: 'PASS UE1 Chimie Organique P1', id: '1PPtgRkvysS1PdJ3kIpTTei6UByrGieAe' },
        { label: 'Chimie O 1.1', id: '1rMOPcSchRZ07IJ60r5fPJht1k9yLMbHC' },
      ]),
      ch('ue1', 8, 'Chimie O — Stéréochimie (chiralité, R/S, Z/E)', 3, [{ label: 'Chimie O 1.2', id: '1RdQ-8Ybu1zdBw-nLLueWZE1PbuypwcWi' }]),
      ch('ue1', 9, 'Chimie O — Effets électroniques & intermédiaires réactionnels', 3),
      ch('ue1', 10, 'Chimie O — Mécanismes : substitutions, éliminations, additions', 3.5),
    ],
  },
  {
    id: 'ue2', code: 'UE2', name: 'Biochimie', short: 'Biochimie', hue: 152, mineure: true, inExamBlanc: true, weight: 1,
    folder: { label: 'UE2-BIOCHIMIE (Tutorat)', id: '1ChGDGkh7UNiiQ5CMVZrR9CaotbZpo9fS', folder: true },
    tds: [
      { label: 'TD Biochimie — Berti', id: '1uzC-8oKT8esJwRRXdax0fo7O9akrX4Bk', folder: true },
      { label: 'TD Biochimie — Poli', id: '1RC7mSp_Z8VEktlej369_I6MQN8ofXqOw', folder: true },
    ],
    chapters: [
      ch('ue2', 1, 'Protéines : acides aminés, structure & stratégie d’étude', 3.5, [
        { label: 'Chap. 1.1 Stratégie d’étude', id: '198YgHtT7T9VE-vmfbQxZTKiZpSCAnZYk' },
        { label: 'Dossier Protéines', id: '1XN2H2Xigh2AIi_2X_KBwhLzzgdI8ZZ70', folder: true },
      ]),
      ch('ue2', 2, 'Transport de l’oxygène (myoglobine, hémoglobine)', 2.5, [{ label: 'Chap. 1.3 Transport de l’O₂', id: '1SL2TpfjPfgNPPhA3u7XgSNw5wNybTq-D' }]),
      ch('ue2', 3, 'Les glucides', 3, [{ label: 'Chap. 2 Les glucides', id: '1Dp-EwPOp64NEqnQabww5-gmfNljLmTlx' }]),
      ch('ue2', 4, 'Les lipides', 3, [{ label: 'Chap. 3 Les lipides', id: '18LMTh9UyTiGJ_OR1dTUeexAWsWg781_A' }]),
      ch('ue2', 5, 'Les enzymes (cinétique, Michaelis-Menten, inhibitions)', 3.5, [{ label: 'Dossier Enzymes', id: '1jWJGWhZbbmSi7-uqgzcD32epDNaOPzI8', folder: true }]),
      ch('ue2', 6, 'Eau et pH', 2, [{ label: 'Chap. 5 Eau et pH', id: '1DT1CKTuI0pzOc0pbb4KLcmMuh25lT1h2' }]),
    ],
  },
  {
    id: 'ue3', code: 'UE3', name: 'Biologie cellulaire', short: 'Bio cell', hue: 192, mineure: true, inExamBlanc: true, weight: 1,
    folder: { label: 'UE3-BIOLOGIE CELLULAIRE (Tutorat)', id: '170cTKCVMfHHriLSFz3uHr2fFmOERJAf3', folder: true },
    chapters: [
      ch('ue3', 1, 'Tri et transport des protéines', 3, [{ label: 'Chap. 1 Tri et transport', id: '1L75X1XLbFm5gdsXb1zzemBGTiDOFaPOu' }]),
      ch('ue3', 2, 'Bioénergie et métabolisme (mitochondrie)', 3, [{ label: 'Chap. 2 Bioénergie', id: '1xdoZAtlLq0aMSNlP51lIIwA4Zj5cyQ9q' }]),
      ch('ue3', 3, 'Cytosquelette', 3, [{ label: 'Chap. 3 Cytosquelette', id: '1Ab12dOUOluAObH7TE6zAwL_kKnyeIBbZ' }]),
      ch('ue3', 4, 'Apoptose', 2, [{ label: 'Chap. 4 L’apoptose', id: '1TUIKZfT7E36ZrJFvnUC2r8dLd8EI5lQT' }]),
      ch('ue3', 5, 'Noyau', 2.5, [{ label: 'Noyau', id: '1Ka4gaCIDY7O9bmFXxu95EM2H4_ThMmdW' }]),
      ch('ue3', 6, 'Communication cellulaire', 2.5, [{ label: 'Communication cellulaire', id: '1D7VmtVXeTy6RYdLT9cmZlSns9EFdg5cN' }]),
      ch('ue3', 7, 'Techniques d’étude de la cellule', 2, [{ label: 'Techniques étude', id: '1vq6AZLud1hfibVD7fEJI-rBaoDhyNMxJ' }]),
    ],
  },
  {
    id: 'ue4', code: 'UE4', name: 'Biologie moléculaire', short: 'Bio mol', hue: 268, mineure: false, inExamBlanc: true, weight: 1,
    folder: { label: 'UE4-BIOMOLL (Tutorat)', id: '1cIbvvzp9FM1tnP1pEE8MecAyQL7y3oJt', folder: true },
    tds: [{ label: 'TD Biomol', id: '1hiLkU_idJgJKLwbbgtOOnvueRX3qh7zF', folder: true }],
    chapters: [
      ch('ue4', 1, 'Généralités : acides nucléiques & structure de l’ADN', 2.5, [
        { label: 'Généralités P1', id: '1Rm9QiVE8Ah5jz5bicR0z6-Q9E2sEOtuy' },
        { label: 'Fiche Acides nucléiques', id: '14c7n1SngQfRj0tHuSa67LUZSzWY-2L_M' },
      ]),
      ch('ue4', 2, 'Réplication', 3, [{ label: 'Chap. 2 Biomol', id: '1qR9F2jLFLQABEvGV1soLSWhhNgjiOneI' }]),
      ch('ue4', 3, 'Transcription', 3, [{ label: 'Chapitre 3', id: '1-JIDGtE9IwAPtdlSKYL3gQS7CSNwooSb' }]),
      ch('ue4', 4, 'Traduction', 3, [{ label: 'Chapitre 4', id: '1mWS7uphl2NnymkCvX-igSVtOgi08UizU' }]),
      ch('ue4', 5, 'Régulation de l’expression des gènes', 3, [{ label: 'Dossier Régulation', id: '1Q_nMaK3el_EebS25Dh0tx8wgThGlDeE2', folder: true }]),
      ch('ue4', 6, 'Dommages et variations du matériel génétique', 2.5, [{ label: 'Chapitre 6', id: '17319CWV13JNk-KXmiYeX22TTd50Qj1-u' }]),
      ch('ue4', 7, 'Techniques de biologie moléculaire', 2.5, [{ label: 'Chapitre 7', id: '1dhCPUJ5ov8PcXhRzMQLijEexuYUDMMbY' }]),
    ],
  },
  {
    id: 'ue5', code: 'UE5', name: 'Histologie', short: 'Histo', hue: 330, mineure: false, inExamBlanc: false, weight: 1,
    folder: { label: 'UE7-HISTO (Tutorat)', id: '1SOhT0xsK1w33DLCXrYry7Y3d89UohDHM', folder: true },
    chapters: [
      ch('ue5', 1, 'Méthodes d’étude', 2, [{ label: 'Chap. 1 Méthodes d’étude', id: '1U2GXmBubqMbhFOXg1AYo9qw6IG7fCU1c' }]),
      ch('ue5', 2, 'Cycle cellulaire', 2.5, [{ label: 'Chap. 2 Cycle cellulaire', id: '1smDRW3FZhx3dJwQ06W9guC6DNaYyHk-c' }]),
      ch('ue5', 3, 'Tissus épithéliaux (revêtement & glandulaires)', 3, [
        { label: 'Épithéliums de revêtement (ancien chap. 3)', id: '1WEr-PwVNwzk1ii3b8gYmjwiVRUwPsgjw', folder: true },
        { label: 'Épithéliums glandulaires (ancien chap. 4)', id: '1Ew3LdfPjtd4fnTxiDJo46a7i3VveSfBN', folder: true },
      ]),
      ch('ue5', 4, 'Tissu conjonctif', 2.5, [{ label: 'Chap. 4 Tissu conjonctif', id: '1Rs5a0knHivCOmYUfFiS78UcwmyHIa0h8' }]),
      ch('ue5', 5, 'Tissu cartilagineux', 2, [{ label: 'Chap. 5 Tissu cartilagineux', id: '1bDOzrmi0PATwBbAjvFf4hC9vzYUAs9pA' }]),
      ch('ue5', 6, 'Tissu adipeux', 1.5, [{ label: 'Chap. 6 Tissu adipeux', id: '10ufCNiYD-1QQgSgqimu2-xF5hdPVuYKl' }]),
      ch('ue5', 7, 'Tissu osseux & ossification', 3, [{ label: '8. Le tissu osseux (ancien chap. 8)', id: '1zTo4h5DSnbBSLdJYOxSe1E4B7rAF0roW', folder: true }]),
      ch('ue5', 8, 'Tissu musculaire strié squelettique', 2.5, [{ label: '9. Muscle strié squelettique (ancien chap. 9)', id: '19juYTeP2KiFXTcxermC1eJvo-qpGhtUz', folder: true }]),
      ch('ue5', 9, 'Tissu musculaire strié cardiaque', 1.5, [{ label: 'Ancien chap. 10', id: '1gr7l5RcXM058GDs-mm44_Qr8D605Foii', folder: true }]),
      ch('ue5', 10, 'Tissu musculaire lisse', 1.5, [{ label: '11. Le muscle lisse (ancien chap. 11)', id: '1iYJv2WCB87DkgN4DKyXTHYVS2FeShrZX', folder: true }]),
      ch('ue5', 11, 'Les cellules sanguines', 2, [{ label: 'Chap. 11 Cellules sanguines', id: '17SBJWf5Tjz6P-wQ7G4X81kqilFOIYE9S' }]),
      ch('ue5', 12, 'L’hématopoïèse', 2.5, [{ label: 'Chap. 12 Hématopoïèse', id: '1TALcDVWpv-u5dRdvfURftDipSrEYRyby' }]),
      // Not in the 2026-2027 tutorat numbering found so far, but every annale ends on it.
      ch('ue5', 13, 'Tissu nerveux', 2.5, [{ label: 'Circulation du LCR', id: '1gG8PMbyK2CPt_210-9loIYc4ALd8exvw' }], true),
    ],
  },
  {
    id: 'ue6', code: 'UE6', name: 'Embryologie', short: 'Embryo', hue: 300, mineure: false, inExamBlanc: false, weight: 1,
    folder: { label: 'UE6-EMBRYOLOGIE (Tutorat)', id: '16MfFxVRJKb515Ukqgrctn1DskWDgj_bO', folder: true },
    chapters: [
      ch('ue6', 1, 'Généralités sur le développement & gamétogenèse', 2.5, [{ label: 'Généralités sur le développement', id: '1xRknICHreGZ6m15eUI7_KqRo2HJ5m39L' }], true),
      ch('ue6', 2, 'La fécondation', 2, [{ label: 'Chap. 2 La fécondation', id: '1zdFzuS0_rOjXQMCtjBd9W8678ragkkk8' }]),
      ch('ue6', 3, 'Première semaine : segmentation & blastocyste', 2, [{ label: 'Chap. 3 Embryo (notes)', id: '1g4LrOx9JpUF80sosJzysrDm5RkF862q3' }]),
      ch('ue6', 4, 'Deuxième semaine : nidation & disque didermique', 2, [{ label: 'Chap. 4 Deuxième semaine', id: '1y_dDIzVphSgygKdmniq4UV1PHmoJh0Ra' }]),
      ch('ue6', 5, 'Troisième semaine : gastrulation & disque tridermique', 2.5, undefined, true),
      ch('ue6', 6, 'Quatrième semaine : délimitation de l’embryon & neurulation', 2, undefined, true),
      ch('ue6', 7, 'Annexes embryonnaires & placenta', 2, undefined, true),
      ch('ue6', 8, 'Développement de l’appareil cardiovasculaire', 3, [{ label: 'Chap. 8 Cardiovasculaire', id: '1yjH8NieX9JvqMo6USmHl3lFpZ7YTyXxt' }]),
      ch('ue6', 9, 'Développement de la région cervico-faciale', 2.5, [
        { label: 'Chap. 9 Cervico-faciale', id: '14Hzja2tZnP-qCsbJ2GYlifvjAuX-R7iX' },
        { label: 'Poly prof « 6 — Face » 2025', id: '1vH88t-IM-6ktB2tfEPSq3Nrfnu9-v4mq' },
      ]),
    ],
  },
  {
    id: 'ue7', code: 'UE7', name: 'Physique', short: 'Physique', hue: 212, mineure: false, inExamBlanc: true, weight: 1,
    folder: { label: 'Physique (S1 Andréa)', id: '12xFIH1iLIVYVJobLAfm3pYJ5rXjXZ8QM', folder: true },
    tds: [{ label: 'TD Physique', id: '1NoSO4YBjd0WhnyPVQDnOJNZ_UCyJ1y8j', folder: true }],
    chapters: [
      ch('ue7', 1, 'Optique (géométrique & œil)', 3, [{ label: 'Tutorat Optique', id: '1PCMUwP5J9TlyIhVzilwaHu00robO_m8J' }]),
      ch('ue7', 2, 'Mécanique des fluides', 3, undefined, true),
      ch('ue7', 3, 'Rayonnements & radioactivité', 3, undefined, true),
      ch('ue7', 4, 'Thermodynamique & transferts', 2.5, undefined, true),
    ],
  },
  {
    id: 'ue8', code: 'UE8', name: 'Biostatistiques', short: 'Biostats', hue: 52, mineure: false, inExamBlanc: true, weight: 1,
    folder: { label: 'Biostats (S1 Andréa)', id: '1bag8A-d-zaTNOssdnGrpw3oJk3gLaCsL', folder: true },
    tds: [
      { label: 'Exercices Biostatistique partie 1', id: '1YbaByDNUmpOGE0UIeiOrhW2YSpZZp6e-' },
      { label: 'Poly 2026', id: '19bjsplyWAM-N9vLkcUPhB9AN6P0SeHw-', folder: true },
    ],
    chapters: [
      ch('ue8', 1, 'Statistiques descriptives', 2.5, [{ label: 'Poly 2026', id: '19bjsplyWAM-N9vLkcUPhB9AN6P0SeHw-', folder: true }], true),
      ch('ue8', 2, 'Probabilités', 3, undefined, true),
      ch('ue8', 3, 'Lois de probabilité (binomiale, Poisson, normale)', 3, undefined, true),
      ch('ue8', 4, 'Estimation & intervalles de confiance', 3, undefined, true),
      ch('ue8', 5, 'Tests d’hypothèse', 3, undefined, true),
    ],
  },
];

export const ANNALES: DriveRef[] = [
  { label: 'Sujet concours 2015 — Histo', id: '1phJizciU0FvOz3e30_X2ABeNUBI9iR9B' },
  { label: 'Concours 2013-2014', id: '1TIbKQ2-zjV-hGJQdmuoNtrzP7Euyrdlf' },
];

export const PLANNING_SHEET = 'https://docs.google.com/spreadsheets/d/1LxhSKeOHS8FeHVLcN66WEnT7ueCjoHn3RSvB-vCDwYU/edit';

export const ALL_CHAPTERS: Chapter[] = UES.flatMap((u) => u.chapters);
export const ueById = (id: string) => UES.find((u) => u.id === id)!;
export const chapterById = (id: string) => ALL_CHAPTERS.find((c) => c.id === id);
