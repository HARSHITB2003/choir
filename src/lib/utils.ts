import { clsx, type ClassValue } from 'clsx';
import type { Classification, Message, Participant } from '../types';

export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}

export function generateRoomCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < 5; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}

export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');
  if (h > 0) return `${String(h).padStart(2, '0')}:${mm}:${ss}`;
  return `${mm}:${ss}`;
}

export function formatClockDelta(fromIso: string, toIso: string): string {
  const delta = new Date(toIso).getTime() - new Date(fromIso).getTime();
  const mm = Math.floor(delta / 60000);
  const ss = Math.floor((delta % 60000) / 1000);
  return `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
}

export function formatRelativeMinutes(iso: string, now: number = Date.now()): string {
  const mins = Math.max(0, Math.floor((now - new Date(iso).getTime()) / 60000));
  if (mins < 1) return 'just now';
  if (mins === 1) return '1 min ago';
  return `${mins} min ago`;
}

export function voiceWeight(messages: Message[], participantId: string): number {
  let total = 0;
  for (const m of messages) {
    if (m.participant_id !== participantId) continue;
    const base = m.classification?.weight ?? 1;
    total += base;
  }
  return total;
}

export function airtimePercent(messages: Message[], participantId: string): number {
  const total = messages.reduce((sum, m) => sum + (m.body?.length ?? 0), 0);
  if (total === 0) return 0;
  const own = messages
    .filter((m) => m.participant_id === participantId)
    .reduce((sum, m) => sum + (m.body?.length ?? 0), 0);
  return Math.round((own / total) * 100);
}

export function silenceMinutes(messages: Message[], participantId: string, now: number = Date.now()): number {
  const theirs = messages.filter((m) => m.participant_id === participantId);
  if (theirs.length === 0) return Math.floor((now - (messages[0] ? new Date(messages[0].created_at).getTime() : now)) / 60000);
  const last = theirs[theirs.length - 1];
  return Math.floor((now - new Date(last.created_at).getTime()) / 60000);
}

export function longestSilentParticipant(
  messages: Message[],
  participants: Participant[],
  now: number = Date.now()
): { participant: Participant; minutes: number } | null {
  let best: { participant: Participant; minutes: number } | null = null;
  for (const p of participants) {
    const mins = silenceMinutes(messages, p.id, now);
    if (best === null || mins > best.minutes) best = { participant: p, minutes: mins };
  }
  return best && best.minutes >= 2 ? best : null;
}

export function classifyDefault(body: string): Classification {
  const trimmed = body.trim().toLowerCase();
  const fillers = ['yeah', 'yes', 'yep', 'no', 'ok', 'okay', 'sure', 'agree', 'agreed', '100%', 'lol', 'haha', 'nice', 'cool', '+1'];
  if (trimmed.length < 4 || fillers.includes(trimmed)) {
    return {
      type: 'filler',
      relates_to_message_ids: [],
      original_speaker_if_steals: null,
      is_resolution_of_earlier_thread: null,
      weight: 0.25,
    };
  }
  if (trimmed.endsWith('?')) {
    return {
      type: 'question',
      relates_to_message_ids: [],
      original_speaker_if_steals: null,
      is_resolution_of_earlier_thread: null,
      weight: 1.0,
    };
  }
  return {
    type: 'builds_on',
    relates_to_message_ids: [],
    original_speaker_if_steals: null,
    is_resolution_of_earlier_thread: null,
    weight: 1.2,
  };
}

export function moodFromMessages(messages: Message[]): 'warm' | 'cool' | 'thin' | 'neutral' {
  const recent = messages.slice(-12);
  if (recent.length < 3) return 'neutral';
  let warm = 0;
  let cool = 0;
  let filler = 0;
  for (const m of recent) {
    const t = m.classification?.type;
    if (!t) continue;
    if (t === 'agreement' || t === 'builds_on') warm++;
    if (t === 'contradicts' || t === 'disagreement_with_reason') cool++;
    if (t === 'filler') filler++;
  }
  if (filler / recent.length > 0.5) return 'thin';
  if (cool > warm + 2) return 'cool';
  if (warm > cool + 2) return 'warm';
  return 'neutral';
}
