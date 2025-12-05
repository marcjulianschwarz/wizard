import { useState, useEffect } from "react";
import { getTimeDifference } from "@/api/utils";
import { type Game } from "@/api/entities";

interface RoundInfoProps {
  game: Game;
  showGameCode?: boolean;
  showDashboardLink?: boolean;
}

export default function RoundInfo({
  game,
  showGameCode = false,
  showDashboardLink = false,
}: RoundInfoProps) {
  const [currentTime, setCurrentTime] = useState(() => Date.now());
  const [isCopied, setIsCopied] = useState(false);

  const maxRounds = 60 / game.state.playerStates.length;

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  function getColorClasses(color: string | undefined) {
    if (color === "green") return "bg-green-500 text-white";
    if (color === "red") return "bg-red-500 text-white";
    if (color === "blue") return "bg-blue-500 text-white";
    if (color === "yellow") return "bg-yellow-400 text-black";
    return "bg-neutral-800 text-neutral-400";
  }

  const copyToClipboard = async () => {
    if ("clipboard" in navigator) {
      try {
        await navigator.clipboard.writeText(game.joinCode);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      } catch (err) {
        console.error("Failed to copy: ", err);
      }
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col md:flex-row justify-between gap-4 md:gap-6 p-4 bg-neutral-900 rounded-xl border border-neutral-800">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold text-white">
            Runde {game.state.currentRound}
          </h1>
          <div className="flex flex-col gap-1">
            <p className="text-sm text-neutral-400">
              {getTimeDifference(game.state.startTime, currentTime).minutes}{" "}
              Spielzeit
            </p>
            <p className="text-sm text-neutral-400">{maxRounds} Runden</p>
          </div>
        </div>
        <div className="flex flex-row md:flex-col gap-3">
          <div
            className={`px-4 py-2 rounded-lg text-sm font-medium ${getColorClasses(game.state.currentTrumpCardColor)}`}
          >
            Trumpf
          </div>
          <div
            className={`px-4 py-2 rounded-lg text-sm font-medium ${getColorClasses(game.state.currentConditionCardColor)}`}
          >
            Bedienung
          </div>
        </div>
      </div>

      {showGameCode && (
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
            {showDashboardLink && (
              <button
                onClick={() =>
                  window.open(`/game/display/${game.joinCode}`, "_blank")
                }
                className="flex-1 sm:flex-initial px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 active:bg-blue-500/40 text-blue-400 text-xs font-medium rounded-md border border-blue-500/40 transition-all duration-150"
              >
                Dashboard
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
