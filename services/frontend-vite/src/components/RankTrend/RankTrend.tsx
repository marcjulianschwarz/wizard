import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowUp, ArrowDown } from "lucide-react";

interface RankTrendProps {
  // How many places the player moved since last round: >0 climbed, <0 dropped,
  // 0 held (nothing is shown).
  delta: number;
  // Round the controller last confirmed. The trend fades in only when this
  // changes, so it appears with the freshly scored round rather than on every
  // socket re-render, and never on a stale trigger present at mount.
  trigger?: number;
}

// A subtle "moved up/down N places since last round" arrow shown next to a
// player's score on the dashboard. Green up / red down; held positions show
// nothing. It fades in shortly after the round is confirmed (aligned with the
// score count-up) and lingers, so the board quietly conveys momentum.
export default function RankTrend({ delta, trigger }: RankTrendProps) {
  const [shown, setShown] = useState(false);
  const mountTrigger = useRef(trigger);

  useEffect(() => {
    if (trigger === undefined || trigger === mountTrigger.current) return;
    if (delta === 0) {
      setShown(false);
      return;
    }
    // Appear with the score count-up (see AnimatedScore's 2100ms badge delay),
    // so it's a calm follow-on beat rather than competing with the pop.
    const timer = setTimeout(() => setShown(true), 2100);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger]);

  const climbed = delta > 0;
  const places = Math.abs(delta);

  return (
    <AnimatePresence>
      {shown && (
        <motion.span
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
