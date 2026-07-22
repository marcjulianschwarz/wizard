import type { PlayerState } from "@/api/entities";
import { motion } from "motion/react";
import { useState } from "react";

interface WizardWelcomeProps {
  players: PlayerState[];
}

// A single twinkling sparkle that jumps to a fresh random spot, size and timing
// each time it finishes a fade cycle — so they never settle into a fixed
// pattern. `seed` just staggers the initial appearance.
function Sparkle({ seed }: { seed: number }) {
  const randomSpot = () => ({
    left: `${5 + Math.random() * 90}%`,
    top: `${5 + Math.random() * 90}%`,
    size: 0.9 + Math.random() * 1.6, // rem
    duration: 1.6 + Math.random() * 2, // s
  });

  const [spot, setSpot] = useState(() => ({ ...randomSpot(), cycle: 0 }));

  return (
    <motion.span
      // Remount on each cycle so the fade-in/out replays at the new spot — the
      // animate values are identical every time, so without a changing key
      // Motion wouldn't re-run it and the sparkle would vanish after once.
      key={spot.cycle}
      className="pointer-events-none absolute"
      style={{ left: spot.left, top: spot.top, fontSize: `${spot.size}rem` }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: [0, 1, 0], scale: [0.4, 1, 0.4], rotate: [0, 90] }}
      transition={{
        duration: spot.duration,
        ease: "easeInOut",
        delay: spot.cycle === 0 ? seed * 0.35 : 0,
      }}
      // Re-roll a new random position/size when the twinkle finishes, so it
      // reappears somewhere else instead of the same place.
      onAnimationComplete={() =>
        setSpot((prev) => ({ ...randomSpot(), cycle: prev.cycle + 1 }))
      }
    >
      ✨
    </motion.span>
  );
}

// A pre-game welcome screen: the players gather in a ring around a glowing
// wizard title, each avatar springing in one after another. Purely decorative,
// shown on the dashboard while the controller is about to spin the wheel.
export default function WizardWelcome({ players }: WizardWelcomeProps) {
  // Ring radius scales down a touch for larger groups so avatars don't collide.
  const ringRadius = Math.min(
    320,
    Math.max(200, 640 / Math.max(players.length, 1)) + 120,
  );

  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden">
      {/* Soft magical glow behind everything. */}
      <motion.div
        className="pointer-events-none absolute h-[520px] w-[520px] rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(139,92,246,0.35), transparent 70%)",
        }}
        animate={{ opacity: [0.4, 0.7, 0.4], scale: [1, 1.08, 1] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Twinkling sparkles that keep jumping to new random spots. */}
      {Array.from({ length: 12 }, (_, i) => (
        <Sparkle key={i} seed={i} />
      ))}

      {/* Center wizard title. */}
      <motion.div
        className="relative z-10 flex flex-col items-center text-center"
        initial={{ opacity: 0, scale: 0.6, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 18, delay: 0.1 }}
      >
        <motion.span
          className="text-8xl leading-none drop-shadow-[0_0_40px_rgba(139,92,246,0.6)] md:text-9xl"
          animate={{ y: [0, -10, 0], rotate: [-3, 3, -3] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        >
          🧙
        </motion.span>
        <h1 className="text-shimmer m-0 mt-4 text-6xl font-black tracking-tight md:text-8xl">
          Wizard
        </h1>
        <motion.p
          className="mt-3 text-xl text-neutral-400 md:text-2xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          Möge das beste Orakel gewinnen
        </motion.p>
      </motion.div>

      {/* Players seated in a ring around the title. */}
      {players.map((ps, idx) => {
        // Distribute evenly on the circle, starting at the top.
        const angle = (idx / players.length) * 2 * Math.PI - Math.PI / 2;
        const x = Math.cos(angle) * ringRadius;
        const y = Math.sin(angle) * ringRadius;
        return (
          <motion.div
            key={ps.player.name}
            className="absolute z-20 flex flex-col items-center gap-2"
            style={{ left: "50%", top: "50%" }}
            initial={{ opacity: 0, x: 0, y: 0, scale: 0.2 }}
            animate={{
              opacity: 1,
              x: x - 0,
              y: y - 0,
              scale: 1,
            }}
            transition={{
              type: "spring",
              stiffness: 160,
              damping: 16,
              delay: 0.4 + idx * 0.15,
            }}
          >
            {/* Keep each card centred on its ring point. */}
            <div className="flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-2">
              <motion.span
                className="text-6xl leading-none drop-shadow-[0_0_20px_rgba(59,130,246,0.4)] md:text-7xl"
                animate={{ y: [0, -8, 0] }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: idx * 0.3,
                }}
              >
                {ps.player.color}
              </motion.span>
              <span className="rounded-full border border-neutral-700 bg-neutral-900/80 px-4 py-1 text-lg font-semibold text-white shadow-lg backdrop-blur-sm md:text-xl">
                {ps.player.name}
              </span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
