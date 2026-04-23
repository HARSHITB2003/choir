import { useEffect, useState } from 'react';
import type { Message, Participant, UnresolvedThread } from '../../types';
import { COLOUR_HEX } from '../../types';
import { airtimePercent, formatDuration, formatRelativeMinutes, longestSilentParticipant } from '../../lib/utils';

interface Props {
  roomCode: string;
  startedAt: string;
  participants: Participant[];
  messages: Message[];
  unresolved: UnresolvedThread[];
}

export function MetaPanel({ roomCode, startedAt, participants, messages, unresolved }: Props) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const h = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(h);
  }, []);

  const duration = formatDuration(now - new Date(startedAt).getTime());
  const silent = longestSilentParticipant(messages, participants, now);

  const withAirtime = participants
    .map((p) => ({ p, pct: airtimePercent(messages, p.id) }))
    .sort((a, b) => b.pct - a.pct);

  return (
    <div className="h-full overflow-y-auto" style={{ padding: '24px 20px 80px' }}>
      <Section title="session">
        <Row label="room" value={roomCode} />
        <Row label="duration" value={duration} />
        <Row label="people" value={String(participants.length)} />
      </Section>

      <Section title="airtime">
        {withAirtime.map(({ p, pct }) => {
          const hex = COLOUR_HEX[p.colour];
          return (
            <div key={p.id} className="mb-1.5">
              <div className="flex items-center gap-2 justify-between font-mono" style={{ fontSize: 12 }}>
                <span style={{ color: hex }}>{p.display_name}</span>
                <span style={{ color: 'var(--color-mist)' }}>{pct}%</span>
              </div>
              <div style={{ height: 2, background: 'var(--color-current)', marginTop: 4, borderRadius: 1 }}>
                <div
                  style={{
                    width: `${pct}%`,
                    height: '100%',
                    background: hex,
                    boxShadow: `0 0 8px ${hex}88`,
                    borderRadius: 1,
                    transition: 'width 800ms ease',
                  }}
                />
              </div>
            </div>
          );
        })}
      </Section>

      <Section title="silence">
        {silent ? (
          <p className="font-mono" style={{ fontSize: 12, color: 'var(--color-mist)', lineHeight: 1.6 }}>
            <span style={{ color: COLOUR_HEX[silent.participant.colour] }}>{silent.participant.display_name}</span>
            {' '}has not spoken in{' '}
            <span style={{ color: 'var(--color-unresolved)' }}>{silent.minutes} minute{silent.minutes === 1 ? '' : 's'}</span>
          </p>
        ) : (
          <p className="font-mono" style={{ fontSize: 12, color: 'var(--color-plankton)' }}>
            everyone is present.
          </p>
        )}
      </Section>

      <Section title="unresolved">
        {unresolved.length === 0 && (
          <p className="font-mono" style={{ fontSize: 12, color: 'var(--color-plankton)' }}>
            nothing dangling.
          </p>
        )}
        {unresolved.map((u, i) => (
          <div key={i} className="mb-3">
            <p className="font-mono" style={{ fontSize: 12, color: 'var(--color-unresolved)', lineHeight: 1.6 }}>
              &ldquo;{u.summary}&rdquo;
            </p>
            <p className="font-mono" style={{ fontSize: 10.5, color: 'var(--color-plankton)', marginTop: 2, letterSpacing: '0.04em' }}>
              raised {formatRelativeMinutes(new Date(Date.now() - u.minutes_since_raised * 60000).toISOString(), now)} · by {u.raised_by}
            </p>
          </div>
        ))}
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-7">
      <div className="label-mono mb-3">{title}</div>
      <div className="thin-rule mb-3" />
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between font-mono mb-1" style={{ fontSize: 12 }}>
      <span style={{ color: 'var(--color-plankton)' }}>{label}</span>
      <span style={{ color: 'var(--color-ink)', letterSpacing: '0.08em' }}>{value}</span>
    </div>
  );
}
