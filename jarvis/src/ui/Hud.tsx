import { useMemo, useState } from 'react';
import { useJ } from './ctx';
import { BlockRow, Chip, DOMAIN_LABEL, Panel, Reactor, Ring, Bar, Md } from './widgets';
import type { Domain } from '../core/types';
import { adherence, chapterStats, readiness, streak } from '../core/progress';
import { addDays, diffDays, longDate, toMin } from '../core/dates';
import { insights } from '../core/insights';
import { phaseOf, phases, PLAN_START } from '../core/planner';
import { dueCards } from '../core/srs';
import { aiErrorCopy } from '../core/ai';
import { contextBrief } from '../core/brain';

export function Hud() {
  const { s, today, nowM, days, go, speak, ai } = useJ();
  const blocks = days.get(today) ?? [];
  const doms: Domain[] = ['foi', 'etudes', 'sport', 'perso'];
  const values = doms.map((d) => ({ d, v: adherence(s, days, [today], d).pct }));
  const current = blocks.find((b) => toMin(b.start) <= nowM && nowM < (toMin(b.end) > toMin(b.start) ? toMin(b.end) : 1440) && b.kind !== 'sommeil');
  const next = blocks.find((b) => toMin(b.start) > nowM);
  const list = useMemo(() => insights(s, days, today), [s, days, today]);
  const yPct = adherence(s, days, [addDays(today, -1)]).pct;
  const rd = readiness(s, today, yPct);
  const ph = phaseOf(s, today);
  const toEB = diffDays(today, s.settings.examBlanc);
  const toCC = diffDays(today, s.settings.concours);
  const st = chapterStats(s);
  const due = dueCards(s.cards, today, (id) => !!s.chapters[id]?.j0 || (s.chapters[id]?.status ?? 'todo') !== 'todo').length;
  const pr = Math.min(streak(s, 'priere-matin', today, PLAN_START), streak(s, 'priere-soir', today, PLAN_START));
  const morning = streak(s, 'reveil-sport', today, PLAN_START);
  const gym = blocks.find((b) => b.kind === 'muscu' || b.kind === 'boxe');
  const openTasks = s.tasks.filter((t) => !t.done).length;
  const [brief, setBrief] = useState('');
  const [busy, setBusy] = useState(false);

  const localBrief = () => {
    const study = blocks.filter((b) => b.domain === 'etudes' && ['etude', 'td', 'test', 'examen'].includes(b.kind)).map((b) => b.title);
    return `Bonjour ${s.settings.name}. Nous sommes ${longDate(today)}. Phase : ${ph.name}. ` +
      (toEB > 0 ? `Examen blanc dans ${toEB} jours. ` : '') + `Concours dans ${toCC} jours. ` +
      (study.length ? `Au programme : ${study.slice(0, 4).join(', ')}. ` : '') +
      (gym ? `Sport : ${gym.title}. ` : '') + (due ? `${due} flashcards à réviser. ` : '') +
      (list.find((i) => i.tone === 'alert')?.text ?? '');
  };

  const runBrief = async () => {
    if (!ai) {
      const t = localBrief();
      setBrief(t);
      speak(t);
      return;
    }
    setBusy(true);
    setBrief('');
    try {
      const t = await ai.ask(
        `Tu es JARVIS. Rédige le briefing du matin de ${s.settings.name} en français, 6 à 9 phrases, ton de majordome IA ferme et bienveillant (tutoiement). Priorités du jour, lien entre les domaines (sommeil, sport, études, foi), un point de vigilance, une phrase de motivation sobre. Pas de liste, pas de titres.\n\n${contextBrief(s, days, today)}\n\nAlertes calculées :\n${list.map((i) => '- ' + i.text).join('\n')}`,
        { onText: setBrief, tier: 'default' },
      );
      speak(t);
    } catch (e) {
      setBrief(aiErrorCopy(e) || localBrief());
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="hud">
      <section className="hero">
        <Reactor
          values={values}
          center={
            <>
              <small className="kicker">{current ? 'En cours' : 'Prochain'}</small>
              <b className="now-t">{(current ?? next)?.title ?? 'Repos'}</b>
              <span className="now-h">{(current ?? next) ? `${(current ?? next)!.start} – ${(current ?? next)!.end}` : ''}</span>
            </>
          }
        />
        <div className="hero-side">
          <div className="kicker">{longDate(today)} · {ph.name}</div>
          <h1 className="hero-title">
            {toEB > 0 ? <>Examen blanc <em>J-{toEB}</em></> : toEB === 0 ? <em>Examen blanc aujourd’hui</em> : <>Concours <em>J-{toCC}</em></>}
          </h1>
          <p className="hero-goal">{ph.goal}</p>
          <div className="legend">
            {values.map(({ d, v }) => (
              <span key={d} className={`lg d-${d}`}><i />{DOMAIN_LABEL[d]} <b>{v}%</b></span>
            ))}
          </div>
          <div className="hero-actions">
            <button type="button" className="btn primary" onClick={runBrief} disabled={busy}>{busy ? 'Analyse…' : 'Briefing du jour'}</button>
            <button type="button" className="btn" onClick={() => go('checkin')}>Check-in</button>
            <button type="button" className="btn" onClick={() => go('coach')}>Parler à JARVIS</button>
          </div>
          {brief && <div className="brief"><Md text={brief} /></div>}
        </div>
      </section>

      <div className="grid-3">
        <Panel kicker="Intelligence" title="Alertes & recommandations" className="span-2">
          <ul className="feed">
            {list.map((i) => (
              <li key={i.id} className={`tone-${i.tone}`}>
                <span className={`dot d-${i.domain}`} />
                <p>{i.text}</p>
                {i.action && <button type="button" className="btn sm" onClick={() => go(i.action!.to as never)}>{i.action.label}</button>}
              </li>
            ))}
            {!list.length && <li className="tone-good"><span className="dot d-etudes" /><p>Rien à signaler. Tu es dans le plan.</p></li>}
          </ul>
        </Panel>
        <Panel kicker="État" title="Disponibilité">
          <div className="ready">
            <Ring value={rd.score} size={112} stroke={9} color={rd.score >= 70 ? 'var(--ok)' : rd.score >= 50 ? 'var(--gold)' : 'var(--rose)'} label={rd.score} sub="/ 100" />
            <div>
              <p>{rd.sleepH !== null ? `${rd.sleepH} h de sommeil` : 'Sommeil non renseigné'}</p>
              <p>Énergie {s.checkins[today]?.energy ?? '—'}/5 · Hier {yPct}%</p>
              <p className="mute">{rd.score >= 70 ? 'Feu vert : journée pleine.' : rd.score >= 50 ? 'Correct : garde la rigueur, évite l’échec musculaire.' : 'Bas : priorise l’essentiel et dors tôt ce soir.'}</p>
            </div>
          </div>
        </Panel>
      </div>

      <div className="grid-3">
        <Panel kicker="Aujourd’hui" title="Plan de vol" right={<button type="button" className="btn sm" onClick={() => go('agenda')}>Agenda complet</button>} className="span-2">
          <div className="timeline">
            {blocks.filter((b) => b.kind !== 'sommeil').map((b) => <BlockRow key={b.id} b={b} now={nowM} />)}
          </div>
        </Panel>
        <div className="stack">
          <Panel kicker="Dieu" title="Prière">
            <div className="kpi"><b>{pr}</b><span>jours de suite<br />matin + soir</span></div>
          </Panel>
          <Panel kicker="Études" title="PASS" right={<Chip tone="arc">{st.pct}%</Chip>}>
            <p className="kpi-line">{st.validated}/{st.total} chapitres validés · {st.rework} à retravailler</p>
            <Bar value={st.pct} />
            <p className="kpi-line">{due} flashcards dues · moyenne {st.avg ?? '—'}/20</p>
          </Panel>
          <Panel kicker="Sport" title={gym?.title ?? 'Repos salle'}>
            <p className="kpi-line">Abdos + shadow : {morning} jour{morning > 1 ? 's' : ''} de suite</p>
          </Panel>
          <Panel kicker="Personnel" title={`${openTasks} tâche${openTasks > 1 ? 's' : ''} ouverte${openTasks > 1 ? 's' : ''}`}>
            <button type="button" className="btn sm" onClick={() => go('perso')}>Gérer</button>
          </Panel>
        </div>
      </div>

      <Panel kicker="Stratégie" title="Feuille de route jusqu’au concours">
        <div className="phases">
          {phases(s).map((p) => {
            const total = diffDays(p.from, p.to) + 1;
            const done = Math.max(0, Math.min(total, diffDays(p.from, today) + 1));
            return (
              <div key={p.id} className={`phase${p.id === ph.id ? ' cur' : ''}${today > p.to ? ' past' : ''}`} style={{ flexGrow: Math.max(1, total) }}>
                <Bar value={(done / total) * 100} color={p.id === 'eb' || p.id === 'cc' ? 'var(--rose)' : 'var(--arc)'} />
                <b>{p.name}</b>
                <small>{p.from.slice(8)}/{p.from.slice(5, 7)} → {p.to.slice(8)}/{p.to.slice(5, 7)}</small>
              </div>
            );
          })}
        </div>
      </Panel>
    </div>
  );
}
