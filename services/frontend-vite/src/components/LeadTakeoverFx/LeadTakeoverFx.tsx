import { AnimatePresence, motion } from "motion/react";
import { Crown } from "lucide-react";

// A brief crown + sparkle burst that plays on a card the moment its player takes
// over first place. Purely controlled: shown while `active` is true (the parent
// gates this to once per confirmed round). Overlays the card, non-interactive.
export default function LeadTakeoverFx({ active }: { active: boolean }) {
  return (
    <AnimatePresence>
      {active && (
        <motion.div
          className="pointer-events-none absolute inset-0 z-30 flex items-start justify-center pt-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.3 } }}
        >
          {/* Crown drops in with a springy overshoot. */}
          <motion.div
            initial={{ y: -30, scale: 0.4, rotate: -20 }}
            animate={{ y: 0, scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 16 }}
            className="relative"
          >
            <Crown
              size={44}
              className="fill-yellow-400 text-yellow-300 drop-shadow-[0_0_16px_rgba(234,179,8,0.9)]"
            />
            {/* Sparkles radiating out from the crown. */}
            {SPARKLES.map((s, i) => (
              <motion.span
                key={i}
                className="absolute left-1/2 top-1/2 h-1.5 w-1.5 rounded-full bg-yellow-200"
                initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
                animate={{
                  x: s.x,
                  y: s.y,
                  opacity: [0, 1, 0],
                  scale: [0, 1, 0.4],
                }}
                transition={{ duration: 0.9, ease: "easeOut", delay: 0.05 }}
              />
            ))}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Fixed radial offsets (px) for the sparkle burst around the crown.
const SPARKLES = [
  { x: -26, y: -14 },
  { x: 26, y: -14 },
  { x: -30, y: 8 },
  { x: 30, y: 8 },
  { x: 0, y: -30 },
  { x: 0, y: 22 },
];
