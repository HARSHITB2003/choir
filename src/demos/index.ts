import type { BioColour, Classification, Message, Participant } from '../types';

export interface DemoScript {
  id: 'startup' | 'bookclub' | 'holiday';
  title: string;
  subtitle: string;
  participants: Array<{ name: string; colour: BioColour }>;
  beats: Array<{
    speaker: string;
    body: string;
    gap_ms: number; // real-time gap before this message was sent
    classification: Classification;
    ref?: number; // index of prior beat for relates_to
  }>;
}

export const DEMOS: Record<DemoScript['id'], DemoScript> = {
  startup: {
    id: 'startup',
    title: 'a startup team arguing about Q2',
    subtitle: '4 people · ~18 min · 1 decision · 2 unresolved threads',
    participants: [
      { name: 'Ava', colour: 'kelp' },
      { name: 'Jin', colour: 'coral' },
      { name: 'Rafi', colour: 'amberglow' },
      { name: 'Priya', colour: 'lavender' },
    ],
    beats: [
      { speaker: 'Ava', body: 'ok. q2 planning. three candidate features on the table: analytics v2, mobile app, onboarding rewrite.', gap_ms: 8000, classification: mk('new_idea', 2.7) },
      { speaker: 'Jin', body: 'my vote is analytics v2. the paid customers keep asking for it.', gap_ms: 7000, classification: mk('new_idea', 2.5) },
      { speaker: 'Rafi', body: 'I\'d push back. mobile unlocks a whole new segment.', gap_ms: 9000, classification: mk('disagreement_with_reason', 2.0) },
      { speaker: 'Priya', body: 'what is our budget actually this quarter?', gap_ms: 11000, classification: mk('question', 1.0) },
      { speaker: 'Ava', body: 'enough for one big thing or two small things. rafi, you were saying?', gap_ms: 6000, classification: mk('builds_on', 1.3, [2]) },
      { speaker: 'Rafi', body: 'analytics v2 is table stakes. mobile is expansion. different goals.', gap_ms: 10000, classification: mk('builds_on', 1.6, [2]) },
      { speaker: 'Jin', body: 'expansion is great but we need to not lose who we have.', gap_ms: 8000, classification: mk('disagreement_with_reason', 2.0, [5]) },
      { speaker: 'Ava', body: 'the onboarding rewrite could cut churn. cheaper than either.', gap_ms: 9000, classification: mk('new_idea', 2.6) },
      { speaker: 'Rafi', body: 'yeah cool', gap_ms: 5000, classification: mk('filler', 0.25) },
      { speaker: 'Jin', body: 'I think analytics is the right call. paying customers > churn reduction.', gap_ms: 12000, classification: mk('builds_on', 1.4, [1]) },
      { speaker: 'Priya', body: 'I keep coming back to the fact we haven\'t talked about capacity. how many eng weeks does each option take?', gap_ms: 14000, classification: mk('question', 1.1) },
      { speaker: 'Ava', body: 'analytics is 8 weeks. mobile is 14. onboarding is 5.', gap_ms: 9000, classification: mk('builds_on', 1.4, [10]) },
      { speaker: 'Rafi', body: 'mobile is 14 because we have to re-platform. that\'s real technical debt we\'ll regret.', gap_ms: 11000, classification: mk('builds_on', 1.5, [11]) },
      { speaker: 'Jin', body: 'agreed.', gap_ms: 4000, classification: mk('agreement', 0.5) },
      { speaker: 'Ava', body: 'so mobile is off?', gap_ms: 6000, classification: mk('question', 1.0) },
      { speaker: 'Rafi', body: 'for q2 yes. q3 we revisit.', gap_ms: 7000, classification: mk('builds_on', 1.4, [14]) },
      { speaker: 'Jin', body: 'the capacity question really is the thing. good call priya.', gap_ms: 9000, classification: mk('restates', 1.3, [10]) },
      { speaker: 'Ava', body: 'so. analytics or onboarding. analytics has the revenue case.', gap_ms: 10000, classification: mk('builds_on', 1.4) },
      { speaker: 'Jin', body: 'analytics. it\'s the responsible thing.', gap_ms: 7000, classification: mk('builds_on', 1.3, [17]) },
      { speaker: 'Rafi', body: 'fine with me.', gap_ms: 5000, classification: mk('agreement', 0.5) },
      { speaker: 'Ava', body: 'priya?', gap_ms: 4000, classification: mk('question', 0.9) },
      { speaker: 'Priya', body: 'sure.', gap_ms: 8000, classification: mk('filler', 0.3) },
      { speaker: 'Ava', body: 'decision: analytics v2 for q2. let\'s move on.', gap_ms: 8000, classification: mk('new_idea', 2.7) },
      { speaker: 'Jin', body: 'do we need to scope the analytics work or just mark it decided?', gap_ms: 12000, classification: mk('question', 1.1) },
      { speaker: 'Ava', body: 'mark it decided. scope next week.', gap_ms: 7000, classification: mk('builds_on', 1.3, [23]) },
    ],
  },

  bookclub: {
    id: 'bookclub',
    title: 'a book club that didn\'t all read the book',
    subtitle: '5 people · ~22 min · no decision',
    participants: [
      { name: 'Mae', colour: 'kelp' },
      { name: 'Tom', colour: 'coral' },
      { name: 'Zora', colour: 'amberglow' },
      { name: 'Lee', colour: 'lavender' },
      { name: 'Nadia', colour: 'seafoam' },
    ],
    beats: [
      { speaker: 'Mae', body: 'ok. klara and the sun. I loved it. the section at the barn — devastating.', gap_ms: 7000, classification: mk('new_idea', 2.7) },
      { speaker: 'Zora', body: 'I know, the sun imagery throughout just broke me.', gap_ms: 8000, classification: mk('builds_on', 1.5, [0]) },
      { speaker: 'Tom', body: 'oh interesting.', gap_ms: 4000, classification: mk('filler', 0.3) },
      { speaker: 'Lee', body: 'the ending felt rushed though. too neat.', gap_ms: 9000, classification: mk('disagreement_with_reason', 1.9, [0]) },
      { speaker: 'Mae', body: 'rushed how?', gap_ms: 5000, classification: mk('question', 1.0) },
      { speaker: 'Lee', body: 'the whole resolution with josie felt like he ran out of pages.', gap_ms: 10000, classification: mk('builds_on', 1.5, [3]) },
      { speaker: 'Nadia', body: 'hm I haven\'t finished it.', gap_ms: 6000, classification: mk('filler', 0.3) },
      { speaker: 'Zora', body: 'what about the lift scene, though? the one where klara watches from the window. that stayed with me for days.', gap_ms: 12000, classification: mk('new_idea', 2.6) },
      { speaker: 'Mae', body: 'yes. yes. the watching. ishiguro loves a watching narrator.', gap_ms: 8000, classification: mk('builds_on', 1.5, [7]) },
      { speaker: 'Tom', body: 'totally.', gap_ms: 4000, classification: mk('filler', 0.25) },
      { speaker: 'Lee', body: 'the watching thing is interesting. she never really becomes an agent. it\'s all reaction.', gap_ms: 11000, classification: mk('builds_on', 1.6, [8]) },
      { speaker: 'Mae', body: 'that\'s the critique, right? she\'s built to serve. never gets a self.', gap_ms: 10000, classification: mk('builds_on', 1.5, [10]) },
      { speaker: 'Zora', body: 'which is what made the ending earned for me, actually. she accepts what she was.', gap_ms: 11000, classification: mk('contradicts', 1.8, [3]) },
      { speaker: 'Lee', body: 'hmm. maybe.', gap_ms: 5000, classification: mk('agreement', 0.6) },
      { speaker: 'Tom', body: 'I liked it', gap_ms: 4000, classification: mk('filler', 0.3) },
      { speaker: 'Mae', body: 'the mother character though. what did people think?', gap_ms: 9000, classification: mk('question', 1.1) },
      { speaker: 'Zora', body: 'heartbreaking. the plan she had for klara was grotesque and I understood it.', gap_ms: 11000, classification: mk('builds_on', 1.7, [15]) },
      { speaker: 'Lee', body: 'I thought ishiguro handled the mother with more sympathy than she deserved.', gap_ms: 12000, classification: mk('disagreement_with_reason', 1.9, [16]) },
      { speaker: 'Mae', body: 'the book is about love that isn\'t enough, maybe.', gap_ms: 10000, classification: mk('new_idea', 2.6) },
      { speaker: 'Nadia', body: 'that\'s nice.', gap_ms: 5000, classification: mk('filler', 0.3) },
      { speaker: 'Zora', body: 'yes. and obligation dressed as love.', gap_ms: 8000, classification: mk('builds_on', 1.6, [18]) },
      { speaker: 'Tom', body: 'deep.', gap_ms: 4000, classification: mk('filler', 0.3) },
      { speaker: 'Lee', body: 'so what\'s next month\'s book?', gap_ms: 11000, classification: mk('question', 1.0) },
    ],
  },

  holiday: {
    id: 'holiday',
    title: 'a family deciding where to go on holiday',
    subtitle: '4 people · ~14 min · strong disagreements',
    participants: [
      { name: 'Mum', colour: 'kelp' },
      { name: 'Dad', colour: 'coral' },
      { name: 'Ellie', colour: 'amberglow' },
      { name: 'Sam', colour: 'lavender' },
    ],
    beats: [
      { speaker: 'Mum', body: 'right. where are we going this summer. ideas.', gap_ms: 6000, classification: mk('question', 1.1) },
      { speaker: 'Sam', body: 'japan', gap_ms: 3000, classification: mk('new_idea', 2.6) },
      { speaker: 'Ellie', body: 'we went last year', gap_ms: 4000, classification: mk('disagreement_with_reason', 1.8, [1]) },
      { speaker: 'Dad', body: 'scotland. somewhere quiet. I need a week without wifi.', gap_ms: 9000, classification: mk('new_idea', 2.6) },
      { speaker: 'Sam', body: 'absolutely not.', gap_ms: 3000, classification: mk('disagreement_with_reason', 1.9, [3]) },
      { speaker: 'Mum', body: 'I\'d like somewhere hot. we earned it.', gap_ms: 8000, classification: mk('new_idea', 2.5) },
      { speaker: 'Ellie', body: 'portugal?', gap_ms: 4000, classification: mk('new_idea', 2.4) },
      { speaker: 'Dad', body: 'portugal is fine if there are hills.', gap_ms: 6000, classification: mk('builds_on', 1.4, [6]) },
      { speaker: 'Sam', body: 'there are hills everywhere dad.', gap_ms: 5000, classification: mk('filler', 0.3) },
      { speaker: 'Mum', body: 'what about croatia.', gap_ms: 7000, classification: mk('new_idea', 2.5) },
      { speaker: 'Ellie', body: 'yes', gap_ms: 3000, classification: mk('agreement', 0.5) },
      { speaker: 'Sam', body: 'meh', gap_ms: 3000, classification: mk('filler', 0.25) },
      { speaker: 'Dad', body: 'croatia in august is a furnace.', gap_ms: 7000, classification: mk('disagreement_with_reason', 1.9, [9]) },
      { speaker: 'Mum', body: 'that\'s the point. warm.', gap_ms: 5000, classification: mk('builds_on', 1.3, [9]) },
      { speaker: 'Ellie', body: 'sam what about sicily? that was on your list in february', gap_ms: 12000, classification: mk('new_idea', 2.5) },
      { speaker: 'Sam', body: 'sicily works.', gap_ms: 4000, classification: mk('agreement', 0.5) },
      { speaker: 'Mum', body: 'sicily is a good compromise. hot. some culture. not a furnace.', gap_ms: 10000, classification: mk('builds_on', 1.5, [14]) },
      { speaker: 'Dad', body: 'there\'s etna.', gap_ms: 5000, classification: mk('builds_on', 1.3, [14]) },
      { speaker: 'Ellie', body: 'there\'s etna dad.', gap_ms: 4000, classification: mk('filler', 0.3) },
      { speaker: 'Mum', body: 'so sicily. agreed?', gap_ms: 6000, classification: mk('question', 1.0) },
      { speaker: 'Ellie', body: 'yes', gap_ms: 3000, classification: mk('agreement', 0.5) },
      { speaker: 'Sam', body: 'yes', gap_ms: 3000, classification: mk('agreement', 0.5) },
      { speaker: 'Mum', body: 'dad?', gap_ms: 4000, classification: mk('question', 0.9) },
      { speaker: 'Dad', body: 'fine. with reservations about august heat.', gap_ms: 7000, classification: mk('disagreement_with_reason', 1.8) },
    ],
  },
};

