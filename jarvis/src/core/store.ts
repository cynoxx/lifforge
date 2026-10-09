import type { AppState, Card, ChatMessage, CourseDoc } from './types';
import { seedCards } from './srs';
import { today } from './dates';

export function defaultState(): AppState {
  return {
    version: 1,
    settings: {
      name: 'Johan',
      wake: '07:00',
      bed: '23:00',
      gymTime: '18:00',
      boxingDays: [3, 6], // jeudi, dimanche
      cleaningDays: [2, 5], // mercredi, samedi
      sundayCatchup: false,
      autoLockMin: 10,
      voice: true,
      examBlanc: '2026-10-17',
      concours: '2026-12-14',
      validationThreshold: 14,
    },
    status: {},
    checkins: {},
    chapters: {},
    cards: seedCards(today()),
    tasks: [],
    memory: [],
    chat: [],
    log: [],
    docs: [],
    examResults: {},
    customChapters: [],
  };
}

// ─── Partitioning ────────────────────────────────────────────────────────
// The state is split into documents so each stays far below the 256 KiB cap
// and only what changed is written. The same layout is used by both backends,
// and it is what Claude reads when it looks at JARVIS from another chat.
type Parts = Record<string, Record<string, unknown>>;

const MAX_DOC_CHARS = 200_000;

export function toParts(s: AppState): Parts {
  const p: Parts = {
    'jarvis/core': {
      version: s.version, settings: s.settings, status: s.status, checkins: s.checkins,
      examResults: s.examResults, tasks: s.tasks, pinHash: s.pinHash ?? null, pinSalt: s.pinSalt ?? null, pinLen: s.pinLen ?? null,
      webauthnId: s.webauthnId ?? null, log: s.log.slice(-300),
    },
    'jarvis/study': { chapters: s.chapters, customChapters: s.customChapters },
    'jarvis/memory': { memory: s.memory },
  };
  const byUe: Record<string, Card[]> = {};
  for (const c of s.cards) (byUe[c.ueId] ??= []).push(c);
  for (const [ue, cards] of Object.entries(byUe)) p[`cards/${ue}`] = { cards };
  const byDay: Record<string, ChatMessage[]> = {};
  for (const m of s.chat) (byDay[m.at.slice(0, 10)] ??= []).push(m);
  for (const [d, messages] of Object.entries(byDay)) p[`chat/${d}`] = { messages };
  for (const d of s.docs) p[`courses/${d.id}`] = { ...d, text: d.text.slice(0, MAX_DOC_CHARS) };
  return p;
}

export function fromParts(p: Parts): AppState | null {
  const core = p['jarvis/core'] as Partial<AppState> & { pinHash?: string | null; pinSalt?: string | null; webauthnId?: string | null } | undefined;
  if (!core?.settings) return null;
  const base = defaultState();
  const study = (p['jarvis/study'] ?? {}) as Partial<AppState>;
  const cards = Object.entries(p).filter(([k]) => k.startsWith('cards/')).flatMap(([, v]) => (v.cards as Card[]) ?? []);
  const chat = Object.entries(p).filter(([k]) => k.startsWith('chat/')).sort(([a], [b]) => a.localeCompare(b)).flatMap(([, v]) => (v.messages as ChatMessage[]) ?? []);
  const docs = Object.entries(p).filter(([k]) => k.startsWith('courses/')).map(([, v]) => v as unknown as CourseDoc);
  return {
    ...base,
    ...core,
    settings: { ...base.settings, ...core.settings },
    pinHash: core.pinHash ?? undefined,
    pinSalt: core.pinSalt ?? undefined,
    pinLen: (core as { pinLen?: number | null }).pinLen ?? undefined,
    webauthnId: core.webauthnId ?? undefined,
    chapters: study.chapters ?? {},
    customChapters: study.customChapters ?? [],
    memory: ((p['jarvis/memory'] ?? {}) as Partial<AppState>).memory ?? [],
    cards: cards.length ? mergeSeeds(cards) : base.cards,
    chat,
    docs,
    log: core.log ?? [],
  };
}

/** Keep user progress on seed cards, and add seeds introduced by updates. */
function mergeSeeds(cards: Card[]): Card[] {
  const ids = new Set(cards.map((c) => c.id));
  return [...cards, ...seedCards(today()).filter((c) => !ids.has(c.id))];
}

