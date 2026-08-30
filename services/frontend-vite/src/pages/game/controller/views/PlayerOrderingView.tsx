import { type Game } from "@/api/entities";
import { useEffect, useState } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { reorderPlayers } from "@/game/loop";

interface PlayerOrderingViewProps {
  game: Game;
  updateGame: (game: Game) => void;
  onComplete: () => void;
}

export default function PlayerOrderingView({
  game,
  updateGame,
  onComplete,
}: PlayerOrderingViewProps) {
  const [playerOrder, setPlayerOrder] = useState(
    game.state.playerStates.map((_, idx) => idx),
  );

  // Entering setup blacks out the dashboard so the welcome later fades in from
  // black rather than from the game charts.
  useEffect(() => {
    if (game.state.setupBlackout) return;
    updateGame({
      ...game,
      state: { ...game.state, setupBlackout: true },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Commit an order change to broadcast state immediately so the dashboard
  // (welcome ring, cards) reflects reordering live, not just on "Übernehmen".
  // After broadcasting, playerStates is already in the new sequence, so the
  // local index order resets to identity to stay aligned with it.
  const applyOrder = (newOrder: number[]) => {
    updateGame(reorderPlayers(game, newOrder));
    setPlayerOrder(newOrder.map((_, idx) => idx));
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newOrder = [...playerOrder];
    [newOrder[index], newOrder[index - 1]] = [
      newOrder[index - 1],
      newOrder[index],
    ];
    applyOrder(newOrder);
  };

  const handleMoveDown = (index: number) => {
    if (index === playerOrder.length - 1) return;
    const newOrder = [...playerOrder];
    [newOrder[index], newOrder[index + 1]] = [
      newOrder[index + 1],
      newOrder[index],
    ];
    applyOrder(newOrder);
  };

  const handleSave = () => {
    updateGame(reorderPlayers(game, playerOrder));
    onComplete();
  };

  const orderedPlayers = playerOrder.map(
    (originalIndex) => game.state.playerStates[originalIndex],
  );

  return (
    <div className="flex h-full flex-col">
      <div className="mb-3 shrink-0 md:mb-6">
        <h2 className="mb-1 text-lg font-semibold text-white md:mb-2 md:text-xl">
          Spielerreihenfolge
        </h2>
        <p className="text-sm text-neutral-400">
          Lege die Reihenfolge für die erste Runde fest
        </p>
      </div>

      <div className="mb-3 flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto md:mb-6 md:flex-none md:gap-3 md:overflow-visible">
        {orderedPlayers.map((playerState, index) => (
          <div
            key={`${playerState.player.name}-${index}`}
            className="flex shrink-0 items-center gap-3 rounded-lg border border-neutral-800 bg-neutral-900 p-3 md:p-4"
          >
            <div className="flex items-center gap-3 flex-1">
              <span className="text-lg font-mono text-neutral-500 w-8">
                {index + 1}.
              </span>
              <span className="text-3xl leading-none">
                {playerState.player.color}
              </span>
              <span className="text-lg font-medium text-white">
                {playerState.player.name}
              </span>
            </div>

            <div className="flex flex-col gap-1">
              <button
                onClick={() => handleMoveUp(index)}
                disabled={index === 0}
                className="p-2 bg-neutral-800 hover:bg-neutral-700 active:bg-neutral-600 text-white rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-150 active:scale-95"
                aria-label="Nach oben"
              >
                <ChevronUp size={20} strokeWidth={2.5} />
              </button>
              <button
                onClick={() => handleMoveDown(index)}
                disabled={index === orderedPlayers.length - 1}
                className="p-2 bg-neutral-800 hover:bg-neutral-700 active:bg-neutral-600 text-white rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-150 active:scale-95"
                aria-label="Nach unten"
              >
                <ChevronDown size={20} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={handleSave}
        className="w-full shrink-0 rounded-xl bg-blue-500 px-6 py-4 text-lg font-medium text-white transition-all duration-150 hover:bg-blue-600 active:scale-95 active:bg-blue-700"
      >
        Reihenfolge übernehmen →
      </button>
    </div>
  );
}
