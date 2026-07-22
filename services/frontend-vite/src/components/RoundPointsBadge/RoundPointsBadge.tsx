import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

interface RoundPointsBadgeProps {
  // Points scored in the just-finished round, or null if unavailable.
  points: number | null;
  // The round number the controller last confirmed as done. When this changes,
  // every card's badge pops together. Undefined = nothing to show.
  trigger?: number;
}

// A floating "+50 / -20" badge that pops out of a player card when the
// controller confirms the round ("Fertig"), then drifts up and fades.
export default function RoundPointsBadge({
  points,
  trigger,
}: RoundPointsBadgeProps) {
  const [shown, setShown] = useState<{ value: number; key: number } | null>(
    null,
  );
  // Track the last trigger we already celebrated so we only pop once per
  // "Fertig", not on every unrelated socket update.
  const celebrated = useRef<number | null>(null);

  useEffect(() => {
    if (trigger === undefined || points === null) return;
    if (celebrated.current === trigger) return;
    celebrated.current = trigger;
    setShown({ value: points, key: trigger });
    const timer = setTimeout(() => setShown(null), 2500);
    return () => clearTimeout(timer);
  }, [trigger, points]);

  const gained = shown ? shown.value >= 0 : false;

  return (
    <AnimatePresence>
      {shown && (
        <motion.div
          key={shown.key}
          className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center"
          initial={{ opacity: 0, scale: 0.2 }}
          animate={{ opacity: 1, scale: [0.2, 1.25, 1] }}
          exit={{ opacity: 0, scale: 1.3, transition: { duration: 0.4 } }}
          transition={{ type: "spring", stiffness: 400, damping: 15 }}
        >
          {/* Dark blurry blob for contrast against the chart behind it. */}
          <span className="absolute h-40 w-40 rounded-full bg-black/70 blur-2xl" />
          <span
            className={`text-7xl md:text-8xl font-black tabular-nums tracking-tight ${
              gained
                ? "text-green-400 drop-shadow-[0_0_30px_rgba(34,197,94,0.5)]"
                : "text-red-400 drop-shadow-[0_0_30px_rgba(239,68,68,0.5)]"
            }`}
          >
            {gained ? "+" : ""}
            {shown.value}
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
