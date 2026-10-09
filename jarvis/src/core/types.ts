// ─── JARVIS domain model ──────────────────────────────────────────────
export type Domain = 'foi' | 'etudes' | 'sport' | 'perso';

export type BlockKind =
  | 'priere' | 'reveil-sport' | 'chambre' | 'hygiene' | 'repas' | 'briefing'
  | 'etude' | 'td' | 'revision' | 'test' | 'pause' | 'muscu' | 'boxe'
  | 'menage' | 'sommeil' | 'examen' | 'tache' | 'recup';

export type BlockStatus = 'done' | 'missed' | 'partial';

/** One timed block in a generated day. Ids are deterministic (date + slot key). */
export interface Block {
  id: string;
  date: string; // YYYY-MM-DD
  start: string; // HH:mm
  end: string;
  kind: BlockKind;
  domain: Domain;
  title: string;
  detail?: string;
  ueId?: string;
  chapterId?: string;
  session?: GymSession;
  critical?: boolean;
}

export type GymSession = 'Push' | 'Pull' | 'Legs' | 'Upper' | 'Lower' | 'Full body' | 'Mobilité';
export type MuscleZone = 'pecs' | 'dos' | 'jambes' | 'epaules' | 'bras' | 'abdos';

export interface CheckIn {
  date: string;
  wake?: string; // actual wake HH:mm
  bed?: string; // bedtime of the previous night HH:mm
  energy?: number; // 1..5
  mood?: number; // 1..5
  soreness?: MuscleZone[];
  note?: string;
}

export interface Settings {
  name: string;
  wake: string;
  bed: string;
  gymTime: string;
  boxingDays: number[]; // 0 = lundi
  cleaningDays: number[];
  sundayCatchup: boolean;
  autoLockMin: number;
  voice: boolean;
  examBlanc: string; // YYYY-MM-DD
  concours: string; // YYYY-MM-DD (first day of the concours week)
  validationThreshold: number; // /20
}

export type ChapterStatus = 'todo' | 'learning' | 'validated' | 'rework';

export interface ChapterProgress {
  status: ChapterStatus;
  j0?: string; // date learned
  reviews: Record<string, number>; // 'J1' -> mastery % ; date keyed by offset label
  scores: { date: string; score: number; mode: 'ia' | 'auto' }[];
  minutes: number;
  summary?: string;
}

export interface Card {
  id: string;
  ueId: string;
  chapterId: string;
  q: string;
  a: string;
  keys: string[]; // key points a written answer must contain (used for grading)
  // SM-2
  ef: number;
  interval: number;
  reps: number;
  due: string; // YYYY-MM-DD
  lapses: number;
  source: 'seed' | 'ia' | 'user';
}

export interface Task {
  id: string;
  title: string;
  date?: string; // one-off date, or undefined for backlog
  time?: string;
  domain: Domain;
  done: boolean;
  createdAt: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  at: string; // ISO
  tags?: string[];
}

export interface Memory {
  id: string;
  text: string;
  tags: string[];
  at: string;
}

export interface LogEvent {
  at: string;
  type: string;
  text: string;
  domain?: Domain;
}

export interface CourseDoc {
  id: string;
  ueId: string;
  chapterId?: string;
  title: string;
  text: string; // pasted / extracted text (indexed for search)
  at: string;
}

export interface AppState {
  version: 1;
  settings: Settings;
  status: Record<string, BlockStatus>; // block id -> status
  checkins: Record<string, CheckIn>;
  chapters: Record<string, ChapterProgress>;
  cards: Card[];
  tasks: Task[];
  memory: Memory[];
  chat: ChatMessage[];
  log: LogEvent[];
  docs: CourseDoc[];
  examResults: Record<string, number>; // ueId -> /20 from exam blanc
  customChapters: import('./curriculum').Chapter[]; // chapters created from imported course files
  pinHash?: string;
  pinSalt?: string;
  pinLen?: number;
  webauthnId?: string;
}
