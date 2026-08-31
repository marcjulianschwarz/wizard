import { useMemo, useState } from "react";
import type { Game, PlayerState } from "@/api/entities";
import { FinalPage } from "@/pages/game/display/DisplayGamePage";

// A finished game with hand-rolled per-round data so the final screen renders
// exactly as it would after a real game — used purely to review the layout,
// colours, podium sizing, confetti firework and the chart/stats flip.
function buildMockGame(): Game {
  const rounds = 12;
  const players: {
    name: string;
    color: string;
    predicted: number[];
    actual: number[];
  }[] = [
    {
      name: "Mama",
      color: "✨",
      predicted: [1, 1, 2, 1, 3, 2, 1, 4, 2, 3, 1, 5],
      actual: [1, 1, 2, 1, 3, 2, 1, 4, 2, 3, 1, 5],
    },
    {
      name: "Olli",
      color: "🔮",
      predicted: [0, 2, 1, 3, 1, 2, 3, 1, 4, 2, 3, 2],
      actual: [1, 2, 0, 3, 1, 1, 3, 2, 4, 2, 2, 2],
    },
    {
      name: "Finn",
      color: "🌟",
      predicted: [1, 0, 2, 1, 2, 1, 2, 3, 1, 4, 2, 3],
      actual: [1, 1, 2, 0, 2, 1, 3, 3, 0, 4, 2, 1],
    },
    {
      name: "Marc",
      color: "🦊",
      predicted: [0, 1, 1, 2, 1, 3, 1, 2, 2, 1, 4, 2],
      actual: [0, 0, 1, 2, 2, 3, 0, 2, 3, 1, 1, 2],
    },
    {
      name: "Leni",
      color: "🦄",
      predicted: [1, 1, 0, 1, 1, 0, 2, 1, 1, 2, 1, 1],
      actual: [1, 2, 0, 1, 0, 0, 2, 0, 1, 2, 3, 1],
    },
  ];

  const playerStates: PlayerState[] = players.map((p, i) => ({
    player: { name: p.name, color: p.color, order: i },
    points: { predicted: p.predicted, actual: p.actual },
  }));

  return {
    joinCode: "PREVIEW",
    state: {
      playerStates,
      startTime: Date.now() - 78 * 60 * 1000, // ~1h18min ago
      currentRound: rounds,
      running: false,
      showCharts: true,
      showStats: false,
    },
  };
}

export default function PreviewPage() {
  const base = useMemo(buildMockGame, []);
  const [showCharts, setShowCharts] = useState(true);
  const [showStats, setShowStats] = useState(false);

  const game: Game = {
    ...base,
    state: { ...base.state, showCharts, showStats },
  };

  return (
    <div className="relative min-h-screen bg-neutral-950">
      {/* Floating controls to exercise the two display toggles. */}
      <div className="fixed left-4 top-4 z-50 flex gap-2">
        <button
          onClick={() => setShowCharts((v) => !v)}
          className="rounded-lg bg-neutral-800 px-3 py-2 text-sm font-medium text-white hover:bg-neutral-700"
        >
          {showCharts ? "Charts: an" : "Charts: aus (GIF)"}
        </button>
        <button
          onClick={() => setShowStats((v) => !v)}
          className="rounded-lg bg-neutral-800 px-3 py-2 text-sm font-medium text-white hover:bg-neutral-700"
        >
          {showStats ? "Karten: Stats" : "Karten: Chart"}
        </button>
      </div>

      <FinalPage game={game} />
    </div>
  );
}
