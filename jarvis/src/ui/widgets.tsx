import type { ReactNode } from 'react';
import type { Block, BlockStatus, Domain } from '../core/types';
import { useJ } from './ctx';
import { setStatus } from '../core/actions';
import { isTracked } from '../core/progress';
import { toMin } from '../core/dates';

export const DOMAIN_LABEL: Record<Domain, string> = { foi: 'Dieu', etudes: 'Études', sport: 'Sport', perso: 'Personnel' };

export function Panel({ title, kicker, right, children, className = '' }: { title?: ReactNode; kicker?: string; right?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`panel ${className}`}>
      {(title || right) && (
        <header className="panel-h">
          <div>
            {kicker && <div className="kicker">{kicker}</div>}
            {title && <h2>{title}</h2>}
          </div>
          {right}
        </header>
      )}
      {children}
    </section>
  );
}

/** Concentric progress ring. `value` 0–100. */
export function Ring({ value, size = 64, stroke = 6, color = 'var(--arc)', label, sub }: { value: number; size?: number; stroke?: number; color?: string; label?: ReactNode; sub?: ReactNode }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className="ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--line)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={`${(v / 100) * c} ${c}`} transform={`rotate(-90 ${size / 2} ${size / 2})`} style={{ filter: `drop-shadow(0 0 4px ${color})`, transition: 'stroke-dasharray .8s ease' }} />
      </svg>
      {(label !== undefined || sub) && (
        <div className="ring-c">
          {label !== undefined && <b>{label}</b>}
          {sub && <small>{sub}</small>}
        </div>
      )}
    </div>
  );
}

/** The arc reactor: one ring per domain, today's completion. */
export function Reactor({ values, center }: { values: { d: Domain; v: number }[]; center: ReactNode }) {
  const size = 260;
  return (
    <div className="reactor">
      <svg viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <defs>
          <radialGradient id="core" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--arc)" stopOpacity=".35" />
            <stop offset="70%" stopColor="var(--arc)" stopOpacity=".04" />
            <stop offset="100%" stopColor="var(--arc)" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="130" cy="130" r="128" fill="url(#core)" />
        <g className="spin-slow">
          {Array.from({ length: 60 }, (_, i) => (
            <line key={i} x1="130" y1="4" x2="130" y2={i % 5 ? 10 : 16} stroke="var(--arc)" strokeOpacity={i % 5 ? 0.25 : 0.6} strokeWidth="1.2" transform={`rotate(${i * 6} 130 130)`} />
          ))}
        </g>
        <g className="spin-rev">
          <circle cx="130" cy="130" r="112" fill="none" stroke="var(--arc)" strokeOpacity=".22" strokeDasharray="2 10" />
        </g>
        {values.map(({ d, v }, i) => {
          const r = 98 - i * 15;
          const c = 2 * Math.PI * r;
          return (
            <g key={d}>
              <circle cx="130" cy="130" r={r} fill="none" stroke="var(--line)" strokeWidth="8" />
              <circle cx="130" cy="130" r={r} fill="none" stroke={`var(--${d})`} strokeWidth="8" strokeLinecap="round"
                strokeDasharray={`${(Math.min(100, v) / 100) * c} ${c}`} transform="rotate(-90 130 130)" style={{ filter: `drop-shadow(0 0 6px var(--${d}))`, transition: 'stroke-dasharray 1s ease' }} />
            </g>
          );
        })}
      </svg>
      <div className="reactor-c">{center}</div>
    </div>
  );
}

export function Chip({ children, tone = 'mute', onClick, active }: { children: ReactNode; tone?: string; onClick?: () => void; active?: boolean }) {
  const C = onClick ? 'button' : 'span';
  return (
    <C className={`chip t-${tone}${active ? ' on' : ''}`} onClick={onClick} type={onClick ? 'button' : undefined}>
      {children}
    </C>
  );
}

const NEXT: Record<string, BlockStatus | undefined> = { '': 'done', done: 'partial', partial: 'missed', missed: undefined };

