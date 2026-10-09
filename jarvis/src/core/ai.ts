import Anthropic from '@anthropic-ai/sdk';

// One interface over two ways of reaching Claude:
//  • inside claude.ai (published Artifact): the `sample` capability, on the
//    viewer's own Claude account — no key needed;
//  • anywhere else (local / PWA): the Anthropic SDK with a key saved on the device.

export interface AiTool {
  name: string;
  description: string;
  inputSchema?: { type: 'object'; properties?: Record<string, unknown>; required?: string[] };
  execute(input: Record<string, unknown>): unknown;
}

export type Turn = { role: 'user' | 'assistant'; content: string };

export interface AskOptions {
  onText?: (text: string) => void;
  signal?: AbortSignal;
  tools?: AiTool[];
  tier?: 'quick' | 'default' | 'complex';
}

export interface Ai {
  kind: 'claude.ai' | 'api';
  ask(input: string | Turn[], o?: AskOptions): Promise<string>;
  json<T>(input: string, o?: AskOptions): Promise<T>;
}

export class AiError extends Error {
  constructor(public code: string, message: string, public partial?: string) {
    super(message);
  }
}

const KEY = 'jarvis:anthropic-key';
export const getApiKey = () => {
  try {
    return localStorage.getItem(KEY) ?? '';
  } catch {
    return '';
  }
};
export const setApiKey = (k: string) => {
  try {
    if (k) localStorage.setItem(KEY, k);
    else localStorage.removeItem(KEY);
  } catch {
    /* storage unavailable */
  }
};

type SampleFn = ((input: string | Turn[], o?: Record<string, unknown>) => Promise<{ text: string }>) & {
  json<T>(input: string | Turn[], o?: Record<string, unknown>): Promise<T>;
};

export async function connectAi(): Promise<Ai | null> {
  const w = window as unknown as { claude?: { use(n: string): Promise<unknown> } };
  if (w.claude?.use) {
    const sample = (await w.claude.use('sample').catch(() => null)) as SampleFn | null;
    if (sample) return sampleAi(sample);
  }
  const key = getApiKey();
  return key ? apiAi(key) : null;
}

function sampleAi(sample: SampleFn): Ai {
  const opts = (o: AskOptions = {}) => ({
    onText: o.onText ? ({ text }: { text: string }) => o.onText!(text) : undefined,
    signal: o.signal,
    modelTier: o.tier ?? 'default',
    ...(o.tools ? { tools: o.tools.map((t) => ({ ...t, execute: (i: Record<string, unknown>) => t.execute(i) })) } : { cache: false }),
  });
  const wrap = (e: unknown): never => {
    const err = e as { code?: string; message?: string; text?: string };
    throw new AiError(err.code ?? 'upstream_error', err.message ?? 'Erreur Claude', err.text);
  };
  return {
    kind: 'claude.ai',
    async ask(input, o) {
      try {
        return (await sample(input, opts(o))).text;
      } catch (e) {
        return wrap(e);
      }
    },
    async json<T>(input: string, o?: AskOptions) {
      try {
        return await sample.json<T>(input, opts(o));
      } catch (e) {
        return wrap(e);
      }
    },
  };
}

const MODEL = 'claude-opus-5-5';

function apiAi(apiKey: string): Ai {
  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });

  async function run(input: string | Turn[], o: AskOptions = {}): Promise<string> {
    const messages: Anthropic.Beta.BetaMessageParam[] = typeof input === 'string' ? [{ role: 'user', content: input }] : input.map((t) => ({ ...t }));
    const tools: Anthropic.Beta.BetaTool[] | undefined = o.tools?.map((t) => ({
      name: t.name,
      description: t.description,
      input_schema: (t.inputSchema ?? { type: 'object', properties: {} }) as Anthropic.Beta.BetaTool.InputSchema,
    }));
    let all = '';
    for (let round = 0; round < 6; round++) {
      try {
        const stream = client.beta.messages.stream(
          {
            model: MODEL,
            max_tokens: 16000,
            output_config: { effort: o.tier === 'quick' ? 'low' : o.tier === 'complex' ? 'high' : 'medium' },
            betas: ['server-side-fallback-2026-07-01'],
            fallbacks: 'default',
            messages,
            ...(tools ? { tools } : {}),
          },
          { signal: o.signal },
        );
        const prefix = all ? all + '\n\n' : '';
        stream.on('text', (_d, snap) => o.onText?.(prefix + snap));
        const msg = await stream.finalMessage();
        if (msg.stop_reason === 'refusal') throw new AiError('refused', 'Claude a décliné cette demande.');
        const text = msg.content.filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === 'text').map((b) => b.text).join('');
        if (text) all = prefix + text;
        const uses = msg.content.filter((b): b is Anthropic.Beta.BetaToolUseBlock => b.type === 'tool_use');
        if (msg.stop_reason !== 'tool_use' || !uses.length) return all;
        messages.push({ role: 'assistant', content: msg.content });
        const results: Anthropic.Beta.BetaToolResultBlockParam[] = [];
        for (const u of uses) {
          const tool = o.tools?.find((t) => t.name === u.name);
          try {
            const r = await tool!.execute((u.input ?? {}) as Record<string, unknown>);
            results.push({ type: 'tool_result', tool_use_id: u.id, content: typeof r === 'string' ? r : JSON.stringify(r) });
          } catch (e) {
            results.push({ type: 'tool_result', tool_use_id: u.id, content: `Error: ${(e as Error).message}`, is_error: true });
          }
        }
        messages.push({ role: 'user', content: results });
      } catch (e) {
        if (e instanceof AiError) throw e;
        if (e instanceof Anthropic.AuthenticationError) throw new AiError('auth', 'Clé API refusée. Vérifie-la dans Réglages.');
        if (e instanceof Anthropic.RateLimitError) throw new AiError('rate_limited', 'Trop de requêtes, réessaie dans un instant.');
        if (e instanceof Anthropic.APIUserAbortError) throw new AiError('cancelled', 'Annulé', all);
        if (e instanceof Anthropic.APIError) throw new AiError('upstream_error', `Erreur API ${e.status ?? ''}`, all);
        throw new AiError('upstream_error', (e as Error).message, all);
      }
    }
    return all;
  }

  return {
    kind: 'api',
    ask: run,
    async json<T>(input: string, o?: AskOptions) {
      const text = await run(input + '\n\nRéponds uniquement avec la valeur JSON demandée, sans texte autour.', o);
      return parseJson<T>(text);
    },
  };
}

export function parseJson<T>(text: string): T {
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const body = fence ? fence[1] : text;
  try {
    return JSON.parse(body) as T;
  } catch {
    const a = body.search(/[[{]/);
    const b = Math.max(body.lastIndexOf('}'), body.lastIndexOf(']'));
    if (a >= 0 && b > a) return JSON.parse(body.slice(a, b + 1)) as T;
    throw new AiError('invalid_json', 'Réponse illisible', text);
  }
}

export const aiErrorCopy = (e: unknown): string => {
  const code = (e as AiError)?.code;
  switch (code) {
    case 'not_granted':
    case 'sampling_disabled':
      return 'Claude n’est pas autorisé pour cette page. Autorise-le dans le menu Autorisations de l’artifact.';
    case 'rate_limited':
      return 'Limite d’utilisation atteinte. Réessaie dans un moment.';
    case 'refused':
      return 'Claude a décliné cette demande. Reformule-la.';
    case 'auth':
      return (e as AiError).message;
    case 'cancelled':
      return '';
    default:
      return 'Connexion à Claude interrompue. Réessaie.';
  }
};