function mk(type: Classification['type'], weight: number, refs: number[] = []): Classification {
  return {
    type,
    relates_to_message_ids: refs.map(String),
    original_speaker_if_steals: null,
    is_resolution_of_earlier_thread: null,
    weight,
  };
}

export function instantiateDemo(
  script: DemoScript,
  upToIndex: number
): { participants: Participant[]; messages: Message[] } {
  const roomId = `DEMO-${script.id.toUpperCase()}`;
  const participants: Participant[] = script.participants.map((p, i) => ({
    id: `p${i}`,
    room_id: roomId,
    display_name: p.name,
    colour: p.colour,
    joined_at: new Date(0).toISOString(),
    last_active_at: new Date(0).toISOString(),
  }));
  const byName = new Map(participants.map((p) => [p.display_name, p.id]));
  const messages: Message[] = [];
  let t = 0;
  for (let i = 0; i <= upToIndex && i < script.beats.length; i++) {
    const b = script.beats[i];
    t += b.gap_ms;
    const msgId = String(i);
    const refIds = b.classification.relates_to_message_ids.map((r) => String(r));
    messages.push({
      id: msgId,
      room_id: roomId,
      participant_id: byName.get(b.speaker) ?? 'p0',
      body: b.body,
      created_at: new Date(t).toISOString(),
      classification: { ...b.classification, relates_to_message_ids: refIds },
    });
  }
  return { participants, messages };
}
