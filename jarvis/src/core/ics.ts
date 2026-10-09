import type { Block } from './types';

const stamp = (date: string, hhmm: string) => `${date.replace(/-/g, '')}T${hhmm.replace(':', '')}00`;
const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');

/** iCalendar export (Europe/Paris floating local time) with a reminder 10 min before. */
export function toIcs(blocks: Block[]): string {
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//JARVIS//PASS//FR', 'CALSCALE:GREGORIAN', 'X-WR-CALNAME:JARVIS', 'X-WR-TIMEZONE:Europe/Paris'];
  const now = new Date().toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z';
  for (const b of blocks) {
    if (b.kind === 'sommeil' || b.kind === 'repas') continue;
    lines.push(
      'BEGIN:VEVENT',
      `UID:${b.id.replace(/[^a-zA-Z0-9-]/g, '-')}@jarvis`,
      `DTSTAMP:${now}`,
      `DTSTART:${stamp(b.date, b.start)}`,
      `DTEND:${stamp(b.date, b.end < b.start ? '23:59' : b.end)}`,
      `SUMMARY:${esc(b.title)}`,
      ...(b.detail ? [`DESCRIPTION:${esc(b.detail)}`] : []),
      `CATEGORIES:${b.domain.toUpperCase()}`,
      'BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${esc(b.title)}`, 'TRIGGER:-PT10M', 'END:VALARM',
      'END:VEVENT',
    );
  }
  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}
