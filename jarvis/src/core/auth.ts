// PIN (PBKDF2-SHA256 with a random salt) and biometric unlock through the
// platform authenticator (Face ID / Touch ID / Windows Hello via WebAuthn).

const enc = new TextEncoder();
const b64 = (buf: ArrayBuffer | Uint8Array) => btoa(String.fromCharCode(...new Uint8Array(buf as ArrayBuffer)));
const unb64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

export async function hashPin(pin: string, salt?: string): Promise<{ hash: string; salt: string }> {
  const saltBytes = salt ? unb64(salt) : crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey('raw', enc.encode(pin), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: saltBytes, iterations: 150_000, hash: 'SHA-256' }, key, 256);
  return { hash: b64(bits), salt: b64(saltBytes) };
}

export async function verifyPin(pin: string, hash: string, salt: string): Promise<boolean> {
  return (await hashPin(pin, salt)).hash === hash;
}

export async function biometricAvailable(): Promise<boolean> {
  try {
    return !!window.PublicKeyCredential && (await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable());
  } catch {
    return false;
  }
}

export async function enrollBiometric(name: string): Promise<string> {
  const cred = (await navigator.credentials.create({
    publicKey: {
      challenge: crypto.getRandomValues(new Uint8Array(32)),
      rp: { name: 'JARVIS' },
      user: { id: crypto.getRandomValues(new Uint8Array(16)), name, displayName: name },
      pubKeyCredParams: [{ type: 'public-key', alg: -7 }, { type: 'public-key', alg: -257 }],
      authenticatorSelection: { authenticatorAttachment: 'platform', userVerification: 'required', residentKey: 'preferred' },
      timeout: 60_000,
    },
  })) as PublicKeyCredential | null;
  if (!cred) throw new Error('Enregistrement annulé');
  return b64(cred.rawId);
}

export async function biometricUnlock(id: string): Promise<boolean> {
  try {
    const res = await navigator.credentials.get({
      publicKey: {
        challenge: crypto.getRandomValues(new Uint8Array(32)),
        allowCredentials: [{ type: 'public-key', id: unb64(id) }],
        userVerification: 'required',
        timeout: 60_000,
      },
    });
    return !!res;
  } catch {
    return false;
  }
}
