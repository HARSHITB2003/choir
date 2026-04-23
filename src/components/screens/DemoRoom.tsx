import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Play, Pause, RotateCcw } from 'lucide-react';
import { AmbientBackground } from '../ui/AmbientBackground';
import { MessageThread } from '../room/MessageThread';
import { MetaPanel } from '../room/MetaPanel';
import { Visualisation } from '../room/Visualisation';
import { DEMOS, instantiateDemo, type DemoScript } from '../../demos';
import type { Message, Participant, UnresolvedThread } from '../../types';
import { moodFromMessages } from '../../lib/utils';

const SPEED = 6;
const MIN_GAP_MS = 380;

export function DemoRoom() {
  const { demoId } = useParams();
  const navigate = useNavigate();
  const script = useMemo<DemoScript | null>(() => {
    if (!demoId) return null;
    const s = DEMOS[demoId as keyof typeof DEMOS];
    return s ?? null;
  }, [demoId]);

  const [index, setIndex] = useState(-1);
  const [playing, setPlaying] = useState(true);
  const [finished, setFinished] = useState(false);
  const timerRef = useRef<number | null>(null);

  const { participants, messages } = useMemo<{ participants: Participant[]; messages: Message[] }>(() => {
    if (!script) return { participants: [], messages: [] };
    return instantiateDemo(script, index);
  }, [script, index]);

  useEffect(() => {
    if (!script || !playing || finished) return;
    if (index >= script.beats.length - 1) {
      setFinished(true);
      return;
    }
    const next = script.beats[index + 1];
    const delay = Math.max(MIN_GAP_MS, next.gap_ms / SPEED);
    timerRef.current = window.setTimeout(() => setIndex((i) => i + 1), delay);
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [index, playing, script, finished]);

  if (!script) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="label-mono">demo not found.</p>
      </div>
    );
  }

  const mood = moodFromMessages(messages);
  const startedAt = new Date(0).toISOString();
  const unresolved: UnresolvedThread[] = computeDemoUnresolved(messages, participants);

  function restart() {
    setIndex(-1);
    setFinished(false);
    setPlaying(true);
  }

  function seeMinutes() {
    sessionStorage.setItem(`choir:DEMO-${script!.id.toUpperCase()}:minutes`, JSON.stringify(DEMO_MINUTES[script!.id]));
    sessionStorage.setItem(`choir:DEMO-${script!.id.toUpperCase()}:duration`, String(estimatedDuration(script!)));
    sessionStorage.setItem(
      `choir:DEMO-${script!.id.toUpperCase()}:participants`,
      JSON.stringify(participants)
    );
    navigate(`/minutes/DEMO-${script!.id.toUpperCase()}`);
  }

  return (
    <div className="min-h-screen flex flex-col">
      <AmbientBackground mood={mood} />

      <header
        style={{
          padding: '14px 20px',
          borderBottom: '1px solid var(--color-current)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <button onClick={() => navigate('/demo')} className="font-mono flex items-center gap-1.5" style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-mist)', background: 'none', border: 0, cursor: 'pointer' }}>
          <ArrowLeft size={12} /> demos
        </button>
        <div className="font-serif" style={{ fontSize: 16, color: 'var(--color-ink)' }}>
          {script.title}
        </div>
        <div className="flex items-center gap-2">
          <button
            aria-label={playing ? 'pause' : 'play'}
            onClick={() => setPlaying((p) => !p)}
            disabled={finished}
            className="font-mono flex items-center gap-1.5"
            style={{
              fontSize: 11,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--color-mist)',
              background: 'none',
              border: '1px solid var(--color-current)',
              borderRadius: 3,
              padding: '6px 10px',
              cursor: finished ? 'default' : 'pointer',
              opacity: finished ? 0.4 : 1,
            }}
          >
            {playing ? <Pause size={12} /> : <Play size={12} />} {playing ? 'pause' : 'play'}
          </button>
          <button
            onClick={restart}
            aria-label="restart"
            className="font-mono flex items-center gap-1.5"
            style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-mist)', background: 'none', border: '1px solid var(--color-current)', borderRadius: 3, padding: '6px 10px', cursor: 'pointer' }}
          >
            <RotateCcw size={12} /> restart
          </button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden" style={{ minHeight: 0 }}>
        <div className="hidden md:block" style={{ width: 320, borderRight: '1px solid var(--color-current)', flexShrink: 0, overflow: 'hidden' }}>
          <MessageThread messages={messages} participants={participants} />
        </div>
        <div className="flex-1 flex items-center justify-center" style={{ minWidth: 0 }}>
          <Visualisation participants={participants} messages={messages} unresolved={unresolved} />
        </div>
        <div className="hidden lg:block" style={{ width: 280, borderLeft: '1px solid var(--color-current)', flexShrink: 0, overflow: 'hidden' }}>
          <MetaPanel roomCode={`DEMO-${script.id.toUpperCase()}`} startedAt={startedAt} participants={participants} messages={messages} unresolved={unresolved} />
        </div>
      </main>

      <div className="md:hidden" style={{ flex: '0 0 36vh', borderTop: '1px solid var(--color-current)', overflow: 'hidden' }}>
        <MessageThread messages={messages} participants={participants} />
      </div>

      {finished && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-t"
          style={{
            padding: '24px 20px',
            borderTop: '1px solid var(--color-current)',
            background: 'rgba(20, 35, 58, 0.7)',
            backdropFilter: 'blur(8px)',
            textAlign: 'center',
          }}
        >
          <p className="font-serif" style={{ fontSize: 20, color: 'var(--color-ink)' }}>
            session ended.
          </p>
          <p className="font-mono mt-2" style={{ fontSize: 12, color: 'var(--color-plankton)' }}>
            the minutes document is ready.
          </p>
          <button
            onClick={seeMinutes}
            className="font-serif mt-4"
            style={{ fontSize: 18, color: 'var(--color-kelp)', background: 'none', border: 0, cursor: 'pointer' }}
          >
            read the minutes →
          </button>
        </motion.div>
      )}
    </div>
  );
}

