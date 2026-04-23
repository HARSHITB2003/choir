import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { AmbientBackground } from '../ui/AmbientBackground';
import { Logo } from '../ui/Logo';
import { Footer } from '../ui/Footer';
import { CurrentUnderline } from '../ui/CurrentUnderline';
import { generateRoomCode } from '../../lib/utils';
import { supabase } from '../../lib/supabase';

export function Arrival() {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function createRoom() {
    setBusy(true);
    setError(null);
    const id = generateRoomCode();
    if (supabase) {
      const { error: insertError } = await supabase.from('rooms').insert({ id });
      if (insertError) {
        setError('could not create a room. check your connection.');
        setBusy(false);
        return;
      }
    }
    navigate(`/join/${id}`);
  }

  async function joinRoom() {
    const trimmed = code.trim().toUpperCase();
    if (trimmed.length !== 5) {
      setError('room codes are 5 characters.');
      return;
    }
    setBusy(true);
    setError(null);
    if (supabase) {
      const { data: room, error: roomErr } = await supabase.from('rooms').select('id,ended_at').eq('id', trimmed).maybeSingle();
      if (roomErr || !room) {
        setError('this room does not exist.');
        setBusy(false);
        return;
      }
      if (room.ended_at) {
        setError('this room has ended.');
        setBusy(false);
        return;
      }
      const { count } = await supabase.from('participants').select('id', { count: 'exact', head: true }).eq('room_id', trimmed);
      if ((count ?? 0) >= 6) {
        setError('this room is full.');
        setBusy(false);
        return;
      }
    }
    navigate(`/join/${trimmed}`);
  }

  return (
    <div className="min-h-screen">
      <AmbientBackground mood="neutral" />
      <motion.div
        className="mx-auto flex flex-col items-center px-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
        style={{ paddingTop: 100, maxWidth: 560 }}
      >
        <Logo size={96} />

        <p
          className="font-serif mt-6 text-center"
          style={{ fontSize: 22, lineHeight: 1.4, color: 'var(--color-mist)', maxWidth: 480 }}
        >
          a room that sees the shape
          <br />
          of your conversation.
        </p>

        <hr className="thin-rule w-full max-w-sm mt-12" />

        <div className="mt-10 flex flex-col items-center gap-2">
          <button
            onClick={createRoom}
            disabled={busy}
            className="font-serif disabled:opacity-40"
            style={{ fontSize: 22, color: 'var(--color-ink)', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            start a new room
          </button>
          <CurrentUnderline colour="kelp" width={220} />
        </div>

        <div
          className="my-8 font-mono flex items-center gap-4"
          style={{ color: 'var(--color-plankton)', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase' }}
        >
          <div style={{ width: 40, height: 1, background: 'var(--color-current)' }} />
          or
          <div style={{ width: 40, height: 1, background: 'var(--color-current)' }} />
        </div>

        <div className="w-full max-w-sm">
          <div className="flex items-center gap-3">
            <label
              className="font-serif whitespace-nowrap"
              style={{ fontSize: 20, color: 'var(--color-mist)' }}
              htmlFor="code"
            >
              join with a code
            </label>
            <input
              id="code"
              className="ghost font-mono"
              style={{ letterSpacing: '0.24em', textTransform: 'uppercase', fontSize: 16 }}
              maxLength={5}
              placeholder="_____"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void joinRoom();
              }}
              autoComplete="off"
              spellCheck={false}
            />
          </div>
        </div>

        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="font-mono mt-6"
            style={{ fontSize: 12, color: 'var(--color-stolen)', letterSpacing: '0.08em' }}
          >
            {error}
          </motion.p>
        )}

        <hr className="thin-rule w-full max-w-sm mt-14" />

        <p
          className="font-mono mt-8 text-center"
          style={{
            fontSize: 12,
            lineHeight: 1.7,
            color: 'var(--color-plankton)',
            maxWidth: 440,
            letterSpacing: '0.02em',
          }}
        >
          a note about what this is:
          <br />
          this room shows live patterns in a multi-person
          <br />
          conversation. who has spoken. whose ideas got
          <br />
          developed. who hasn&apos;t said anything in a while.
          <br />
          it is not a transcript. it is a mirror.
        </p>

        <div className="mt-14 flex flex-col items-center gap-2">
          <button
            onClick={() => navigate('/demo')}
            className="font-serif italic"
            style={{
              fontSize: 16,
              color: 'var(--color-surface)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              textDecoration: 'underline',
              textUnderlineOffset: 6,
              textDecorationColor: 'var(--color-current)',
            }}
          >
            watch a demo session &rarr;
          </button>
        </div>

        <Footer />
      </motion.div>
    </div>
  );
}
