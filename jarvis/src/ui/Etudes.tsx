import { useEffect, useMemo, useState } from 'react';
import { useJ } from './ctx';
import { Bar, Chip, Md, Modal, Panel, Ring } from './widgets';
import { UES, driveUrl, ueById, ANNALES, PLANNING_SHEET, type Chapter } from '../core/curriculum';
import { allChapters, chapterStats, progressOf } from '../core/progress';
import { projectStudy, phases, REVIEW_OFFSETS } from '../core/planner';
import { addDays, shortDate } from '../core/dates';
import * as A from '../core/actions';
import { newCard, scoreFromKeys } from '../core/srs';
import { aiErrorCopy } from '../core/ai';
import type { Card, ChapterStatus } from '../core/types';

const STATUS: Record<ChapterStatus, [string, string]> = {
  todo: ['À faire', 'mute'],
  learning: ['En cours', 'arc'],
  validated: ['VALIDÉ', 'ok'],
  rework: ['À RETRAVAILLER', 'rose'],
};

export const chapterText = (docs: { chapterId?: string; ueId: string; text: string; title: string }[], c: Chapter, max = 60000) =>
  docs.filter((d) => d.chapterId === c.id).map((d) => `### ${d.title}\n${d.text}`).join('\n\n').slice(0, max);

