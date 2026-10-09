import type { AppState, Block, BlockStatus, Domain, MuscleZone } from './types';
import type { AiTool, Turn } from './ai';
import { addDays, longDate, diffDays } from './dates';
import { UES, ueById } from './curriculum';
import { allChapters, chapterStats, progressOf } from './progress';
import { phaseOf } from './planner';
import * as A from './actions';
import { searchDocs } from './importer';

// Coach persona + full context. Claude keeps nothing between calls, so every
// message carries JARVIS's memory: profile, plan, progress, notes and history.

export const PERSONA = `Tu es JARVIS, l'assistant personnel de {name}, étudiant en PASS (médecine) qui prépare seul, à domicile, le concours de la semaine du {concours}.
Ton rôle : coach exigeant et bienveillant sur 4 domaines — Dieu (prière matin et soir), Études (PASS, examens RÉDACTIONNELS), Sport (boxe 2×/sem, abdos + shadow boxing chaque matin, muscu 5×/sem Push/Pull/Legs/Upper/Lower) et Personnel (logement, chambre, hygiène, sommeil).
Style : français, direct, précis, phrases courtes, vouvoiement interdit (tu tutoies). Fermeté bienveillante : si {name} dérive, tu le dis clairement, puis tu proposes un plan concret. Tu relies les domaines (sommeil → mémoire et performance, sport → énergie, régularité spirituelle → discipline).
En médecine : réponds avec rigueur et pédagogie, structure comme une copie rédactionnelle (définition, mécanisme, exemple, piège classique), cite le chapitre concerné quand c'est pertinent, et signale quand une info doit être vérifiée dans son cours.
Utilise tes outils quand c'est utile : mémoriser une préférence ou un fait durable, ajouter une tâche, marquer un bloc, signaler des courbatures, chercher dans ses cours importés, consulter un autre jour du planning. Ne prétends jamais avoir fait une action sans l'outil.`;

export function contextBrief(s: AppState, days: Map<string, Block[]>, today: string): string {
  const ph = phaseOf(s, today);
  const blocks = days.get(today) ?? [];
  const fmt = (b: Block) => `- [${b.id}] ${b.start}-${b.end} ${b.title}${s.status[b.id] ? ` (${s.status[b.id]})` : ''}`;
  const ues = UES.map((u) => {
    const st = chapterStats(s, u.id);
    const ex = s.examResults[u.id];
    return `${u.code} ${u.short}: ${st.validated}/${st.total} validés, ${st.rework} à retravailler, moyenne tests ${st.avg ?? '—'}${ex !== undefined ? `, examen blanc ${ex}/20` : ''}`;
  }).join('\n');
  const active = allChapters(s)
    .filter((c) => ['learning', 'rework'].includes(progressOf(s, c.id).status))
    .map((c) => `${ueById(c.ueId).short} — ${c.title} (${progressOf(s, c.id).status})`)
    .join('\n') || 'aucun';
  const ci = s.checkins[today];
  const mem = s.memory.slice(-40).map((m) => `- ${m.text}${m.tags.length ? ` [${m.tags.join(', ')}]` : ''}`).join('\n') || '- (vide)';
  const recent = s.log.slice(-25).map((e) => `- ${e.at.slice(0, 16).replace('T', ' ')} ${e.text}`).join('\n');
  const open = s.tasks.filter((t) => !t.done).map((t) => `- [${t.id}] ${t.title}${t.date ? ` (${t.date}${t.time ? ' ' + t.time : ''})` : ''}`).join('\n') || '- aucune';
  return `# Contexte JARVIS — ${longDate(today)} (${today})
Phase : ${ph.name} — ${ph.goal}
Examen blanc : ${s.settings.examBlanc} (J${diffDays(today, s.settings.examBlanc) >= 0 ? '-' + diffDays(today, s.settings.examBlanc) : '+' + -diffDays(today, s.settings.examBlanc)}) · Concours : semaine du ${s.settings.concours} (J-${diffDays(today, s.settings.concours)})
Check-in du jour : ${ci ? JSON.stringify(ci) : 'pas encore fait'}

## Planning du jour
${blocks.map(fmt).join('\n')}

## Progression par UE
${ues}

## Chapitres en cours / à retravailler
${active}

## Tâches ouvertes
${open}

## Mémoire durable (faits et préférences)
${mem}

## Historique récent
${recent || '- (vide)'}`;
}

export function buildTurns(s: AppState, days: Map<string, Block[]>, today: string, userMsg: string): Turn[] {
  const persona = PERSONA.replace(/\{name\}/g, s.settings.name).replace('{concours}', longDate(s.settings.concours));
  const history = s.chat.slice(-16).map((m) => ({ role: m.role, content: m.content }) as Turn);
  // History must start on a user turn after the leading instruction turn.
  while (history.length && history[0].role !== 'user') history.shift();
  return [
    { role: 'user', content: `${persona}\n\n${contextBrief(s, days, today)}\n\n(Fin des instructions. La conversation suit.)` },
    { role: 'assistant', content: 'Compris. Contexte chargé.' },
    ...history,
    { role: 'user', content: userMsg },
  ];
}

