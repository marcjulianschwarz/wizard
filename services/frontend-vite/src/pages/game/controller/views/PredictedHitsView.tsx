import type { Game } from "@/api/entities";
import { useState } from "react";
import PlayerListItem from "@/components/PlayerListItem/PlayerListItem";
import NumberPad from "@/components/NumberPad/NumberPad";

export default function PredictedHitsView(props: {
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

      // Save immediately
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
                  predicted: [
                    ...ps.points.predicted.slice(
                      0,
                      game.state.currentRound - 1,
                    ),
                    value,
                    ...ps.points.predicted.slice(game.state.currentRound),
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

  const handleBackspace = () => {
    const newValue = currentValue.slice(0, -1);
    setCurrentValue(newValue);

    // Save immediately (0 if empty)
    const value = newValue ? parseInt(newValue) : 0;
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
                predicted: [
                  ...ps.points.predicted.slice(0, game.state.currentRound - 1),
                  value,
                  ...ps.points.predicted.slice(game.state.currentRound),
                ],
              },
            };
          }
          return ps;
        }),
      },
    };
    updateGame(updatedGame);
  };

  const handleClear = () => {
    setCurrentValue("");

    // Save 0 immediately
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
                predicted: [
                  ...ps.points.predicted.slice(0, game.state.currentRound - 1),
                  0,
                  ...ps.points.predicted.slice(game.state.currentRound),
                ],
              },
            };
          }
          return ps;
        }),
      },
    };
    updateGame(updatedGame);
  };

  const handleConfirm = () => {
    // Data is already saved on each input, just navigate
    if (currentPlayerIndex < totalPlayers - 1) {
      setCurrentPlayerIndex((prev) => prev + 1);
      setCurrentValue("");
    } else {
      // Last player completed, trigger navigation
      onComplete?.();
    }
  };

  const handlePlayerClick = (index: number) => {
    // Data is already saved on each input, just switch player
    setCurrentPlayerIndex(index);
    const playerValue =
      game.state.playerStates[index].points.predicted[
        game.state.currentRound - 1
      ];
    setCurrentValue(playerValue?.toString() ?? "");
  };

  const isLastPlayer = currentPlayerIndex === totalPlayers - 1;

  return (
    <div className="max-w-sm mx-auto mt-10">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-white">
          Vorhergesagte Stiche
        </h2>
      </div>

      {/* Progress overview */}
      <div className="mb-6">
        <div className="space-y-2">
          {game.state.playerStates.map((playerState, index) => {
            const displayValue =
              index === currentPlayerIndex
                ? currentValue || "0"
                : (playerState.points.predicted[
                    game.state.currentRound - 1
                  ]?.toString() ?? "—");

            return (
              <PlayerListItem
                key={playerState.player.name}
                playerState={playerState}
                index={index}
                currentPlayerIndex={currentPlayerIndex}
                displayValue={displayValue}
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