export function Etudes() {
  const { s, set, today, arg } = useJ();
  const [ue, setUe] = useState<string>(() => (arg ? arg.split('-')[0] : UES[0].id));
  const [chap, setChap] = useState<string | null>(arg ?? null);
  useEffect(() => {
    if (arg) {
      setUe(arg.split('-')[0]);
      setChap(arg);
    }
  }, [arg]);

  const study = useMemo(() => projectStudy(s, today), [s, today]);
  const lastLearn = [...study.values()].filter((d) => d.learned.length).at(-1)?.date;
  const p3 = phases(s).find((p) => p.id === 'p3')!;
  const late = lastLearn && lastLearn >= p3.from;
  const chapters = allChapters(s).filter((c) => c.ueId === ue).sort((a, b) => a.n - b.n);
  const u = ueById(ue);
  const current = chap ? allChapters(s).find((c) => c.id === chap) : null;

  return (
    <div className="page">
      <Panel kicker="Moteur d’évaluation" title="Études — PASS">
        <div className="ue-grid">
          {UES.map((x) => {
            const st = chapterStats(s, x.id);
            return (
              <button key={x.id} type="button" className={`ue-card${ue === x.id ? ' on' : ''}`} style={{ ['--h' as string]: x.hue }} onClick={() => { setUe(x.id); setChap(null); }}>
                <Ring value={st.pct} size={58} stroke={5} color={`hsl(${x.hue} 90% 62%)`} label={`${st.pct}%`} />
                <span>
                  <small>{x.code}{x.mineure ? ' · mineure' : ''}</small>
                  <b>{x.short}</b>
                  <small>{st.validated}/{st.total} validés{s.examResults[x.id] !== undefined ? ` · EB ${s.examResults[x.id]}/20` : ''}</small>
                </span>
              </button>
            );
          })}
        </div>
        <p className={`note ${late ? 't-rose' : 't-ok'}`}>
          {lastLearn
            ? late
              ? `Retard : au rythme actuel, le premier passage se termine le ${shortDate(lastLearn)}, après le début de la phase annales (${shortDate(p3.from)}). Valide plus vite les chapitres en cours, ou active le rattrapage du dimanche dans Réglages.`
              : `Au rythme prévu, le premier passage de tout le programme se termine le ${shortDate(lastLearn)}, avant la phase annales (${shortDate(p3.from)}).`
            : 'Premier passage terminé : place aux annales et aux reprises.'}
        </p>
        <div className="toolbar wrap">
          <a className="btn sm" href={PLANNING_SHEET} target="_blank" rel="noreferrer">Ton tableur J0-J30 ↗</a>
          {ANNALES.map((r) => <a key={r.id} className="btn sm" href={driveUrl(r)} target="_blank" rel="noreferrer">{r.label} ↗</a>)}
        </div>
      </Panel>

      <div className="grid-2">
        <Panel
          kicker={`${u.code} · ${u.mineure ? 'Mineure, prioritaire' : 'Majeure'}${u.inExamBlanc ? '' : ' · hors examen blanc'}`}
          title={u.name}
          right={u.folder && <a className="btn sm" href={driveUrl(u.folder)} target="_blank" rel="noreferrer">Drive ↗</a>}
        >
          <ExamResult ueId={ue} />
          {u.tds && (
            <div className="toolbar wrap">
              {u.tds.map((t) => <a key={t.id} className="btn sm" href={driveUrl(t)} target="_blank" rel="noreferrer">{t.label} ↗</a>)}
            </div>
          )}
          <ol className="chapters">
            {chapters.map((c) => {
              const p = progressOf(s, c.id);
              const [label, tone] = STATUS[p.status];
              const last = p.scores.at(-1);
              return (
                <li key={c.id} className={chap === c.id ? 'on' : ''}>
                  <button type="button" onClick={() => setChap(c.id)}>
                    <span className="cn">{c.n}</span>
                    <span className="ct">
                      <b>{c.title}</b>
                      <small>
                        {p.j0 ? `J0 ${shortDate(p.j0)}` : 'Pas commencé'}
                        {last ? ` · dernier test ${last.score}/20` : ''}
                        {c.inferred ? ' · titre à confirmer' : ''}
                      </small>
                    </span>
                    <Chip tone={tone}>{label}</Chip>
                  </button>
                </li>
              );
            })}
          </ol>
          <button type="button" className="btn sm" onClick={() => {
            const title = window.document.getElementById('new-ch') as HTMLInputElement | null;
            if (!title?.value.trim()) return;
            const n = Math.max(0, ...chapters.map((c) => c.n)) + 1;
            set((x) => ({ ...x, customChapters: [...x.customChapters, { id: `${ue}-x${Date.now().toString(36)}`, ueId: ue, n, title: title.value.trim(), hours: 2.5 }] }));
            title.value = '';
          }}>Ajouter un chapitre</button>
          <input id="new-ch" className="input" placeholder="Titre du nouveau chapitre" />
        </Panel>

        {current ? <ChapterPanel c={current} /> : (
          <Panel kicker="Méthode" title="Comment JARVIS valide un cours">
            <ol className="steps">
              <li><b>J0 — Apprentissage actif.</b> Lecture, fiche, schémas. Tu termines en rédigeant de mémoire.</li>
              <li><b>TD.</b> Les TDs fournis, refaits jusqu’à maîtrise.</li>
              <li><b>Test rédactionnel.</b> Questions générées sur ton cours, corrigées et notées sur 20. Seuil : {s.settings.validationThreshold}/20.</li>
              <li><b>VALIDÉ ou À RETRAVAILLER.</b> Tant qu’un chapitre n’est pas validé, le suivant de la même UE est bloqué.</li>
              <li><b>Révisions J1, J3, J7, J14, J30</b>, programmées automatiquement le soir, plus les flashcards en répétition espacée.</li>
            </ol>
          </Panel>
        )}
      </div>
    </div>
  );
}

function ExamResult({ ueId }: { ueId: string }) {
  const { s, set } = useJ();
  const u = ueById(ueId);
  if (!u.inExamBlanc) return <p className="mute">Pas d’examen blanc pour cette UE le 17 octobre.</p>;
  return (
    <label className="field inline">
      <span>Note à l’examen blanc (/20)</span>
      <input className="input sm" id={`eb-${ueId}`} type="number" min={0} max={20} step={0.25} value={s.examResults[ueId] ?? ''}
        onChange={(e) => set((x) => A.setExamResult(x, ueId, e.target.value === '' ? undefined : Number(e.target.value)))} />
    </label>
  );
}

