import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";

// Latest ref: read the freshest value inside a timer/effect without adding it
// to the dependency array (which would re-run the effect on every jitter).
function useLatest<T>(value: T) {
  const ref = useRef(value);
  ref.current = value;
  return ref;
}

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
  // `shown` mounts the badge; `visible` drives its fade. We flip visible→false
  // to fade out, then unmount by clearing `shown`. Removal never relies on an
  // AnimatePresence exit completing (which the flood of socket re-renders was
  // interrupting, leaving the badge stuck on screen).
  const [shown, setShown] = useState<{ value: number; key: number } | null>(
    null,
  );
  const [visible, setVisible] = useState(false);
  // Read the freshest points at the moment the trigger fires, without making
  // the effect depend on `points` (which jitters across socket updates).
  const latestPoints = useLatest(points);

  // Fire once per NEW trigger. Depending only on `trigger` means the effect
  // runs exactly when the round is confirmed — never on unrelated `points`
  // updates — so its own cleanup owns the timers cleanly (no cross-effect
  // cancellation, no StrictMode double-invoke leaving a live badge with a dead
  // timer). A trigger already present on mount is skipped (stale after reload).
  const mountTrigger = useRef(trigger);
  useEffect(() => {
    if (trigger === undefined) return;
    if (trigger === mountTrigger.current) return; // stale on mount
    const value = latestPoints.current;
    if (value === null) return;

    setShown({ value, key: trigger });
    setVisible(true);
    const fade = setTimeout(() => setVisible(false), 2100);
    const hide = setTimeout(() => setShown(null), 2500);
    return () => {
      clearTimeout(fade);
      clearTimeout(hide);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger]);

  const gained = shown ? shown.value >= 0 : false;

  // Plain conditional render (no AnimatePresence): when `shown` is null the node
  // is removed immediately, so it can never get stuck mid-exit.
  if (!shown) return null;

  return (
    <motion.div
      key={shown.key}
      className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center"
      initial={{ opacity: 0, scale: 0.2 }}
      animate={
        visible
          ? {
              opacity: 1,
              scale: 1,
              transition: { type: "spring", stiffness: 400, damping: 15 },
            }
          : {
              // Smooth, plain fade-out — no keyframe arrays (those snapped and
              // caused the flash when the exit interrupted the pop-in).
              opacity: 0,
              scale: 1.3,
              transition: { duration: 0.4, ease: "easeOut" },
            }
      }
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
  );
}
