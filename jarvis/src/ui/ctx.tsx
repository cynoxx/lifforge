import { createContext, useContext } from 'react';
import type { AppState, Block } from '../core/types';
import type { Ai } from '../core/ai';
import type { Backend } from '../core/store';

export type View = 'hud' | 'agenda' | 'etudes' | 'cards' | 'sport' | 'foi' | 'perso' | 'coach' | 'import' | 'settings' | 'checkin';

export interface Jarvis {
  s: AppState;
  set: (fn: (s: AppState) => AppState) => void;
  get: () => AppState;
  today: string;
  nowM: number;
  days: Map<string, Block[]>;
  ai: Ai | null;
  backend: Backend | null;
  toast: (msg: string, tone?: 'info' | 'good' | 'warn') => void;
  speak: (text: string) => void;
  go: (v: View, arg?: string) => void;
  arg?: string;
  download: (filename: string, data: string, mime: string) => Promise<void>;
  lock: () => void;
}

export const Ctx = createContext<Jarvis>(null as unknown as Jarvis);
export const useJ = () => useContext(Ctx);
