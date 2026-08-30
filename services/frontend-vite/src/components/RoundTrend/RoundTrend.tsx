import { AnimatePresence, motion } from "motion/react";
import { ArrowUp, ArrowDown } from "lucide-react";

interface RoundTrendProps {
  // Points gained (+) or lost (-) in the last completed round. null/0 = nothing
  // to show (round not scored, or a wash).
  delta: number | null;
}

// A quiet inline hint of how many POINTS a player gained or lost last round: a
// thin caret + number in a muted green/red, sitting unobtrusively next to the
// "PKT" label — no pill, no bold. Always reflects the last completed round and
// cross-fades when it changes.
export default function RoundTrend({ delta }: RoundTrendProps) {
  const show = delta !== null && delta !== 0;
  const gained = (delta ?? 0) > 0;
  const amount = Math.abs(delta ?? 0);

  return (
    <AnimatePresence mode="wait">
      {show && (
        <motion.span
          key={delta}
          className={`ml-1 inline-flex items-center gap-px text-xs font-medium leading-none tabular-nums ${
            gained ? "text-green-500/60" : "text-red-500/60"
          }`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          aria-label={`${amount} Punkte ${gained ? "gewonnen" : "verloren"}`}
        >
          {gained ? <ArrowUp size={11} strokeWidth={2.5} /> : <ArrowDown size={11} strokeWidth={2.5} />}
          {amount}
        </motion.span>
      )}
    </AnimatePresence>
  );
}
