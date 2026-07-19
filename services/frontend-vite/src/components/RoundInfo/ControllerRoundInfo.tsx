import { useState } from "react";
import { Settings } from "lucide-react";
import { type CardColor, type Game } from "@/api/entities";
import CardColorSelector from "@/components/CardColorSelector/CardColorSelector";
import RoundHeader from "./RoundHeader";

interface ControllerRoundInfoProps {
  game: Game;
  onSelectTrump: (color: CardColor) => void;
  onSelectCondition: (color: CardColor) => void;
}

export default function ControllerRoundInfo({
  game,
  onSelectTrump,
  onSelectCondition,
}: ControllerRoundInfoProps) {
  const [isCopied, setIsCopied] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

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
    <div className="flex flex-col gap-3">
      <div className="flex flex-row items-center justify-between gap-4 p-4 bg-neutral-900 rounded-xl border border-neutral-800">
        <div className="flex flex-col gap-4">
          <RoundHeader game={game} />
          <button
            onClick={() => setShowSettings((v) => !v)}
            aria-label="Einstellungen"
            className={`w-fit p-2 rounded-lg border transition-all duration-150 ${
              showSettings
                ? "bg-neutral-800 border-neutral-600 text-white"
                : "bg-neutral-900 border-neutral-700 text-neutral-400 hover:text-white hover:border-neutral-600"
            }`}
          >
            <Settings size={18} />
          </button>
        </div>

        <CardColorSelector
          bare
          trump={game.state.currentTrumpCardColor}
          condition={game.state.currentConditionCardColor}
          onSelectTrump={onSelectTrump}
          onSelectCondition={onSelectCondition}
        />
      </div>

      {showSettings && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 bg-neutral-900 rounded-lg border border-neutral-800">
          <div className="flex items-center gap-3">
            <label className="text-xs uppercase tracking-wider text-neutral-500">
              Code
            </label>
            <span className="text-lg font-bold font-mono text-blue-400 tracking-wide">
              {game.joinCode}
            </span>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={copyToClipboard}
              className="flex-1 sm:flex-initial px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 active:bg-neutral-600 text-white text-xs font-medium rounded-md border border-neutral-700 transition-all duration-150"
            >
              {isCopied ? "✓" : "Kopieren"}
            </button>
            <button
              onClick={() =>
                window.open(`/game/display/${game.joinCode}`, "_blank")
              }
              className="flex-1 sm:flex-initial px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 active:bg-blue-500/40 text-blue-400 text-xs font-medium rounded-md border border-blue-500/40 transition-all duration-150"
            >
              Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
