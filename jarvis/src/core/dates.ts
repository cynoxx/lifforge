// Date helpers working on local calendar dates as 'YYYY-MM-DD' strings.

export const pad = (n: number) => String(n).padStart(2, '0');

export function iso(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function parse(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d, 12); // noon avoids DST edge cases
}

export function addDays(s: string, n: number): string {
  const d = parse(s);
  d.setDate(d.getDate() + n);
  return iso(d);
}

export function diffDays(a: string, b: string): number {
  return Math.round((parse(b).getTime() - parse(a).getTime()) / 86400000);
}

/** 0 = lundi … 6 = dimanche */
export function weekday(s: string): number {
  return (parse(s).getDay() + 6) % 7;
}

export function mondayOf(s: string): string {
  return addDays(s, -weekday(s));
}

export function range(from: string, to: string): string[] {
  const out: string[] = [];
  for (let d = from; d <= to; d = addDays(d, 1)) out.push(d);
  return out;
}

export function toMin(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

export function toHHMM(min: number): string {
  const m = ((Math.round(min) % 1440) + 1440) % 1440;
  return `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
}

export function today(): string {
  return iso(new Date());
}

export function nowMin(): number {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
}

const JOURS = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

export const dayName = (s: string) => JOURS[weekday(s)];
export const shortDay = (s: string) => JOURS[weekday(s)].slice(0, 3);

export function longDate(s: string): string {
  const d = parse(s);
  return `${JOURS[weekday(s)]} ${d.getDate()} ${MOIS[d.getMonth()]}`;
}

export function shortDate(s: string): string {
  const d = parse(s);
  return `${d.getDate()} ${MOIS[d.getMonth()].slice(0, 4)}.`;
}

/** Sleep duration in minutes between a bedtime and a wake time. */
export function sleepMinutes(bed: string, wake: string): number {
  let d = toMin(wake) - toMin(bed);
  if (d <= 0) d += 1440;
  return d;
}
