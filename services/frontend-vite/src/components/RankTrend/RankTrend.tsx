import { AnimatePresence, motion } from "motion/react";
import { ArrowUp, ArrowDown } from "lucide-react";

interface RankTrendProps {
  // How many places the player moved since last round: >0 climbed, <0 dropped,
  // 0 held (nothing is shown).
  delta: number;
}

// A subtle "moved up/down N places since last round" arrow shown next to a
// player's score on the dashboard. Green up / red down; held positions show
// nothing. It always reflects the last confirmed round's movement — it persists
// with the current standings rather than flashing once — and cross-fades when
// the movement changes.
export default function RankTrend({ delta }: RankTrendProps) {
  const climbed = delta > 0;
  const places = Math.abs(delta);

  return (
    <AnimatePresence mode="wait">
      {delta !== 0 && (
        <motion.span
          // Key by the signed delta so a change animates as a swap.
          key={delta}
          className={`inline-flex items-center gap-0.5 text-sm font-bold tabular-nums ${
            climbed ? "text-green-400/80" : "text-red-400/80"
          }`}
          initial={{ opacity: 0, y: climbed ? 4 : -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          aria-label={`${places} ${climbed ? "aufgestiegen" : "abgestiegen"}`}
        >
          {climbed ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
          {places}
        </motion.span>
      )}
    </AnimatePresence>
  );
}
