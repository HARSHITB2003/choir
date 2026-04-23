import Groq from 'groq-sdk';
import type { VercelResponse } from '@vercel/node';

const apiKey = process.env.GROQ_API_KEY;

export const MODEL = 'llama-3.3-70b-versatile';

export function getGroq(): Groq | null {
  if (!apiKey) return null;
  return new Groq({ apiKey });
}

export function sendJson(res: VercelResponse, body: unknown, status = 200) {
  res.status(status).setHeader('cache-control', 'no-store').json(body);
}