function estimatedDuration(script: DemoScript): number {
  return script.beats.reduce((a, b) => a + b.gap_ms, 0);
}

function computeDemoUnresolved(messages: Message[], participants: Participant[]): UnresolvedThread[] {
  const nameById = new Map(participants.map((p) => [p.id, p.display_name]));
  const questions = messages.filter((m) => m.classification?.type === 'question');
  const out: UnresolvedThread[] = [];
  const latest = messages[messages.length - 1];
  for (const q of questions) {
    const askedAt = new Date(q.created_at).getTime();
    const after = messages.filter((m) => new Date(m.created_at).getTime() > askedAt);
    const answered = after.some((m) => m.classification?.type === 'builds_on' && m.classification.relates_to_message_ids.includes(q.id));
    if (!answered) {
      out.push({
        raised_at_message_id: q.id,
        raised_by: nameById.get(q.participant_id) ?? 'unknown',
        summary: q.body.length > 60 ? q.body.slice(0, 58) + '…' : q.body,
        minutes_since_raised: Math.max(0, Math.floor((new Date(latest?.created_at ?? q.created_at).getTime() - askedAt) / 60000)),
      });
    }
  }
  return out.slice(0, 5);
}

const DEMO_MINUTES = {
  startup: {
    session_summary:
      'The conversation centred on product prioritisation for the Q2 roadmap. Four participants debated three candidate features: analytics v2, mobile, and an onboarding rewrite. A decision was recorded at minute 41 to pursue analytics v2, with one participant expressing reservations about capacity that were not fully explored.',
    participants: [
      { name: 'Ava', airtime_percent: 34, new_ideas_contributed: 4, silent_minutes: 0, was_developed_by_others: true },
      { name: 'Jin', airtime_percent: 28, new_ideas_contributed: 3, silent_minutes: 0, was_developed_by_others: true },
      { name: 'Rafi', airtime_percent: 22, new_ideas_contributed: 2, silent_minutes: 0, was_developed_by_others: true },
      { name: 'Priya', airtime_percent: 16, new_ideas_contributed: 1, silent_minutes: 9, was_developed_by_others: true },
    ],
    decisions_recorded: [
      {
        decision: 'Pursue analytics v2 as the Q2 focus',
        support: 'openly supported by 3 of 4 participants',
        reservations: 'Priya accepted the decision but did not advocate for it. The capacity concern she raised was resolved only by number, not by plan.',
      },
    ],
    unresolved_threads: [
      { thread: 'What is our budget actually this quarter?', raised_by: 'Priya', at_timestamp: '00:26' },
      { thread: 'Do we need to scope the analytics work or just mark it decided?', raised_by: 'Jin', at_timestamp: '03:18' },
    ],
    patterns_worth_noting: [
      'Priya raised the capacity question at minute 10. It was answered with numbers but the conversation moved on before the implications were discussed.',
      'Jin restated Priya\'s capacity point at minute 16 and credited her for it. This is the only attribution move in the session.',
      'The decision was made with open support from 3 of 4 participants. Priya agreed with a single word.',
    ],
    one_sentence_verdict: 'A productive 47 minutes that resulted in a decision and left two procedural questions dangling.',
  },
  bookclub: {
    session_summary:
      'A five-person book club discussed Klara and the Sun. The conversation arc moved from initial emotional reactions through a short critical debate about the ending, then to character analysis of the mother figure, then drifted into logistics. No decision was required and none was made.',
    participants: [
      { name: 'Mae', airtime_percent: 32, new_ideas_contributed: 3, silent_minutes: 0, was_developed_by_others: true },
      { name: 'Zora', airtime_percent: 29, new_ideas_contributed: 2, silent_minutes: 0, was_developed_by_others: true },
      { name: 'Lee', airtime_percent: 22, new_ideas_contributed: 0, silent_minutes: 0, was_developed_by_others: false },
      { name: 'Tom', airtime_percent: 9, new_ideas_contributed: 0, silent_minutes: 0, was_developed_by_others: false },
      { name: 'Nadia', airtime_percent: 8, new_ideas_contributed: 0, silent_minutes: 0, was_developed_by_others: false },
    ],
    decisions_recorded: [],
    unresolved_threads: [
      { thread: 'So what\'s next month\'s book?', raised_by: 'Lee', at_timestamp: '21:12' },
    ],
    patterns_worth_noting: [
      'Tom and Nadia spoke but made no text-specific contributions. Their messages were all filler or short reactions.',
      'Every new interpretation came from Mae or Zora. Lee disagreed productively but did not introduce new readings.',
      'The question about next month\'s book was raised at the end and no one answered before the session closed.',
    ],
    one_sentence_verdict: 'A warm, uneven 22 minutes in which two participants did the interpretive work and three participated without engaging with the text.',
  },
  holiday: {
    session_summary:
      'Four family members decided on a summer holiday destination. Initial suggestions included Japan, Scotland, Portugal, and Croatia. After Ellie introduced Sicily, the proposal gained majority support and was recorded as the decision.',
    participants: [
      { name: 'Mum', airtime_percent: 30, new_ideas_contributed: 2, silent_minutes: 0, was_developed_by_others: true },
      { name: 'Ellie', airtime_percent: 26, new_ideas_contributed: 2, silent_minutes: 0, was_developed_by_others: true },
      { name: 'Dad', airtime_percent: 25, new_ideas_contributed: 1, silent_minutes: 0, was_developed_by_others: false },
      { name: 'Sam', airtime_percent: 19, new_ideas_contributed: 1, silent_minutes: 0, was_developed_by_others: false },
    ],
    decisions_recorded: [
      {
        decision: 'Sicily in summer',
        support: 'openly supported by 3 of 4 participants',
        reservations: 'Dad agreed but expressed reservations about August heat. This was not discussed further.',
      },
    ],
    unresolved_threads: [],
    patterns_worth_noting: [
      'Sam\'s first suggestion (Japan) was rejected immediately by Ellie. Dad\'s first suggestion (Scotland) was rejected immediately by Sam. The third and fourth ideas were taken more seriously.',
      'Sicily was Ellie\'s idea on Sam\'s behalf. Sam had proposed it privately before the conversation and only agreed once the reference was made explicit.',
      'The decision resolved faster than most because each person had a veto they used early.',
    ],
    one_sentence_verdict: 'A direct 14-minute negotiation that produced a decision with one unresolved reservation.',
  },
} as const;
