import type { AppState, Block, BlockKind, Domain } from './types';
import { addDays, range, toHHMM, toMin, weekday } from './dates';
import { UES, ueById, type Chapter } from './curriculum';
import { gymDayFor, isGymWeekday, blockedForGym, PLAN_START } from './sport';
import { allChapters } from './progress';

export { PLAN_START };
export const REVIEW_OFFSETS = [1, 3, 7, 14, 30] as const;

export type Phase = { id: string; name: string; from: string; to: string; goal: string };

export function phases(s: AppState): Phase[] {
  const eb = s.settings.examBlanc;
  const cc = s.settings.concours;
  return [
    { id: 'p1', name: 'Blitz examen blanc', from: PLAN_START, to: addDays(eb, -1), goal: 'Mineures (Chimie, Biochimie, Bio cell) et TDs en priorité absolue. Exercices de Biostats, Physique, Bio mol.' },
    { id: 'eb', name: 'Examen blanc', from: eb, to: eb, goal: 'Toutes les matières sauf Histologie et Embryologie.' },
    { id: 'p2', name: 'Couverture totale', from: addDays(eb, 1), to: addDays(cc, -22), goal: 'Premier passage de toutes les UE, Histo et Embryo comprises. Plus de temps sur les UE faibles à l’examen blanc.' },
    { id: 'p3', name: 'Rédaction & annales', from: addDays(cc, -21), to: addDays(cc, -8), goal: 'Annales rédactionnelles chronométrées, reprise des chapitres « à retravailler », concours blanc le samedi.' },
    { id: 'p4', name: 'Affûtage', from: addDays(cc, -7), to: addDays(cc, -1), goal: 'Plus de nouveau contenu. Fiches, flashcards, sommeil protégé, charge sportive allégée.' },
    { id: 'cc', name: 'Concours', from: cc, to: addDays(cc, 4), goal: 'Semaine du concours PASS.' },
  ];
}

export function phaseOf(s: AppState, date: string): Phase {
  return phases(s).find((p) => date >= p.from && date <= p.to) ?? phases(s)[phases(s).length - 1];
}

// ─── Study projection ────────────────────────────────────────────────────
export interface StudySlot {
  kind: 'learn' | 'gate' | 'annale' | 'rework' | 'fiches' | 'td-mix';
  ueId: string;
  chapter?: Chapter;
  label: string;
}

export interface StudyDay {
  date: string;
  slots: StudySlot[]; // [morning, afternoon]
  reviews: { chapter: Chapter; offset: number }[];
  learned: Chapter[];
}

const isStarted = (s: AppState, id: string) => {
  const p = s.chapters[id];
  return !!p && (p.status !== 'todo' || !!p.j0);
};

/**
 * Simulates the study schedule from PLAN_START to the concours. Past days keep
 * their projection; from `today` on, the simulation restarts from the real
 * state of every chapter, so the plan always continues from reality.
 */
