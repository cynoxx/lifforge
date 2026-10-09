import type { AppState, GymSession, MuscleZone } from './types';
import { addDays, mondayOf, weekday, range } from './dates';

/** First day covered by JARVIS. */
export const PLAN_START = '2026-10-08';

export const SPLIT: GymSession[] = ['Push', 'Pull', 'Legs', 'Upper', 'Lower'];

export const TARGETS: Record<GymSession, MuscleZone[]> = {
  Push: ['pecs', 'epaules', 'bras'],
  Pull: ['dos', 'bras'],
  Legs: ['jambes'],
  Upper: ['pecs', 'dos', 'epaules', 'bras'],
  Lower: ['jambes', 'abdos'],
  'Full body': ['pecs', 'dos', 'jambes', 'epaules', 'bras'],
  Mobilité: [],
};

export const ZONE_LABEL: Record<MuscleZone, string> = {
  pecs: 'Pectoraux', dos: 'Dos', jambes: 'Jambes', epaules: 'Épaules', bras: 'Bras', abdos: 'Abdos',
};

export interface GymDay {
  date: string;
  session: GymSession;
  note?: string;
  missed?: boolean;
}

export const muscuId = (date: string) => `${date}:muscu`;

/** Days where the gym is impossible (exam blanc, concours week). */
export function blockedForGym(s: AppState, date: string): boolean {
  const { examBlanc, concours } = s.settings;
  return date === examBlanc || (date >= concours && date <= addDays(concours, 4));
}

export function isGymWeekday(s: AppState, date: string): boolean {
  return !s.settings.boxingDays.includes(weekday(date));
}

/**
 * Assigns the Push → Pull → Legs → Upper → Lower split to one week, replaying
 * what really happened: a missed session is re-queued on the next gym day,
 * and when fewer gym days remain than sessions, the plan realigns by dropping
 * the sessions best covered by the others (Upper, then Lower) or merging into
 * a full body. Soreness reported today swaps or downgrades today's session.
 */
export function planGymWeek(s: AppState, anyDate: string, todayStr: string): GymDay[] {
  const mon = mondayOf(anyDate);
  const days = range(mon, addDays(mon, 6)).filter((d) => d >= PLAN_START && isGymWeekday(s, d) && !blockedForGym(s, d));
  const partialFirstWeek = mon < PLAN_START;
  const queue = [...SPLIT];
  const out: GymDay[] = [];

  days.forEach((d, i) => {
    const remainingDays = days.length - i;
    const notes: string[] = [];
    while (!partialFirstWeek && queue.length > remainingDays) {
      const drop = queue.includes('Upper') ? 'Upper' : queue.includes('Lower') ? 'Lower' : null;
      if (drop) {
        queue.splice(queue.indexOf(drop), 1);
        notes.push(`${drop} retirée pour réaligner la semaine`);
      } else {
        queue.splice(0, 2, 'Full body');
        notes.push('Séances fusionnées en full body');
      }
    }
    let session = queue.shift();
    if (!session) return;

    const sore = d === todayStr ? s.checkins[d]?.soreness ?? [] : [];
    if (sore.length && TARGETS[session].some((z) => sore.includes(z))) {
      const alt = queue.findIndex((q) => !TARGETS[q].some((z) => sore.includes(z)));
      if (alt >= 0) {
        const swapped = queue.splice(alt, 1, session)[0];
        notes.push(`Courbatures (${sore.map((z) => ZONE_LABEL[z]).join(', ')}) : ${session} décalée, ${swapped} à la place`);
        session = swapped;
      } else {
        queue.unshift(session);
        notes.push(`Courbatures : ${session} reportée, séance mobilité`);
        session = 'Mobilité';
      }
    }

    const missed = d < todayStr && s.status[muscuId(d)] === 'missed';
    if (missed && session !== 'Mobilité') {
      queue.unshift(session);
      notes.push(`${session} ratée → reportée`);
    }
    out.push({ date: d, session, missed, note: notes.join(' · ') || undefined });
  });

  // Optional Sunday catch-up for anything still pending.
  if (queue.length && s.settings.sundayCatchup) {
    const sun = addDays(mon, 6);
    if (sun >= todayStr && !blockedForGym(s, sun)) {
      out.push({ date: sun, session: queue.length > 1 ? 'Full body' : queue[0], note: 'Rattrapage du dimanche matin' });
    }
  }
  return out;
}

export function gymDayFor(s: AppState, date: string, todayStr: string): GymDay | undefined {
  return planGymWeek(s, date, todayStr).find((g) => g.date === date);
}
