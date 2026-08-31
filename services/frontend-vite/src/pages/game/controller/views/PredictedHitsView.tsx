import type { Game } from "@/api/entities";
import { useState } from "react";
import PlayerListItem from "@/components/PlayerListItem/PlayerListItem";
import NumberPad from "@/components/NumberPad/NumberPad";
import { forbiddenLastPrediction } from "@/api/utils";
import type { EntryOutcome } from "@/game/loop";
import {
  predictionEntryOutcome,
  predictionOverlayTransition,
  setPrediction,
} from "@/game/loop";

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
      const isFirstDigit = currentValue.length === 0;
      const newValue = currentValue + number;
      setCurrentValue(newValue);

      // Save immediately
      const value = parseInt(newValue);
      const saved = setPrediction(game, {
        playerName: game.state.playerStates[currentPlayerIndex].player.name,
        value,
        // Predictions aren't capped by the round number in this variant, so
        // don't clamp — matches the live tricks entry and correction panel.
        clampToRound: false,
      });

      const outcome = predictionEntryOutcome({
        value,
        playerIndex: currentPlayerIndex,
        totalPlayers,
        forbiddenValue,
      });

      // Fold the dashboard turn-overlay change into the SAME update as the save
      // so it can't be clobbered by a follow-up updateGame built from stale
      // state. `predictionOverlayTransition` owns the rules (hide "Stiche" on
      // the first prediction, show "Am Zug" once the last one lands).
      const turnOverlay = predictionOverlayTransition({
        current: game.state.turnOverlay,
        outcome,
        playerIndex: currentPlayerIndex,
        isFirstDigit,
      });
      updateGame({ ...saved, state: { ...saved.state, turnOverlay } });

      // Advance immediately on a single digit. Most predictions are one digit;
      // for the rare two-digit value, tap the player to re-select and type the
      // second digit (which appends since the field isn't cleared yet).
      advanceFrom(outcome);
    }
  };

  // Move to the next player, or finish the phase after the last one, based on
  // the already-computed entry outcome. The decision logic lives in the game
  // module (`predictionEntryOutcome`); this only applies its result.
  const advanceFrom = (outcome: EntryOutcome) => {
    if (outcome.kind === "blocked") return;
    if (outcome.kind === "finish") {
      onComplete?.();
      return;
    }
    setCurrentPlayerIndex((prev) => prev + 1);
    setCurrentValue("");
  };

  const handleBackspace = () => {
    const newValue = currentValue.slice(0, -1);
    setCurrentValue(newValue);

    // Save immediately (0 if empty)
    const value = newValue ? parseInt(newValue) : 0;
    updateGame(
      setPrediction(game, {
        playerName: game.state.playerStates[currentPlayerIndex].player.name,
        value,
        clampToRound: false,
      }),
    );
  };

  const handleClear = () => {
    setCurrentValue("");

    // Remove the prediction entirely for this player/round instead of storing 0.
    updateGame(
      setPrediction(game, {
        playerName: game.state.playerStates[currentPlayerIndex].player.name,
        value: undefined,
      }),
    );
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
    <div className="flex h-full w-full flex-col">
      {/* Header — hidden on mobile, where the step indicator already names the
          phase and vertical space is tight. */}
      <h2 className="mb-3 hidden shrink-0 text-lg font-semibold text-white md:block md:mb-6 md:text-xl">
        Vorhergesagte Stiche
      </h2>

      {/* Progress overview — scrolls internally if it can't fit, so the numpad
          and confirm button below always stay on screen. */}
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto md:flex-none md:overflow-visible">
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

      {/* "Darf nicht aufgehen" warning for the last player. */}
      {isLastPlayer && forbiddenValue !== null && (
        <div className="mt-3 shrink-0 rounded-xl border border-orange-500/50 bg-orange-500/10 p-2.5 text-orange-400">
          <p className="m-0 text-sm font-medium">
            Darf nicht {forbiddenValue} ansagen.
          </p>
        </div>
      )}

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
        disabled={isForbiddenPick}
        className="w-full shrink-0 rounded-xl bg-blue-500 px-6 py-4 font-medium text-white transition-all duration-150 hover:bg-blue-600 active:scale-98 active:bg-blue-700 disabled:cursor-not-allowed disabled:bg-neutral-700"
      >
        {isForbiddenPick
          ? `${forbiddenValue} nicht erlaubt`
          : isLastPlayer
            ? "Fertig ✓"
            : "Weiter →"}
      </button>
    </div>
  );
}
