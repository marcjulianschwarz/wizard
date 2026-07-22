import type { Game } from "@/api/entities";
import { useState } from "react";
import PlayerListItem from "@/components/PlayerListItem/PlayerListItem";
import NumberPad from "@/components/NumberPad/NumberPad";
import { forbiddenLastPrediction } from "@/api/utils";

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

      // Advance immediately on a single digit. Most predictions are one digit;
      // for the rare two-digit value, tap the player to re-select and type the
      // second digit (which appends since the field isn't cleared yet).
      advanceFrom(value);
    }
  };

  // Move to the next player, or finish the phase after the last one. `value` is
  // the prediction just entered by the current (last) player, used to honor the
  // "Darf nicht aufgehen" block.
  const advanceFrom = (value: number) => {
    const blocked =
      isLastPlayer && forbiddenValue !== null && value === forbiddenValue;
    if (blocked) return;
    if (currentPlayerIndex < totalPlayers - 1) {
      setCurrentPlayerIndex((prev) => prev + 1);
      setCurrentValue("");
    } else {
      onComplete?.();
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

    // Remove the prediction entirely for this player/round instead of storing 0.
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
                  undefined,
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
    // Block the forbidden value under the "Darf nicht aufgehen" rule.
    if (isForbiddenPick) return;
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

  // "Darf nicht aufgehen": the forbidden value for the last player this round.
  const forbiddenValue = forbiddenLastPrediction({
    game,
    predictionOrder: game.state.playerStates,
  });
  // Only the last-to-predict player is actually blocked from this value.
  const currentValueNumber = currentValue ? parseInt(currentValue) : 0;
  const isForbiddenPick =
    isLastPlayer &&
    forbiddenValue !== null &&
    currentValueNumber === forbiddenValue;

  return (
    <div className="w-full">
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
                ? currentValue || "—"
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

      {/* "Darf nicht aufgehen" warning for the last player. */}
      {isLastPlayer && forbiddenValue !== null && (
        <div className="mb-4 rounded-xl border border-orange-500/50 bg-orange-500/10 p-3 text-orange-400">
          <p className="m-0 text-sm font-medium">
            Darf nicht {forbiddenValue} ansagen.
          </p>
        </div>
      )}

      <NumberPad
        onNumberClick={handleNumberClick}
        onClear={handleClear}
        onBackspace={handleBackspace}
      />

      {/* Navigation */}
      <div className="flex gap-3">
        <button
          onClick={handleConfirm}
          disabled={isForbiddenPick}
          className="w-full bg-blue-500 hover:bg-blue-600 active:bg-blue-700 disabled:bg-neutral-700 disabled:cursor-not-allowed text-white font-medium py-4 px-6 rounded-xl transition-all duration-150 active:scale-98"
        >
          {isForbiddenPick
            ? `${forbiddenValue} nicht erlaubt`
            : isLastPlayer
              ? "Fertig ✓"
              : "Weiter →"}
        </button>
      </div>
    </div>
  );
}
