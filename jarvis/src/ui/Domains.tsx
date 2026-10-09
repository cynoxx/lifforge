import { useMemo, useState } from 'react';
import { useJ } from './ctx';
import { Chip, Empty, Heat, Panel, Ring, BlockRow } from './widgets';
import { UES, ueById } from '../core/curriculum';
import { dueCards, type Grade } from '../core/srs';
import * as A from '../core/actions';
import { addDays, longDate, mondayOf, range, shortDay, sleepMinutes, toMin } from '../core/dates';
import { adherence, monthRate, streak } from '../core/progress';
import { PLAN_START } from '../core/planner';
import { planGymWeek, ZONE_LABEL, TARGETS } from '../core/sport';
import type { Domain, MuscleZone } from '../core/types';

// ─── Flashcards ──────────────────────────────────────────────────────────
export function Cards() {
  const { s, set, today } = useJ();
  const [ue, setUe] = useState<string>('all');
  const [all, setAll] = useState(false);
  const started = (id: string) => !!s.chapters[id]?.j0 || (s.chapters[id]?.status ?? 'todo') !== 'todo';
  const queue = useMemo(() => {
    const base = all ? s.cards.filter((c) => c.due <= today) : dueCards(s.cards, today, started);
    return base.filter((c) => ue === 'all' || c.ueId === ue);
  }, [s.cards, today, ue, all]); // eslint-disable-line react-hooks/exhaustive-deps
  const [shown, setShown] = useState(false);
  const [draft, setDraft] = useState('');
  const card = queue[0];

  const grade = (g: Grade) => {
    set((x) => A.reviewCard(x, card.id, g, today));
    setShown(false);
    setDraft('');
  };

  return (
    <div className="page">
      <Panel kicker="Répétition espacée" title="Flashcards" right={<Chip tone="arc">{queue.length} à réviser</Chip>}>
        <div className="toolbar wrap">
          <Chip onClick={() => setUe('all')} active={ue === 'all'}>Toutes</Chip>
          {UES.map((u) => <Chip key={u.id} onClick={() => setUe(u.id)} active={ue === u.id}>{u.short} · {s.cards.filter((c) => c.ueId === u.id).length}</Chip>)}
        </div>
        <label className="check"><input type="checkbox" id="cards-all" checked={all} onChange={(e) => setAll(e.target.checked)} /> Inclure les chapitres pas encore commencés (aperçu)</label>
        {!card ? (
          <Empty>Aucune carte due {ue !== 'all' ? 'dans cette UE ' : ''}aujourd’hui. Les cartes d’un chapitre entrent en révision à partir de son J0.</Empty>
        ) : (
          <div className="flash">
            <small className="kicker">{ueById(card.ueId).short} · {card.reps ? `révision ${card.reps + 1}` : 'nouvelle'}</small>
            <p className="fq">{card.q}</p>
            {!shown ? (
              <>
                <textarea className="input" id="flash-draft" rows={4} placeholder="Rédige ta réponse de mémoire (recommandé : c’est ce qui fixe le savoir)…" value={draft} onChange={(e) => setDraft(e.target.value)} />
                <button type="button" className="btn primary" onClick={() => setShown(true)}>Révéler la réponse</button>
              </>
            ) : (
              <>
                <p className="fa">{card.a}</p>
                {card.keys.length > 0 && <ul className="keys">{card.keys.map((k) => <li key={k}>{k}</li>)}</ul>}
                <div className="grades">
                  <button type="button" className="btn g0" onClick={() => grade(0)}>Oublié<small>1 j</small></button>
                  <button type="button" className="btn g1" onClick={() => grade(1)}>Difficile<small>1 j</small></button>
                  <button type="button" className="btn g2" onClick={() => grade(2)}>Correct<small>{card.reps === 0 ? '1 j' : card.reps === 1 ? '3 j' : `${Math.round(card.interval * card.ef)} j`}</small></button>
                  <button type="button" className="btn g3" onClick={() => grade(3)}>Facile<small>+30 %</small></button>
                </div>
              </>
            )}
          </div>
        )}
      </Panel>
    </div>
  );
}

// ─── Sport ───────────────────────────────────────────────────────────────
const ZONES: MuscleZone[] = ['pecs', 'dos', 'epaules', 'bras', 'jambes', 'abdos'];

