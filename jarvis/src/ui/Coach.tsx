import { useEffect, useRef, useState } from 'react';
import { useJ } from './ctx';
import { Chip, Md, Panel, Empty } from './widgets';
import { buildTurns, coachTools } from '../core/brain';
import { aiErrorCopy } from '../core/ai';
import * as A from '../core/actions';
import { planDays } from '../core/planner';
import { listen, canListen } from '../core/voice';

const QUICK = [
  'Fais-moi le point sur ma journée et dis-moi par quoi commencer.',
  'J’ai des courbatures aux jambes, adapte ma séance.',
  'Explique-moi l’effet Bohr comme dans une copie de concours.',
  'Pose-moi 3 questions rédactionnelles de biochimie, une par une.',
  'Je suis en retard sur plusieurs jours, propose un plan de rattrapage.',
];

export function Coach() {
  const J = useJ();
  const { s, set, get, today, days, ai, arg, speak, toast } = J;
  const [msg, setMsg] = useState('');
  const [live, setLive] = useState('');
  const [busy, setBusy] = useState(false);
  const [mic, setMic] = useState(false);
  const ctl = useRef<AbortController | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const sentArg = useRef<string | undefined>(undefined);

  useEffect(() => endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }), [s.chat.length, live]);

  const daysFor = (d: string) => days.get(d) ?? planDays(get(), d, d, today).get(d) ?? [];

  const send = async (text: string) => {
    const t = text.trim();
    if (!t || busy) return;
    if (!ai) return toast('Connecte Claude dans Réglages (ou ouvre JARVIS dans claude.ai) pour parler au coach.', 'warn');
    const turns = buildTurns(get(), days, today, t);
    set((x) => ({ ...x, chat: [...x.chat, { role: 'user', content: t, at: new Date().toISOString() }] }));
    setMsg('');
    setBusy(true);
    setLive('');
    ctl.current = new AbortController();
    try {
      const out = await ai.ask(turns, { onText: setLive, signal: ctl.current.signal, tools: coachTools(get, set, daysFor, today) });
      set((x) => ({ ...x, chat: [...x.chat, { role: 'assistant', content: out, at: new Date().toISOString() }] }));
      speak(out.replace(/[#*`>-]/g, ''));
    } catch (e) {
      const copy = aiErrorCopy(e);
      const partial = (e as { partial?: string }).partial;
      if (partial) set((x) => ({ ...x, chat: [...x.chat, { role: 'assistant', content: partial + '\n\n*(interrompu)*', at: new Date().toISOString() }] }));
      if (copy) toast(copy, 'warn');
    } finally {
      setBusy(false);
      setLive('');
    }
  };

  useEffect(() => {
    if (arg && arg !== sentArg.current) {
      sentArg.current = arg;
      void send(arg);
    }
  }, [arg]); // eslint-disable-line react-hooks/exhaustive-deps

  const voice = () => {
    if (!canListen()) return toast('La dictée vocale n’est pas disponible dans ce navigateur ou dans claude.ai. Elle fonctionne dans la version installée (Chrome, Edge, Safari).', 'warn');
    setMic(true);
    listen((text, final) => {
      setMsg(text);
      if (final) {
        setMic(false);
        void send(text);
      }
    }, () => setMic(false));
  };

  return (
    <div className="page coach">
      <Panel kicker="Interface unifiée" title="JARVIS — coach" right={<Chip tone={ai ? 'ok' : 'rose'}>{ai ? (ai.kind === 'claude.ai' ? 'Claude via claude.ai' : 'Claude via API') : 'Claude non connecté'}</Chip>} className="chat-panel">
        <div className="chat">
          {s.chat.length === 0 && !live && <Empty>JARVIS connaît ton planning, ta progression, tes notes et tes préférences. Pose une question de cours, demande un plan, signale un imprévu.</Empty>}
          {s.chat.slice(-60).map((m, i) => (
            <div key={i} className={`bubble ${m.role}`}>
              {m.role === 'assistant' ? <Md text={m.content} /> : <p>{m.content}</p>}
              <small>{m.at.slice(11, 16)}</small>
            </div>
          ))}
          {busy && <div className="bubble assistant">{live ? <Md text={live} /> : <p className="pulse">JARVIS réfléchit…</p>}</div>}
          <div ref={endRef} />
        </div>
        <div className="toolbar wrap">
          {QUICK.map((q) => <Chip key={q} onClick={() => send(q)}>{q}</Chip>)}
        </div>
        <form className="composer" onSubmit={(e) => { e.preventDefault(); void send(msg); }}>
          <textarea className="input" id="coach-msg" rows={2} placeholder="Parle à JARVIS…" value={msg} onChange={(e) => setMsg(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void send(msg); } }} />
          <button type="button" className={`btn mic${mic ? ' on' : ''}`} onClick={voice} aria-label="Dicter">
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M12 3a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3zM5 11a7 7 0 0 0 14 0M12 18v3" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
          </button>
          {busy ? <button type="button" className="btn" onClick={() => ctl.current?.abort()}>Stop</button> : <button type="submit" className="btn primary">Envoyer</button>}
        </form>
      </Panel>
      <Panel kicker="Mémoire persistante" title="Ce que JARVIS retient de toi">
        <ul className="memory">
          {s.memory.map((m) => (
            <li key={m.id}>
              <p>{m.text}</p>
              <small>{m.at.slice(0, 10)}{m.tags.length ? ` · ${m.tags.join(', ')}` : ''}</small>
              <button type="button" className="btn ghost sm" onClick={() => set((x) => A.forget(x, m.id))} aria-label="Oublier">✕</button>
            </li>
          ))}
          {!s.memory.length && <Empty>Vide pour l’instant. Dis par exemple : « Retiens que je me concentre mieux le matin. »</Empty>}
        </ul>
        <form onSubmit={(e) => {
          e.preventDefault();
          const el = document.getElementById('mem-new') as HTMLInputElement;
          if (el.value.trim()) set((x) => A.remember(x, el.value.trim()));
          el.value = '';
        }}>
          <input className="input" id="mem-new" placeholder="Ajouter un souvenir manuellement" />
        </form>
      </Panel>
    </div>
  );
}