export function projectStudy(s: AppState, todayStr: string): Map<string, StudyDay> {
  const out = new Map<string, StudyDay>();
  const chapters = allChapters(s);
  const byUe = (ueId: string) => chapters.filter((c) => c.ueId === ueId).sort((a, b) => a.n - b.n);
  const learnedOn = new Map<string, string>();
  let done = new Set<string>();
  let gates = new Set<string>(); // chapters to validate before moving on in their UE
  let rotA = 0;
  let rotB = 0;

  const resetFromReality = () => {
    done = new Set(chapters.filter((c) => isStarted(s, c.id)).map((c) => c.id));
    gates = new Set(chapters.filter((c) => ['learning', 'rework'].includes(s.chapters[c.id]?.status ?? '')).map((c) => c.id));
    for (const k of [...learnedOn.keys()]) if (!done.has(k)) learnedOn.delete(k);
    for (const c of chapters) {
      const j0 = s.chapters[c.id]?.j0;
      if (j0) learnedOn.set(c.id, j0);
    }
  };

  const weakness = (ueId: string) => {
    const r = s.examResults[ueId];
    return r === undefined ? 1 : r < 8 ? 2.2 : r < 10 ? 1.7 : r < 12 ? 1.3 : 1;
  };

  /** Next action for a UE: validate a pending chapter, or learn the next one. */
  const nextFor = (ueId: string, date: string): StudySlot | null => {
    const gate = [...gates].map((id) => chapters.find((c) => c.id === id)!).find((c) => c?.ueId === ueId);
    if (gate) {
      gates.delete(gate.id);
      return { kind: 'gate', ueId, chapter: gate, label: `Valider « ${gate.title} » avant d’avancer` };
    }
    const next = byUe(ueId).find((c) => !done.has(c.id));
    if (!next) return null;
    done.add(next.id);
    learnedOn.set(next.id, date);
    return { kind: 'learn', ueId, chapter: next, label: next.title };
  };

  const pick = (pool: string[], rot: number, date: string, avoid?: string): [StudySlot | null, number] => {
    // Weighted round-robin: weak UEs appear several times in the cycle.
    const cycle = pool.flatMap((id) => Array(Math.round(weakness(id) * 2)).fill(id) as string[]);
    for (let k = 0; k < cycle.length; k++) {
      const ueId = cycle[(rot + k) % cycle.length];
      if (ueId === avoid) continue;
      const slot = nextFor(ueId, date);
      if (slot) return [slot, rot + k + 1];
    }
    return [null, rot + 1];
  };

  const minors = UES.filter((u) => u.mineure).map((u) => u.id);
  const others = UES.filter((u) => !u.mineure).map((u) => u.id);
  const examUes = UES.filter((u) => u.inExamBlanc && !u.mineure).map((u) => u.id);

  const end = addDays(s.settings.concours, 4);
  for (const date of range(PLAN_START, end)) {
    if (date === todayStr) resetFromReality();
    const ph = phaseOf(s, date);
    const sunday = weekday(date) === 6;
    const day: StudyDay = { date, slots: [], reviews: [], learned: [] };

    if (ph.id === 'p1' || ph.id === 'p2') {
      const poolA = minors.some((id) => byUe(id).some((c) => !done.has(c.id))) ? minors : [...minors, ...others];
      const [a, ra] = pick(poolA, rotA, date);
      rotA = ra;
      if (a) day.slots.push(a);
      if (!sunday) {
        const poolB = ph.id === 'p1' ? [...minors, ...examUes] : [...others, ...minors];
        const [b, rb] = pick(poolB, rotB, date, a?.ueId);
        rotB = rb;
        if (b) day.slots.push(b);
        else if (ph.id === 'p1') day.slots.push({ kind: 'td-mix', ueId: examUes[rotB % examUes.length], label: 'Exercices type examen' });
      }
      if (!day.slots.length) day.slots.push(reworkSlot(s, chapters, date));
    } else if (ph.id === 'p3') {
      const ue = UES[(range(ph.from, date).length - 1) % UES.length];
      day.slots.push({ kind: 'annale', ueId: ue.id, label: `Annale rédactionnelle chronométrée — ${ue.short}` });
      if (!sunday) day.slots.push(reworkSlot(s, chapters, date));
    } else if (ph.id === 'p4') {
      const ue = UES[(range(ph.from, date).length - 1) % UES.length];
      day.slots.push({ kind: 'fiches', ueId: ue.id, label: `Fiches & questions de cours — ${ue.short}` });
    }

    day.learned = day.slots.filter((x) => x.kind === 'learn' && x.chapter).map((x) => x.chapter!);
    for (const [cid, d0] of learnedOn) {
      const off = REVIEW_OFFSETS.find((o) => addDays(d0, o) === date);
      if (off) day.reviews.push({ chapter: chapters.find((c) => c.id === cid)!, offset: off });
    }
    out.set(date, day);
  }
  return out;
}