// ─── Backends ────────────────────────────────────────────────────────────
export interface Backend {
  kind: 'cloud' | 'local';
  label: string;
  loadAll(): Promise<Parts>;
  write(path: string, body: Record<string, unknown>): Promise<void>;
  remove(path: string): Promise<void>;
}

const COLLECTIONS = ['jarvis', 'cards', 'chat', 'courses'];

/** claude.ai Artifact store: survives devices, readable by Claude in other chats. */
export async function cloudBackend(): Promise<Backend | null> {
  const w = window as unknown as { claude?: { use(n: string): Promise<unknown> } };
  if (!w.claude?.use) return null;
  type Snap = { id: string; data(): Record<string, unknown> | undefined };
  type DB = {
    collection(p: string): { get(): Promise<{ docs: Snap[] }> };
    doc(p: string): { set(d: Record<string, unknown>): Promise<void>; delete(): Promise<void> };
  };
  const db = (await w.claude.use('db').catch(() => null)) as DB | null;
  if (!db) return null;
  try {
    await db.collection('jarvis').get();
  } catch {
    return null;
  }
  return {
    kind: 'cloud',
    label: 'Mémoire cloud claude.ai',
    async loadAll() {
      const out: Parts = {};
      for (const c of COLLECTIONS) {
        const snap = await db.collection(c).get();
        for (const d of snap.docs) out[`${c}/${d.id}`] = d.data() ?? {};
      }
      return out;
    },
    write: (path, body) => db.doc(path).set(body),
    remove: (path) => db.doc(path).delete(),
  };
}

/** IndexedDB fallback when JARVIS runs outside claude.ai (local / PWA). */
export function localBackend(): Backend {
  const open = () =>
    new Promise<IDBDatabase>((res, rej) => {
      const r = indexedDB.open('jarvis', 1);
      r.onupgradeneeded = () => r.result.createObjectStore('kv');
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    });
  const tx = async <T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>) => {
    const db = await open();
    return new Promise<T>((res, rej) => {
      const req = fn(db.transaction('kv', mode).objectStore('kv'));
      req.onsuccess = () => res(req.result);
      req.onerror = () => rej(req.error);
    });
  };
  return {
    kind: 'local',
    label: 'Stockage local de l’appareil',
    async loadAll() {
      try {
        const keys = (await tx('readonly', (s) => s.getAllKeys())) as string[];
        const vals = (await tx('readonly', (s) => s.getAll())) as Record<string, unknown>[];
        return Object.fromEntries(keys.map((k, i) => [k, vals[i]]));
      } catch {
        return {};
      }
    },
    async write(path, body) {
      await tx('readwrite', (s) => s.put(body, path));
    },
    async remove(path) {
      await tx('readwrite', (s) => s.delete(path));
    },
  };
}

/** Writes only the documents whose content changed, one at a time. */
export class Saver {
  private last = new Map<string, string>();
  private chain: Promise<void> = Promise.resolve();
  private timer: ReturnType<typeof setTimeout> | null = null;
  onError?: (e: unknown) => void;
  onSaved?: () => void;

  constructor(private backend: Backend, initial: Parts) {
    for (const [k, v] of Object.entries(initial)) this.last.set(k, JSON.stringify(v));
  }

  schedule(s: AppState) {
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => this.flush(s), 700);
  }

  flush(s: AppState) {
    const parts = toParts(s);
    this.chain = this.chain.then(async () => {
      try {
        for (const [k, v] of Object.entries(parts)) {
          const json = JSON.stringify(v);
          if (this.last.get(k) === json) continue;
          await this.backend.write(k, v);
          this.last.set(k, json);
        }
        for (const k of [...this.last.keys()]) {
          if (!(k in parts) && !k.startsWith('backups/')) {
            await this.backend.remove(k);
            this.last.delete(k);
          }
        }
        this.onSaved?.();
      } catch (e) {
        this.onError?.(e);
      }
    });
    return this.chain;
  }
}

export function exportJson(s: AppState): string {
  return JSON.stringify({ app: 'JARVIS', exportedAt: new Date().toISOString(), state: s }, null, 1);
}

export function importJson(text: string): AppState {
  const j = JSON.parse(text);
  const st = (j.state ?? j) as AppState;
  if (!st.settings || !st.status) throw new Error('Fichier JARVIS invalide');
  return { ...defaultState(), ...st };
}
