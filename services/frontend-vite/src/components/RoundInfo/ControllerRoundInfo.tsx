import { useState } from "react";
import { ExternalLink } from "lucide-react";
import { type Game } from "@/api/entities";
import RoundHeader from "./RoundHeader";

interface ControllerRoundInfoProps {
  game: Game;
}

export default function ControllerRoundInfo({
  game,
}: ControllerRoundInfoProps) {
  const [isCopied, setIsCopied] = useState(false);

  const copyToClipboard = async () => {
    if (!("clipboard" in navigator)) return;
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/game/display/${game.joinCode}`,
      );
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy: ", err);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <RoundHeader game={game} />

      <div className="flex items-center gap-3 rounded-lg border border-neutral-800 bg-neutral-900 p-3">
        <button
          onClick={copyToClipboard}
          aria-label="Code kopieren"
          className="text-lg font-bold font-mono text-blue-400 tracking-wide hover:text-blue-300 transition-colors duration-150"
        >
          {isCopied ? "✓ Kopiert" : game.joinCode}
        </button>
        <button
          onClick={() =>
            window.open(`/game/display/${game.joinCode}`, "_blank")
          }
          aria-label="Dashboard öffnen"
          className="p-2 bg-blue-500/20 hover:bg-blue-500/30 active:bg-blue-500/40 text-blue-400 rounded-md border border-blue-500/40 transition-all duration-150"
        >
          <ExternalLink size={16} />
        </button>
      </div>
    </div>
  );
}
