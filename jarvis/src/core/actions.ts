import type { AppState, BlockStatus, Card, CheckIn, Domain, LogEvent, Task } from './types';
import { review, type Grade } from './srs';
import { emptyProgress } from './progress';
import { chapterById } from './curriculum';

// Pure state transitions. Every UI action and every Claude tool call goes
// through these, so the history (log) is always complete.

const nowIso = () => new Date().toISOString();
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

export function log(s: AppState, type: string, text: string, domain?: Domain): AppState {
  const e: LogEvent = { at: nowIso(), type, text, domain };
  return { ...s, log: [...s.log, e].slice(-400) };
}

export function setStatus(s: AppState, blockId: string, st: BlockStatus | undefined, title?: string): AppState {
  const status = { ...s.status };
  if (st) status[blockId] = st;
  else delete status[blockId];
  const next = { ...s, status };
  return st ? log(next, `bloc:${st}`, `${title ?? blockId} → ${st === 'done' ? 'fait' : st === 'missed' ? 'raté' : 'partiel'}`) : next;
}

export function checkin(s: AppState, date: string, patch: Partial<CheckIn>): AppState {
  const ci = { ...(s.checkins[date] ?? { date }), ...patch, date };
  return log({ ...s, checkins: { ...s.checkins, [date]: ci } }, 'checkin', `Check-in ${date}${patch.wake ? ` · réveil ${patch.wake}` : ''}${patch.soreness?.length ? ` · courbatures ${patch.soreness.join(', ')}` : ''}`, 'perso');
}

export function addTask(s: AppState, t: Omit<Task, 'id' | 'done' | 'createdAt'>): AppState {
  const task: Task = { ...t, id: uid(), done: false, createdAt: nowIso() };
  return log({ ...s, tasks: [...s.tasks, task] }, 'tache', `Nouvelle tâche : ${t.title}`, t.domain);
}

export function toggleTask(s: AppState, id: string): AppState {
  return { ...s, tasks: s.tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)) };
}

export function removeTask(s: AppState, id: string): AppState {
  return { ...s, tasks: s.tasks.filter((t) => t.id !== id) };
}

export function remember(s: AppState, text: string, tags: string[] = []): AppState {
  return log({ ...s, memory: [...s.memory, { id: uid(), text, tags, at: nowIso() }] }, 'memoire', text);
}

export function forget(s: AppState, id: string): AppState {
  return { ...s, memory: s.memory.filter((m) => m.id !== id) };
}

export function startChapter(s: AppState, chapterId: string, date: string): AppState {
  const p = s.chapters[chapterId] ?? emptyProgress();
  if (p.j0) return s;
  return log({ ...s, chapters: { ...s.chapters, [chapterId]: { ...p, status: 'learning', j0: date } } }, 'chapitre', `J0 : ${chapterById(chapterId)?.title ?? chapterId}`, 'etudes');
}

export function setChapterStatus(s: AppState, chapterId: string, status: AppState['chapters'][string]['status']): AppState {
  const p = s.chapters[chapterId] ?? emptyProgress();
  return { ...s, chapters: { ...s.chapters, [chapterId]: { ...p, status } } };
}

/** Records a test score; ≥ threshold → VALIDÉ, otherwise À RETRAVAILLER. */
export function recordScore(s: AppState, chapterId: string, score: number, mode: 'ia' | 'auto', date: string): AppState {
  const p = s.chapters[chapterId] ?? emptyProgress();
  const ok = score >= s.settings.validationThreshold;
  const next: AppState['chapters'][string] = {
    ...p,
    j0: p.j0 ?? date,
    status: ok ? 'validated' : 'rework',
    scores: [...p.scores, { date, score, mode }],
  };
  const title = chapterById(chapterId)?.title ?? s.customChapters.find((c) => c.id === chapterId)?.title ?? chapterId;
  return log({ ...s, chapters: { ...s.chapters, [chapterId]: next } }, ok ? 'valide' : 'retravailler', `${title} : ${score}/20 → ${ok ? 'VALIDÉ' : 'À RETRAVAILLER'}`, 'etudes');
}

export function reviewCard(s: AppState, cardId: string, grade: Grade, date: string): AppState {
  return { ...s, cards: s.cards.map((c) => (c.id === cardId ? review(c, grade, date) : c)) };
}

export function addCards(s: AppState, cards: Card[]): AppState {
  return log({ ...s, cards: [...s.cards, ...cards] }, 'cartes', `${cards.length} flashcards ajoutées`, 'etudes');
}

export function setExamResult(s: AppState, ueId: string, note: number | undefined): AppState {
  const r = { ...s.examResults };
  if (note === undefined || Number.isNaN(note)) delete r[ueId];
  else r[ueId] = note;
  return { ...s, examResults: r };
}

export { uid };
