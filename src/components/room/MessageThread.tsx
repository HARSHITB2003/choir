import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Message, Participant } from '../../types';
import { COLOUR_HEX } from '../../types';

interface Props {
  messages: Message[];
  participants: Participant[];
  systemMessages?: Array<{ id: string; text: string; at: number }>;
}

export function MessageThread({ messages, participants }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages.length]);

  const participantById = new Map(participants.map((p) => [p.id, p]));

  return (
    <div
      ref={scrollRef}
      className="h-full overflow-y-auto"
      style={{ padding: '24px 20px 120px' }}
    >
      <div className="label-mono mb-4">messages</div>
      <AnimatePresence initial={false}>
        {messages.map((m) => {
          const p = participantById.get(m.participant_id);
          const hex = p ? COLOUR_HEX[p.colour] : '#4A6B8F';
          const time = new Date(m.created_at);
          const hh = String(time.getHours()).padStart(2, '0');
          const mm = String(time.getMinutes()).padStart(2, '0');
          return (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 180, damping: 24 }}
              className="pb-4 mb-4"
              style={{
                borderBottom: '1px solid var(--color-current)',
                borderLeft: `2px solid ${hex}`,
                paddingLeft: 12,
              }}
            >
              <div className="flex items-baseline justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: hex,
                      boxShadow: `0 0 8px ${hex}`,
                      display: 'inline-block',
                    }}
                  />
                  <span className="font-medium" style={{ fontSize: 14, color: hex }}>
                    {p?.display_name ?? 'unknown'}
                  </span>
                </div>
                <span className="font-mono" style={{ fontSize: 10, color: 'var(--color-plankton)', letterSpacing: '0.08em' }}>
                  {hh}:{mm}
                </span>
              </div>
              <p style={{ fontSize: 15, lineHeight: 1.55, marginTop: 6, color: 'var(--color-ink)' }}>
                {m.body}
              </p>
              {m.classification && m.classification.type !== 'filler' && m.classification.type !== 'builds_on' && (
                <div
                  className="font-mono mt-2"
                  style={{
                    fontSize: 9.5,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: m.classification.type === 'steals' ? 'var(--color-stolen)' : 'var(--color-plankton)',
                  }}
                >
                  {m.classification.type.replace(/_/g, ' ')}
                </div>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
