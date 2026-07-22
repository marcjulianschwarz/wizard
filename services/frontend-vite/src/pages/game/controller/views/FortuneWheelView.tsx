import type { Game, PlayerState } from "@/api/entities";
import { AnimatePresence, motion } from "motion/react";
import { Sparkles } from "lucide-react";
import { useEffect } from "react";

interface FortuneWheelViewProps {
  game: Game;
  updateGame: (game: Game) => void;
  onComplete: () => void;
}

// Rotate the turn order so `winnerIndex` leads, keeping the seated sequence
// intact (we all stay in our seats, only the starting point moves). The stamped
// `player.order` is untouched, so the display cards keep their fixed order.
function rotateToStart(
  playerStates: PlayerState[],
  winnerIndex: number,
): PlayerState[] {
  return [
    ...playerStates.slice(winnerIndex),
    ...playerStates.slice(0, winnerIndex),
  ];
}

// The controller is only the remote control: it triggers the spin (writing the
// target/nonce into broadcast state) and reads back the result. The wheel spins
// on the dashboard (display), which flips `settled` when the animation lands.
export default function FortuneWheelView({
  game,
  updateGame,
  onComplete,
}: FortuneWheelViewProps) {
  const players = game.state.playerStates;
  const wheel = game.state.fortuneWheel;

  const spinning = wheel !== undefined && !wheel.settled;
  const winnerIndex = wheel?.settled ? wheel.targetIndex : null;
  const winner = winnerIndex !== null ? players[winnerIndex] : null;

  // Entering the wheel step shows the welcome screen on the dashboard (players
  // gathered for the wizard intro) until the first spin. Only flip it on if it
  // isn't already set and no wheel is in play yet.
  useEffect(() => {
    if (game.state.showWelcome || game.state.fortuneWheel) return;
    updateGame({
      ...game,
      state: { ...game.state, showWelcome: true },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSpin = () => {
    if (spinning) return;
    const picked = Math.floor(Math.random() * players.length);
    updateGame({
      ...game,
      state: {
        ...game.state,
        // Leave the welcome screen behind — the wheel takes over the dashboard.
        showWelcome: false,
        fortuneWheel: {
          targetIndex: picked,
          spinNonce: (wheel?.spinNonce ?? 0) + 1,
          settled: false,
        },
      },
    });
  };

  const handleConfirm = () => {
    if (winnerIndex === null) return;
    updateGame({
      ...game,
      state: {
        ...game.state,
        playerStates: rotateToStart(players, winnerIndex),
        // Clear the wheel + welcome + blackout so nothing lingers on the
        // display and the game board comes back.
        fortuneWheel: undefined,
        showWelcome: false,
        setupBlackout: false,
      },
    });
    onComplete();
  };

  return (
    <div className="flex flex-col items-center">
      <div className="mb-6 text-center">
        <h2 className="mb-2 text-xl font-semibold text-white">Glücksrad</h2>
        <p className="text-sm text-neutral-400">
          Dreh das Rad auf dem Dashboard – wer beginnt zuerst?
        </p>
      </div>

      {/* Spin-in-progress / result feedback (the actual wheel is on the display). */}
      <div className="mb-6 flex h-20 w-full items-center justify-center">
        <AnimatePresence mode="wait">
          {spinning ? (
            <motion.div
              key="spinning"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-3 text-neutral-300"
            >
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="inline-flex"
              >
                <Sparkles size={22} />
              </motion.span>
              <span className="text-lg font-medium">Das Rad dreht sich…</span>
            </motion.div>
          ) : winner ? (
            <motion.div
              key={winner.player.name}
              initial={{ opacity: 0, scale: 0.6, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 500, damping: 22 }}
              className="flex items-center gap-2 rounded-xl border border-blue-500/50 bg-blue-500/10 px-4 py-3 text-blue-300"
            >
              <span className="text-2xl leading-none">{winner.player.color}</span>
              <span className="text-lg font-semibold">
                {winner.player.name} beginnt!
              </span>
            </motion.div>
          ) : (
            <motion.p
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-neutral-500"
            >
              Noch nicht gedreht.
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      <div className="flex w-full flex-col gap-3">
        <motion.button
          onClick={handleSpin}
          disabled={spinning}
          whileTap={{ scale: 0.95 }}
          className="w-full rounded-xl bg-neutral-800 px-6 py-4 text-lg font-medium text-white transition-colors duration-150 hover:bg-neutral-700 disabled:opacity-40"
        >
          {spinning ? "Dreht…" : winner ? "Nochmal drehen" : "Drehen"}
        </motion.button>
        <motion.button
          onClick={handleConfirm}
          disabled={winnerIndex === null || spinning}
          whileTap={{ scale: winnerIndex === null ? 1 : 0.95 }}
          className="w-full rounded-xl bg-blue-500 px-6 py-4 text-lg font-medium text-white transition-colors duration-150 hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-neutral-700"
        >
          Übernehmen →
        </motion.button>
      </div>
    </div>
  );
}
