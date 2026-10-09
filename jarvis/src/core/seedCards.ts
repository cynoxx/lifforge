// Starter bank of written-answer questions (format rédactionnel).
// `keys` are the points a complete answer must contain; they drive the
// offline self-grading checklist. Imported courses and Claude add more.
type Seed = [q: string, a: string, keys: string[]];

export const SEEDS: Record<string, Seed[]> = {
  'ue1-c1': [
    ['Définir le numéro atomique Z et le nombre de masse A, puis expliquer ce qu’est un isotope.', 'Z = nombre de protons (définit l’élément). A = protons + neutrons. Des isotopes ont même Z mais A différent (nombre de neutrons différent), donc mêmes propriétés chimiques.', ['Z = protons', 'A = protons + neutrons', 'isotopes : même Z, A différent', 'mêmes propriétés chimiques']],
    ['Énoncer les règles de remplissage électronique (Klechkowski, Pauli, Hund).', 'Klechkowski : remplissage par (n + l) croissant, à égalité n croissant. Pauli : deux électrons d’une même orbitale ont des spins opposés (pas 4 nombres quantiques identiques). Hund : dans des orbitales de même énergie, on place d’abord un électron par case, spins parallèles.', ['n + l croissant', 'Pauli : 4 nombres quantiques non identiques', 'Hund : spins parallèles avant appariement']],
    ['Comment évoluent électronégativité et rayon atomique dans la classification ?', 'L’électronégativité augmente de gauche à droite sur une période et de bas en haut dans une colonne (max : F). Le rayon atomique évolue en sens inverse : il diminue sur une période (charge effective ↑) et augmente en descendant une colonne (nouvelle couche).', ['EN ↑ vers la droite et vers le haut', 'fluor le plus électronégatif', 'rayon ↓ sur une période', 'rayon ↑ en descendant']],
  ],
  'ue1-c2': [
    ['Expliquer la méthode VSEPR et donner la géométrie de AX4, AX3E et AX2E2.', 'VSEPR : les doublets (liants et non liants) autour de l’atome central se repoussent et s’orientent pour minimiser les répulsions. AX4 : tétraédrique (109,5°, ex. CH4). AX3E : pyramide trigonale (≈107°, NH3). AX2E2 : coudée (≈104,5°, H2O).', ['répulsion des doublets', 'AX4 tétraèdre 109,5°', 'AX3E pyramide trigonale', 'AX2E2 coudée', 'doublets non liants réduisent les angles']],
    ['Définir l’hybridation sp3, sp2 et sp avec un exemple chacun.', 'sp3 : 1 s + 3 p → 4 orbitales à 109,5° (CH4). sp2 : 1 s + 2 p → 3 orbitales à 120° + 1 p pure formant une liaison π (éthylène). sp : 1 s + 1 p → 2 orbitales à 180° + 2 p pures (acétylène, triple liaison).', ['sp3 109,5° CH4', 'sp2 120° éthylène, liaison π', 'sp 180° alcyne']],
  ],
  'ue1-c3': [
    ['Définir enthalpie, entropie et enthalpie libre ; donner la condition de spontanéité d’une réaction.', 'ΔH : chaleur échangée à pression constante (< 0 exothermique). ΔS : variation du désordre. ΔG = ΔH − TΔS. Une réaction est spontanée (thermodynamiquement favorable) si ΔG < 0 ; à l’équilibre ΔG = 0.', ['ΔH chaleur à P constante', 'ΔS désordre', 'ΔG = ΔH − TΔS', 'spontanée si ΔG < 0']],
    ['Énoncer la loi de Hess.', 'L’enthalpie de réaction ne dépend que des états initial et final, pas du chemin suivi : on peut la calculer en combinant des réactions connues (ΔrH = Σ ΔfH produits − Σ ΔfH réactifs).', ['fonction d’état', 'indépendante du chemin', 'ΔrH = Σ ΔfH produits − Σ ΔfH réactifs']],
  ],
  'ue1-c4': [
    ['Énoncer la loi d’action de masse et le principe de Le Chatelier.', 'À l’équilibre, le quotient réactionnel Q est égal à la constante K (qui ne dépend que de T). Le Chatelier : un système à l’équilibre soumis à une perturbation (concentration, pression, température) évolue dans le sens qui s’oppose à cette perturbation.', ['Q = K à l’équilibre', 'K dépend de T seulement', 'évolution qui s’oppose à la perturbation']],
    ['Définir l’ordre d’une réaction et le temps de demi-vie pour une cinétique d’ordre 1.', 'Ordre : exposant de la concentration dans la loi de vitesse v = k[A]^n. Ordre 1 : [A] = [A]0·e^(−kt) et t1/2 = ln2 / k, indépendant de la concentration initiale.', ['v = k[A]^n', 'décroissance exponentielle', 't1/2 = ln2/k', 'indépendant de [A]0']],
  ],
  'ue1-c5': [
    ['Donner les définitions de Brønsted d’un acide et d’une base et la formule du pH d’un acide faible.', 'Acide : donneur de proton H+ ; base : accepteur de proton. Couple acide/base conjugué. Acide faible : pH = ½(pKa − log C), si l’acide est peu dissocié.', ['acide donneur H+', 'base accepteur H+', 'couple conjugué', 'pH = ½(pKa − log C)']],
    ['Qu’est-ce qu’une solution tampon ? Donner l’équation d’Henderson-Hasselbalch.', 'Mélange d’un acide faible et de sa base conjuguée en quantités comparables, dont le pH varie peu lors d’un ajout modéré d’acide ou de base ou d’une dilution. pH = pKa + log([A−]/[AH]) ; pouvoir tampon maximal à pH = pKa.', ['acide faible + base conjuguée', 'pH peu modifié', 'pH = pKa + log([A−]/[AH])', 'efficace autour du pKa']],
  ],
  'ue1-c6': [
    ['Définir oxydant, réducteur et nombre d’oxydation ; écrire l’équation de Nernst.', 'Oxydant : capte des électrons ; réducteur : cède des électrons. Le n.o. traduit la charge fictive d’un atome. Nernst : E = E° + (0,06/n)·log([Ox]/[Red]) à 25 °C.', ['oxydant capte e−', 'réducteur cède e−', 'nombre d’oxydation', 'E = E° + 0,06/n log(Ox/Red)']],
  ],
  'ue1-c7': [
    ['Citer les groupes fonctionnels prioritaires dans l’ordre de nomenclature.', 'Acide carboxylique > anhydride > ester > halogénure d’acyle > amide > nitrile > aldéhyde > cétone > alcool > amine. La fonction prioritaire donne le suffixe, les autres sont en préfixe.', ['acide carboxylique prioritaire', 'ester, amide, nitrile', 'aldéhyde > cétone > alcool > amine', 'suffixe = fonction principale']],
  ],
  'ue1-c8': [
    ['Expliquer les règles CIP et la détermination R/S d’un carbone asymétrique.', 'On classe les 4 substituants par numéro atomique décroissant (règles de Cahn-Ingold-Prelog, exploration en arborescence si égalité). On regarde la molécule avec le substituant de plus faible priorité vers l’arrière : sens horaire 1→2→3 = R, antihoraire = S.', ['priorité par Z décroissant', 'plus faible priorité à l’arrière', 'horaire = R', 'antihoraire = S']],
    ['Différencier énantiomères et diastéréoisomères.', 'Énantiomères : images l’un de l’autre dans un miroir, non superposables (toutes les configurations inversées), mêmes propriétés physiques sauf pouvoir rotatoire opposé. Diastéréoisomères : stéréoisomères non énantiomères (une partie des configurations inversées, ou isomères Z/E), propriétés physiques différentes.', ['énantiomères : image miroir non superposable', 'pouvoir rotatoire opposé', 'diastéréoisomères : non images miroir', 'propriétés physiques différentes']],
  ],
  'ue1-c9': [
    ['Différencier effet inductif et effet mésomère.', 'Effet inductif : polarisation des liaisons σ due à l’électronégativité, s’atténue vite avec la distance (−I : halogènes ; +I : groupes alkyles). Effet mésomère : délocalisation d’électrons π ou de doublets non liants dans un système conjugué, se transmet sur toute la conjugaison (+M : −OH, −NH2 ; −M : −NO2, C=O).', ['inductif : liaisons σ, électronégativité', 's’atténue avec la distance', 'mésomère : délocalisation π / doublets', 'exemples +M et −M']],
  ],
  'ue1-c10': [
    ['Comparer les mécanismes SN1 et SN2.', 'SN2 : une étape, attaque dorsale, vitesse = k[RX][Nu], inversion de Walden, favorisée sur carbone primaire et en solvant aprotique. SN1 : deux étapes via un carbocation plan, vitesse = k[RX], racémisation, favorisée sur carbone tertiaire et en solvant protique.', ['SN2 une étape, ordre 2', 'inversion de configuration', 'SN1 carbocation, ordre 1', 'racémisation', 'primaire SN2 / tertiaire SN1']],
    ['Énoncer la règle de Markovnikov.', 'Lors de l’addition d’un HX sur un alcène dissymétrique, l’hydrogène se fixe sur le carbone le plus hydrogéné : on passe par le carbocation le plus stable (le plus substitué).', ['H sur le carbone le plus hydrogéné', 'carbocation le plus stable', 'alcène dissymétrique']],
  ],
  'ue2-c1': [
    ['Décrire la structure générale d’un acide aminé et son comportement selon le pH.', 'Carbone α lié à un groupe amine, un groupe carboxyle, un H et une chaîne latérale R (sauf glycine, tous chiraux, série L). En solution : zwitterion au pH isoélectrique (pHi), forme cationique à pH < pHi, anionique à pH > pHi.', ['Cα, NH2, COOH, R', 'série L, glycine achirale', 'zwitterion au pHi', 'cation si pH < pHi, anion si pH > pHi']],
    ['Définir les quatre niveaux de structure des protéines et les liaisons qui les stabilisent.', 'Primaire : séquence d’acides aminés (liaisons peptidiques). Secondaire : hélice α, feuillet β (liaisons H du squelette). Tertiaire : repliement 3D (interactions entre chaînes latérales : hydrophobes, ioniques, H, ponts disulfure). Quaternaire : association de plusieurs sous-unités.', ['primaire = séquence, liaison peptidique', 'secondaire hélice α / feuillet β, liaisons H', 'tertiaire : ponts disulfure, hydrophobes', 'quaternaire : sous-unités']],
    ['Caractériser la liaison peptidique.', 'Liaison amide entre le COOH d’un acide aminé et le NH2 du suivant, avec libération d’eau. Caractère partiel de double liaison (mésomérie) : plane, rigide, conformation trans majoritaire ; rotations possibles seulement autour de Cα (angles φ et ψ).', ['amide COOH + NH2', 'perte d’eau', 'plane, partiellement double', 'trans', 'angles φ et ψ']],
  ],
  'ue2-c2': [
    ['Comparer myoglobine et hémoglobine (structure et courbe de saturation).', 'Myoglobine : monomère, une hème, courbe hyperbolique, forte affinité (stockage musculaire). Hémoglobine : tétramère α2β2, 4 hèmes, courbe sigmoïde due à la coopérativité (transport sanguin), passage T (tendue) ↔ R (relâchée).', ['Mb monomère, hyperbolique', 'Hb tétramère α2β2', 'sigmoïde = coopérativité', 'états T et R']],
    ['Expliquer l’effet Bohr et le rôle du 2,3-BPG.', 'Effet Bohr : une baisse du pH ou une hausse du CO2 diminue l’affinité de l’Hb pour O2 (courbe déplacée à droite), favorisant la libération d’O2 dans les tissus actifs. Le 2,3-BPG se fixe dans la cavité centrale de la désoxy-Hb et stabilise l’état T : il diminue aussi l’affinité.', ['pH ↓ / CO2 ↑ → affinité ↓', 'courbe à droite', 'libération tissulaire', '2,3-BPG stabilise l’état T']],
  ],
  'ue2-c3': [
    ['Définir un ose, différencier aldose et cétose et expliquer la cyclisation.', 'Ose : glucide simple non hydrolysable, polyhydroxylé avec une fonction carbonyle. Aldose : fonction aldéhyde (glucose) ; cétose : fonction cétone (fructose). Cyclisation : hémiacétalisation intramoléculaire (pyranose, furanose) qui crée le carbone anomérique (α ou β).', ['ose non hydrolysable', 'aldose aldéhyde / cétose cétone', 'hémiacétal intramoléculaire', 'carbone anomérique α/β']],
    ['Décrire la liaison osidique et donner la composition du saccharose, du lactose et du maltose.', 'Liaison osidique : liaison entre le carbone anomérique d’un ose et un OH d’un autre ose. Saccharose = glucose α(1→2)β fructose (non réducteur). Lactose = galactose β(1→4) glucose. Maltose = glucose α(1→4) glucose.', ['carbone anomérique impliqué', 'saccharose glc-fru non réducteur', 'lactose gal β1-4 glc', 'maltose glc α1-4 glc']],
  ],
  'ue2-c4': [
    ['Classer les lipides et décrire la structure d’un triglycéride et d’un phospholipide.', 'Lipides simples (triglycérides, cérides, stérides) et complexes (phospholipides, sphingolipides). Triglycéride : glycérol estérifié par 3 acides gras (réserve). Glycérophospholipide : glycérol + 2 acides gras + phosphate + alcool (choline, éthanolamine…), molécule amphiphile constituant les membranes.', ['simples vs complexes', 'TG = glycérol + 3 AG', 'phospholipide amphiphile', 'membranes']],
    ['Expliquer la nomenclature des acides gras (oméga, delta) et l’effet des insaturations.', 'Nomenclature Cn:x Δ (position des doubles liaisons depuis le carboxyle) ou ω (depuis le méthyle terminal). Les doubles liaisons cis créent un coude, diminuent le point de fusion et augmentent la fluidité membranaire.', ['Δ depuis le COOH', 'ω depuis le CH3', 'cis = coude', 'point de fusion ↓, fluidité ↑']],
  ],
  'ue2-c5': [
    ['Donner l’équation de Michaelis-Menten et la signification de Km et Vmax.', 'v = Vmax·[S] / (Km + [S]). Vmax : vitesse maximale quand l’enzyme est saturée. Km : concentration en substrat donnant Vmax/2 ; inverse approximatif de l’affinité (Km faible = forte affinité).', ['v = Vmax[S]/(Km+[S])', 'Vmax enzyme saturée', 'Km = [S] à Vmax/2', 'Km faible = forte affinité']],
    ['Comparer inhibition compétitive et non compétitive (effets sur Km et Vmax, Lineweaver-Burk).', 'Compétitive : l’inhibiteur se fixe au site actif, Km apparent ↑, Vmax inchangée, droites qui se croisent sur l’axe 1/v. Non compétitive : fixation ailleurs, Vmax ↓, Km inchangé, droites qui se croisent sur l’axe 1/[S].', ['compétitif : site actif', 'Km ↑ Vmax =', 'non compétitif : Vmax ↓ Km =', 'représentation de Lineweaver-Burk']],
  ],
  'ue2-c6': [
    ['Expliquer les propriétés de l’eau liées à sa structure.', 'Molécule coudée (≈104,5°) et polaire (O plus électronégatif) : moment dipolaire, liaisons hydrogène entre molécules, d’où point d’ébullition élevé, forte capacité thermique, excellent solvant des composés polaires et ioniques (constante diélectrique élevée).', ['coudée, polaire', 'liaisons hydrogène', 'Téb et capacité thermique élevées', 'solvant des ions, constante diélectrique']],
    ['Définir le produit ionique de l’eau et le pH.', 'Ke = [H3O+][OH−] = 10^−14 à 25 °C. pH = −log[H3O+] ; neutre à pH 7 à 25 °C.', ['Ke = 10^−14', 'pH = −log[H3O+]', 'neutralité pH 7 à 25 °C']],
  ],
  'ue3-c1': [
    ['Décrire l’adressage co-traductionnel d’une protéine vers le réticulum endoplasmique.', 'Le peptide signal N-terminal est reconnu par la SRP qui bloque la traduction et amène le ribosome au récepteur de la SRP sur le RE. Le peptide est transloqué par le translocon (Sec61), le peptide signal est clivé par la signal peptidase, la protéine est repliée (chaperonnes, BiP) et N-glycosylée.', ['peptide signal', 'SRP et récepteur', 'translocon Sec61', 'signal peptidase', 'N-glycosylation, chaperonnes']],
    ['Citer les rôles de l’appareil de Golgi.', 'Maturation des protéines (O-glycosylation, remaniement des N-glycannes), tri et adressage (cis → trans, réseau trans-golgien), ajout du mannose-6-phosphate pour les enzymes lysosomales, formation des vésicules de sécrétion constitutive et régulée.', ['glycosylation', 'tri cis → trans', 'mannose-6-phosphate → lysosome', 'sécrétion constitutive et régulée']],
  ],
  'ue3-c2': [
    ['Décrire la structure de la mitochondrie et la chaîne respiratoire.', 'Double membrane : externe perméable (porines), interne imperméable avec crêtes portant les complexes I-IV et l’ATP synthase ; matrice (cycle de Krebs, ADN mitochondrial). Les électrons de NADH/FADH2 traversent les complexes jusqu’à O2 ; le pompage de protons crée un gradient utilisé par l’ATP synthase (couplage chimio-osmotique de Mitchell).', ['double membrane, crêtes', 'complexes I à IV', 'gradient de protons', 'ATP synthase', 'O2 accepteur final']],
  ],
  'ue3-c3': [
    ['Comparer les trois familles du cytosquelette.', 'Microfilaments d’actine (≈7 nm, polarisés, mobilité, contraction avec la myosine). Filaments intermédiaires (≈10 nm, non polarisés, résistance mécanique, ex. kératines, lamines). Microtubules (≈25 nm, tubuline α/β, polarisés, transport vésiculaire avec kinésines/dynéines, fuseau mitotique, centrosome).', ['actine 7 nm, myosine', 'FI 10 nm, résistance, non polarisés', 'microtubules 25 nm tubuline', 'kinésine / dynéine', 'fuseau mitotique']],
  ],
  'ue3-c4': [
    ['Différencier apoptose et nécrose.', 'Apoptose : mort programmée, active (ATP), cellule isolée, condensation de la chromatine, fragmentation de l’ADN en échelle, corps apoptotiques phagocytés, pas d’inflammation. Nécrose : mort accidentelle, gonflement et lyse cellulaire, libération du contenu, inflammation.', ['apoptose active, programmée', 'corps apoptotiques', 'pas d’inflammation', 'nécrose : lyse + inflammation']],
    ['Décrire les voies intrinsèque et extrinsèque de l’apoptose.', 'Extrinsèque : ligand de mort (FasL, TNF) sur récepteur → DISC → caspase 8. Intrinsèque (mitochondriale) : stress → Bax/Bak perméabilisent la membrane mitochondriale (régulées par Bcl-2), libération du cytochrome c → apoptosome (Apaf-1) → caspase 9. Les deux convergent vers les caspases effectrices 3/7.', ['extrinsèque : récepteur de mort, caspase 8', 'intrinsèque : cytochrome c, Bcl-2/Bax', 'apoptosome caspase 9', 'caspases effectrices 3/7']],
  ],
  'ue3-c5': [
    ['Décrire l’enveloppe nucléaire et le pore nucléaire.', 'Double membrane en continuité avec le RE, doublée de la lamina (lamines). Les complexes du pore nucléaire permettent la diffusion des petites molécules et le transport actif des grosses via les signaux NLS (import, importines) et NES (export, exportines), régulé par le gradient Ran-GTP.', ['double membrane continue avec RE', 'lamina', 'NLS / NES', 'importines / exportines', 'Ran-GTP']],
  ],
  'ue3-c6': [
    ['Comparer récepteurs couplés aux protéines G et récepteurs à activité tyrosine kinase.', 'RCPG : 7 domaines transmembranaires, activent une protéine G hétérotrimérique (échange GDP/GTP) → seconds messagers (AMPc via adénylate cyclase, IP3/DAG via PLC). RTK : un domaine transmembranaire, dimérisation et autophosphorylation sur tyrosines → recrutement de protéines à domaine SH2 → voie Ras-MAPK (prolifération).', ['RCPG 7 TM', 'protéine G, GDP/GTP', 'AMPc, IP3/DAG', 'RTK dimérisation, autophosphorylation', 'Ras-MAPK']],
  ],
  'ue3-c7': [
    ['Comparer microscopie optique et électronique (résolution, préparation).', 'Optique : photons, résolution ≈ 0,2 µm, coupes colorées, observation possible du vivant. Électronique : électrons, résolution ≈ 0,2 nm, sous vide, fixation (glutaraldéhyde, OsO4), coupes ultrafines ; MET (transmission, structure interne) et MEB (balayage, surface).', ['optique 0,2 µm', 'électronique 0,2 nm', 'MET vs MEB', 'fixation et coupes ultrafines']],
  ],
  'ue4-c1': [
    ['Décrire la structure de l’ADN selon Watson et Crick.', 'Double hélice droite de deux brins antiparallèles (5’→3’ / 3’→5’), squelette sucre (désoxyribose)-phosphate à l’extérieur, bases à l’intérieur appariées par liaisons H complémentaires (A=T 2 liaisons, G≡C 3 liaisons) ; forme B, ≈10 pb par tour, grand et petit sillons.', ['double hélice antiparallèle', 'désoxyribose-phosphate', 'A-T 2 liaisons H, G-C 3', 'forme B, sillons']],
  ],
  'ue4-c2': [
    ['Décrire la fourche de réplication et le rôle des principales enzymes.', 'Réplication semi-conservative et bidirectionnelle. Hélicase : ouvre la double hélice ; SSB : stabilisent les simples brins ; topoisomérase : relâche les supertours ; primase : synthétise l’amorce ARN ; ADN polymérase : synthèse 5’→3’ (brin continu et brin discontinu en fragments d’Okazaki) ; ligase : relie les fragments.', ['semi-conservative', 'hélicase, SSB, topoisomérase', 'primase amorce ARN', 'polymérase 5’→3’', 'fragments d’Okazaki, ligase']],
  ],
  'ue4-c3': [
    ['Décrire les étapes de la transcription chez les eucaryotes et la maturation des ARNm.', 'Initiation (facteurs généraux, TATA box, ARN polymérase II), élongation 5’→3’ sur le brin matrice, terminaison. Maturation : coiffe 7-méthylguanosine en 5’, queue poly-A en 3’, épissage des introns par le splicéosome (snRNP).', ['ARN pol II, TATA box', 'synthèse 5’→3’ brin matrice', 'coiffe 5’', 'poly-A 3’', 'épissage splicéosome']],
  ],
  'ue4-c4': [
    ['Décrire les caractéristiques du code génétique.', 'Triplets de nucléotides (codons), 64 codons dont 61 sens et 3 stop (UAA, UAG, UGA), codon initiateur AUG (méthionine). Code redondant (dégénéré), non chevauchant, sans ponctuation, quasi universel.', ['codons triplets', '61 sens / 3 stop', 'AUG initiateur', 'dégénéré, universel']],
  ],
  'ue4-c5': [
    ['Expliquer le fonctionnement de l’opéron lactose.', 'En l’absence de lactose, le répresseur LacI se fixe sur l’opérateur et bloque la transcription des gènes lacZ, lacY, lacA. L’allolactose inactive le répresseur. En l’absence de glucose, l’AMPc élevé active CAP qui stimule la transcription (régulation positive).', ['répresseur sur l’opérateur', 'allolactose inducteur', 'lacZ, lacY, lacA', 'CAP-AMPc si glucose absent']],
  ],
  'ue4-c6': [
    ['Citer les principaux types de mutations ponctuelles et leurs conséquences.', 'Substitutions : transitions (purine ↔ purine) et transversions ; conséquences silencieuses, faux-sens ou non-sens (codon stop). Insertions/délétions : décalage du cadre de lecture si non multiple de 3.', ['transition / transversion', 'silencieuse, faux-sens, non-sens', 'indel → décalage du cadre']],
  ],
  'ue4-c7': [
    ['Expliquer le principe de la PCR.', 'Amplification exponentielle d’une séquence d’ADN par cycles de dénaturation (≈95 °C), hybridation des amorces (≈50-65 °C) et élongation (72 °C) par une ADN polymérase thermostable (Taq). Après n cycles : environ 2^n copies.', ['dénaturation 95 °C', 'hybridation des amorces', 'élongation Taq 72 °C', '2^n copies']],
  ],
  'ue5-c2': [
    ['Décrire les phases du cycle cellulaire et ses points de contrôle.', 'G1 (croissance), S (réplication de l’ADN), G2 (préparation), M (mitose + cytodiérèse) ; G0 = quiescence. Points de contrôle G1/S, G2/M et du fuseau ; régulés par les complexes cycline-CDK, p53 et pRb.', ['G1, S, G2, M', 'G0', 'checkpoints G1/S, G2/M, fuseau', 'cyclines-CDK, p53']],
  ],
  'ue5-c4': [
    ['Décrire les constituants du tissu conjonctif.', 'Cellules (fibroblastes, macrophages, mastocytes, plasmocytes, adipocytes) et matrice extracellulaire abondante : fibres (collagène, élastiques, réticuline) et substance fondamentale (glycosaminoglycanes, protéoglycanes, glycoprotéines d’adhérence). Rôles : soutien, nutrition, défense.', ['fibroblastes', 'fibres collagène et élastiques', 'substance fondamentale GAG', 'soutien, défense']],
  ],
  'ue5-c12': [
    ['Décrire l’organisation générale de l’hématopoïèse.', 'Dans la moelle osseuse, une cellule souche hématopoïétique multipotente (auto-renouvellement) donne des progéniteurs myéloïdes et lymphoïdes, puis des précurseurs reconnaissables, jusqu’aux cellules matures ; régulation par des facteurs de croissance (EPO, G-CSF, TPO…).', ['moelle osseuse', 'cellule souche multipotente', 'lignées myéloïde / lymphoïde', 'facteurs de croissance EPO']],
  ],
  'ue6-c2': [
    ['Décrire les étapes de la fécondation.', 'Capacitation des spermatozoïdes, traversée de la corona radiata, fixation à la zone pellucide (ZP3), réaction acrosomique, fusion des membranes, réaction corticale (blocage de la polyspermie), achèvement de la méiose II de l’ovocyte, formation des pronucléi puis amphimixie.', ['capacitation', 'zone pellucide ZP3', 'réaction acrosomique', 'réaction corticale', 'fin de méiose II, pronucléi']],
  ],
  'ue6-c4': [
    ['Décrire les événements de la deuxième semaine de développement.', '« Semaine des deux » : le bouton embryonnaire forme un disque didermique (épiblaste, hypoblaste), deux cavités (cavité amniotique, lécithocèle primaire puis secondaire), le trophoblaste se divise en cytotrophoblaste et syncytiotrophoblaste ; nidation achevée, mésoderme extra-embryonnaire et cœlome externe.', ['disque didermique épiblaste/hypoblaste', 'cavité amniotique, lécithocèle', 'cyto- et syncytiotrophoblaste', 'cœlome extra-embryonnaire']],
  ],
  'ue7-c1': [
    ['Énoncer les lois de Descartes et définir la vergence d’une lentille.', 'Réflexion : angle de réflexion = angle d’incidence. Réfraction : n1·sin i1 = n2·sin i2 (réflexion totale si n1 > n2 au-delà de l’angle limite). Vergence V = 1/f’ en dioptries (m⁻¹), positive pour une lentille convergente.', ['i = r', 'n1 sin i1 = n2 sin i2', 'réflexion totale', 'V = 1/f’ en dioptries']],
  ],
  'ue8-c4': [
    ['Donner l’intervalle de confiance à 95 % d’une moyenne pour un grand échantillon.', 'IC95 = m ± 1,96 · s / √n (n ≥ 30, s écart-type estimé). L’intervalle contient la vraie moyenne avec une probabilité de 95 % ; sa largeur diminue quand n augmente.', ['m ± 1,96 s/√n', 'grand échantillon n ≥ 30', 'interprétation 95 %', 'largeur ↓ si n ↑']],
  ],
  'ue8-c5': [
    ['Définir risque α, risque β et puissance d’un test.', 'α : probabilité de rejeter H0 alors qu’elle est vraie (erreur de 1re espèce, souvent 5 %). β : probabilité de ne pas rejeter H0 alors qu’elle est fausse (2e espèce). Puissance = 1 − β : probabilité de détecter une différence réelle.', ['α : rejeter H0 vraie', 'β : conserver H0 fausse', 'puissance = 1 − β']],
  ],
};
