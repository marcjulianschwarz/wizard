import type { Game } from "@/api/entities";
import { setPlayerIdentity } from "@/game/loop";
import { useState } from "react";
import { ChevronDown, Users } from "lucide-react";
import { EMOJI_OPTIONS } from "@/components/EmojiPicker/EmojiOptions";

// Controller panel to rename players and change their icon live, mid-game.
// Edits are silent identity changes (points travel with the player, so nothing
// is lost). Sits in the controller's secondary controls next to CorrectionPanel.
export default function PlayerEditPanel(props: {
  game: Game;
  updateGame: (game: Game) => void;
}) {
  const { game, updateGame } = props;
  const [open, setOpen] = useState(false);
  // Index of the player whose icon picker is open, or null.
  const [pickerFor, setPickerFor] = useState<number | null>(null);

  function rename(playerIndex: number, name: string) {
    updateGame(setPlayerIdentity(game, { playerIndex, name }));
  }

  function setIcon(playerIndex: number, color: string) {
    updateGame(setPlayerIdentity(game, { playerIndex, color }));
    setPickerFor(null);
  }

  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900/40">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 px-4 py-3 text-sm font-medium text-neutral-300"
      >
        <span className="flex items-center gap-2">
          <Users size={16} />
          Spieler bearbeiten
        </span>
        <ChevronDown
          size={18}
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="flex flex-col gap-3 border-t border-neutral-800 px-4 py-4">
          {game.state.playerStates.map((ps, index) => (
            <div key={index} className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                {/* Icon button toggles the picker for this player. */}
                <button
                  onClick={() =>
                    setPickerFor((cur) => (cur === index ? null : index))
                  }
                  aria-label="Symbol ändern"
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border bg-neutral-800 text-2xl active:bg-neutral-700 ${
                    pickerFor === index
                      ? "border-blue-500"
                      : "border-neutral-700"
                  }`}
                >
                  {ps.player.color}
                </button>

                {/* Name field: commit on blur / Enter. */}
                <input
                  type="text"
                  defaultValue={ps.player.name}
                  key={ps.player.name}
                  onBlur={(e) => rename(index, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") e.currentTarget.blur();
                  }}
                  className="min-w-0 flex-1 rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-white"
                />
              </div>

              {/* Inline icon picker for the selected player. */}
              {pickerFor === index && (
                <div className="grid grid-cols-8 gap-1.5 rounded-lg border border-neutral-800 bg-neutral-950 p-2">
                  {EMOJI_OPTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => setIcon(index, emoji)}
                      className={`flex aspect-square items-center justify-center rounded-md text-2xl active:bg-neutral-700 ${
                        ps.player.color === emoji
                          ? "bg-neutral-800 ring-1 ring-blue-500"
                          : ""
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
