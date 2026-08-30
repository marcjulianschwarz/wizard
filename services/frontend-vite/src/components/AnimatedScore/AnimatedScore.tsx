import { useEffect, useRef, useState } from "react";
import { animate, motion, useMotionValue } from "motion/react";

interface AnimatedScoreProps {
  // The current (already up-to-date) total score for the player.
  points: number;
  // Points scored in the round that was just confirmed, or null. Used to hold
  // the display at the pre-round total until the badge has popped, so the
  // score visibly counts to its new value afterwards.
  roundDelta: number | null;
  // Round number the controller last confirmed. A change kicks off the delayed
  // count-up. Undefined = nothing pending.
  trigger?: number;
}

// The player's total score, rendered so that when a round is confirmed it first
// holds at the previous total (while the "+30 / -20" badge pops), then counts up
// or down to the new total — so you clearly see the points move.
export default function AnimatedScore({
  points,
  roundDelta,
  trigger,
}: AnimatedScoreProps) {
  const [display, setDisplay] = useState(points);
  const motionValue = useMotionValue(points);
  // Skip a trigger that is already set on mount (stale after a reload).
  const mountTrigger = useRef(trigger);
  // Latest total, read inside the delayed timer without re-running the effect.
  const latestPoints = useRef(points);
  latestPoints.current = points;
  // True from the moment a trigger arrives until its count-up finishes. While
  // set, the `points` effect must NOT snap to the new total: the confirming
  // broadcast bumps `points` and `trigger` together, so without this guard the
  // points effect would race ahead during the 1400ms badge delay (velocity is
  // still 0 then) and jump straight to the final value — no visible count-up.
  const pending = useRef(false);

  useEffect(() => {
    const unsubscribe = motionValue.on("change", (v) =>
      setDisplay(Math.round(v)),
    );
    return unsubscribe;
  }, [motionValue]);

  // On a new trigger: snap to the pre-round total, wait for the badge to pop,
  // then count to the new total.
  useEffect(() => {
    if (trigger === undefined || trigger === mountTrigger.current) return;
    if (roundDelta === null) return;

    const target = latestPoints.current;
    const start = target - roundDelta;
    pending.current = true;
    motionValue.set(start);
    setDisplay(start);

    // Start the count-up only as the badge begins to fade (it holds until
    // ~2100ms), so the sequence reads as two distinct beats: the "+30" pops and
    // holds, THEN the total visibly climbs — rather than both moving at once.
    const timer = setTimeout(() => {
      animate(motionValue, latestPoints.current, {
        duration: 1,
        ease: "easeOut",
        onComplete: () => {
          pending.current = false;
        },
      });
    }, 2100);

    return () => {
      clearTimeout(timer);
      pending.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger]);

  // Any other change to the total (not driven by a trigger animation) is
  // reflected immediately — but never while a triggered count-up is pending,
  // which owns the display until it lands.
  useEffect(() => {
    if (pending.current) return;
    if (motionValue.getVelocity() === 0) {
      motionValue.set(points);
      setDisplay(points);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [points]);

  return (
    <motion.span className="text-4xl md:text-5xl font-black text-white tabular-nums tracking-tight">
      {display}
    </motion.span>
  );
}