function ChapterPanel({ c }: { c: Chapter }) {
  const { s, set, today, ai, toast, go } = useJ();
  const p = progressOf(s, c.id);
  const docs = s.docs.filter((d) => d.chapterId === c.id);
  const cards = s.cards.filter((x) => x.chapterId === c.id);
  const [testing, setTesting] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [summary, setSummary] = useState(p.summary ?? '');

  const material = () => chapterText(s.docs, c) || '(Aucun cours importé pour ce chapitre : appuie-toi sur le programme standard de PASS, et signale ce qui doit être vérifié dans le cours.)';

  const genCards = async () => {
    if (!ai) return toast('Connecte Claude (Réglages) pour générer des flashcards.', 'warn');
    setBusy('cards');
    try {
      const list = await ai.json<{ q: string; a: string; keys: string[] }[]>(
        `Tu prépares un étudiant de PASS à un concours RÉDACTIONNEL. Chapitre : « ${c.title} » (${ueById(c.ueId).name}).
Crée 10 flashcards de questions de cours rédactionnelles couvrant les notions clés, les définitions, les mécanismes et les pièges classiques.
Réponds uniquement par un tableau JSON : [{"q": "question", "a": "réponse modèle en 2 à 5 phrases", "keys": ["point clé 1", "point clé 2", "…"]}]. 3 à 5 points clés par carte.

Cours :
${material()}`,
        { tier: 'default' },
      );
      const fresh: Card[] = list.filter((x) => x?.q && x?.a).map((x, i) => newCard({ id: `${c.id}-ia${Date.now().toString(36)}${i}`, ueId: c.ueId, chapterId: c.id, q: x.q, a: x.a, keys: Array.isArray(x.keys) ? x.keys.map(String) : [], source: 'ia' }, today));
      set((x) => A.addCards(x, fresh));
      toast(`${fresh.length} flashcards créées pour ce chapitre.`, 'good');
    } catch (e) {
      toast(aiErrorCopy(e) || 'Génération interrompue', 'warn');
    } finally {
      setBusy(null);
    }
  };

  const genSummary = async () => {
    if (!ai) return toast('Connecte Claude (Réglages) pour générer un résumé.', 'warn');
    setBusy('sum');
    setSummary('');
    try {
      const t = await ai.ask(
        `Fais la fiche de révision du chapitre « ${c.title} » (${ueById(c.ueId).name}, PASS, examen rédactionnel). Structure : ## Notions clés, ## Mécanismes, ## Définitions à savoir rédiger, ## Pièges classiques, ## 3 questions type concours. Concis, dense, en français.\n\nCours :\n${material()}`,
        { onText: setSummary },
      );
      set((x) => ({ ...x, chapters: { ...x.chapters, [c.id]: { ...progressOf(x, c.id), summary: t } } }));
    } catch (e) {
      toast(aiErrorCopy(e) || 'Résumé interrompu', 'warn');
    } finally {
      setBusy(null);
    }
  };

  const [label, tone] = STATUS[p.status];
  return (
    <Panel kicker={`${ueById(c.ueId).short} · chapitre ${c.n}`} title={c.title} right={<Chip tone={tone}>{label}</Chip>}>
      <div className="toolbar wrap">
        {!p.j0 && <button type="button" className="btn" onClick={() => set((x) => A.startChapter(x, c.id, today))}>Démarrer (J0 aujourd’hui)</button>}
        <button type="button" className="btn primary" onClick={() => setTesting(true)}>Test de validation</button>
        <button type="button" className="btn" onClick={genSummary} disabled={!!busy}>{busy === 'sum' ? 'Rédaction…' : 'Fiche résumé (IA)'}</button>
        <button type="button" className="btn" onClick={genCards} disabled={!!busy}>{busy === 'cards' ? 'Génération…' : 'Flashcards (IA)'}</button>
        <button type="button" className="btn" onClick={() => go('coach', `Explique-moi le chapitre « ${c.title} » comme pour une copie rédactionnelle, puis pose-moi une question pour vérifier.`)}>Demander au coach</button>
      </div>
      {p.j0 && (
        <div className="reviews">
          {REVIEW_OFFSETS.map((o) => {
            const d = addDays(p.j0!, o);
            return <Chip key={o} tone={d < today ? 'mute' : d === today ? 'gold' : 'arc'}>J{o} · {shortDate(d)}</Chip>;
          })}
        </div>
      )}
      {p.scores.length > 0 && (
        <div className="scores">
          {p.scores.map((x, i) => (
            <div key={i} className="score-row">
              <span>{shortDate(x.date)}</span>
              <Bar value={(x.score / 20) * 100} color={x.score >= s.settings.validationThreshold ? 'var(--ok)' : 'var(--rose)'} />
              <b>{x.score}/20</b>
            </div>
          ))}
        </div>
      )}
      <div className="toolbar wrap">
        {c.drive?.map((r) => <a key={r.id} className="btn sm" href={driveUrl(r)} target="_blank" rel="noreferrer">{r.label} ↗</a>)}
      </div>
      <p className="mute">{cards.length} flashcards · {docs.length} cours importé{docs.length > 1 ? 's' : ''}{docs.length ? ` (${docs.map((d) => d.title).join(', ')})` : ' — importe-le depuis l’onglet Import'}</p>
      {summary && <div className="sheet"><Md text={summary} /></div>}
      {testing && <TestModal c={c} onClose={() => setTesting(false)} />}
    </Panel>
  );
}

