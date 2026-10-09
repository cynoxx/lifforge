import { useRef, useState } from 'react';
import { useJ } from './ctx';
import { Chip, Empty, Panel, Bar } from './widgets';
import { UES, ueById } from '../core/curriculum';
import { allChapters } from '../core/progress';
import { makeDoc, planImport, readFileText, searchDocs, type ImportItem } from '../core/importer';
import { newCard } from '../core/srs';
import * as A from '../core/actions';
import { aiErrorCopy } from '../core/ai';
import type { Chapter } from '../core/curriculum';
import type { Card } from '../core/types';

/** Import courses from the user's computer: pick the PASS folder (UE 1 … UE 8). */
export function Import() {
  const { s, set, get, today, ai, toast } = useJ();
  const [items, setItems] = useState<ImportItem[]>([]);
  const [running, setRunning] = useState(false);
  const [gen, setGen] = useState<{ done: number; total: number } | null>(null);
  const [q, setQ] = useState('');
  const stop = useRef(false);
  const dirRef = useRef<HTMLInputElement>(null);

  const take = (files: FileList | File[] | null) => {
    if (!files?.length) return;
    const list = planImport(Array.from(files), allChapters(s));
    setItems(list);
    if (!list.length) toast('Aucun fichier PDF, DOCX, TXT ou MD trouvé dans cette sélection.', 'warn');
  };

  const onDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const files: File[] = [];
    const walk = async (entry: FileSystemEntry, path: string): Promise<void> => {
      if (entry.isFile) {
        const f = await new Promise<File>((res, rej) => (entry as FileSystemFileEntry).file(res, rej));
        Object.defineProperty(f, 'webkitRelativePath', { value: path + f.name });
        files.push(f);
      } else if (entry.isDirectory) {
        const reader = (entry as FileSystemDirectoryEntry).createReader();
        let batch: FileSystemEntry[] = [];
        do {
          batch = await new Promise<FileSystemEntry[]>((res) => reader.readEntries(res, () => res([])));
          for (const c of batch) await walk(c, `${path}${entry.name}/`);
        } while (batch.length);
      }
    };
    const entries = Array.from(e.dataTransfer.items).map((i) => i.webkitGetAsEntry()).filter(Boolean) as FileSystemEntry[];
    if (entries.length) {
      for (const en of entries) await walk(en, '');
      take(files);
    } else take(e.dataTransfer.files);
  };

  const patch = (i: number, p: Partial<ImportItem>) => setItems((list) => list.map((x, k) => (k === i ? { ...x, ...p } : x)));

  const run = async () => {
    setRunning(true);
    const created: Chapter[] = [];
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (!it.ueId || it.status === 'done') {
        if (!it.ueId) patch(i, { status: 'skipped' });
        continue;
      }
      patch(i, { status: 'reading' });
      try {
        const text = await readFileText(it.file);
        let chapterId = it.chapterId;
        if (!chapterId) {
          const existing = [...allChapters(get()), ...created].filter((c) => c.ueId === it.ueId);
          const ch: Chapter = { id: `${it.ueId}-x${Date.now().toString(36)}${i}`, ueId: it.ueId, n: Math.max(0, ...existing.map((c) => c.n)) + 1, title: it.newChapterTitle || it.file.name, hours: 2.5 };
          created.push(ch);
          chapterId = ch.id;
          set((x) => ({ ...x, customChapters: [...x.customChapters, ch] }));
        }
        const doc = makeDoc(it, text, chapterId);
        set((x) => A.log({ ...x, docs: [...x.docs.filter((d) => !(d.title === doc.title && d.ueId === doc.ueId)), doc] }, 'import', `Cours importé : ${doc.title} (${ueById(doc.ueId).short})`, 'etudes'));
        patch(i, { status: 'done', chars: text.length, chapterId });
      } catch (e) {
        patch(i, { status: 'error', error: (e as Error).message });
      }
    }
    setRunning(false);
    toast('Import terminé. Les cours sont indexés et reliés à leurs chapitres.', 'good');
  };

  const genAll = async () => {
    if (!ai) return toast('Connecte Claude pour générer les flashcards.', 'warn');
    const targets = [...new Set(get().docs.map((d) => d.chapterId).filter(Boolean) as string[])].filter((id) => !get().cards.some((c) => c.chapterId === id && c.source === 'ia'));
    if (!targets.length) return toast('Tous les cours importés ont déjà leurs flashcards IA.', 'info');
    stop.current = false;
    setGen({ done: 0, total: targets.length });
    for (let k = 0; k < targets.length && !stop.current; k++) {
      const c = allChapters(get()).find((x) => x.id === targets[k]);
      if (!c) continue;
      const text = get().docs.filter((d) => d.chapterId === c.id).map((d) => d.text).join('\n\n').slice(0, 60000);
      try {
        const list = await ai.json<{ q: string; a: string; keys: string[] }[]>(
          `Cours de PASS « ${c.title} » (${ueById(c.ueId).name}). Crée 10 flashcards de questions de cours RÉDACTIONNELLES fidèles à ce cours (notions, définitions, mécanismes, pièges).
Réponds uniquement par un tableau JSON [{"q": "…", "a": "réponse modèle 2-5 phrases", "keys": ["point clé", "…"]}].

${text}`,
        );
        const fresh: Card[] = list.filter((x) => x?.q && x?.a).map((x, i) => newCard({ id: `${c.id}-ia${Date.now().toString(36)}${i}`, ueId: c.ueId, chapterId: c.id, q: x.q, a: x.a, keys: Array.isArray(x.keys) ? x.keys.map(String) : [], source: 'ia' }, today));
        set((x) => A.addCards(x, fresh));
      } catch (e) {
        toast(aiErrorCopy(e) || 'Génération interrompue', 'warn');
        break;
      }
      setGen({ done: k + 1, total: targets.length });
    }
    setGen(null);
  };

  const found = q ? searchDocs(s.docs, q) : [];
  const byUe = UES.map((u) => ({ u, n: s.docs.filter((d) => d.ueId === u.id).length }));

  return (
    <div className="page">
      <Panel kicker="Gestion des cours" title="Importer mes cours depuis l’ordinateur">
        <p>Sélectionne ton dossier PASS qui contient <b>UE 1- chimie</b>, <b>UE 2-biochimie</b> … <b>UE 8-biostatistiques</b>. Les fichiers sont lus <b>dans ton navigateur</b> (PDF, Word, texte) : rien n’est envoyé ailleurs. Chaque fichier est rangé dans son UE d’après le nom du dossier, puis relié au bon chapitre.</p>
        <div className="drop" onDragOver={(e) => e.preventDefault()} onDrop={onDrop}>
          <svg viewBox="0 0 24 24" width="34" height="34" aria-hidden="true"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM12 10v6M9 13l3-3 3 3" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          <p>Glisse ton dossier PASS ici</p>
          <div className="toolbar wrap center">
            <button type="button" className="btn primary" onClick={() => dirRef.current?.click()}>Choisir le dossier PASS</button>
            <label className="btn">
              Choisir des fichiers
              <input type="file" id="imp-files" multiple accept=".pdf,.docx,.txt,.md" hidden onChange={(e) => take(e.target.files)} />
            </label>
          </div>
          <input ref={dirRef} type="file" id="imp-dir" hidden multiple {...({ webkitdirectory: '', directory: '' } as Record<string, string>)} onChange={(e) => take(e.target.files)} />
        </div>
        <div className="toolbar wrap">
          {byUe.map(({ u, n }) => <Chip key={u.id} tone={n ? 'ok' : 'mute'}>{u.code} {u.short} · {n}</Chip>)}
        </div>
      </Panel>

      {items.length > 0 && (
        <Panel kicker={`${items.length} fichiers détectés`} title="Vérifie le classement" right={<button type="button" className="btn primary" onClick={run} disabled={running}>{running ? 'Lecture…' : 'Importer dans JARVIS'}</button>}>
          <div className="table-wrap">
            <table className="tbl">
              <thead><tr><th>Fichier</th><th>UE</th><th>Chapitre</th><th>État</th></tr></thead>
              <tbody>
                {items.map((it, i) => {
                  const chs = allChapters(s).filter((c) => c.ueId === it.ueId);
                  return (
                    <tr key={i}>
                      <td><b>{it.file.name}</b><small>{it.path}</small></td>
                      <td>
                        <select className="input sm" id={`imp-ue-${i}`} value={it.ueId ?? ''} onChange={(e) => patch(i, { ueId: e.target.value || null, chapterId: undefined })}>
                          <option value="">— ignorer —</option>
                          {UES.map((u) => <option key={u.id} value={u.id}>{u.code} {u.short}</option>)}
                        </select>
                      </td>
                      <td>
                        <select className="input sm" id={`imp-ch-${i}`} value={it.chapterId ?? ''} onChange={(e) => patch(i, { chapterId: e.target.value || undefined })} disabled={!it.ueId}>
                          <option value="">+ Nouveau : {it.newChapterTitle}</option>
                          {chs.map((c) => <option key={c.id} value={c.id}>{c.n}. {c.title}</option>)}
                        </select>
                      </td>
                      <td><Chip tone={it.status === 'done' ? 'ok' : it.status === 'error' ? 'rose' : it.status === 'reading' ? 'arc' : 'mute'}>{it.status === 'done' ? `${Math.round((it.chars ?? 0) / 1000)}k car.` : it.status === 'error' ? 'Erreur' : it.status === 'reading' ? 'Lecture' : it.status === 'skipped' ? 'Ignoré' : 'Prêt'}</Chip></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Panel>
      )}

      <div className="grid-2">
        <Panel kicker="Claude" title="Flashcards à partir de tes cours">
          <p className="mute">Pour chaque chapitre importé, Claude lit ton cours et rédige 10 questions rédactionnelles avec réponse modèle et points clés.</p>
          {gen ? (
            <>
              <Bar value={(gen.done / gen.total) * 100} />
              <p>{gen.done}/{gen.total} chapitres</p>
              <button type="button" className="btn" onClick={() => (stop.current = true)}>Arrêter</button>
            </>
          ) : (
            <button type="button" className="btn primary" onClick={genAll} disabled={!s.docs.length}>Générer les flashcards manquantes</button>
          )}
        </Panel>
        <Panel kicker="Index" title="Rechercher dans mes cours">
          <input className="input" id="doc-search" placeholder="ex. Michaelis, apoptose, hémoglobine…" value={q} onChange={(e) => setQ(e.target.value)} />
          <ul className="results">
            {found.map((r) => (
              <li key={r.doc.id}><b>{r.doc.title}</b> <Chip>{ueById(r.doc.ueId).short}</Chip><p>…{r.excerpt}…</p></li>
            ))}
            {q && !found.length && <Empty>{s.docs.length ? 'Aucun résultat.' : 'Importe d’abord tes cours.'}</Empty>}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
