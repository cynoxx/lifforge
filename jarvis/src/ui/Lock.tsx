import { useEffect, useState } from 'react';
import type { AppState } from '../core/types';
import { biometricAvailable, biometricUnlock, hashPin, verifyPin } from '../core/auth';

/** Boot / lock screen: PIN pad (created on first run) and Face ID / Touch ID / Windows Hello. */
export function Lock({ s, onUnlock, onSetPin }: { s: AppState; onUnlock: () => void; onSetPin: (hash: string, salt: string, len: number) => void }) {
  const setup = !s.pinHash;
  const [pin, setPin] = useState('');
  const [first, setFirst] = useState<string | null>(null);
  const [msg, setMsg] = useState(setup ? 'Crée ton code d’accès (4 à 6 chiffres)' : 'Identification requise');
  const [err, setErr] = useState(false);
  const [bio, setBio] = useState(false);
  const [scan, setScan] = useState(false);

  useEffect(() => {
    if (s.webauthnId) biometricAvailable().then(setBio);
  }, [s.webauthnId]);

  const submit = async (p: string) => {
    if (setup) {
      if (p.length < 4) return;
      if (!first) {
        setFirst(p);
        setPin('');
        setMsg('Confirme ton code');
        return;
      }
      if (first !== p) {
        setFirst(null);
        setPin('');
        setErr(true);
        setMsg('Les codes ne correspondent pas. Recommence.');
        return;
      }
      const { hash, salt } = await hashPin(p);
      onSetPin(hash, salt, p.length);
      onUnlock();
      return;
    }
    if (await verifyPin(p, s.pinHash!, s.pinSalt!)) onUnlock();
    else {
      setErr(true);
      setPin('');
      setMsg('Code incorrect');
    }
  };

  const press = (k: string) => {
    setErr(false);
    if (k === '⌫') return setPin((p) => p.slice(0, -1));
    if (k === 'OK') return void submit(pin);
    const p = (pin + k).slice(0, 6);
    setPin(p);
    if (!setup && p.length >= 4 && p.length === (s.pinLen ?? 4)) void submit(p);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (/^\d$/.test(e.key)) press(e.key);
      else if (e.key === 'Backspace') press('⌫');
      else if (e.key === 'Enter') press('OK');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const face = async () => {
    setScan(true);
    const ok = await biometricUnlock(s.webauthnId!);
    setScan(false);
    if (ok) onUnlock();
    else setMsg('Reconnaissance refusée. Utilise ton code.');
  };

  return (
    <div className="lock">
      <div className="lock-grid" aria-hidden="true" />
      <div className="lock-card">
        <div className={`lock-core${scan ? ' scanning' : ''}${err ? ' err' : ''}`} aria-hidden="true">
          <span /><span /><span />
        </div>
        <h1 className="wordmark">J.A.R.V.I.S.</h1>
        <p className="lock-sub">Just A Rather Very Intelligent System</p>
        <p className={`lock-msg${err ? ' err' : ''}`} role="status">{msg}</p>
        <div className="pin-dots" aria-label={`${pin.length} chiffres saisis`}>
          {Array.from({ length: Math.max(4, pin.length) }, (_, i) => <i key={i} className={i < pin.length ? 'on' : ''} />)}
        </div>
        <div className="pad">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0', 'OK'].map((k) => (
            <button key={k} type="button" onClick={() => press(k)} className={k === 'OK' ? 'ok' : ''} aria-label={k === '⌫' ? 'Effacer' : k === 'OK' ? 'Valider' : k}>{k}</button>
          ))}
        </div>
        {bio && !setup && (
          <button type="button" className="btn face" onClick={face}>
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3M9 9v1M15 9v1M12 9v4h-1M9 16c1.5 1 4.5 1 6 0" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
            Reconnaissance faciale
          </button>
        )}
      </div>
    </div>
  );
}
