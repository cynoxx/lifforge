import { useState } from 'react';
import { useJ } from './ctx';
import { BlockRow, Chip, Modal, Panel, StatusButton, DOMAIN_LABEL } from './widgets';
import type { Block } from '../core/types';
import { addDays, longDate, mondayOf, range, shortDay, toMin, parse } from '../core/dates';
import { adherence, isTracked } from '../core/progress';
import { phaseOf, PLAN_START } from '../core/planner';
import { setStatus } from '../core/actions';
import { toIcs } from '../core/ics';
import { driveUrl, chapterById, ueById } from '../core/curriculum';

type Mode = 'jour' | 'semaine' | 'mois';

export function Agenda() {
  const { s, set, today, nowM, days, toast, download, go } = useJ();
  const [mode, setMode] = useState<Mode>('jour');
  const [day, setDay] = useState(today);
  const [open, setOpen] = useState<Block | null>(null);
  const last = addDays(s.settings.concours, 4);
  const clamp = (d: string) => (d < PLAN_START ? PLAN_START : d > last ? last : d);

  const reorganize = () => {
    const overdue = (days.get(today) ?? []).filter((b) => isTracked(b) && !s.status[b.id] && toMin(b.end) <= nowM && toMin(b.end) > toMin(b.start));
    if (!overdue.length) return toast('Rien à réorganiser : aucun bloc passé sans statut.', 'info');
    set((x) => overdue.reduce((acc, b) => setStatus(acc, b.id, 'missed', b.title), x));
    const study = overdue.filter((b) => b.domain === 'etudes').length;
    const gym = overdue.some((b) => b.kind === 'muscu');
    toast(`${overdue.length} bloc(s) marqués ratés.${study ? ' Les chapitres non faits sont replanifiés dès demain.' : ''}${gym ? ' Split muscu recalculé.' : ''}`, 'warn');
  };

  const exportIcs = async () => {
    const all = range(today, last).flatMap((d) => days.get(d) ?? []);
    await download('jarvis-planning.ics', toIcs(all), 'text/calendar');
  };

  const step = (n: number) => setDay((d) => clamp(addDays(d, mode === 'jour' ? n : mode === 'semaine' ? 7 * n : 28 * n)));

  return (
    <div className="page">
      <Panel
        kicker={phaseOf(s, day).name}
        title={mode === 'jour' ? longDate(day) : mode === 'semaine' ? `Semaine du ${longDate(mondayOf(day))}` : parse(day).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
        right={
          <div className="toolbar">
            <div className="seg" role="tablist">
              {(['jour', 'semaine', 'mois'] as Mode[]).map((m) => (
                <button key={m} type="button" role="tab" aria-selected={mode === m} className={mode === m ? 'on' : ''} onClick={() => setMode(m)}>{m}</button>
              ))}
            </div>
            <button type="button" className="btn sm" onClick={() => step(-1)} aria-label="Précédent">‹</button>
            <button type="button" className="btn sm" onClick={() => setDay(today)}>Aujourd’hui</button>
            <button type="button" className="btn sm" onClick={() => step(1)} aria-label="Suivant">›</button>
          </div>
        }
      >
        <div className="toolbar wrap">
          <button type="button" className="btn" onClick={reorganize}>Réorganiser ma journée</button>
          <button type="button" className="btn" onClick={() => go('coach', 'Je suis en retard sur plusieurs jours. Propose-moi un plan de rattrapage réaliste pour les 7 prochains jours, sans sacrifier le sommeil.')}>Plan de rattrapage (IA)</button>
          <button type="button" className="btn" onClick={exportIcs}>Exporter vers mon calendrier (.ics)</button>
        </div>

        {mode === 'jour' && (
          <div className="timeline big">
            {(days.get(day) ?? []).map((b) => <BlockRow key={b.id} b={b} now={day === today ? nowM : undefined} onOpen={setOpen} />)}
          </div>
        )}

        {mode === 'semaine' && (
          <div className="week">
            {range(mondayOf(day), addDays(mondayOf(day), 6)).map((d) => (
              <div key={d} className={`wcol${d === today ? ' today' : ''}`}>
                <button type="button" className="wh" onClick={() => { setDay(d); setMode('jour'); }}>
                  <b>{shortDay(d)}</b> {d.slice(8)}
                </button>
                {(days.get(d) ?? []).filter((b) => !['repas', 'sommeil', 'hygiene', 'chambre', 'briefing'].includes(b.kind)).map((b) => (
                  <div key={b.id} className={`wb d-${b.domain} st-${s.status[b.id] ?? 'todo'}`} onClick={() => setOpen(b)} role="button" tabIndex={0}>
                    <small>{b.start}</small> {b.title}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {mode === 'mois' && <Month day={day} onPick={(d) => { setDay(d); setMode('jour'); }} />}
      </Panel>

      {open && (
        <Modal title={open.title} onClose={() => setOpen(null)}>
          <p className="mute">{longDate(open.date)} · {open.start} – {open.end} · {DOMAIN_LABEL[open.domain]}</p>
          {open.detail && <p className="pre">{open.detail}</p>}
          {open.chapterId && (() => {
            const c = chapterById(open.chapterId) ?? s.customChapters.find((x) => x.id === open.chapterId);
            return c ? (
              <div className="toolbar wrap">
                {c.drive?.map((r) => <a key={r.id} className="btn sm" href={driveUrl(r)} target="_blank" rel="noreferrer">{r.label} ↗</a>)}
                <button type="button" className="btn sm primary" onClick={() => go('etudes', c.id)}>Ouvrir le chapitre</button>
              </div>
            ) : null;
          })()}
          {open.ueId && !open.chapterId && <Chip>{ueById(open.ueId).name}</Chip>}
          {isTracked(open) && (
            <div className="toolbar wrap">
              {(['done', 'partial', 'missed'] as const).map((st) => (
                <button key={st} type="button" className={`btn${s.status[open.id] === st ? ' primary' : ''}`} onClick={() => set((x) => setStatus(x, open.id, st, open.title))}>
                  {st === 'done' ? 'Fait' : st === 'partial' ? 'Partiel' : 'Raté'}
                </button>
              ))}
              <StatusButton b={open} />
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}

function Month({ day, onPick }: { day: string; onPick: (d: string) => void }) {
  const { s, days, today } = useJ();
  const d0 = parse(day);
  const first = `${day.slice(0, 7)}-01`;
  const lastDay = new Date(d0.getFullYear(), d0.getMonth() + 1, 0).getDate();
  const start = mondayOf(first);
  const cells = range(start, addDays(start, 41)).filter((d, i) => i < 35 || d.slice(0, 7) === day.slice(0, 7));
  return (
    <div className="month">
      {['lun', 'mar', 'mer', 'jeu', 'ven', 'sam', 'dim'].map((w) => <b key={w} className="mh">{w}</b>)}
      {cells.map((d) => {
        const inMonth = d.slice(0, 7) === day.slice(0, 7) && Number(d.slice(8)) <= lastDay;
        const bl = days.get(d) ?? [];
        const gym = bl.find((b) => b.kind === 'muscu');
        const box = bl.some((b) => b.kind === 'boxe');
        const exam = bl.some((b) => b.kind === 'examen');
        const ad = d <= today && bl.length ? adherence(s, days, [d]).pct : null;
        return (
          <button key={d} type="button" className={`mc${inMonth ? '' : ' out'}${d === today ? ' today' : ''}${exam ? ' exam' : ''}`} onClick={() => bl.length && onPick(d)} disabled={!bl.length}>
            <span className="mn">{Number(d.slice(8))}</span>
            {exam && <i className="tag t-rose">Examen</i>}
            {gym && <i className="tag t-sport">{gym.session}</i>}
            {box && <i className="tag t-sport">Boxe</i>}
            {ad !== null && <span className="mad" style={{ width: `${ad}%` }} />}
          </button>
        );
      })}
    </div>
  );
}
