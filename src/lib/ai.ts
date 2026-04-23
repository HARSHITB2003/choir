import type { Classification, Message, MinutesDocument, Participant, UnresolvedThread } from '../types';
import { classifyDefault } from './utils';

async function postJson<T>(path: string, payload: unknown): Promise<T | null> {
  try {
    const res = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function classifyMessage(
  newMessage: Message,
  history: Message[],
  participants: Participant[]
): Promise<Classification> {
  const result = await postJson<Classification>('/api/classify', {
    newMessage,
    history: history.slice(-20),
    participants,
  });
  return result ?? classifyDefault(newMessage.body);
}

export async function computeUnresolved(
  messages: Message[],
  participants: Participant[]
): Promise<UnresolvedThread[]> {
  const result = await postJson<{ unresolved: UnresolvedThread[] }>('/api/unresolved', {
    messages,
    participants,
  });
  return result?.unresolved ?? [];
}

export async function synthesiseMinutes(
  messages: Message[],
  participants: Participant[],
  roomCode: string,
  durationMs: number
): Promise<MinutesDocument | null> {
  return await postJson<MinutesDocument>('/api/minutes', {
    messages,
    participants,
    roomCode,
    durationMs,
  });
}
