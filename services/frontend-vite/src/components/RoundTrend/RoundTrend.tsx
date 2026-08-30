import { AnimatePresence, motion } from "motion/react";
import { ArrowUp, ArrowDown } from "lucide-react";

interface RoundTrendProps {
  // Points gained (+) or lost (-) in the last completed round. null/0 = nothing
  // to show (round not scored, or a wash).
  delta: number | null;
}

// A small pill next to a player's score showing how many POINTS they gained or
// lost in the last round: green "▲ 40" up, red "▼ 30" down. Always reflects the
// last completed round; cross-fades when the value changes.
export default function RoundTrend({ delta }: RoundTrendProps) {
  const show = delta !== null && delta !== 0;
  const gained = (delta ?? 0) > 0;
  const amount = Math.abs(delta ?? 0);

  return (
    <AnimatePresence mode="wait">
      {show && (
        <motion.span
          key={delta}
          className={`ml-1.5 inline-flex -translate-y-0.5 items-center gap-0.5 self-center rounded-full px-2 py-1 text-sm font-bold leading-none tabular-nums ${
            gained
              ? "bg-green-500/15 text-green-400"
              : "bg-red-500/15 text-red-400"
          }`}
          initial={{ opacity: 0, y: gained ? 6 : -6, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ type: "spring", stiffness: 400, damping: 26 }}
          aria-label={`${amount} Punkte ${gained ? "gewonnen" : "verloren"}`}
        >
          {gained ? <ArrowUp size={13} /> : <ArrowDown size={13} />}
          {amount}
        </motion.span>
      )}
    </AnimatePresence>
  );
}
