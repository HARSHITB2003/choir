import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getGroq, sendJson, MODEL } from './_groq';

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
}
interface Payload {
  newMessage: Message;
  history: Message[];
  participants: Participant[];
}

const SYSTEM = `You are the social analyst of Choir, a room that visualises the shape of multi-party conversations.

You will be given:
- The last up-to-20 messages in the conversation (each with message id, speaker name, timestamp, body)
- A new message that was just sent
- The list of current participants

Classify the new message.

Return ONLY JSON matching:
{
  "type": "new_idea" | "builds_on" | "contradicts" | "restates" | "steals" | "question" | "agreement" | "disagreement_with_reason" | "filler",
  "relates_to_message_ids": [ ...string ids or empty array ],
  "original_speaker_if_steals": string | null,
  "is_resolution_of_earlier_thread": string | null,
  "weight": number between 0.2 and 3.0
}

RULES:
- "steals" only when the current speaker is presenting something previously said by someone else without attribution, AND that person's original contribution was dismissed, ignored, or not credited. Be conservative.
- "restates" is the neutral version: same idea, same person's credit due, but not malicious.
- "filler" is for "yeah", "I agree", "lol", "100%" — minimal content.
- "new_idea" is rare. Most messages build on prior ones.
- When in doubt between "new_idea" and "builds_on", default to "builds_on".

Weight guidelines:
- new_idea: 2.5-3.0
- disagreement_with_reason: 1.8-2.2
- builds_on: 1.2-1.6
- question: 0.8-1.2
- agreement: 0.4-0.6
- filler: 0.2-0.3`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return sendJson(res, { error: 'method not allowed' }, 405);
  const groq = getGroq();
  const payload = req.body as Payload;
  if (!payload || !payload.newMessage) return sendJson(res, { error: 'bad json' }, 400);
  if (!groq) return sendJson(res, { error: 'groq not configured' }, 503);

  const participantNameById = new Map(payload.participants.map((p) => [p.id, p.display_name]));

  const historyText = (payload.history || [])
    .map((m) => `[id:${m.id}] ${participantNameById.get(m.participant_id) ?? 'unknown'}: ${m.body}`)
    .join('\n');

  const selfName = participantNameById.get(payload.newMessage.participant_id) ?? 'unknown';

  const userPrompt = `PARTICIPANTS: ${payload.participants.map((p) => p.display_name).join(', ')}

HISTORY:
${historyText || '(no prior messages)'}

NEW MESSAGE
[id:${payload.newMessage.id}] ${selfName}: ${payload.newMessage.body}

Classify. Return JSON only.`;

  try {
    const completion = await groq.chat.completions.create({
      model: MODEL,
      temperature: 0.1,
      max_tokens: 350,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM },
        { role: 'user', content: userPrompt },
      ],
    });
    const raw = completion.choices[0]?.message?.content ?? '{}';
    const parsed = JSON.parse(raw);
    return sendJson(res, {
      type: parsed.type ?? 'builds_on',
      relates_to_message_ids: Array.isArray(parsed.relates_to_message_ids) ? parsed.relates_to_message_ids : [],
      original_speaker_if_steals: parsed.original_speaker_if_steals ?? null,
      is_resolution_of_earlier_thread: parsed.is_resolution_of_earlier_thread ?? null,
      weight: typeof parsed.weight === 'number' ? parsed.weight : 1.0,
    });
  } catch (err) {
    return sendJson(res, { error: 'classify failed', detail: String(err) }, 500);
  }
}
