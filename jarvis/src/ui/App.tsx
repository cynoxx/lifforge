import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Ctx, useJ, type Jarvis, type View } from './ctx';
import { Lock } from './Lock';
import { Hud } from './Hud';
import { Agenda } from './Agenda';
import { Etudes } from './Etudes';
import { Cards, Sport, Foi, Perso, CheckInView } from './Domains';
import { Coach } from './Coach';
import { Import } from './Import';
import { Settings } from './Settings';
import type { AppState } from '../core/types';
import { cloudBackend, defaultState, fromParts, localBackend, Saver, toParts, type Backend } from '../core/store';
import { connectAi, type Ai } from '../core/ai';
import { planDays, PLAN_START } from '../core/planner';
import { addDays, diffDays, nowMin, today as todayFn, toMin, weekday } from '../core/dates';
import { speak as say, setVoiceEnabled } from '../core/voice';
import * as A from '../core/actions';

const NAV: { v: View; label: string; icon: string }[] = [
  { v: 'hud', label: 'HUD', icon: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zm0 4a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0 3a2 2 0 1 0 0 4 2 2 0 0 0 0-4z' },
  { v: 'agenda', label: 'Agenda', icon: 'M4 6h16v14H4zM4 10h16M9 3v4M15 3v4' },
  { v: 'etudes', label: 'Études', icon: 'M3 8l9-4 9 4-9 4zM7 10v5c0 1.5 2.5 3 5 3s5-1.5 5-3v-5' },
  { v: 'cards', label: 'Cartes', icon: 'M5 6h11v13H5zM8 3h11v13' },
  { v: 'sport', label: 'Sport', icon: 'M4 10v4M7 7v10M17 7v10M20 10v4M7 12h10' },
  { v: 'foi', label: 'Dieu', icon: 'M12 3v18M7 8h10' },
  { v: 'perso', label: 'Perso', icon: 'M4 11l8-6 8 6v8H4zM10 19v-5h4v5' },
  { v: 'coach', label: 'Coach', icon: 'M4 5h16v11H9l-5 4z' },
  { v: 'import', label: 'Import', icon: 'M12 4v11M7 10l5 5 5-5M4 19h16' },
  { v: 'settings', label: 'Réglages', icon: 'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM4 12h2M18 12h2M12 4v2M12 18v2M6.3 6.3l1.4 1.4M16.3 16.3l1.4 1.4M6.3 17.7l1.4-1.4M16.3 7.7l1.4-1.4' },
];

export function App() {
  const [s, setS] = useState<AppState | null>(null);
  const ref = useRef<AppState | null>(null);
  const [backend, setBackend] = useState<Backend | null>(null);
  const saver = useRef<Saver | null>(null);
  const [locked, setLocked] = useState(true);
  const [view, setView] = useState<View>('hud');
  const [arg, setArg] = useState<string | undefined>();
  const [ai, setAi] = useState<Ai | null>(null);
  const [today, setToday] = useState(todayFn());
  const [nowM, setNowM] = useState(nowMin());
  const [toasts, setToasts] = useState<{ id: number; msg: string; tone: string }[]>([]);
  const [sync, setSync] = useState<'ok' | 'saving' | 'error'>('ok');
  const [palette, setPalette] = useState(false);

  // Boot: pick the storage backend and load the state.
  useEffect(() => {
    (async () => {
      const be = (await cloudBackend()) ?? localBackend();
      const parts = await be.loadAll().catch(() => ({}));
      const st = fromParts(parts) ?? defaultState();
      ref.current = st;
      setBackend(be);
      saver.current = new Saver(be, parts);
      saver.current.onError = () => setSync('error');
      saver.current.onSaved = () => setSync('ok');
      if (!Object.keys(parts).length) saver.current.flush(st);
      setS(st);
      setAi(await connectAi());
    })();
  }, []);

  const set = useCallback((fn: (x: AppState) => AppState) => {
    const next = fn(ref.current!);
    ref.current = next;
    setS(next);
    setSync('saving');
    saver.current?.schedule(next);
  }, []);
  const get = useCallback(() => ref.current!, []);

  const toast = useCallback((msg: string, tone = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t.slice(-3), { id, msg, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 6500);
  }, []);

  // Clock.
  useEffect(() => {
    const t = setInterval(() => {
      setToday(todayFn());
      setNowM(nowMin());
    }, 20_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => setVoiceEnabled(!!s?.settings.voice), [s?.settings.voice]);

  const end = s ? addDays(s.settings.concours, 4) : today;
  const days = useMemo(() => (s ? planDays(s, PLAN_START, end, today) : new Map()), [s, end, today]);

  // Contextual reminders while JARVIS is open: 5 min before each block.
  const notified = useRef(new Set<string>());
  useEffect(() => {
    if (!s || locked) return;
    for (const b of days.get(today) ?? []) {
      const delta = toMin(b.start) - nowM;
      if (delta >= 0 && delta <= 5 && !notified.current.has(b.id) && !['repas', 'hygiene', 'sommeil'].includes(b.kind)) {
        notified.current.add(b.id);
        const msg = `Dans ${delta || 'moins d’une'} minute${delta > 1 ? 's' : ''} : ${b.title}`;
        toast(msg, b.critical ? 'warn' : 'info');
        say(msg);
        try {
          if (typeof Notification !== 'undefined' && Notification.permission === 'granted') new Notification('JARVIS', { body: msg });
        } catch {
          /* notifications unavailable */
        }
      }
    }
  }, [nowM, today, days, s, locked, toast]);

  // Daily snapshot into 7 rolling backup slots.
  useEffect(() => {
    if (!s || !backend) return;
    const k = `jarvis:backup:${today}`;
    try {
      if (localStorage.getItem(k)) return;
      localStorage.setItem(k, '1');
    } catch {
      /* ignore */
    }
    const p = toParts(s);
    void backend.write(`backups/d${weekday(today)}`, { date: today, core: p['jarvis/core'], study: p['jarvis/study'], memory: p['jarvis/memory'] }).catch(() => undefined);
  }, [today, backend]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-lock on inactivity.
  useEffect(() => {
    if (locked || !s) return;
    let t = setTimeout(() => setLocked(true), s.settings.autoLockMin * 60_000);
    const reset = () => {
      clearTimeout(t);
      t = setTimeout(() => setLocked(true), s.settings.autoLockMin * 60_000);
    };
    window.addEventListener('pointerdown', reset);
    window.addEventListener('keydown', reset);
    return () => {
      clearTimeout(t);
      window.removeEventListener('pointerdown', reset);
      window.removeEventListener('keydown', reset);
    };
  }, [locked, s?.settings.autoLockMin]); // eslint-disable-line react-hooks/exhaustive-deps

  // Ctrl/⌘ + K command palette.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPalette((p) => !p);
      }
      if (e.key === 'Escape') setPalette(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const go = useCallback((v: View, a?: string) => {
    setView(v);
    setArg(a);
    setPalette(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const download = useCallback(async (filename: string, data: string, mime: string) => {
    const w = window as unknown as { claude?: { use(n: string): Promise<{ save(o: { filename: string; data: Blob }): Promise<unknown> } | null> } };
    const d = w.claude?.use ? await w.claude.use('downloads').catch(() => null) : null;
    if (d) {
      try {
        await d.save({ filename, data: new Blob([data], { type: mime }) });
      } catch {
        toast('Téléchargement annulé.', 'info');
      }
      return;
    }
    const url = URL.createObjectURL(new Blob([data], { type: mime }));
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }, [toast]);

  if (!s) {
    return (
      <div className="boot">
        <div className="lock-core scanning" aria-hidden="true"><span /><span /><span /></div>
        <p className="kicker">Initialisation des systèmes…</p>
      </div>
    );
  }

  if (locked) {
    return (
      <Lock
        s={s}
        onUnlock={() => {
          setLocked(false);
          set((x) => A.log(x, 'acces', 'Déverrouillage'));
          if (s.settings.voice) say(`Bonjour ${s.settings.name}. Systèmes en ligne.`);
        }}
        onSetPin={(hash, salt, len) => set((x) => ({ ...x, pinHash: hash, pinSalt: salt, pinLen: len }))}
      />
    );
  }

  const J: Jarvis = { s, set, get, today, nowM, days, ai, backend, toast, speak: say, go, arg, download, lock: () => setLocked(true) };
  const toEB = diffDays(today, s.settings.examBlanc);
  const toCC = diffDays(today, s.settings.concours);
  const hh = `${String(Math.floor(nowM / 60)).padStart(2, '0')}:${String(nowM % 60).padStart(2, '0')}`;

  return (
    <Ctx.Provider value={J}>
      <div className="app">
        <div className="bg-grid" aria-hidden="true" />
        <header className="top">
          <button type="button" className="brand" onClick={() => go('hud')}>
            <span className="brand-core" aria-hidden="true" />
            <b>J.A.R.V.I.S.</b>
          </button>
          <div className="top-mid">
            <span className="clock">{hh}</span>
            {toEB >= 0 && <span className="cd t-gold">EB J-{toEB}</span>}
            <span className="cd t-rose">Concours J-{toCC}</span>
          </div>
          <div className="top-r">
            <span className={`sync s-${sync}`} title={backend?.label}>{sync === 'saving' ? 'Sync…' : sync === 'error' ? 'Hors sync' : backend?.kind === 'cloud' ? 'Cloud' : 'Local'}</span>
            <button type="button" className="btn sm ghost" onClick={() => setPalette(true)} aria-label="Commandes">⌘K</button>
            <button type="button" className="btn sm ghost" onClick={() => setLocked(true)} aria-label="Verrouiller">
              <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M6 11h12v9H6zM8 11V8a4 4 0 0 1 8 0v3" fill="none" stroke="currentColor" strokeWidth="1.8" /></svg>
            </button>
          </div>
        </header>
        <nav className="rail" aria-label="Navigation">
          {NAV.map((n) => (
            <button key={n.v} type="button" className={view === n.v ? 'on' : ''} onClick={() => go(n.v)} aria-current={view === n.v ? 'page' : undefined}>
              <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d={n.icon} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
              <span>{n.label}</span>
            </button>
          ))}
        </nav>
        <main className="main">
          {view === 'hud' && <Hud />}
          {view === 'agenda' && <Agenda />}
          {view === 'etudes' && <Etudes />}
          {view === 'cards' && <Cards />}
          {view === 'sport' && <Sport />}
          {view === 'foi' && <Foi />}
          {view === 'perso' && <Perso />}
          {view === 'coach' && <Coach />}
          {view === 'import' && <Import />}
          {view === 'checkin' && <CheckInView />}
          {view === 'settings' && <Settings onAiChange={() => void connectAi().then(setAi)} />}
        </main>
        <div className="toasts" role="status" aria-live="polite">
          {toasts.map((t) => <div key={t.id} className={`toast t-${t.tone}`}>{t.msg}</div>)}
        </div>
        {palette && <PaletteInner onClose={() => setPalette(false)} />}
      </div>
    </Ctx.Provider>
  );
}

function PaletteInner({ onClose }: { onClose: () => void }) {
  const { go } = useJ();
  const [q, setQ] = useState('');
  const cmds: { label: string; run: () => void }[] = [
    ...NAV.map((n) => ({ label: `Aller à ${n.label}`, run: () => go(n.v) })),
    { label: 'Faire mon check-in', run: () => go('checkin') },
    { label: 'Demander au coach…', run: () => go('coach', q.replace(/^demander au coach…?/i, '').trim() || undefined) },
  ];
  const list = cmds.filter((c) => c.label.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="palette" onClick={(e) => e.stopPropagation()}>
        <input autoFocus className="input" id="palette" placeholder="Commande ou question pour JARVIS…" value={q} onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              if (list[0] && list.length < cmds.length) list[0].run();
              else go('coach', q);
            }
          }} />
        <ul>
          {list.map((c) => <li key={c.label}><button type="button" onClick={c.run}>{c.label}</button></li>)}
          {q && <li><button type="button" onClick={() => go('coach', q)}>Demander à JARVIS : « {q} »</button></li>}
        </ul>
      </div>
    </div>
  );
}
