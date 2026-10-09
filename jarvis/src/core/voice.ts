// Speech synthesis (briefings, coach replies) and dictation (where the browser allows it).

let enabled = true;
export const setVoiceEnabled = (v: boolean) => {
  enabled = v;
  if (!v) window.speechSynthesis?.cancel();
};

export function speak(text: string) {
  if (!enabled || !('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.cancel();
    const clean = text.replace(/\s+/g, ' ').slice(0, 1400);
    const u = new SpeechSynthesisUtterance(clean);
    u.lang = 'fr-FR';
    u.rate = 1.04;
    u.pitch = 0.92;
    const voices = window.speechSynthesis.getVoices().filter((v) => v.lang.startsWith('fr'));
    const pick = voices.find((v) => /thomas|daniel|paul|male|homme/i.test(v.name)) ?? voices[0];
    if (pick) u.voice = pick;
    window.speechSynthesis.speak(u);
  } catch {
    /* speech unavailable */
  }
}

type Rec = { lang: string; interimResults: boolean; continuous: boolean; start(): void; stop(): void; onresult: (e: { results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void; onend: () => void; onerror: () => void };

const Ctor = () => (window as unknown as { SpeechRecognition?: new () => Rec; webkitSpeechRecognition?: new () => Rec }).SpeechRecognition
  ?? (window as unknown as { webkitSpeechRecognition?: new () => Rec }).webkitSpeechRecognition;

export const canListen = () => !!Ctor() && window.self === window.top;

export function listen(onText: (t: string, final: boolean) => void, onEnd: () => void) {
  const C = Ctor();
  if (!C) return onEnd();
  const r = new C();
  r.lang = 'fr-FR';
  r.interimResults = true;
  r.continuous = false;
  r.onresult = (e) => {
    const res = Array.from(e.results);
    const text = res.map((x) => x[0].transcript).join(' ');
    onText(text, res.at(-1)?.isFinal ?? false);
  };
  r.onend = onEnd;
  r.onerror = onEnd;
  r.start();
}