type Q = { q: string; points: number; keys: string[]; model?: string };
type Graded = { score: number; feedback: string; perQuestion: { score: number; max: number; feedback: string; missing: string[] }[] };

function TestModal({ c, onClose }: { c: Chapter; onClose: () => void }) {
  const { s, set, today, ai, toast } = useJ();
  const [qs, setQs] = useState<Q[] | null>(null);
  const [answers, setAnswers] = useState<string[]>([]);
  const [graded, setGraded] = useState<Graded | null>(null);
  const [ticks, setTicks] = useState<Record<string, boolean>>({});
  const [phase, setPhase] = useState<'loading' | 'answer' | 'grading' | 'done' | 'self'>('loading');
  const offline = !ai;

  useEffect(() => {
    let cancelled = false;
    const seed = s.cards.filter((x) => x.chapterId === c.id).sort(() => Math.random() - 0.5).slice(0, 3);
    const fallback: Q[] = seed.length
      ? seed.map((x) => ({ q: x.q, points: Math.round((20 / seed.length) * 10) / 10, keys: x.keys, model: x.a }))
      : [{ q: `Rédige tout ce que tu sais sur « ${c.title} » : définitions, mécanismes, exemples.`, points: 20, keys: ['définitions exactes', 'mécanisme complet', 'exemple ou application', 'structure claire'] }];
    if (offline) {
      setQs(fallback);
      setPhase('answer');
      return;
    }
    ai!
      .json<Q[]>(
        `Tu es examinateur au concours PASS (épreuves RÉDACTIONNELLES). Chapitre : « ${c.title} » (${ueById(c.ueId).name}).
Écris 3 questions rédactionnelles de difficulté concours, notées au total sur 20 (barème par question), couvrant des notions différentes du chapitre.
Réponds uniquement par un tableau JSON : [{"q": "énoncé", "points": 7, "keys": ["élément attendu 1", "…"], "model": "corrigé type concis"}].

Cours de l’étudiant :
${chapterText(s.docs, c) || '(non importé : base-toi sur le programme standard de PASS)'}`,
        { tier: 'default' },
      )
      .then((r) => {
        if (cancelled) return;
        setQs(Array.isArray(r) && r.length ? r : fallback);
        setPhase('answer');
      })
      .catch((e) => {
        if (cancelled) return;
        toast(aiErrorCopy(e) || 'Questions hors-ligne utilisées', 'warn');
        setQs(fallback);
        setPhase('answer');
      });
    return () => {
      cancelled = true;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const finish = (score: number, mode: 'ia' | 'auto') => {
    const sc = Math.round(score * 4) / 4;
    set((x) => A.recordScore(x, c.id, sc, mode, today));
    toast(sc >= s.settings.validationThreshold ? `${c.title} : VALIDÉ (${sc}/20)` : `${c.title} : À RETRAVAILLER (${sc}/20)`, sc >= s.settings.validationThreshold ? 'good' : 'warn');
  };

  const grade = async () => {
    if (!qs) return;
    if (offline) return setPhase('self');
    setPhase('grading');
    try {
      const r = await ai!.json<Graded>(
        `Corrige cette copie de concours PASS (épreuve rédactionnelle) avec la sévérité d’un vrai correcteur. Barème indiqué par question, total sur 20.
Pour chaque question : note, commentaire constructif (ce qui est juste, ce qui manque, ce qui est faux), éléments manquants.
Réponds uniquement en JSON : {"score": 13.5, "feedback": "bilan global en 3 phrases", "perQuestion": [{"score": 4, "max": 7, "feedback": "…", "missing": ["…"]}]}

${qs.map((q, i) => `## Question ${i + 1} (${q.points} pts)\n${q.q}\nÉléments attendus : ${q.keys.join(' ; ')}\nCorrigé : ${q.model ?? '—'}\n### Réponse de l’étudiant\n${answers[i]?.trim() || '(vide)'}`).join('\n\n')}`,
        { tier: 'complex' },
      );
      setGraded(r);
      finish(Math.max(0, Math.min(20, Number(r.score) || 0)), 'ia');
      setPhase('done');
    } catch (e) {
      toast(aiErrorCopy(e) || 'Correction IA indisponible : auto-évaluation.', 'warn');
      setPhase('self');
    }
  };

  const selfScore = () => {
    if (!qs) return 0;
    return qs.reduce((acc, q, i) => {
      const n = q.keys.filter((_, k) => ticks[`${i}-${k}`]).length;
      return acc + (scoreFromKeys(n, q.keys.length) / 20) * q.points;
    }, 0);
  };

  const verdict = graded ? graded.score : null;
  return (
    <Modal title={`Test — ${c.title}`} onClose={onClose} wide>
      {phase === 'loading' && <p className="pulse">JARVIS prépare un sujet rédactionnel sur ton cours…</p>}
      {(phase === 'answer' || phase === 'grading') && qs && (
        <>
          {qs.map((q, i) => (
            <div key={i} className="q">
              <p><b>Question {i + 1}</b> <Chip>{q.points} pts</Chip></p>
              <p>{q.q}</p>
              <textarea className="input" id={`ans-${i}`} rows={7} placeholder="Rédige ta réponse comme le jour du concours…" value={answers[i] ?? ''}
                onChange={(e) => setAnswers((a) => Object.assign([...a], { [i]: e.target.value }))} />
            </div>
          ))}
          <button type="button" className="btn primary" onClick={grade} disabled={phase === 'grading'}>
            {phase === 'grading' ? 'Correction en cours…' : offline ? 'Voir le corrigé et m’auto-évaluer' : 'Rendre ma copie'}
          </button>
        </>
      )}
      {phase === 'self' && qs && (
        <>
          <p className="mute">Coche honnêtement chaque élément présent dans ta réponse. Ta note est calculée sur les éléments attendus.</p>
          {qs.map((q, i) => (
            <div key={i} className="q">
              <p><b>Question {i + 1}</b> — {q.q}</p>
              {q.model && <p className="model">{q.model}</p>}
              {q.keys.map((k, j) => (
                <label key={j} className="check">
                  <input type="checkbox" id={`k-${i}-${j}`} checked={!!ticks[`${i}-${j}`]} onChange={(e) => setTicks((t) => ({ ...t, [`${i}-${j}`]: e.target.checked }))} /> {k}
                </label>
              ))}
            </div>
          ))}
          <p className="kpi-line">Note : <b>{Math.round(selfScore() * 4) / 4}/20</b></p>
          <button type="button" className="btn primary" onClick={() => { finish(selfScore(), 'auto'); onClose(); }}>Enregistrer la note</button>
        </>
      )}
      {phase === 'done' && graded && (
        <>
          <div className={`verdict ${verdict! >= s.settings.validationThreshold ? 'ok' : 'ko'}`}>
            <b>{verdict! >= s.settings.validationThreshold ? 'VALIDÉ' : 'À RETRAVAILLER'}</b>
            <span>{graded.score}/20</span>
          </div>
          <p>{graded.feedback}</p>
          {graded.perQuestion?.map((pq, i) => (
            <div key={i} className="q">
              <p><b>Question {i + 1}</b> — {pq.score}/{pq.max}</p>
              <p>{pq.feedback}</p>
              {pq.missing?.length > 0 && <p className="mute">Manquant : {pq.missing.join(' ; ')}</p>}
              {qs?.[i]?.model && <details><summary>Corrigé type</summary><p className="model">{qs[i].model}</p></details>}
            </div>
          ))}
          <button type="button" className="btn" onClick={onClose}>Fermer</button>
        </>
      )}
    </Modal>
  );
}
