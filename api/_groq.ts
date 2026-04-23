import Groq from 'groq-sdk';

const apiKey = process.env.GROQ_API_KEY;

export const MODEL = 'llama-3.3-70b-versatile';

export function getGroq(): Groq | null {
  if (!apiKey) return null;
  return new Groq({ apiKey });
}

export function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });
}

export async function readJson<T>(req: Request): Promise<T | null> {
  try {
    return (await req.json()) as T;
  } catch {
    return null;
  }
}
