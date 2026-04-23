import { motion } from 'framer-motion';

type Mood = 'warm' | 'cool' | 'thin' | 'neutral';

const MOOD_GRADIENT: Record<Mood, string> = {
  warm:
    'radial-gradient(1200px 800px at 20% 20%, rgba(45, 212, 191, 0.08), transparent 60%), radial-gradient(1000px 700px at 80% 70%, rgba(110, 231, 183, 0.06), transparent 60%), #0A1628',
  cool:
    'radial-gradient(1200px 800px at 20% 20%, rgba(96, 165, 250, 0.1), transparent 60%), radial-gradient(1000px 700px at 80% 70%, rgba(30, 53, 85, 0.6), transparent 60%), #0A1628',
  thin:
    'radial-gradient(1200px 800px at 50% 50%, rgba(20, 35, 58, 0.9), transparent 70%), #08111E',
  neutral:
    'radial-gradient(1200px 800px at 20% 20%, rgba(30, 53, 85, 0.55), transparent 60%), radial-gradient(1000px 700px at 80% 70%, rgba(20, 35, 58, 0.6), transparent 60%), #0A1628',
};

export function AmbientBackground({ mood = 'neutral' }: { mood?: Mood }) {
  return (
    <motion.div
      aria-hidden
      className="fixed inset-0 -z-10 bg-drift"
      style={{ backgroundImage: MOOD_GRADIENT[mood] }}
      animate={{ opacity: [0.85, 1, 0.9, 1] }}
      transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
    >
      <svg className="absolute inset-0 h-full w-full opacity-[0.06]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="plankton" width="220" height="220" patternUnits="userSpaceOnUse">
            <circle cx="20" cy="40" r="1" fill="#E4ECF4" />
            <circle cx="180" cy="90" r="0.8" fill="#E4ECF4" />
            <circle cx="110" cy="160" r="1.2" fill="#E4ECF4" />
            <circle cx="60" cy="200" r="0.6" fill="#E4ECF4" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#plankton)" />
      </svg>
    </motion.div>
  );
}
