import { AnimatePresence, motion } from "motion/react";
import { type Player } from "@/api/entities";

interface TurnOverlayProps {
  // Whether the overlay is currently shown. Controlled entirely by the caller.
  visible: boolean;
  // Action phrase shown after the player's name, e.g. "ist am Zug".
  action: string;
  player?: Player;
  accent?: string;
}

// A springy pop for children, staggered so emoji → name → action cascade in.
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
};

const item = {
  hidden: { opacity: 0, scale: 0.6, y: 20 },
  show: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: "spring", stiffness: 500, damping: 22 },
  },
};

// Full-page background overlay that announces whose turn it is. Purely
// controlled: shown while `visible` is true, with a springy pop in/out.
export default function TurnOverlay({
  visible,
  action,
  player,
  accent = "text-blue-300",
}: TurnOverlayProps) {
  return (
    <AnimatePresence>
      {visible && player && (
        <motion.div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-black/90 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.2 } }}
        >
          <motion.div
            className="flex flex-col items-center gap-6"
            variants={container}
            initial="hidden"
            animate="show"
          >
            <motion.span
              variants={item}
              className="text-6xl md:text-8xl leading-none drop-shadow-[0_0_60px_rgba(59,130,246,0.4)]"
            >
              {player.color}
            </motion.span>
            <div className="flex flex-col items-center gap-2 text-center px-6">
              <motion.span
                variants={item}
                className="text-7xl md:text-9xl font-black text-white tracking-tight"
              >
                {player.name}
              </motion.span>
              <motion.span
                variants={item}
                className={`text-3xl md:text-5xl font-semibold ${accent}`}
              >
                {action}
              </motion.span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