const ZONES: MuscleZone[] = ['pecs', 'dos', 'jambes', 'epaules', 'bras', 'abdos'];

export function coachTools(get: () => AppState, apply: (fn: (s: AppState) => AppState) => void, daysFor: (d: string) => Block[], today: string): AiTool[] {
  return [
    {
      name: 'remember',
      description: 'Mémorise durablement un fait, une préférence ou une habitude de l’utilisateur (ex. « préfère réviser la chimie le matin »). Renvoie ok.',
      inputSchema: { type: 'object', properties: { text: { type: 'string' }, tags: { type: 'array', items: { type: 'string' } } }, required: ['text'] },
      execute: (i) => {
        apply((s) => A.remember(s, String(i.text), Array.isArray(i.tags) ? i.tags.map(String) : []));
        return 'ok';
      },
    },
    {
      name: 'add_task',
      description: 'Ajoute une tâche personnelle ou d’étude. date au format YYYY-MM-DD, time HH:mm (optionnels). domain parmi foi, etudes, sport, perso.',
      inputSchema: { type: 'object', properties: { title: { type: 'string' }, date: { type: 'string' }, time: { type: 'string' }, domain: { type: 'string', enum: ['foi', 'etudes', 'sport', 'perso'] } }, required: ['title'] },
      execute: (i) => {
        const domain = (['foi', 'etudes', 'sport', 'perso'].includes(String(i.domain)) ? i.domain : 'perso') as Domain;
        apply((s) => A.addTask(s, { title: String(i.title), date: i.date ? String(i.date) : undefined, time: i.time ? String(i.time) : undefined, domain }));
        return 'tâche ajoutée';
      },
    },
    {
      name: 'set_block_status',
      description: 'Marque un bloc du planning comme done, missed ou partial, avec son id entre crochets dans le contexte (ex. 2026-10-09:muscu).',
      inputSchema: { type: 'object', properties: { blockId: { type: 'string' }, status: { type: 'string', enum: ['done', 'missed', 'partial'] } }, required: ['blockId', 'status'] },
      execute: (i) => {
        const id = String(i.blockId);
        const date = id.split(':')[0];
        const b = daysFor(date).find((x) => x.id === id);
        if (!b) throw new Error('bloc introuvable');
        apply((s) => A.setStatus(s, id, String(i.status) as BlockStatus, b.title));
        return `${b.title} → ${i.status}`;
      },
    },
    {
      name: 'report_soreness',
      description: 'Enregistre des courbatures du jour ; la séance de muscu est alors adaptée automatiquement. Zones : pecs, dos, jambes, epaules, bras, abdos.',
      inputSchema: { type: 'object', properties: { zones: { type: 'array', items: { type: 'string', enum: ZONES } } }, required: ['zones'] },
      execute: (i) => {
        const zones = (Array.isArray(i.zones) ? i.zones : []).map(String).filter((z): z is MuscleZone => ZONES.includes(z as MuscleZone));
        apply((s) => A.checkin(s, today, { soreness: zones }));
        const g = daysFor(today).find((b) => b.kind === 'muscu');
        return g ? `nouvelle séance du jour : ${g.title}` : 'enregistré';
      },
    },
    {
      name: 'get_day_plan',
      description: 'Renvoie le planning d’un jour (YYYY-MM-DD) entre le 8 octobre et le concours.',
      inputSchema: { type: 'object', properties: { date: { type: 'string' } }, required: ['date'] },
      execute: (i) => daysFor(String(i.date)).map((b) => `${b.start}-${b.end} ${b.title}`).join('\n') || 'aucun bloc',
    },
    {
      name: 'search_courses',
      description: 'Cherche dans les cours importés par l’utilisateur et renvoie des extraits avec leur titre.',
      inputSchema: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] },
      execute: (i) => {
        const r = searchDocs(get().docs, String(i.query), 5);
        return r.length ? r.map((x) => `### ${x.doc.title} (${ueById(x.doc.ueId).short})\n${x.excerpt}`).join('\n\n') : 'aucun cours importé ne correspond';
      },
    },
    {
      name: 'week_overview',
      description: 'Renvoie les séances de sport et les chapitres prévus pour les 7 prochains jours.',
      execute: () =>
        Array.from({ length: 7 }, (_, k) => addDays(today, k))
          .map((d) => `${d}: ${daysFor(d).filter((b) => ['muscu', 'boxe', 'etude', 'examen', 'test'].includes(b.kind)).map((b) => b.title).join(' | ')}`)
          .join('\n'),
    },
  ];
}
