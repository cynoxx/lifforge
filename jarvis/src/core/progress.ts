import type { AppState, Block, BlockKind, ChapterProgress, Domain } from './types';
import { ALL_CHAPTERS, type Chapter } from './curriculum';
import { addDays, range, sleepMinutes } from './dates';

export function allChapters(s: AppState): Chapter[] {
  return [...ALL_CHAPTERS, ...(s.customChapters ?? [])];
}

export const emptyProgress = (): ChapterProgress => ({ status: 'todo', reviews: {}, scores: [], minutes: 0 });

export const progressOf = (s: AppState, id: string) => s.chapters[id] ?? emptyProgress();

/** Kinds that count toward adherence (meals, sleep and briefings are informative). */
const TRACKED: BlockKind[] = ['priere', 'reveil-sport', 'chambre', 'hygiene', 'etude', 'td', 'revision', 'test', 'muscu', 'boxe', 'menage', 'examen', 'tache'];
export const isTracked = (b: Block) => TRACKED.includes(b.kind);

export interface Adherence { done: number; total: number; pct: number }

export function adherence(s: AppState, days: Map<string, Block[]>, dates: string[], domain?: Domain, kinds?: BlockKind[]): Adherence {
  let done = 0;
  let total = 0;
  for (const d of dates) {
    for (const b of days.get(d) ?? []) {
      if (!isTracked(b)) continue;
      if (domain && b.domain !== domain) continue;
      if (kinds && !kinds.includes(b.kind)) continue;
      total++;
      const st = s.status[b.id];
      if (st === 'done') done++;
      else if (st === 'partial') done += 0.5;
    }
  }
  return { done, total, pct: total ? Math.round((done / total) * 100) : 0 };
}

/** Consecutive days (ending yesterday, or today if done) where `blockKey` was done. */
export function streak(s: AppState, key: string, todayStr: string, first: string): number {
  let n = 0;
  let d = s.status[`${todayStr}:${key}`] === 'done' ? todayStr : addDays(todayStr, -1);
  while (d >= first && s.status[`${d}:${key}`] === 'done') {
    n++;
    d = addDays(d, -1);
  }
  return n;
}

export function monthRate(s: AppState, key: string, month: string, todayStr: string): { done: number; total: number; pct: number } {
  const [y, m] = month.split('-').map(Number);
  const last = new Date(y, m, 0).getDate();
  const dates = range(`${month}-01`, `${month}-${String(last).padStart(2, '0')}`).filter((d) => d <= todayStr);
  const done = dates.filter((d) => s.status[`${d}:${key}`] === 'done').length;
  return { done, total: dates.length, pct: dates.length ? Math.round((done / dates.length) * 100) : 0 };
}

export function chapterStats(s: AppState, ueId?: string) {
  const list = allChapters(s).filter((c) => !ueId || c.ueId === ueId);
  const by = (st: string) => list.filter((c) => progressOf(s, c.id).status === st).length;
  const scores = list.flatMap((c) => progressOf(s, c.id).scores.map((x) => x.score));
  return {
    total: list.length,
    validated: by('validated'),
    learning: by('learning'),
    rework: by('rework'),
    todo: by('todo'),
    avg: scores.length ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10 : null,
    pct: list.length ? Math.round((by('validated') / list.length) * 100) : 0,
  };
}

/** 0–100 readiness from sleep, energy, soreness and yesterday's adherence. */
export function readiness(s: AppState, date: string, yesterdayPct: number): { score: number; sleepH: number | null; parts: string[] } {
  const ci = s.checkins[date];
  const parts: string[] = [];
  let score = 0;
  let sleepH: number | null = null;
  if (ci?.bed && ci?.wake) {
    sleepH = Math.round((sleepMinutes(ci.bed, ci.wake) / 60) * 10) / 10;
    const sp = Math.max(0, Math.min(40, ((sleepH - 5) / 3) * 40));
    score += sp;
    parts.push(`sommeil ${sleepH} h`);
  } else score += 28;
  const energy = ci?.energy ?? 3;
  score += (energy / 5) * 25;
  const sore = ci?.soreness?.length ?? 0;
  score += Math.max(0, 15 - sore * 5);
  score += (yesterdayPct / 100) * 20;
  return { score: Math.round(Math.min(100, score)), sleepH, parts };
}
