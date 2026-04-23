import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getGroq, sendJson, MODEL } from './_groq.js';

interface Participant {
  id: string;
  display_name: string;
  colour: string;
}
interface Message {
  id: string;
  participant_id: string;
  body: string;
  created_at: string;
  classification: unknown;
}
interface Payload {
  messages: Message[];
  participants: Participant[];
  roomCode: string;
  durationMs: number;
}

const SYSTEM = `You are the quiet court stenographer of Choir. You have sat through thousands of these sessions. You write the minutes document.

Your voice:
- Precise, slightly dry, never theatrical.
- Reports what happened, not what it means emotionally.
- Never accuses, never soft-pedals.
- Uses specific numbers. Uses specific timestamps. British spelling.
- Never uses: hopefully, unfortunately, great, excellent, wonderful.
- No exclamation marks. No em dashes.

Produce ONLY JSON:
{
  "session_summary": "3-5 sentences of what the conversation was about and what its arc was. factual. no interpretation.",
  "participants": [
    {
      "name": string,
      "airtime_percent": number (0-100),
      "new_ideas_contributed": number,
      "silent_minutes": number,
      "was_developed_by_others": boolean
    }
  ],
  "decisions_recorded": [
    {
      "decision": string,
      "support": string (e.g. "openly supported by 3 of 4 participants"),
      "reservations": string | null
    }
  ],
  "unresolved_threads": [
    { "thread": string, "raised_by": string, "at_timestamp": string (MM:SS into session) }
  ],
  "patterns_worth_noting": [
    string (factual observation, no judgement. max 5. pick the most material.)
  ],
  "one_sentence_verdict": string
}

RULES:
- patterns_worth_noting is the most important field. It says things meetings need someone brave enough to say. Say them.
- Never invent. If the data does not support something, do not note it.
- If the conversation was healthy and balanced, say so. Do not manufacture problems.`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return sendJson(res, { error: 'method not allowed' }, 405);
  const groq = getGroq();
  const payload = req.body as Payload;
  if (!payload) return sendJson(res, { error: 'bad json' }, 400);
  if (!groq) return sendJson(res, { error: 'groq not configured' }, 503);

  const participantNameById = new Map(payload.participants.map((p) => [p.id, p.display_name]));
  const startMs = payload.messages.length > 0 ? new Date(payload.messages[0].created_at).getTime() : 0;

  const transcript = payload.messages
    .map((m) => {
      const elapsed = Math.max(0, new Date(m.created_at).getTime() - startMs);
      const mm = Math.floor(elapsed / 60000);
      const ss = Math.floor((elapsed % 60000) / 1000);
      const ts = `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
      const cls = m.classification ? ` <${(m.classification as { type?: string }).type ?? ''}>` : '';
      return `${ts} ${participantNameById.get(m.participant_id) ?? 'unknown'}${cls}: ${m.body}`;
    })
    .join('\n');

  const totalMinutes = Math.round(payload.durationMs / 60000);

  const userPrompt = `ROOM: ${payload.roomCode}
DURATION: ${totalMinutes} minutes
PARTICIPANTS: ${payload.participants.map((p) => p.display_name).join(', ')}

TRANSCRIPT (annotated with classifications in angle brackets):
${transcript}

Write the minutes document. JSON only.`;

  try {
    const completion = await groq.chat.completions.create({
      model: MODEL,
      temperature: 0.3,
      max_tokens: 2000,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM },
        { role: 'user', content: userPrompt },
      ],
    });
    const raw = completion.choices[0]?.message?.content ?? '{}';
    const parsed = JSON.parse(raw);
    return sendJson(res, parsed);
  } catch (err) {
    return sendJson(res, { error: 'minutes failed', detail: String(err) }, 500);
  }
}
