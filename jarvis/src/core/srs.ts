import type { Card } from './types';
import { addDays } from './dates';
import { SEEDS } from './seedCards';

/** Review grades: 0 = oublié, 1 = difficile, 2 = correct, 3 = facile. */
export type Grade = 0 | 1 | 2 | 3;

/** SM-2 scheduling, adapted to a 4-button scale. Returns a new card. */
export function review(card: Card, grade: Grade, on: string): Card {
  const q = [1, 3, 4, 5][grade];
  let { ef, interval, reps, lapses } = card;
  if (q < 3) {
    reps = 0;
    interval = 1;
    lapses += 1;
  } else {
    reps += 1;
    interval = reps === 1 ? 1 : reps === 2 ? 3 : Math.round(interval * ef);
    if (grade === 3) interval = Math.round(interval * 1.3);
  }
  ef = Math.max(1.3, ef + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)));
  return { ...card, ef, interval, reps, lapses, due: addDays(on, interval) };
}

export function newCard(p: Pick<Card, 'id' | 'ueId' | 'chapterId' | 'q' | 'a' | 'keys' | 'source'>, on: string): Card {
  return { ...p, ef: 2.5, interval: 0, reps: 0, due: on, lapses: 0 };
}

export function seedCards(on: string): Card[] {
  const out: Card[] = [];
  for (const [chapterId, list] of Object.entries(SEEDS)) {
    const ueId = chapterId.split('-')[0];
    list.forEach(([q, a, keys], i) =>
      out.push(newCard({ id: `${chapterId}-s${i}`, ueId, chapterId, q, a, keys, source: 'seed' }, on)),
    );
  }
  return out;
}

/** Cards due on or before `on`, but only for chapters already started (J0 passed). */
export function dueCards(cards: Card[], on: string, started: (chapterId: string) => boolean): Card[] {
  return cards.filter((c) => c.due <= on && started(c.chapterId));
}

/** Score /20 from ticked key points (offline written-answer grading). */
export function scoreFromKeys(ticked: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((ticked / total) * 200) / 10;
}
