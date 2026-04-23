import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { AmbientBackground } from '../ui/AmbientBackground';
import { Logo } from '../ui/Logo';
import { Footer } from '../ui/Footer';
import { DEMOS } from '../../demos';

export function DemoLauncher() {
  const navigate = useNavigate();
  const items = Object.values(DEMOS);

  return (
    <div className="min-h-screen">
      <AmbientBackground mood="neutral" />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto px-6"
        style={{ paddingTop: 90, maxWidth: 620 }}
      >
        <Logo size={64} />

        <p className="font-serif mt-6" style={{ fontSize: 22, color: 'var(--color-mist)' }}>
          three sessions to watch.
        </p>
        <p className="font-mono mt-4" style={{ fontSize: 12, color: 'var(--color-plankton)', lineHeight: 1.7, letterSpacing: '0.02em' }}>
          each replays at 6× speed. the live visualisation, the classifications,
          <br />
          the unresolved threads, the minutes at the end — all real output,
          <br />
          generated once and stored.
        </p>

        <hr className="thin-rule mt-12 mb-8" />

        <div className="flex flex-col gap-10 mt-6">
          {items.map((d) => (
            <button
              key={d.id}
              onClick={() => navigate(`/demo/${d.id}`)}
              className="text-left group"
              style={{ background: 'none', border: 0, cursor: 'pointer', padding: 0 }}
            >
              <p
                className="font-serif"
                style={{
                  fontSize: 22,
                  color: 'var(--color-ink)',
                  letterSpacing: '-0.005em',
                  lineHeight: 1.25,
                }}
              >
                {d.title}
              </p>
              <p className="font-mono mt-2" style={{ fontSize: 12, color: 'var(--color-plankton)', letterSpacing: '0.02em' }}>
                {d.subtitle}
              </p>
              <div
                className="mt-3"
                style={{ width: 0, height: 1, background: 'var(--color-kelp)', transition: 'width 500ms ease' }}
                onMouseEnter={(e) => (e.currentTarget.style.width = '100%')}
                onMouseLeave={(e) => (e.currentTarget.style.width = '0')}
              />
            </button>
          ))}
        </div>

        <div className="mt-14">
          <button
            onClick={() => navigate('/')}
            className="font-serif"
            style={{ fontSize: 16, color: 'var(--color-surface)', background: 'none', border: 0, cursor: 'pointer' }}
          >
            &larr; back
          </button>
        </div>

        <Footer />
      </motion.div>
    </div>
  );
}
