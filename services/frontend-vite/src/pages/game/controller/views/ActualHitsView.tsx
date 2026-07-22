import type { Game } from "@/api/entities";
import { useState } from "react";
import PlayerListItem from "@/components/PlayerListItem/PlayerListItem";
import NumberPad from "@/components/NumberPad/NumberPad";

export default function ActualHitsView(props: {
  game: Game;
  updateGame: (game: Game) => void;
  onComplete?: () => void;
}) {
  const { game, updateGame, onComplete } = props;
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [currentValue, setCurrentValue] = useState("");

  const totalPlayers = game.state.playerStates.length;

  const handleNumberClick = (number: string) => {
    if (currentValue.length < 2) {
      const newValue = currentValue + number;
      setCurrentValue(newValue);

      const value = parseInt(newValue);
      const updatedGame: Game = {
        ...game,
        state: {
          ...game.state,
          playerStates: game.state.playerStates.map((ps, index) => {
            if (index === currentPlayerIndex) {
              return {
                ...ps,
                points: {
                  ...ps.points,
                  actual: [
                    ...ps.points.actual.slice(0, game.state.currentRound - 1),
                    value,
                    ...ps.points.actual.slice(game.state.currentRound),
                  ],
                },
              };
            }
            return ps;
          }),
        },
      };
      updateGame(updatedGame);

      // Auto-advance to the next player once the value is complete. Wait for a
      // second digit only when a valid two-digit count is still reachable.
      const canGrow =
        newValue.length === 1 && value * 10 <= game.state.currentRound;
      if (!canGrow) {
        advanceFromCurrent();
      }
    }
  };

  const advanceFromCurrent = () => {
    // The last player never auto-finishes the round — that stays a deliberate
    // "Fertig" click so the results/points badges aren't fired by accident.
    if (currentPlayerIndex < totalPlayers - 1) {
      setCurrentPlayerIndex((prev) => prev + 1);
      setCurrentValue("");
    }
  };

  const handleBackspace = () => {
    const newValue = currentValue.slice(0, -1);
    setCurrentValue(newValue);

    if (newValue) {
      const value = parseInt(newValue);
      const updatedGame: Game = {
        ...game,
        state: {
          ...game.state,
          playerStates: game.state.playerStates.map((ps, index) => {
            if (index === currentPlayerIndex) {
              return {
                ...ps,
                points: {
                  ...ps.points,
                  actual: [
                    ...ps.points.actual.slice(0, game.state.currentRound - 1),
                    value,
                    ...ps.points.actual.slice(game.state.currentRound),
                  ],
                },
              };
            }
            return ps;
          }),
        },
      };
      updateGame(updatedGame);
    }
  };

  const handleClear = () => {
    setCurrentValue("");
  };

  const handleConfirm = () => {
    if (currentPlayerIndex < totalPlayers - 1) {
      setCurrentPlayerIndex((prev) => prev + 1);
      setCurrentValue("");
    } else {
      onComplete?.();
    }
  };

  const handlePlayerClick = (index: number) => {
    setCurrentPlayerIndex(index);
    const playerValue =
      game.state.playerStates[index].points.actual[game.state.currentRound - 1];
    setCurrentValue(playerValue?.toString() ?? "");
  };

  const isLastPlayer = currentPlayerIndex === totalPlayers - 1;

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-white">Gemachte Stiche</h2>
      </div>

      {/* Progress overview */}
      <div className="mb-6">
        <div className="space-y-2">
          {game.state.playerStates.map((playerState, index) => {
            const displayValue =
              index === currentPlayerIndex
                ? currentValue || "—"
                : (playerState.points.actual[
                    game.state.currentRound - 1
                  ]?.toString() ?? "—");

            const referenceValue =
              playerState.points.predicted[game.state.currentRound - 1];

            return (
              <PlayerListItem
                key={playerState.player.name}
                playerState={playerState}
                index={index}
                currentPlayerIndex={currentPlayerIndex}
                displayValue={displayValue}
                referenceValue={referenceValue}
                onClick={handlePlayerClick}
              />
            );
          })}
        </div>
      </div>

      <NumberPad
        onNumberClick={handleNumberClick}
        onClear={handleClear}
        onBackspace={handleBackspace}
      />

      {/* Navigation */}
      <div className="flex gap-3">
        <button
          onClick={handleConfirm}
          className="w-full bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white font-medium py-4 px-6 rounded-xl transition-all duration-150 active:scale-98"
        >
          {isLastPlayer ? "Fertig ✓" : "Weiter →"}
        </button>
      </div>
    </div>
  );
}
