import { describe, it, expect } from 'vitest';
import { defaultState } from '../src/core/store';
import { planDays, projectStudy, phaseOf } from '../src/core/planner';
import { planGymWeek } from '../src/core/sport';
import { review } from '../src/core/srs';
import { seedCards } from '../src/core/srs';
import { recordScore } from '../src/core/actions';

const T = '2026-10-09';

describe('planner', () => {
  it('builds every day from today to the concours week', () => {
    const s = defaultState();
    const days = planDays(s, T, '2026-12-18', T);
    expect(days.size).toBe(71);
    for (const [, blocks] of days) {
      expect(blocks.find((b) => b.kind === 'priere' && b.id.endsWith('priere-matin'))).toBeTruthy();
      expect(blocks.find((b) => b.id.endsWith('priere-soir'))).toBeTruthy();
      expect(blocks.find((b) => b.kind === 'reveil-sport')).toBeTruthy();
    }
  });

  it('prioritises minors before the exam blanc and blocks the exam day', () => {
    const s = defaultState();
    const study = projectStudy(s, T);
    const learned = [...study.values()].filter((d) => d.date >= T && d.date < '2026-10-17').flatMap((d) => d.learned);
    expect(learned.length).toBeGreaterThan(8);
    const minors = learned.filter((c) => ['ue1', 'ue2', 'ue3'].includes(c.ueId)).length;
    expect(minors / learned.length).toBeGreaterThan(0.6);
    const eb = planDays(s, '2026-10-17', '2026-10-17', T).get('2026-10-17')!;
    expect(eb.some((b) => b.kind === 'examen')).toBe(true);
    expect(eb.some((b) => b.kind === 'muscu')).toBe(false);
    expect(phaseOf(s, '2026-12-10').id).toBe('p4');
  });

  it('covers every chapter before the annales phase', () => {
    const s = defaultState();
    const study = projectStudy(s, T);
    const all = new Set([...study.values()].filter((d) => d.date < '2026-11-23').flatMap((d) => d.learned.map((c) => c.id)));
    expect(all.size).toBeGreaterThanOrEqual(56);
  });

  it('gates the next chapter of a UE when the previous one must be reworked', () => {
    let s = defaultState();
    s = recordScore(s, 'ue2-c1', 9, 'auto', T);
    const study = projectStudy(s, T);
    const ue2 = [...study.values()].filter((d) => d.date >= T).flatMap((d) => d.slots).filter((x) => x.ueId === 'ue2');
    expect(ue2[0].kind).toBe('gate');
    expect(ue2[0].chapter?.id).toBe('ue2-c1');
  });
});

describe('sport', () => {
  it('assigns Push Pull Legs Upper Lower on the 5 gym days', () => {
    const s = defaultState();
    const w = planGymWeek(s, '2026-10-19', T);
    expect(w.map((g) => g.session)).toEqual(['Push', 'Pull', 'Legs', 'Upper', 'Lower']);
    expect(w.map((g) => g.date)).toEqual(['2026-10-19', '2026-10-20', '2026-10-21', '2026-10-23', '2026-10-24']);
  });

  it('re-queues a missed session and realigns the week', () => {
    const s = defaultState();
    s.status['2026-10-19:muscu'] = 'missed';
    const w = planGymWeek(s, '2026-10-19', '2026-10-21');
    expect(w[0]).toMatchObject({ session: 'Push', missed: true });
    expect(w[1].session).toBe('Push');
    expect(w.map((g) => g.session)).toEqual(['Push', 'Push', 'Pull', 'Legs', 'Lower']);
  });

  it('swaps the session on soreness', () => {
    const s = defaultState();
    s.checkins['2026-10-19'] = { date: '2026-10-19', soreness: ['pecs'] };
    const w = planGymWeek(s, '2026-10-19', '2026-10-19');
    expect(w[0].session).toBe('Pull');
  });

  it('skips the exam blanc saturday', () => {
    const s = defaultState();
    const w = planGymWeek(s, '2026-10-12', T);
    expect(w.find((g) => g.date === '2026-10-17')).toBeUndefined();
    expect(w.length).toBe(4);
  });
});

describe('srs', () => {
  it('grows intervals and resets on lapse', () => {
    let c = seedCards(T)[0];
    c = review(c, 2, T); expect(c.interval).toBe(1);
    c = review(c, 2, T); expect(c.interval).toBe(3);
    c = review(c, 2, T); expect(c.interval).toBeGreaterThan(6);
    c = review(c, 0, T); expect(c.interval).toBe(1); expect(c.lapses).toBe(1);
  });
});
