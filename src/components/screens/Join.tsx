import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { AmbientBackground } from '../ui/AmbientBackground';
import { Logo } from '../ui/Logo';
import { Footer } from '../ui/Footer';
import { CurrentUnderline } from '../ui/CurrentUnderline';
import { supabase } from '../../lib/supabase';
import { COLOUR_ORDER, type BioColour } from '../../types';

export function Join() {
  const navigate = useNavigate();
  const { code } = useParams();
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function enterRoom() {
    const trimmed = name.trim();
    if (trimmed.length === 0) {
      setError('you need a name.');
      return;
    }
    if (trimmed.length > 16) {
      setError('16 characters max.');
      return;
    }
    if (!code) return;

    setBusy(true);
    setError(null);

    if (supabase) {
      const { data: existing, error: listErr } = await supabase
        .from('participants')
        .select('id,colour')
        .eq('room_id', code)
        .order('joined_at', { ascending: true });
      if (listErr) {
        setError('could not reach the room.');
        setBusy(false);
        return;
      }
      if ((existing?.length ?? 0) >= 6) {
        setError('this room just filled up.');
        setBusy(false);
        return;
      }
      const taken = new Set<BioColour>((existing ?? []).map((p) => p.colour as BioColour));
      const colour = COLOUR_ORDER.find((c) => !taken.has(c)) ?? 'kelp';

      const { data: inserted, error: insertErr } = await supabase
        .from('participants')
        .insert({ room_id: code, display_name: trimmed, colour })
        .select()
        .single();
      if (insertErr || !inserted) {
        setError('could not join.');
        setBusy(false);
        return;
      }
      sessionStorage.setItem(`choir:${code}:participant`, inserted.id);
      sessionStorage.setItem(`choir:${code}:name`, trimmed);
      sessionStorage.setItem(`choir:${code}:colour`, colour);
    } else {
      sessionStorage.setItem(`choir:${code}:participant`, 'local-' + Math.random().toString(36).slice(2));
      sessionStorage.setItem(`choir:${code}:name`, trimmed);
      sessionStorage.setItem(`choir:${code}:colour`, 'kelp');
    }
    navigate(`/room/${code}`);
  }

  return (
    <div className="min-h-screen">
      <AmbientBackground mood="neutral" />
      <motion.div
        className="mx-auto flex flex-col items-center px-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9 }}
        style={{ paddingTop: 120, maxWidth: 560 }}
      >
        <Logo size={64} />

        <div
          className="mt-6 font-mono flex items-center gap-3"
          style={{
            color: 'var(--color-ink)',
            fontSize: 22,
            letterSpacing: '0.3em',
          }}
        >
          <span style={{ color: 'var(--color-plankton)', fontSize: 11 }}>ROOM</span>
          <span style={{ width: 1, height: 18, background: 'var(--color-current)' }} />
          <span>{code}</span>
        </div>

        <hr className="thin-rule w-full max-w-sm mt-12" />

        <p
          className="font-serif mt-10 text-center"
          style={{ fontSize: 22, color: 'var(--color-mist)' }}
        >
          how should others see you?
        </p>

        <div className="w-full max-w-sm mt-8">
          <input
            className="ghost text-center"
            style={{ fontSize: 18 }}
            placeholder="your name"
            maxLength={16}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void enterRoom();
            }}
            autoFocus
            spellCheck={false}
            autoComplete="off"
          />
        </div>

        <div className="mt-12 flex flex-col items-center gap-2">
          <button
            onClick={enterRoom}
            disabled={busy}
            className="font-serif disabled:opacity-40"
            style={{ fontSize: 20, color: 'var(--color-ink)', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            enter the room
          </button>
          <CurrentUnderline colour="seafoam" width={180} />
        </div>

        {error && (
          <p
            className="font-mono mt-8"
            style={{ fontSize: 12, color: 'var(--color-stolen)', letterSpacing: '0.08em' }}
          >
            {error}
          </p>
        )}

        <Footer />
      </motion.div>
    </div>
  );
}
