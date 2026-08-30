import type { Game, PlayerState } from "@/api/entities";
import {
  maxRounds as maxRoundsFor,
  playerScore,
  setActual,
  setCurrentRound as setRound,
  setPrediction,
} from "@/game/loop";
import { useState } from "react";
import { ChevronDown, Wrench } from "lucide-react";

// Parse a text field into a round value: empty clears (undefined for
// predictions, which allows a hole), otherwise a clamped non-negative integer.
function parseRoundValue(raw: string): number | undefined {
  const trimmed = raw.trim();
  if (trimmed === "") return undefined;
  const n = parseInt(trimmed, 10);
  if (Number.isNaN(n) || n < 0) return undefined;
  return n;
}

export default function CorrectionPanel(props: {
  game: Game;
  updateGame: (game: Game) => void;
}) {
  const { game, updateGame } = props;
  const [open, setOpen] = useState(false);

  const maxRounds = maxRoundsFor(game);
  const currentRound = game.state.currentRound;

  // Which round's values the editor is showing. Defaults to the current round.
  const [editRound, setEditRound] = useState(currentRound);
  const roundIndex = editRound - 1;

  function setCurrentRound(round: number) {
    updateGame(setRound(game, round));
  }

  // Update one player's predicted/actual for the currently edited round. These
  // are silent corrections: the module never touches roundResultTrigger, so the
  // display just re-renders the new totals without popping a badge.
  function setPlayerValue(
    playerName: string,
    field: "predicted" | "actual",
    value: number | undefined,
  ) {
    const next =
      field === "predicted"
        ? setPrediction(game, {
            playerName,
            value,
            round: editRound,
            clampToRound: false,
          })
        : setActual(game, {
            playerName,
            value,
            round: editRound,
            clampToRound: false,
          });
    updateGame(next);
  }

  const playerTotal = (ps: PlayerState) => playerScore(ps);

  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900/40">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 px-4 py-3 text-sm font-medium text-neutral-300"
      >
        <span className="flex items-center gap-2">
          <Wrench size={16} />
          Korrigieren
        </span>
        <ChevronDown
          size={18}
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="flex flex-col gap-5 border-t border-neutral-800 px-4 py-4">
          {/* Current round control */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium uppercase tracking-wider text-neutral-500">
              Aktuelle Runde
            </span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setCurrentRound(currentRound - 1)}
                className="h-10 w-10 rounded-lg bg-neutral-800 text-lg text-white active:bg-neutral-700"
              >
                −
              </button>
              <span className="min-w-[3ch] text-center text-2xl font-bold tabular-nums text-white">
                {currentRound}
              </span>
              <button
                onClick={() => setCurrentRound(currentRound + 1)}
                className="h-10 w-10 rounded-lg bg-neutral-800 text-lg text-white active:bg-neutral-700"
              >
                +
              </button>
              <span className="text-sm text-neutral-500">von {maxRounds}</span>
            </div>
          </div>

          {/* Round selector for the value editor */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium uppercase tracking-wider text-neutral-500">
              Runde bearbeiten
            </span>
            <select
              value={editRound}
              onChange={(e) => setEditRound(parseInt(e.target.value, 10))}
              className="rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-white"
            >
              {Array.from({ length: maxRounds }, (_, i) => i + 1).map((r) => (
                <option key={r} value={r}>
                  Runde {r}
                  {r === currentRound ? " (aktuell)" : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Per-player predicted/actual editor for the selected round */}
          <div className="flex flex-col gap-2">
            <div className="grid grid-cols-[1fr_4rem_4rem_4rem] items-center gap-2 px-1 text-xs font-medium uppercase tracking-wider text-neutral-500">
              <span>Spieler</span>
              <span className="text-center">Ansage</span>
              <span className="text-center">Stiche</span>
              <span className="text-center">Punkte</span>
            </div>
            {game.state.playerStates.map((ps) => {
              const predicted = ps.points.predicted[roundIndex];
              const actual = ps.points.actual[roundIndex];
              return (
                <div
                  key={ps.player.name}
                  className="grid grid-cols-[1fr_4rem_4rem_4rem] items-center gap-2"
                >
                  <span className="flex items-center gap-2 truncate text-sm text-white">
                    <span className="text-lg leading-none">
                      {ps.player.color}
                    </span>
                    <span className="truncate">{ps.player.name}</span>
                  </span>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    value={predicted ?? ""}
                    onChange={(e) =>
                      setPlayerValue(
                        ps.player.name,
                        "predicted",
                        parseRoundValue(e.target.value),
                      )
                    }
                    className="w-16 rounded-lg border border-neutral-700 bg-neutral-800 px-2 py-2 text-center text-sm tabular-nums text-white"
                  />
                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    value={actual ?? ""}
                    onChange={(e) =>
                      setPlayerValue(
                        ps.player.name,
                        "actual",
                        parseRoundValue(e.target.value),
                      )
                    }
                    className="w-16 rounded-lg border border-neutral-700 bg-neutral-800 px-2 py-2 text-center text-sm tabular-nums text-white"
                  />
                  <span className="text-center text-sm font-semibold tabular-nums text-neutral-300">
                    {playerTotal(ps)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
