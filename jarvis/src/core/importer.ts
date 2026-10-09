// Reads course folders picked from the user's computer (PDF, DOCX, TXT/MD),
// entirely in the browser, and maps them onto the 8 UE.
import { UES, type Chapter } from './curriculum';
import type { CourseDoc } from './types';

const PDFJS = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
const PDFJS_WORKER = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
const MAMMOTH = 'https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js';

const loaded = new Map<string, Promise<void>>();
function loadScript(src: string) {
  if (!loaded.has(src)) {
    loaded.set(src, new Promise((res, rej) => {
      const el = document.createElement('script');
      el.src = src;
      el.onload = () => res();
      el.onerror = () => rej(new Error(`Impossible de charger ${src}`));
      document.head.appendChild(el);
    }));
  }
  return loaded.get(src)!;
}

type PdfLib = {
  getDocument(src: { data: ArrayBuffer }): { promise: Promise<{ numPages: number; getPage(n: number): Promise<{ getTextContent(): Promise<{ items: { str?: string; hasEOL?: boolean }[] }> }> }> };
};

async function pdfText(buf: ArrayBuffer): Promise<string> {
  // Loading the worker as a plain script makes pdf.js run it on the main
  // thread, which works inside the sandboxed Artifact frame.
  await loadScript(PDFJS);
  await loadScript(PDFJS_WORKER);
  const lib = (window as unknown as { pdfjsLib: PdfLib }).pdfjsLib;
  const doc = await lib.getDocument({ data: buf }).promise;
  const pages: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const tc = await (await doc.getPage(i)).getTextContent();
    pages.push(tc.items.map((it) => (it.str ?? '') + (it.hasEOL ? '\n' : ' ')).join(''));
  }
  return pages.join('\n\n');
}

async function docxText(buf: ArrayBuffer): Promise<string> {
  await loadScript(MAMMOTH);
  const m = (window as unknown as { mammoth: { extractRawText(o: { arrayBuffer: ArrayBuffer }): Promise<{ value: string }> } }).mammoth;
  return (await m.extractRawText({ arrayBuffer: buf })).value;
}

export const SUPPORTED = /\.(pdf|docx|txt|md)$/i;

/** "UE 1- chimie", "UE2-BIOCHIMIE", "biologie cellulaire", "histo"… → ue id */
export function ueFromPath(path: string): string | null {
  const p = path.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const num = p.match(/ue\s*[-_ ]?\s*(\d)/);
  if (num) {
    const id = `ue${num[1]}`;
    if (UES.some((u) => u.id === id)) return id;
  }
  const words: [RegExp, string][] = [
    [/biochim/, 'ue2'], [/bio\s*cell|biologie cellulaire|biocell/, 'ue3'], [/bio\s*mol|moleculaire/, 'ue4'],
    [/histo/, 'ue5'], [/embryo/, 'ue6'], [/physique|optique/, 'ue7'], [/biostat|statist/, 'ue8'], [/chimie/, 'ue1'],
  ];
  for (const [re, id] of words) if (re.test(p)) return id;
  return null;
}

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]/g, ' ');

/** Best matching existing chapter by shared significant words (≥ 2) or chapter number. */
export function matchChapter(fileName: string, chapters: Chapter[]): Chapter | null {
  const f = norm(fileName.replace(SUPPORTED, ''));
  const words = new Set(f.split(/\s+/).filter((w) => w.length > 3));
  let best: Chapter | null = null;
  let bestScore = 0;
  for (const c of chapters) {
    const cw = norm(c.title).split(/\s+/).filter((w) => w.length > 3);
    const score = cw.filter((w) => words.has(w)).length;
    if (score > bestScore) {
      best = c;
      bestScore = score;
    }
  }
  if (bestScore >= 1) return best;
  const n = f.match(/chap(?:itre)?\s*(\d+)/);
  return n ? chapters.find((c) => c.n === Number(n[1])) ?? null : null;
}

export interface ImportItem {
  file: File;
  path: string;
  ueId: string | null;
  chapterId?: string;
  newChapterTitle?: string;
  status: 'pending' | 'reading' | 'done' | 'error' | 'skipped';
  chars?: number;
  error?: string;
}

export function planImport(files: File[], chapters: Chapter[]): ImportItem[] {
  return files
    .filter((f) => SUPPORTED.test(f.name) && !f.name.startsWith('~$') && !f.name.startsWith('.'))
    .map((file) => {
      const path = (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name;
      const ueId = ueFromPath(path);
      const ch = ueId ? matchChapter(file.name, chapters.filter((c) => c.ueId === ueId)) : null;
      return {
        file, path, ueId, status: 'pending' as const,
        chapterId: ch?.id,
        newChapterTitle: ch ? undefined : cleanTitle(file.name),
      };
    });
}

export const cleanTitle = (name: string) =>
  name.replace(SUPPORTED, '').replace(/[_]+/g, ' ').replace(/\s+-\s+copie.*$/i, '').replace(/\s+/g, ' ').trim();

export async function readFileText(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  if (/\.pdf$/i.test(file.name)) return pdfText(buf);
  if (/\.docx$/i.test(file.name)) return docxText(buf);
  return new TextDecoder().decode(buf);
}

export function makeDoc(item: ImportItem, text: string, chapterId: string | undefined): CourseDoc {
  return {
    id: `d${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    ueId: item.ueId!,
    chapterId,
    title: cleanTitle(item.file.name),
    text: text.replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim(),
    at: new Date().toISOString(),
  };
}

/** Plain keyword search over imported course text; returns short excerpts. */
export function searchDocs(docs: CourseDoc[], query: string, max = 8): { doc: CourseDoc; excerpt: string }[] {
  const terms = norm(query).split(/\s+/).filter((t) => t.length > 2);
  if (!terms.length) return [];
  const out: { doc: CourseDoc; excerpt: string; score: number }[] = [];
  for (const doc of docs) {
    const n = norm(doc.text);
    const score = terms.reduce((a, t) => a + (n.split(t).length - 1), 0) + terms.filter((t) => norm(doc.title).includes(t)).length * 5;
    if (!score) continue;
    const at = Math.max(0, n.indexOf(terms[0]) - 120);
    out.push({ doc, score, excerpt: doc.text.slice(at, at + 320).replace(/\s+/g, ' ') });
  }
  return out.sort((a, b) => b.score - a.score).slice(0, max);
}