export function StatusButton({ b }: { b: Block }) {
  const { s, set } = useJ();
  const st = s.status[b.id] ?? '';
  if (!isTracked(b)) return <span className="sbtn ghost" aria-hidden="true" />;
  const label = st === 'done' ? 'Fait' : st === 'partial' ? 'Partiel' : st === 'missed' ? 'Raté' : 'À faire';
  return (
    <button type="button" className={`sbtn s-${st || 'todo'}`} title={`${label} — cliquer pour changer`} aria-label={`${b.title} : ${label}`}
      onClick={(e) => {
        e.stopPropagation();
        set((x) => setStatus(x, b.id, NEXT[st], b.title));
      }}>
      {st === 'done' ? '✓' : st === 'partial' ? '½' : st === 'missed' ? '✕' : ''}
    </button>
  );
}

export function BlockRow({ b, now, onOpen, compact }: { b: Block; now?: number; onOpen?: (b: Block) => void; compact?: boolean }) {
  const { s } = useJ();
  const live = now !== undefined && toMin(b.start) <= now && now < (toMin(b.end) > toMin(b.start) ? toMin(b.end) : 1440);
  const st = s.status[b.id];
  return (
    <div className={`brow d-${b.domain}${live ? ' live' : ''}${st ? ` st-${st}` : ''}${b.critical ? ' crit' : ''}`} onClick={() => onOpen?.(b)} role={onOpen ? 'button' : undefined} tabIndex={onOpen ? 0 : undefined}>
      <span className="btime">{b.start}<i>{b.end}</i></span>
      <span className="bbar" />
      <span className="btxt">
        <b>{b.title}</b>
        {!compact && b.detail && <small>{b.detail.split('\n')[0]}</small>}
      </span>
      <StatusButton b={b} />
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="empty">{children}</p>;
}

export function Bar({ value, color = 'var(--arc)' }: { value: number; color?: string }) {
  return (
    <div className="bar" role="progressbar" aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={100}>
      <span style={{ width: `${Math.max(0, Math.min(100, value))}%`, background: color }} />
    </div>
  );
}

/** GitHub-style adherence heatmap for a list of dates. */
export function Heat({ cells }: { cells: { date: string; v: number | null; title: string }[] }) {
  return (
    <div className="heat">
      {cells.map((c) => (
        <span key={c.date} title={c.title} className="hc" style={{ opacity: c.v === null ? 0.15 : 0.25 + 0.75 * c.v, background: c.v === null ? 'var(--line)' : 'var(--arc)' }} />
      ))}
    </div>
  );
}

export function Modal({ title, onClose, children, wide }: { title: ReactNode; onClose: () => void; children: ReactNode; wide?: boolean }) {
  return (
    <div className="modal-bg" onClick={onClose}>
      <div className={`modal${wide ? ' wide' : ''}`} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <header className="panel-h">
          <h2>{title}</h2>
          <button type="button" className="btn ghost" onClick={onClose} aria-label="Fermer">✕</button>
        </header>
        <div className="modal-b">{children}</div>
      </div>
    </div>
  );
}

/** Minimal markdown: headings, bold, italics, lists, code. Escapes HTML first. */
export function Md({ text }: { text: string }) {
  const esc = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const html = esc
    .split(/\n{2,}/)
    .map((para) => {
      if (/^#{1,4} /.test(para)) {
        const lvl = para.match(/^#+/)![0].length;
        return `<h${lvl + 2}>${inline(para.replace(/^#+ /, ''))}</h${lvl + 2}>`;
      }
      const lines = para.split('\n');
      if (lines.every((l) => /^\s*([-*•]|\d+\.) /.test(l))) {
        const ordered = /^\s*\d+\./.test(lines[0]);
        return `<${ordered ? 'ol' : 'ul'}>${lines.map((l) => `<li>${inline(l.replace(/^\s*([-*•]|\d+\.) /, ''))}</li>`).join('')}</${ordered ? 'ol' : 'ul'}>`;
      }
      return `<p>${lines.map(inline).join('<br/>')}</p>`;
    })
    .join('');
  return <div className="md" dangerouslySetInnerHTML={{ __html: html }} />;
}

const inline = (s: string) =>
  s.replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>');
