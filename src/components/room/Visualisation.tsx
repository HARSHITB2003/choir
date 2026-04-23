import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import type { Message, Participant, UnresolvedThread } from '../../types';
import { COLOUR_HEX } from '../../types';
import { silenceMinutes, voiceWeight } from '../../lib/utils';

interface Thread {
  id: string;
  fromXY: [number, number];
  toXY: [number, number];
  colour: string;
  type: 'builds_on' | 'contradicts' | 'restates' | 'steals';
  createdAt: number;
}

interface Props {
  participants: Participant[];
  messages: Message[];
  unresolved: UnresolvedThread[];
}

const VB = 600;
const CX = VB / 2;
const CY = VB / 2;

function layoutPositions(n: number): Array<[number, number]> {
  if (n === 0) return [];
  if (n === 1) return [[CX, CY]];
  const radius = n === 2 ? 130 : n <= 4 ? 170 : 200;
  const start = -Math.PI / 2;
  const out: Array<[number, number]> = [];
  for (let i = 0; i < n; i++) {
    const angle = start + (i * 2 * Math.PI) / n;
    out.push([CX + Math.cos(angle) * radius, CY + Math.sin(angle) * radius]);
  }
  return out;
}

export function Visualisation({ participants, messages, unresolved }: Props) {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [now, setNow] = useState(Date.now());
  const processedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const h = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(h);
  }, []);

  const positions = useMemo(() => layoutPositions(participants.length), [participants.length]);
  const positionById = useMemo(() => {
    const map = new Map<string, [number, number]>();
    participants.forEach((p, i) => map.set(p.id, positions[i] ?? [CX, CY]));
    return map;
  }, [participants, positions]);

  const messageById = useMemo(() => {
    const map = new Map<string, Message>();
    messages.forEach((m) => map.set(m.id, m));
    return map;
  }, [messages]);

  useEffect(() => {
    for (const m of messages) {
      if (processedRef.current.has(m.id)) continue;
      if (!m.classification) continue;
      processedRef.current.add(m.id);

      const to = positionById.get(m.participant_id);
      if (!to) continue;

      const c = m.classification;
      if (c.type === 'new_idea' || c.type === 'question' || c.type === 'agreement' || c.type === 'filler' || c.type === 'disagreement_with_reason') {
        continue;
      }

      let fromParticipantId: string | null = null;
      if (c.type === 'steals' && c.original_speaker_if_steals) {
        const src = participants.find((p) => p.display_name === c.original_speaker_if_steals);
        if (src) fromParticipantId = src.id;
      } else if (c.relates_to_message_ids && c.relates_to_message_ids.length > 0) {
        const srcMsg = messageById.get(c.relates_to_message_ids[0]);
        if (srcMsg) fromParticipantId = srcMsg.participant_id;
      }
      if (!fromParticipantId || fromParticipantId === m.participant_id) continue;

      const from = positionById.get(fromParticipantId);
      if (!from) continue;

      const self = participants.find((p) => p.id === m.participant_id);
      const srcP = participants.find((p) => p.id === fromParticipantId);
      const selfHex = self ? COLOUR_HEX[self.colour] : '#E4ECF4';
      const srcHex = srcP ? COLOUR_HEX[srcP.colour] : '#E4ECF4';

      let colour = selfHex;
      if (c.type === 'restates') colour = srcHex;
      if (c.type === 'steals') colour = '#F87171';

      setThreads((prev) => [
        ...prev.slice(-60),
        {
          id: m.id,
          fromXY: from,
          toXY: to,
          colour,
          type: c.type as Thread['type'],
          createdAt: Date.now(),
        },
      ]);
    }
  }, [messages, participants, positionById, messageById]);

  return (
    <div className="w-full h-full flex items-center justify-center" style={{ position: 'relative' }}>
      <svg
        viewBox={`0 0 ${VB} ${VB}`}
        className="w-full h-full"
        style={{ maxWidth: 700, maxHeight: 700 }}
      >
        <defs>
          {Object.entries(COLOUR_HEX).map(([name, hex]) => (
            <radialGradient id={`halo-${name}`} key={name} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={hex} stopOpacity="0.55" />
              <stop offset="50%" stopColor={hex} stopOpacity="0.18" />
              <stop offset="100%" stopColor={hex} stopOpacity="0" />
            </radialGradient>
          ))}
          <radialGradient id="halo-unresolved" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FCD34D" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#FCD34D" stopOpacity="0" />
          </radialGradient>
          <filter id="soft-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* lineage threads */}
        <g>
          {threads.map((t) => {
            const age = (now - t.createdAt) / 1000;
            const base = 0.75;
            const fade = Math.max(0, base - age / 180);
            if (fade <= 0.05) return null;
            const [x1, y1] = t.fromXY;
            const [x2, y2] = t.toXY;
            const mx = (x1 + x2) / 2 + (y2 - y1) * 0.18;
            const my = (y1 + y2) / 2 - (x2 - x1) * 0.18;
            return (
              <motion.path
                key={t.id}
                d={`M ${x1} ${y1} Q ${mx} ${my}, ${x2} ${y2}`}
                fill="none"
                stroke={t.colour}
                strokeWidth={t.type === 'steals' ? 2.2 : 1.4}
                strokeDasharray={t.type === 'contradicts' ? '4 5' : undefined}
                strokeOpacity={fade}
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.4, ease: 'easeOut' }}
                style={{ filter: `drop-shadow(0 0 4px ${t.colour}88)` }}
              />
            );
          })}
        </g>

        {/* bubbles */}
        {participants.map((p, i) => {
          const [x, y] = positions[i] ?? [CX, CY];
          const weight = voiceWeight(messages, p.id);
          const radius = Math.min(62, 22 + Math.sqrt(weight) * 8);
          const silent = silenceMinutes(messages, p.id, now);
          const silentRing = silent >= 5;
          const hex = COLOUR_HEX[p.colour];
          return (
            <motion.g
              key={p.id}
              animate={{ scale: [1, 1.03, 1] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut', delay: i * 0.2 }}
              style={{ transformOrigin: `${x}px ${y}px` }}
            >
              {silentRing && (
                <circle
                  cx={x}
                  cy={y}
                  r={radius + 18}
                  fill="url(#halo-unresolved)"
                />
              )}
              <circle
                cx={x}
                cy={y}
                r={radius + 14}
                fill={`url(#halo-${p.colour})`}
              />
              <motion.circle
                cx={x}
                cy={y}
                r={radius}
                fill={hex}
                fillOpacity={silent >= 2 ? 0.65 : 0.92}
                filter="url(#soft-glow)"
                animate={{ r: radius }}
                transition={{ type: 'spring', stiffness: 90, damping: 18 }}
              />
              <text
                x={x}
                y={y + radius + 22}
                textAnchor="middle"
                fill={hex}
                fontSize={13}
                fontFamily="Inter, sans-serif"
                fontWeight={500}
              >
                {p.display_name}
              </text>
              <text
                x={x}
                y={y + radius + 38}
                textAnchor="middle"
                fill="#7A8DA3"
                fontSize={10}
                fontFamily="IBM Plex Mono, monospace"
                letterSpacing="0.08em"
              >
                {weight.toFixed(1)}
              </text>
            </motion.g>
          );
        })}

        {/* unresolved question-mark markers */}
        {unresolved.slice(0, 5).map((u, idx) => {
          const raiser = participants.find((p) => p.display_name === u.raised_by);
          const anchor = raiser ? positionById.get(raiser.id) : null;
          if (!anchor) return null;
          const [ax, ay] = anchor;
          const angle = (idx / Math.max(1, unresolved.length)) * Math.PI * 2;
          const r = 85;
          const x = ax + Math.cos(angle) * r;
          const y = ay + Math.sin(angle) * r;
          return (
            <motion.g
              key={`unres-${idx}`}
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 4 + idx * 0.4, repeat: Infinity, ease: 'easeInOut' }}
            >
              <circle cx={x} cy={y} r={10} fill="url(#halo-unresolved)" />
              <text
                x={x}
                y={y + 4}
                textAnchor="middle"
                fill="#FCD34D"
                fontSize={14}
                fontFamily="Fraunces, serif"
                fontWeight={400}
              >
                ?
              </text>
            </motion.g>
          );
        })}

        {participants.length === 0 && (
          <text
            x={CX}
            y={CY}
            textAnchor="middle"
            fill="#7A8DA3"
            fontSize={14}
            fontFamily="IBM Plex Mono, monospace"
            letterSpacing="0.12em"
          >
            waiting for people to arrive…
          </text>
        )}
      </svg>
    </div>
  );
}