function reworkSlot(s: AppState, chapters: Chapter[], date: string): StudySlot {
  const scored = chapters
    .map((c) => {
      const p = s.chapters[c.id];
      const last = p?.scores.at(-1)?.score;
      return { c, prio: p?.status === 'rework' ? -1 : last ?? 10 };
    })
    .sort((a, b) => a.prio - b.prio);
  const pickIdx = Math.abs(hash(date)) % Math.min(6, scored.length);
  const c = scored[pickIdx].c;
  return { kind: 'rework', ueId: c.ueId, chapter: c, label: `Reprise ciblée — ${c.title}` };
}

const hash = (str: string) => [...str].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) | 0, 7);

// ─── Day builder ─────────────────────────────────────────────────────────
const mk = (date: string, key: string, start: number, end: number, kind: BlockKind, domain: Domain, title: string, extra: Partial<Block> = {}): Block => ({
  id: `${date}:${key}`, date, start: toHHMM(start), end: toHHMM(end), kind, domain, title, ...extra,
});

export function buildDay(s: AppState, date: string, study: Map<string, StudyDay>, todayStr: string): Block[] {
  const { settings } = s;
  const ci = s.checkins[date];
  const wake = toMin(ci?.wake ?? settings.wake);
  const bed = toMin(settings.bed) || 1440;
  const bedM = bed < 600 ? bed + 1440 : bed;
  const wd = weekday(date);
  const ph = phaseOf(s, date);
  const B: Block[] = [];

  // Morning routine — anchored on the real wake-up time.
  B.push(mk(date, 'priere-matin', wake, wake + 10, 'priere', 'foi', 'Prière du matin', { critical: true, detail: 'Dès le réveil, avant toute autre chose.' }));
  B.push(mk(date, 'reveil-sport', wake + 10, wake + 30, 'reveil-sport', 'sport', 'Abdos + shadow boxing', { detail: '20 min · sans exception, même les jours de repos.' }));
  B.push(mk(date, 'chambre', wake + 30, wake + 40, 'chambre', 'perso', 'Ranger la chambre'));
  B.push(mk(date, 'hygiene-matin', wake + 40, wake + 75, 'hygiene', 'perso', 'Douche, hygiène & petit-déjeuner'));

  const dayStudy = study.get(date);
  const exam = ph.id === 'eb';
  const concours = ph.id === 'cc';
  let cursor = Math.max(toMin('08:30'), wake + 90);
  B.push(mk(date, 'briefing', wake + 75, wake + 90, 'briefing', 'etudes', 'Briefing JARVIS + flashcards du jour', { detail: 'Lis le plan, fais les cartes dues.' }));

  if (exam || concours) {
    const t = exam ? 'EXAMEN BLANC' : 'CONCOURS PASS';
    const d = exam ? 'Toutes matières sauf Histo/Embryo · horaires à confirmer' : 'Épreuves rédactionnelles · horaires à confirmer';
    B.push(mk(date, 'exam-am', Math.max(cursor, toMin('08:00')), toMin('12:00'), 'examen', 'etudes', t, { critical: true, detail: d }));
    B.push(mk(date, 'dejeuner', toMin('12:00'), toMin('13:00'), 'repas', 'perso', 'Déjeuner léger'));
    B.push(mk(date, 'exam-pm', toMin('14:00'), toMin('17:00'), 'examen', 'etudes', t, { critical: true, detail: d }));
    B.push(mk(date, 'recup', toMin('17:30'), toMin('18:30'), 'recup', 'sport', 'Marche + mobilité', { detail: 'Décompression. Pas de séance lourde.' }));
  } else {
    const slots = dayStudy?.slots ?? [];
    const sunday = wd === 6;
    const p4 = ph.id === 'p4';
    // Morning: learn (2h) + TD (1h45)
    const am = slots[0];
    const pm = slots[1];
    if (am) {
      const s1End = toMin('10:30');
      if (s1End - cursor >= 45) B.push(studyBlock(date, 's1', cursor, s1End, am, 'learn'));
      B.push(studyBlock(date, 's2', Math.max(toMin('10:45'), cursor), toMin('12:30'), am, 'td'));
    }
    B.push(mk(date, 'dejeuner', toMin('12:30'), toMin('13:30'), 'repas', 'perso', 'Déjeuner'));
    if (sunday && !p4) {
      B.push(mk(date, 'bilan', toMin('14:00'), toMin('16:00'), 'test', 'etudes', 'Bilan hebdo : test rédactionnel chronométré', { detail: 'Une question par chapitre vu cette semaine. Correction par JARVIS → VALIDÉ / À RETRAVAILLER.' }));
    } else if (pm) {
      B.push(studyBlock(date, 's3', toMin('13:30'), toMin('15:30'), pm, 'learn'));
      B.push(studyBlock(date, 's4', toMin('15:45'), toMin('17:30'), pm, 'td'));
    } else if (p4) {
      B.push(mk(date, 's3', toMin('14:00'), toMin('16:00'), 'revision', 'etudes', 'Flashcards & récitation à voix haute', { detail: 'Pas de nouveau contenu. Consolidation uniquement.' }));
    }
    if (ph.id === 'p3' && wd === 5) {
      // Saturday mock exam replaces the morning.
      const sMorning = B.filter((b) => b.id.endsWith(':s1') || b.id.endsWith(':s2'));
      sMorning.forEach((b) => B.splice(B.indexOf(b), 1));
      B.push(mk(date, 'concours-blanc', cursor, toMin('12:30'), 'examen', 'etudes', 'Concours blanc (conditions réelles)', { critical: true, detail: 'Sujet d’annale, chrono, sans notes. Correction par JARVIS l’après-midi.' }));
    }
  }

  // Sport — evening slot.
  const gymT = toMin(settings.gymTime);
  const gym = gymDayFor(s, date, todayStr);
  if (!exam && !concours) {
    if (s.settings.boxingDays.includes(wd)) {
      B.push(mk(date, 'boxe', gymT, gymT + 75, 'boxe', 'sport', 'Boxe — 45 min', { detail: 'Trajet compris. Échauffement, technique, sparring/sac.' }));
      if (gym) B.push(mk(date, 'muscu', toMin('10:00'), toMin('11:30'), 'muscu', 'sport', `Muscu — ${gym.session}`, { session: gym.session, detail: gym.note }));
    } else if (gym) {
      const deload = ph.id === 'p4' ? ' · semaine de décharge −40 %' : '';
      B.push(mk(date, 'muscu', gymT, gymT + 90, 'muscu', 'sport', `Muscu — ${gym.session}`, { session: gym.session, detail: (gym.note ?? 'Trajet compris') + deload }));
    } else if (isGymWeekday(s, date) && !blockedForGym(s, date)) {
      B.push(mk(date, 'recup', gymT, gymT + 45, 'recup', 'sport', 'Récupération active', { detail: 'Split déjà bouclé cette semaine. Marche, étirements.' }));
    }
  }

  // Evening.
  const dinner = gymT + 90;
  B.push(mk(date, 'diner', dinner, dinner + 45, 'repas', 'perso', 'Dîner'));
  let ev = dinner + 45;
  if (s.settings.cleaningDays.includes(wd) && !concours) {
    B.push(mk(date, 'menage', ev, ev + 45, 'menage', 'perso', 'Laver le logement', { detail: 'Sols, cuisine, salle de bain.' }));
    ev += 45;
  }
  const revEnd = bedM - 30;
  if (dayStudy && !concours && revEnd - ev >= 30) {
    const rv = dayStudy.reviews;
    const detail = rv.length
      ? rv.map((r) => `J${r.offset} · ${ueById(r.chapter.ueId).short} — ${r.chapter.title}`).join('\n')
      : 'Flashcards dues + relecture de la journée.';
    B.push(mk(date, 's5', ev, revEnd, 'revision', 'etudes', exam ? 'Débrief de l’examen blanc' : `Révisions espacées${rv.length ? ` (${rv.length})` : ''}`, { detail: exam ? 'Note tes résultats par UE dans JARVIS : le plan se recalcule.' : detail }));
  }
  B.push(mk(date, 'hygiene-soir', bedM - 30, bedM - 15, 'hygiene', 'perso', 'Hygiène du soir'));
  B.push(mk(date, 'priere-soir', bedM - 15, bedM - 5, 'priere', 'foi', 'Prière du soir', { critical: true }));
  B.push(mk(date, 'coucher', bedM, bedM + 480, 'sommeil', 'perso', 'Coucher — 8 h de sommeil', { detail: 'Écrans coupés. Le sommeil consolide la mémoire.' }));

  // User tasks dated today.
  for (const t of s.tasks.filter((t) => t.date === date && t.time)) {
    const st = toMin(t.time!);
    B.push(mk(date, `task-${t.id}`, st, st + 30, 'tache', t.domain, t.title));
  }
  return B.sort((a, b) => toMin(a.start) - toMin(b.start));
}

