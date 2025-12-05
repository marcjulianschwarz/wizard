import { type Player } from "@/api/entities";
import { X } from "lucide-react";

interface PlayerCardProps {
  player: Player;
  onRemove?: (playerName: string) => void;
}

export default function PlayerCard({ player, onRemove }: PlayerCardProps) {
  return (
    <div className="flex flex-row justify-between items-center px-5 py-4 bg-neutral-900 border border-neutral-800 rounded-lg transition-all duration-200 hover:bg-neutral-800 hover:translate-x-1 hover:border-neutral-700">
      <div className="flex items-center gap-4">
        <span className="text-3xl leading-none">{player.color}</span>
        <span className="text-lg font-medium text-white">{player.name}</span>
      </div>
      {onRemove && (
        <button
          className="w-9 h-9 p-0 flex items-center justify-center text-red-500 border border-red-500 bg-transparent rounded-lg transition-all duration-200 hover:bg-red-500/15 hover:scale-105"
          onClick={() => onRemove(player.name)}
          aria-label={`${player.name} entfernen`}
        >
          <X size={18} strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
}
