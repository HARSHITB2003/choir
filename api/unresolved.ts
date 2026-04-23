import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getGroq, sendJson, MODEL } from './_groq.js';

interface Participant { id: string; display_name: string; }
interface Message {
  id: string;
  participant_id: string;
  body: string;
  created_at: string;
}
interface Payload {
  messages: Message[];
  participants: Participant[];
}

const SYSTEM = `You are tracking unresolved threads in a live group conversation.

You will be given the full conversation so far. Identify:
1. Questions that were raised and never directly answered
2. Ideas that were introduced but never developed
3. Disagreements that were dropped without resolution

Return ONLY JSON matching:
{
  "unresolved": [
    {
      "raised_at_message_id": string,
      "raised_by": string,
      "summary": string (max 12 words, phrased as the question or open thread itself),
      "minutes_since_raised": number
    }
  ]
}

RULES:
- Maximum 5 unresolved threads at any time. Pick the most important.
- If a thread has been addressed later, omit it.
- Never flag rhetorical questions as unresolved.`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return sendJson(res, { error: 'method not allowed' }, 405);
  const groq = getGroq();
  const payload = req.body as Payload;
  if (!payload) return sendJson(res, { error: 'bad json' }, 400);
  if (!groq) return sendJson(res, { unresolved: [] });

  const participantNameById = new Map(payload.participants.map((p) => [p.id, p.display_name]));
  const now = Date.now();

  const conversation = payload.messages
    .map((m) => {
      const mins = Math.floor((now - new Date(m.created_at).getTime()) / 60000);
      return `[id:${m.id}] (${mins}m ago) ${participantNameById.get(m.participant_id) ?? 'unknown'}: ${m.body}`;
    })
    .join('\n');

  try {
    const completion = await groq.chat.completions.create({
      model: MODEL,
      temperature: 0.2,
      max_tokens: 500,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM },
        { role: 'user', content: `CONVERSATION SO FAR:\n${conversation}\n\nIdentify unresolved threads. Return JSON.` },
      ],
    });
    const raw = completion.choices[0]?.message?.content ?? '{"unresolved":[]}';
    const parsed = JSON.parse(raw);
    return sendJson(res, { unresolved: Array.isArray(parsed.unresolved) ? parsed.unresolved.slice(0, 5) : [] });
  } catch (err) {
    return sendJson(res, { unresolved: [], error: String(err) }, 500);
  }
}
