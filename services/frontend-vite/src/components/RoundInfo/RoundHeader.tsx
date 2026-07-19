import { useState, useEffect } from "react";
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
    <div className="flex flex-col gap-2">
      <h1 className="text-2xl font-semibold text-white">
        Runde {game.state.currentRound}
      </h1>
      <div className="flex flex-col gap-1">
        <p className="text-sm text-neutral-400">
          {getTimeDifference(game.state.startTime, currentTime).minutes} Spielzeit
        </p>
        <p className="text-sm text-neutral-400">{maxRounds} Runden</p>
      </div>
    </div>
  );
}
