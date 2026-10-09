import { useState } from 'react';
import { useJ } from './ctx';
import { Chip, Panel } from './widgets';
import type { Settings as S } from '../core/types';
import { biometricAvailable, enrollBiometric, hashPin } from '../core/auth';
import { exportJson, importJson } from '../core/store';
import { getApiKey, setApiKey } from '../core/ai';

const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

export function Settings({ onAiChange }: { onAiChange: () => void }) {
  const { s, set, toast, download, backend, ai } = useJ();
  const st = s.settings;
  const up = (p: Partial<S>) => set((x) => ({ ...x, settings: { ...x.settings, ...p } }));
  const toggleDay = (key: 'boxingDays' | 'cleaningDays', d: number) => {
    const cur = st[key];
    const next = cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d].sort();
    if (key === 'boxingDays' && next.length !== 2) return toast('La boxe est prévue 2 fois par semaine : choisis exactement 2 jours.', 'warn');
    up({ [key]: next } as Partial<S>);
  };
  const [pin, setPin] = useState('');
  const [key, setKey] = useState(getApiKey());

  const changePin = async () => {
    if (!/^\d{4,6}$/.test(pin)) return toast('Le code doit contenir 4 à 6 chiffres.', 'warn');
    const { hash, salt } = await hashPin(pin);
    set((x) => ({ ...x, pinHash: hash, pinSalt: salt, pinLen: pin.length }));
    setPin('');
    toast('Code d’accès modifié.', 'good');
  };

  const face = async () => {
    if (!(await biometricAvailable())) return toast('Aucun capteur biométrique disponible ici. Installe JARVIS sur ton téléphone ou ton Mac (Face ID / Touch ID) pour l’activer.', 'warn');
    try {
      const id = await enrollBiometric(st.name);
      set((x) => ({ ...x, webauthnId: id }));
      toast('Reconnaissance biométrique activée.', 'good');
    } catch {
      toast('Enregistrement biométrique annulé ou refusé par le navigateur.', 'warn');
    }
  };

  return (
    <div className="page">
      <div className="grid-2">
        <Panel kicker="Profil & rythme" title="Réglages du planning">
          <div className="form-grid">
            <label className="field"><span>Prénom</span><input className="input" id="set-name" value={st.name} onChange={(e) => up({ name: e.target.value })} /></label>
            <label className="field"><span>Réveil cible</span><input className="input" id="set-wake" type="time" value={st.wake} onChange={(e) => up({ wake: e.target.value })} /></label>
            <label className="field"><span>Coucher cible</span><input className="input" id="set-bed" type="time" value={st.bed} onChange={(e) => up({ bed: e.target.value })} /></label>
            <label className="field"><span>Heure salle / boxe</span><input className="input" id="set-gym" type="time" value={st.gymTime} onChange={(e) => up({ gymTime: e.target.value })} /></label>
            <label className="field"><span>Examen blanc</span><input className="input" id="set-eb" type="date" value={st.examBlanc} onChange={(e) => up({ examBlanc: e.target.value })} /></label>
            <label className="field"><span>Début semaine du concours</span><input className="input" id="set-cc" type="date" value={st.concours} onChange={(e) => up({ concours: e.target.value })} /></label>
            <label className="field"><span>Seuil de validation (/20)</span><input className="input" id="set-th" type="number" min={10} max={18} step={0.5} value={st.validationThreshold} onChange={(e) => up({ validationThreshold: Number(e.target.value) })} /></label>
            <label className="field"><span>Verrouillage auto (min)</span><input className="input" id="set-lock" type="number" min={1} max={120} value={st.autoLockMin} onChange={(e) => up({ autoLockMin: Number(e.target.value) })} /></label>
          </div>
          <p className="kicker">Jours de boxe (2)</p>
          <div className="toolbar wrap">{DAYS.map((d, i) => <Chip key={d} tone="sport" active={st.boxingDays.includes(i)} onClick={() => toggleDay('boxingDays', i)}>{d}</Chip>)}</div>
          <p className="mute">La musculation occupe automatiquement les 5 autres jours (Push → Pull → Legs → Upper → Lower).</p>
          <p className="kicker">Jours de ménage</p>
          <div className="toolbar wrap">{DAYS.map((d, i) => <Chip key={d} tone="ok" active={st.cleaningDays.includes(i)} onClick={() => toggleDay('cleaningDays', i)}>{d}</Chip>)}</div>
          <label className="check"><input type="checkbox" id="set-sun" checked={st.sundayCatchup} onChange={(e) => up({ sundayCatchup: e.target.checked })} /> Rattrapage muscu le dimanche matin si une séance a sauté</label>
          <label className="check"><input type="checkbox" id="set-voice" checked={st.voice} onChange={(e) => up({ voice: e.target.checked })} /> Voix de JARVIS (briefings et réponses lus à voix haute)</label>
        </Panel>

        <div className="stack">
          <Panel kicker="Sécurité" title="Accès">
            <div className="toolbar wrap">
              <input className="input sm" id="set-pin" type="password" inputMode="numeric" placeholder="Nouveau code" value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))} />
              <button type="button" className="btn" onClick={changePin}>Changer le code</button>
            </div>
            <div className="toolbar wrap">
              <button type="button" className="btn" onClick={face}>{s.webauthnId ? 'Réenregistrer Face ID / Touch ID' : 'Activer Face ID / Touch ID / Windows Hello'}</button>
              {s.webauthnId && <Chip tone="ok">Biométrie active</Chip>}
            </div>
            <p className="mute">La biométrie passe par le capteur de ton appareil (WebAuthn). Ton visage ne quitte jamais l’appareil. Elle fonctionne dans la version installée de JARVIS ; dans claude.ai, utilise le code.</p>
          </Panel>

          <Panel kicker="Intelligence" title="Connexion à Claude" right={<Chip tone={ai ? 'ok' : 'rose'}>{ai ? (ai.kind === 'claude.ai' ? 'claude.ai' : 'API') : 'hors ligne'}</Chip>}>
            {ai?.kind === 'claude.ai' ? (
              <p>JARVIS utilise ton compte Claude directement depuis claude.ai. Aucune clé n’est nécessaire.</p>
            ) : (
              <>
                <p className="mute">Hors de claude.ai, JARVIS parle à Claude avec une clé API Anthropic stockée uniquement sur cet appareil.</p>
                <div className="toolbar wrap">
                  <input className="input" id="set-key" type="password" placeholder="sk-ant-…" value={key} onChange={(e) => setKey(e.target.value.trim())} />
                  <button type="button" className="btn primary" onClick={() => { setApiKey(key); onAiChange(); toast(key ? 'Clé enregistrée.' : 'Clé supprimée.', 'good'); }}>Enregistrer</button>
                </div>
              </>
            )}
          </Panel>

          <Panel kicker="Mémoire" title="Données & sauvegardes">
            <p>Stockage : <b>{backend?.label ?? '—'}</b>{backend?.kind === 'cloud' ? '. Claude peut relire cette mémoire dans tes prochaines conversations : tout est relié.' : '.'}</p>
            <p className="mute">Sauvegarde automatique à chaque action, plus un instantané quotidien (7 jours glissants).</p>
            <div className="toolbar wrap">
              <button type="button" className="btn" onClick={() => download(`jarvis-${new Date().toISOString().slice(0, 10)}.json`, exportJson(s), 'application/json')}>Exporter tout (.json)</button>
              <label className="btn">
                Restaurer une sauvegarde
                <input type="file" id="set-restore" accept="application/json" hidden onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  try {
                    const st2 = importJson(await f.text());
                    set(() => st2);
                    toast('Sauvegarde restaurée.', 'good');
                  } catch (err) {
                    toast((err as Error).message, 'warn');
                  }
                }} />
              </label>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
