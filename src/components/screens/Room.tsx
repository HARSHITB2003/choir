import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Copy, LogOut, Check } from 'lucide-react';
import { useRoom } from '../../hooks/useRoom';
import { AmbientBackground } from '../ui/AmbientBackground';
import { MessageThread } from '../room/MessageThread';
import { Visualisation } from '../room/Visualisation';
import { MetaPanel } from '../room/MetaPanel';
import { MessageInput } from '../room/MessageInput';
import { moodFromMessages } from '../../lib/utils';
import { synthesiseMinutes } from '../../lib/ai';

export function Room() {
  const { code } = useParams();
  const navigate = useNavigate();
  const { room, participants, messages, unresolved, selfId, loading, sendMessage, leaveRoom, endSession } = useRoom(code);
  const [copied, setCopied] = useState(false);
  const [endingPrompt, setEndingPrompt] = useState(false);

  const mood = useMemo(() => moodFromMessages(messages), [messages]);
  const startedAt = room?.created_at ?? new Date().toISOString();

  useEffect(() => {
    if (room?.ended_at) {
      void onEnded();
    }
    async function onEnded() {
      if (!code || !room) return;
      const durationMs = new Date(room.ended_at!).getTime() - new Date(room.created_at).getTime();
      sessionStorage.setItem(`choir:${code}:messages`, JSON.stringify(messages));
      sessionStorage.setItem(`choir:${code}:participants`, JSON.stringify(participants));
      sessionStorage.setItem(`choir:${code}:duration`, String(durationMs));
      const minutes = await synthesiseMinutes(messages, participants, code, durationMs);
      if (minutes) sessionStorage.setItem(`choir:${code}:minutes`, JSON.stringify(minutes));
      navigate(`/minutes/${code}`);
    }
  }, [room?.ended_at, room?.created_at, code, messages, participants, navigate, room]);

  if (!code) return null;

  if (!selfId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="font-mono label-mono">you need to join this room first.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <AmbientBackground mood={mood} />

      {/* top strip */}
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
        <div className="flex items-center gap-3">
          <span className="font-serif" style={{ fontSize: 20 }}>choir.</span>
          <span style={{ width: 1, height: 18, background: 'var(--color-current)' }} />
          <button
            onClick={() => {
              void navigator.clipboard.writeText(code);
              setCopied(true);
              setTimeout(() => setCopied(false), 1400);
            }}
            className="font-mono flex items-center gap-2"
            style={{
              fontSize: 13,
              letterSpacing: '0.3em',
              color: 'var(--color-ink)',
              background: 'none',
              border: 0,
              cursor: 'pointer',
            }}
          >
            {code}
            {copied ? <Check size={13} color="var(--color-kelp)" /> : <Copy size={13} color="var(--color-plankton)" />}
          </button>
        </div>
        <div className="flex items-center gap-4">
          <span className="label-mono">{participants.length} in room</span>
          <button
            onClick={() => setEndingPrompt(true)}
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
              cursor: 'pointer',
            }}
          >
            <LogOut size={12} /> end session
          </button>
        </div>
      </header>

      {/* three columns on desktop, stack on mobile */}
      <main className="flex-1 flex overflow-hidden" style={{ minHeight: 0 }}>
        <div
          className="hidden md:block"
          style={{
            width: 320,
            borderRight: '1px solid var(--color-current)',
            flexShrink: 0,
            overflow: 'hidden',
          }}
        >
          <MessageThread messages={messages} participants={participants} />
        </div>

        <div className="flex-1 flex items-center justify-center" style={{ minWidth: 0 }}>
          {loading ? (
            <div className="label-mono">listening…</div>
          ) : (
            <Visualisation participants={participants} messages={messages} unresolved={unresolved} />
          )}
        </div>

        <div
          className="hidden lg:block"
          style={{
            width: 280,
            borderLeft: '1px solid var(--color-current)',
            flexShrink: 0,
            overflow: 'hidden',
          }}
        >
          <MetaPanel roomCode={code} startedAt={startedAt} participants={participants} messages={messages} unresolved={unresolved} />
        </div>
      </main>

      {/* mobile message thread (below visualisation) */}
      <div className="md:hidden" style={{ flex: '0 0 40vh', borderTop: '1px solid var(--color-current)', overflow: 'hidden' }}>
        <MessageThread messages={messages} participants={participants} />
      </div>

      <MessageInput onSend={sendMessage} disabled={Boolean(room?.ended_at)} />

      {endingPrompt && (
        <EndPrompt
          onCancel={() => setEndingPrompt(false)}
          onConfirm={async () => {
            setEndingPrompt(false);
            await leaveRoom();
            await endSession();
          }}
        />
      )}
    </div>
  );
}

function EndPrompt({ onCancel, onConfirm }: { onCancel: () => void; onConfirm: () => void | Promise<void> }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ background: 'rgba(10, 22, 40, 0.7)', backdropFilter: 'blur(8px)' }}
      onClick={onCancel}
    >
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="font-serif"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--color-trench)',
          border: '1px solid var(--color-current)',
          borderRadius: 6,
          padding: '28px 32px',
          maxWidth: 420,
        }}
      >
        <p style={{ fontSize: 20, color: 'var(--color-ink)', marginBottom: 8 }}>end this session?</p>
        <p className="font-mono" style={{ fontSize: 12, color: 'var(--color-mist)', lineHeight: 1.6, letterSpacing: '0.02em' }}>
          the minutes document will be generated and shared
          with everyone in the room.
        </p>
        <div className="flex gap-6 mt-6 justify-end">
          <button onClick={onCancel} className="font-serif" style={{ fontSize: 16, color: 'var(--color-mist)', background: 'none', border: 0, cursor: 'pointer' }}>
            not yet
          </button>
          <button onClick={() => void onConfirm()} className="font-serif" style={{ fontSize: 16, color: 'var(--color-kelp)', background: 'none', border: 0, cursor: 'pointer' }}>
            end it
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
