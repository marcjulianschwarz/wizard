import type { Game } from "@/api/entities";
import { useState } from "react";
import PlayerListItem from "@/components/PlayerListItem/PlayerListItem";
import NumberPad from "@/components/NumberPad/NumberPad";
import { setActual, tricksEntryOutcome } from "@/game/loop";

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
      updateGame(
        setActual(game, {
          playerName: game.state.playerStates[currentPlayerIndex].player.name,
          value,
        }),
      );

      // Auto-advance once the value is complete. The module decides whether to
      // wait for a possible second digit or move on (and never auto-finishes on
      // the last player).
      const outcome = tricksEntryOutcome({
        value,
        digitsEntered: newValue.length,
        playerIndex: currentPlayerIndex,
        totalPlayers,
        maxTricks: game.state.currentRound,
      });
      if (outcome.kind === "advance") {
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
      updateGame(
        setActual(game, {
          playerName: game.state.playerStates[currentPlayerIndex].player.name,
          value,
        }),
      );
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
    <div className="flex h-full w-full flex-col">
      {/* Header */}
      <h2 className="mb-3 shrink-0 text-lg font-semibold text-white md:mb-6 md:text-xl">
        Gemachte Stiche
      </h2>

      {/* Progress overview — scrolls internally if it can't fit, so the numpad
          and confirm button below always stay on screen. */}
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto md:flex-none md:overflow-visible">
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

      <div className="mt-3 shrink-0 md:mt-6">
        <NumberPad
          onNumberClick={handleNumberClick}
          onClear={handleClear}
          onBackspace={handleBackspace}
        />
      </div>

      {/* Navigation */}
      <button
        onClick={handleConfirm}
        className="w-full shrink-0 rounded-xl bg-blue-500 px-6 py-4 font-medium text-white transition-all duration-150 hover:bg-blue-600 active:scale-98 active:bg-blue-700"
      >
        {isLastPlayer ? "Fertig ✓" : "Weiter →"}
      </button>
    </div>
  );
}