function studyBlock(date: string, key: string, start: number, end: number, slot: StudySlot, part: 'learn' | 'td'): Block {
  const ue = ueById(slot.ueId);
  const c = slot.chapter;
  let kind: BlockKind = part === 'learn' ? 'etude' : 'td';
  let title = '';
  let detail = '';
  switch (slot.kind) {
    case 'learn':
      title = part === 'learn' ? `${ue.short} · J0 — ${c!.title}` : `${ue.short} · TD — ${c!.title}`;
      detail = part === 'learn'
        ? 'Apprentissage actif : lecture, fiche, schémas. Termine par 3 questions rédigées de mémoire.'
        : 'TD du chapitre, à refaire jusqu’à maîtrise. Puis test de validation JARVIS.';
      break;
    case 'gate':
      kind = 'test';
      title = part === 'learn' ? `${ue.short} · Retravail — ${c!.title}` : `${ue.short} · Test de validation — ${c!.title}`;
      detail = 'Chapitre non validé : on ne passe pas au suivant tant qu’il n’est pas VALIDÉ.';
      break;
    case 'annale':
      kind = part === 'learn' ? 'test' : 'td';
      title = part === 'learn' ? slot.label : `${ue.short} · Correction & reprise des erreurs`;
      detail = part === 'learn' ? 'Conditions réelles, chrono, rédaction complète.' : 'Compare à la correction, note les points manqués, crée des flashcards.';
      break;
    case 'rework':
      kind = part === 'learn' ? 'etude' : 'test';
      title = part === 'learn' ? slot.label : `${ue.short} · Test — ${c!.title}`;
      detail = 'Chapitre faible ou à retravailler.';
      break;
    case 'fiches':
      kind = 'revision';
      title = part === 'learn' ? slot.label : `${ue.short} · Questions de cours à l’oral`;
      detail = 'Consolidation, aucune nouveauté.';
      break;
    case 'td-mix':
      kind = 'td';
      title = `${ue.short} · ${slot.label}`;
      detail = 'Exercices des TDs fournis, en conditions d’examen.';
  }
  return mk(date, key, start, end, kind, 'etudes', title, { ueId: ue.id, chapterId: c?.id, detail });
}

export function planDays(s: AppState, from: string, to: string, todayStr: string): Map<string, Block[]> {
  const study = projectStudy(s, todayStr);
  const out = new Map<string, Block[]>();
  for (const d of range(from, to)) out.set(d, buildDay(s, d, study, todayStr));
  return out;
}