export function Sport() {
  const { s, set, today, days } = useJ();
  const [wk, setWk] = useState(mondayOf(today));
  const week = planGymWeek(s, wk, today);
  const sore = s.checkins[today]?.soreness ?? [];
  const month = today.slice(0, 7);
  const past = range(PLAN_START, today);
  const gymAd = adherence(s, days, past, 'sport', ['muscu']);
  const boxAd = adherence(s, days, past, 'sport', ['boxe']);
  const morning = streak(s, 'reveil-sport', today, PLAN_START);
  const mRate = monthRate(s, 'reveil-sport', month, today);
  const todayGym = (days.get(today) ?? []).filter((b) => b.domain === 'sport');

  const toggleZone = (z: MuscleZone) => set((x) => A.checkin(x, today, { soreness: sore.includes(z) ? sore.filter((y) => y !== z) : [...sore, z] }));

  return (
    <div className="page">
      <div className="grid-3">
        <Panel kicker="Discipline" title="Abdos + shadow boxing">
          <div className="kpi"><b>{morning}</b><span>jours de suite<br />{mRate.pct}% ce mois</span></div>
        </Panel>
        <Panel kicker="Musculation" title="Respect du split">
          <div className="kpi"><Ring value={gymAd.pct} size={70} label={`${gymAd.pct}%`} color="var(--sport)" /><span>{gymAd.done}/{gymAd.total} séances</span></div>
        </Panel>
        <Panel kicker="Boxe" title="2 × 45 min / semaine">
          <div className="kpi"><Ring value={boxAd.pct} size={70} label={`${boxAd.pct}%`} color="var(--sport)" /><span>{boxAd.done}/{boxAd.total} séances</span></div>
        </Panel>
      </div>

      <div className="grid-2">
        <Panel kicker="Aujourd’hui" title="Mode réorganisation">
          <p className="mute">Signale tes courbatures : la séance du jour est remplacée par une séance qui épargne ces zones, et le reste de la semaine se réaligne.</p>
          <div className="toolbar wrap">
            {ZONES.map((z) => <Chip key={z} onClick={() => toggleZone(z)} active={sore.includes(z)} tone="sport">{ZONE_LABEL[z]}</Chip>)}
          </div>
          <div className="timeline">{todayGym.map((b) => <BlockRow key={b.id} b={b} />)}</div>
        </Panel>
        <Panel kicker="Split hebdomadaire" title={`Semaine du ${longDate(wk)}`} right={
          <div className="toolbar">
            <button type="button" className="btn sm" onClick={() => setWk(addDays(wk, -7))} aria-label="Semaine précédente">‹</button>
            <button type="button" className="btn sm" onClick={() => setWk(addDays(wk, 7))} aria-label="Semaine suivante">›</button>
          </div>
        }>
          <div className="split">
            {range(wk, addDays(wk, 6)).map((d) => {
              const g = week.find((x) => x.date === d);
              const box = s.settings.boxingDays.includes((range(wk, d).length - 1) % 7);
              const st = s.status[`${d}:muscu`];
              return (
                <div key={d} className={`sd${d === today ? ' today' : ''}`}>
                  <small>{shortDay(d)} {d.slice(8)}</small>
                  {g ? <b className={st ? `st-${st}` : ''}>{g.session}</b> : box ? <b className="box">Boxe</b> : <b className="rest">—</b>}
                  {g && <i>{TARGETS[g.session].map((z) => ZONE_LABEL[z]).slice(0, 2).join(' · ')}</i>}
                  {g?.note && <em title={g.note}>⚑</em>}
                </div>
              );
            })}
          </div>
          {week.some((g) => g.note) && <ul className="notes">{week.filter((g) => g.note).map((g) => <li key={g.date}>{shortDay(g.date)} : {g.note}</li>)}</ul>}
        </Panel>
      </div>
    </div>
  );
}

