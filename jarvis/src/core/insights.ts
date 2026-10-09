import type { AppState, Block } from './types';
import { addDays, diffDays, longDate, toMin } from './dates';
import { adherence, chapterStats, readiness, streak } from './progress';
import { phaseOf, PLAN_START } from './planner';
import { dueCards } from './srs';
import { ueById } from './curriculum';
import { ZONE_LABEL } from './sport';

export type Tone = 'info' | 'warn' | 'alert' | 'good';
export interface Insight { id: string; tone: Tone; domain: string; text: string; action?: { label: string; to: string } }

/**
 * The proactive layer: reads every domain and links them (sleep → study and
 * training, missed prayer → catch-up, weak UE → more slots, deadlines…).
 */
export function insights(s: AppState, days: Map<string, Block[]>, today: string): Insight[] {
  const out: Insight[] = [];
  const y = addDays(today, -1);
  const ci = s.checkins[today];
  const ph = phaseOf(s, today);
  const toEB = diffDays(today, s.settings.examBlanc);
  const toCC = diffDays(today, s.settings.concours);
  const yAd = adherence(s, days, [y]);
  const rd = readiness(s, today, yAd.pct);

  if (!ci?.wake) out.push({ id: 'checkin', tone: 'info', domain: 'perso', text: 'Fais ton check-in du matin : heure de réveil, sommeil, énergie, courbatures. Le planning du jour s’ajuste dessus.', action: { label: 'Check-in', to: 'checkin' } });

  if (toEB > 0 && toEB <= 9) {
    const st = ['ue1', 'ue2', 'ue3'].map((id) => chapterStats(s, id));
    const v = st.reduce((a, b) => a + b.validated, 0);
    const t = st.reduce((a, b) => a + b.total, 0);
    out.push({ id: 'eb', tone: toEB <= 3 ? 'alert' : 'warn', domain: 'etudes', text: `Examen blanc dans ${toEB} jour${toEB > 1 ? 's' : ''} (${longDate(s.settings.examBlanc)}). Mineures validées : ${v}/${t}. Les TDs passent avant tout le reste.` });
  }
  if (toEB === 0) out.push({ id: 'eb0', tone: 'alert', domain: 'etudes', text: 'Jour d’examen blanc. Pas de séance de muscu ce soir : récupération. Note tes notes par UE ce soir, le plan se recalcule.', action: { label: 'Saisir les notes', to: 'etudes' } });
  if (toEB < 0 && toEB >= -3 && !Object.keys(s.examResults).length) out.push({ id: 'ebres', tone: 'warn', domain: 'etudes', text: 'Saisis tes résultats de l’examen blanc : JARVIS donnera plus de créneaux aux UE les plus faibles.', action: { label: 'Saisir', to: 'etudes' } });

  if (rd.sleepH !== null && rd.sleepH < 7) {
    out.push({ id: 'sleep', tone: 'warn', domain: 'perso', text: `Seulement ${rd.sleepH} h de sommeil. Fais l’apprentissage nouveau ce matin tant que tu es frais, garde l’après-midi pour les TDs. Ce soir à la salle : charges −10 %, pas d’échec musculaire.` });
  }
  if (ci?.soreness?.length) out.push({ id: 'sore', tone: 'info', domain: 'sport', text: `Courbatures signalées (${ci.soreness.map((z) => ZONE_LABEL[z]).join(', ')}). Si la séance du jour sollicite ces zones, JARVIS la remplace et réaligne la semaine.` });

  const morningMiss = s.status[`${y}:priere-matin`] !== 'done';
  const eveningMiss = s.status[`${y}:priere-soir`] !== 'done';
  const activeYesterday = Object.keys(s.status).some((k) => k.startsWith(y)) || !!s.checkins[y];
  if (y >= PLAN_START && activeYesterday && (morningMiss || eveningMiss)) {
    const which = morningMiss && eveningMiss ? 'les deux prières' : morningMiss ? 'la prière du matin' : 'la prière du soir';
    out.push({ id: 'prayer', tone: 'warn', domain: 'foi', text: `Hier, ${which} n’${morningMiss && eveningMiss ? 'ont' : 'a'} pas été cochée${morningMiss && eveningMiss ? 's' : ''}. Prends un temps de rattrapage aujourd’hui, puis reprends le rythme dès ce soir.` });
  }
  const pStreak = Math.min(streak(s, 'priere-matin', today, PLAN_START), streak(s, 'priere-soir', today, PLAN_START));
  if (pStreak >= 3) out.push({ id: 'pstreak', tone: 'good', domain: 'foi', text: `${pStreak} jours de prière sans interruption. Continue.` });

  if (s.status[`${y}:muscu`] === 'missed') out.push({ id: 'gym', tone: 'warn', domain: 'sport', text: 'Séance de muscu ratée hier : le split de la semaine a été recalculé pour rester aligné.', action: { label: 'Voir le sport', to: 'sport' } });
  if (s.status[`${y}:reveil-sport`] && s.status[`${y}:reveil-sport`] !== 'done') out.push({ id: 'morning', tone: 'warn', domain: 'sport', text: 'Abdos + shadow boxing non faits hier. C’est la règle : chaque matin, sans exception.' });

  const due = dueCards(s.cards, today, (id) => !!s.chapters[id]?.j0 || (s.chapters[id]?.status ?? 'todo') !== 'todo');
  if (due.length) out.push({ id: 'cards', tone: due.length > 30 ? 'warn' : 'info', domain: 'etudes', text: `${due.length} flashcard${due.length > 1 ? 's' : ''} à réviser aujourd’hui.`, action: { label: 'Réviser', to: 'cards' } });

  const rework = Object.entries(s.chapters).filter(([, p]) => p.status === 'rework');
  if (rework.length) out.push({ id: 'rework', tone: 'alert', domain: 'etudes', text: `${rework.length} chapitre${rework.length > 1 ? 's' : ''} À RETRAVAILLER. Ils bloquent la suite de leur UE tant qu’ils ne sont pas validés.`, action: { label: 'Voir', to: 'etudes' } });

  const weak = Object.entries(s.examResults).filter(([, n]) => n < 10).map(([id]) => ueById(id).short);
  if (weak.length) out.push({ id: 'weak', tone: 'info', domain: 'etudes', text: `UE sous la moyenne à l’examen blanc : ${weak.join(', ')}. Elles reçoivent plus de créneaux dans le plan.` });

  // Recurrent omissions over the last 7 days.
  const last7 = Array.from({ length: 7 }, (_, i) => addDays(today, -i - 1)).filter((d) => d >= PLAN_START);
  for (const [key, label] of [['chambre', 'ranger la chambre'], ['menage', 'laver le logement'], ['hygiene-soir', 'l’hygiène du soir']] as const) {
    const planned = last7.filter((d) => days.get(d)?.some((b) => b.id === `${d}:${key}`));
    const missed = planned.filter((d) => s.status[`${d}:${key}`] !== 'done').length;
    if (planned.length >= 2 && missed >= 2) out.push({ id: `omit-${key}`, tone: 'warn', domain: 'perso', text: `Oubli récurrent : ${label} (${missed}/${planned.length} sur 7 jours). Fais-le juste après le bloc qui précède, sans négocier.` });
  }

  if (ph.id === 'p4') out.push({ id: 'taper', tone: 'info', domain: 'etudes', text: `Phase d’affûtage, concours dans ${toCC} jours. Plus de nouveau contenu. Coucher à heure fixe : le sommeil vaut plus qu’une heure de révision en plus.` });
  if (toCC > 0 && ph.id !== 'p4') out.push({ id: 'cc', tone: 'info', domain: 'etudes', text: `Concours dans ${toCC} jours. Phase actuelle : ${ph.name}. ${ph.goal}` });

  // Late on today's plan.
  const now = new Date();
  const nowM = now.getHours() * 60 + now.getMinutes();
  const overdue = (days.get(today) ?? []).filter((b) => toMin(b.end) < nowM && !s.status[b.id] && ['etude', 'td', 'priere', 'muscu', 'boxe', 'test'].includes(b.kind));
  if (overdue.length >= 2) out.push({ id: 'late', tone: 'alert', domain: 'etudes', text: `${overdue.length} blocs d’aujourd’hui sont passés sans être validés. Coche ce qui est fait, ou lance « Réorganiser ma journée ».`, action: { label: 'Agenda', to: 'agenda' } });

  return out;
}
