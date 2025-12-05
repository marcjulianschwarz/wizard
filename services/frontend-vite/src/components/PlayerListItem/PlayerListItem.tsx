import type { PlayerState } from "@/api/entities";

interface PlayerListItemProps {
  playerState: PlayerState;
  index: number;
  currentPlayerIndex: number;
  displayValue: string;
  referenceValue?: number | string;
  onClick: (index: number) => void;
}

export default function PlayerListItem({
  playerState,
  index,
  currentPlayerIndex,
  displayValue,
  referenceValue,
  onClick,
}: PlayerListItemProps) {
  return (
    <button
      onClick={() => onClick(index)}
      className={`w-full flex justify-between items-center p-3 rounded-lg transition-all duration-200 cursor-pointer ${
        index === currentPlayerIndex
          ? "bg-blue-500/20 border border-blue-500/40 ring-2 ring-blue-500/20"
          : index < currentPlayerIndex
            ? "bg-neutral-900 border border-neutral-800 hover:bg-neutral-800"
            : "bg-neutral-900/50 border border-neutral-800 hover:bg-neutral-900"
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="text-2xl">{playerState.player.color}</div>
        <span className="text-sm font-medium text-white">
          {playerState.player.name}
        </span>
      </div>
      <div className="flex items-center gap-2">
        {referenceValue !== undefined && (
          <span className="text-xs text-neutral-500 font-mono">
            ({referenceValue})
          </span>
        )}
        <span
          className={`font-mono text-lg px-3 py-1 rounded min-w-12 text-center ${
            index === currentPlayerIndex
              ? "bg-blue-500/30 text-blue-200 border border-blue-500/50 font-bold"
              : displayValue !== "—"
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                : "bg-neutral-800 text-neutral-500 border border-neutral-700"
          }`}
        >
          {displayValue}
        </span>
      </div>
    </button>
  );
}