// ─── Foi ─────────────────────────────────────────────────────────────────
export function Foi() {
  const { s, today, days } = useJ();
  const blocks = (days.get(today) ?? []).filter((b) => b.domain === 'foi');
  const month = today.slice(0, 7);
  const m = monthRate(s, 'priere-matin', month, today);
  const e = monthRate(s, 'priere-soir', month, today);
  const sm = streak(s, 'priere-matin', today, PLAN_START);
  const se = streak(s, 'priere-soir', today, PLAN_START);
  const cells = range(PLAN_START, addDays(s.settings.concours, 4)).map((d) => {
    const n = (s.status[`${d}:priere-matin`] === 'done' ? 1 : 0) + (s.status[`${d}:priere-soir`] === 'done' ? 1 : 0);
    return { date: d, v: d > today ? null : n / 2, title: `${longDate(d)} : ${n}/2` };
  });
  return (
    <div className="page">
      <div className="grid-2">
        <Panel kicker="Dieu" title="Prières du jour">
          <div className="timeline big">{blocks.map((b) => <BlockRow key={b.id} b={b} />)}</div>
          <p className="mute">La prière du matin suit ton heure de réveil réelle (check-in). La prière du soir précède le coucher.</p>
        </Panel>
        <Panel kicker="Régularité" title="Taux de respect">
          <div className="duo">
            <div><Ring value={m.pct} size={96} stroke={8} color="var(--foi)" label={`${m.pct}%`} sub="matin" /><p>{sm} jours de suite</p></div>
            <div><Ring value={e.pct} size={96} stroke={8} color="var(--foi)" label={`${e.pct}%`} sub="soir" /><p>{se} jours de suite</p></div>
          </div>
          <p className="kicker">Du 8 octobre au concours</p>
          <Heat cells={cells} />
        </Panel>
      </div>
    </div>
  );
}

// ─── Personnel ───────────────────────────────────────────────────────────
export function Perso() {
  const { s, set, today, days } = useJ();
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [dom, setDom] = useState<Domain>('perso');
  const routine = (days.get(today) ?? []).filter((b) => b.domain === 'perso' && ['chambre', 'hygiene', 'menage', 'tache'].includes(b.kind));
  const last14 = range(addDays(today, -13), today).filter((d) => d >= PLAN_START);
  const sleeps = last14.map((d) => {
    const c = s.checkins[d];
    return { d, h: c?.bed && c?.wake ? sleepMinutes(c.bed, c.wake) / 60 : null };
  });
  const ad = adherence(s, days, last14, 'perso');
  const add = () => {
    if (!title.trim()) return;
    set((x) => A.addTask(x, { title: title.trim(), date: date || undefined, time: time || undefined, domain: dom }));
    setTitle('');
    setTime('');
  };
  const open = s.tasks.filter((t) => !t.done).sort((a, b) => (a.date ?? '9') .localeCompare(b.date ?? '9'));
  const done = s.tasks.filter((t) => t.done).slice(-8);

  return (
    <div className="page">
      <div className="grid-2">
        <Panel kicker="Personnel" title="Tâches">
          <form className="task-form" onSubmit={(e) => { e.preventDefault(); add(); }}>
            <input className="input" id="task-title" placeholder="Nouvelle tâche (ex. rendez-vous dentiste)" value={title} onChange={(e) => setTitle(e.target.value)} />
            <input className="input sm" id="task-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} aria-label="Date" />
            <input className="input sm" id="task-time" type="time" value={time} onChange={(e) => setTime(e.target.value)} aria-label="Heure" />
            <select className="input sm" id="task-domain" value={dom} onChange={(e) => setDom(e.target.value as Domain)} aria-label="Domaine">
              <option value="perso">Personnel</option><option value="etudes">Études</option><option value="sport">Sport</option><option value="foi">Dieu</option>
            </select>
            <button type="submit" className="btn primary">Ajouter</button>
          </form>
          <ul className="tasks">
            {open.map((t) => (
              <li key={t.id} className={`d-${t.domain}`}>
                <input type="checkbox" id={`t-${t.id}`} checked={false} onChange={() => set((x) => A.toggleTask(x, t.id))} />
                <label htmlFor={`t-${t.id}`}>{t.title}{t.date && <small> · {longDate(t.date)}{t.time ? ` ${t.time}` : ''}</small>}</label>
                <button type="button" className="btn ghost sm" onClick={() => set((x) => A.removeTask(x, t.id))} aria-label="Supprimer">✕</button>
              </li>
            ))}
            {!open.length && <Empty>Aucune tâche ouverte.</Empty>}
          </ul>
          {done.length > 0 && <p className="mute">Faites récemment : {done.map((t) => t.title).join(' · ')}</p>}
        </Panel>
        <div className="stack">
          <Panel kicker="Routines" title="Aujourd’hui" right={<Chip tone="ok">{ad.pct}% sur 14 j</Chip>}>
            <div className="timeline">{routine.map((b) => <BlockRow key={b.id} b={b} compact />)}</div>
          </Panel>
          <Panel kicker="Sommeil" title="14 dernières nuits">
            <div className="sleep">
              {sleeps.map(({ d, h }) => (
                <div key={d} className="sl" title={h ? `${h.toFixed(1)} h` : 'non renseigné'}>
                  <span style={{ height: `${h ? Math.min(100, (h / 10) * 100) : 4}%`, background: h === null ? 'var(--line)' : h >= 7.5 ? 'var(--ok)' : h >= 6.5 ? 'var(--gold)' : 'var(--rose)' }} />
                  <small>{d.slice(8)}</small>
                </div>
              ))}
            </div>
            <p className="mute">Cible : coucher {s.settings.bed}, lever {s.settings.wake} (8 h). En dessous de 7 h, JARVIS allège la séance et déplace l’apprentissage nouveau au matin.</p>
          </Panel>
        </div>
      </div>
    </div>
  );
}

