import { motion } from 'framer-motion';
import type { BioColour } from '../../types';
import { COLOUR_HEX } from '../../types';

export function CurrentUnderline({ colour = 'kelp' as BioColour, width = 240 }: { colour?: BioColour; width?: number }) {
  const hex = COLOUR_HEX[colour];
  return (
    <svg width={width} height={12} viewBox={`0 0 ${width} 12`} className="pointer-events-none">
      <motion.path
        d={`M 2 6 Q ${width * 0.25} 0, ${width * 0.5} 6 T ${width - 2} 6`}
        fill="none"
        stroke={hex}
        strokeWidth={1.4}
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: [0, 1, 1, 0], opacity: [0, 1, 1, 0] }}
        transition={{ duration: 4, ease: 'easeInOut', repeat: Infinity, repeatDelay: 0.6 }}
        style={{ filter: `drop-shadow(0 0 6px ${hex}88)` }}
      />
    </svg>
  );
}
