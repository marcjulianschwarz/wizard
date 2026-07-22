import { useState, useEffect } from "react";
import { Clock } from "lucide-react";
import { getTimeDifference } from "@/api/utils";
import { type Game } from "@/api/entities";

// The "Runde X / Spielzeit / Runden" text block shared by the controller and
// display round info headers.
export default function RoundHeader({ game }: { game: Game }) {
  const [currentTime, setCurrentTime] = useState(() => Date.now());
  const maxRounds = 60 / game.state.playerStates.length;

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline gap-2">
        <span className="text-6xl font-bold leading-none text-white tabular-nums">
          {game.state.currentRound}
        </span>
        <span className="text-2xl font-medium leading-none text-neutral-600">
          / {maxRounds} Runden
        </span>
      </div>
      <div className="mt-2 flex items-center gap-2 text-neutral-400">
        <Clock size={16} strokeWidth={2} />
        <span className="text-lg font-medium tabular-nums text-white">
          {getTimeDifference(game.state.startTime, currentTime).minutes}
        </span>
        <span className="text-sm text-neutral-500">Spielzeit</span>
      </div>
    </div>
  );
}