// ─── Check-in ────────────────────────────────────────────────────────────
export function CheckInView() {
  const { s, set, today, go, toast, nowM } = useJ();
  const ci = s.checkins[today] ?? { date: today };
  const nowHH = `${String(Math.floor(nowM / 60)).padStart(2, '0')}:${String(nowM % 60).padStart(2, '0')}`;
  const [wake, setWake] = useState(ci.wake ?? (nowM < toMin('12:00') ? nowHH : s.settings.wake));
  const [bed, setBed] = useState(ci.bed ?? s.settings.bed);
  const [energy, setEnergy] = useState(ci.energy ?? 3);
  const [mood, setMood] = useState(ci.mood ?? 3);
  const [sore, setSore] = useState<MuscleZone[]>(ci.soreness ?? []);
  const [note, setNote] = useState(ci.note ?? '');
  const save = () => {
    set((x) => A.checkin(x, today, { wake, bed, energy, mood, soreness: sore, note: note || undefined }));
    const h = sleepMinutes(bed, wake) / 60;
    toast(`Check-in enregistré. ${h.toFixed(1)} h de sommeil. Planning ajusté sur un réveil à ${wake}.`, h >= 7 ? 'good' : 'warn');
    go('hud');
  };
  return (
    <div className="page narrow">
      <Panel kicker={longDate(today)} title="Check-in du matin">
        <div className="form-grid">
          <label className="field"><span>Heure de réveil réelle</span><input className="input" id="ci-wake" type="time" value={wake} onChange={(e) => setWake(e.target.value)} /></label>
          <label className="field"><span>Coucher hier soir</span><input className="input" id="ci-bed" type="time" value={bed} onChange={(e) => setBed(e.target.value)} /></label>
          <label className="field"><span>Énergie : {energy}/5</span><input id="ci-energy" type="range" min={1} max={5} value={energy} onChange={(e) => setEnergy(Number(e.target.value))} /></label>
          <label className="field"><span>Moral : {mood}/5</span><input id="ci-mood" type="range" min={1} max={5} value={mood} onChange={(e) => setMood(Number(e.target.value))} /></label>
        </div>
        <p className="kicker">Courbatures</p>
        <div className="toolbar wrap">
          {ZONES.map((z) => <Chip key={z} tone="sport" active={sore.includes(z)} onClick={() => setSore((x) => (x.includes(z) ? x.filter((y) => y !== z) : [...x, z]))}>{ZONE_LABEL[z]}</Chip>)}
        </div>
        <label className="field"><span>Note libre (optionnel)</span><textarea className="input" id="ci-note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} /></label>
        <p className="mute">Sommeil : {(sleepMinutes(bed, wake) / 60).toFixed(1)} h</p>
        <button type="button" className="btn primary" onClick={save}>Enregistrer et ajuster ma journée</button>
      </Panel>
    </div>
  );
}

