import type { Game, PlayerState } from "@/api/entities";
import { useSocket } from "@/api/hooks";
import RoundInfo from "@/components/RoundInfo/RoundInfo";
import { currentPoints, lineChartPointsValues } from "@/api/utils";
import SimpleLineChart from "@/components/SimpleLineChart/SimpleLineChart";
import { useParams } from "react-router";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useState, useEffect } from "react";

function StatsBlock(props: {
  playerState: PlayerState;
  currentRound: number;
  globalMin: number;
  globalMax: number;
  allNumbers: number[];
  rank?: number;
}) {
  const { playerState, currentRound, allNumbers, globalMax, globalMin, rank } =
    props;

  const predicted = playerState.points.predicted[currentRound - 1];
  const actual = playerState.points.actual[currentRound - 1];

  const points = currentPoints(
    playerState.points.predicted,
    playerState.points.actual,
  );

  // Determine border color based on rank
  const getBorderColor = () => {
    if (rank === undefined) return "border-neutral-800";
    if (rank === 1) return "border-yellow-500"; // Gold
    if (rank === 2) return "border-gray-400"; // Silver
    if (rank === 3) return "border-amber-700"; // Bronze
    return "border-neutral-800";
  };

  const getHoverBorderColor = () => {
    if (rank === undefined) return "hover:border-neutral-700";
    if (rank === 1) return "hover:border-yellow-400";
    if (rank === 2) return "hover:border-gray-300";
    if (rank === 3) return "hover:border-amber-600";
    return "hover:border-neutral-700";
  };

  return (
    <div
      className={`grow p-4 bg-neutral-900 border-2 ${getBorderColor()} rounded-xl transition-transform duration-200 hover:-translate-y-0.5 ${getHoverBorderColor()}`}
    >
      <div className="flex items-center gap-3 mb-3">
        <span className="text-3xl md:text-4xl leading-none">
          {playerState.player.color}
        </span>
        <p className="text-lg md:text-xl text-white m-0">
          {playerState.player.name}
        </p>
      </div>
      {points !== null && points !== undefined ? (
        <div className="mb-2">
          <span className="text-2xl md:text-3xl font-bold text-white">
            {points}
          </span>
          <span className="text-white ml-1">pkt</span>
        </div>
      ) : null}
      {predicted !== undefined ? (
        <p
          className={`font-bold mb-3 ${
            predicted === actual ? "text-green-500" : "text-red-500"
          }`}
        >
          {actual !== undefined ? actual : "—"} / {predicted}
        </p>
      ) : null}
      <SimpleLineChart
        numbers={allNumbers}
        globalMax={globalMax}
        globalMin={globalMin}
      />
    </div>
  );
}

function FinalPage(props: { game: Game }) {
  const { game } = props;
  const [currentTime, setCurrentTime] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  function getPlayerWithMostPoints(game: Game): string {
    if (!game.state.playerStates.length) {
      return "No players in the game";
    }

    let maxPoints = -Infinity;
    let playerWithMostPoints = "";

    for (const playerState of game.state.playerStates) {
      const points = currentPoints(
        playerState.points.predicted,
        playerState.points.actual,
      );
      if (points > maxPoints) {
        maxPoints = points;
        playerWithMostPoints = playerState.player.name;
      }
    }

    return playerWithMostPoints;
  }

  function formatPlayTime(startTime: number, currentTime: number): string {
    const elapsedMs = currentTime - startTime;
    const totalMinutes = Math.floor(elapsedMs / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}min`;
    }
    return `${minutes}min`;
  }

  const scores = game.state.playerStates.map((playerState) => {
    return currentPoints(
      playerState.points.predicted,
      playerState.points.actual,
    );
  });

  const winner = game.state.playerStates.find(
    (ps) => ps.player.name === getPlayerWithMostPoints(game),
  );

  return (
    <div className="w-full mt-20 p-5 md:p-8 flex flex-col items-center gap-10">
      <div className="flex flex-col items-center gap-5">
        {winner && (
          <span className="text-6xl md:text-8xl leading-none mt-5 animate-bounce">
            {winner.player.color}
          </span>
        )}
        <h1 className="text-3xl md:text-5xl text-center font-normal text-green-500 m-0">
          {getPlayerWithMostPoints(game)} hat gewonnen!
        </h1>
        <p className="text-lg md:text-xl text-neutral-400 m-0 text-center">
          Spielzeit: {formatPlayTime(game.state.startTime, currentTime)}
        </p>
      </div>

      <div className="flex flex-col items-center gap-10 w-full max-w-3xl">
        <div className="flex flex-col gap-4 w-full max-w-lg">
          {game.state.playerStates
            .map((ps, idx) => ({ ps, score: scores[idx] }))
            .sort((a, b) => b.score - a.score)
            .map(({ ps, score }, index) => (
              <div
                key={ps.player.name}
                className={`flex justify-between items-center p-4 md:p-5 bg-neutral-900 border rounded-xl transition-all duration-200 hover:translate-x-1 hover:border-neutral-700 ${
                  index === 0
                    ? "border-green-500 bg-green-500/10"
                    : "border-neutral-800"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl md:text-3xl leading-none">
                    {ps.player.color}
                  </span>
                  <span className="text-lg md:text-xl font-medium text-white">
                    {ps.player.name}
                  </span>
                </div>
                <span className="text-xl md:text-2xl font-bold text-green-500">
                  {score} pkt
                </span>
              </div>
            ))}
        </div>
        <img
          src="/IwAZ6dvvvaTtdI8SD5.webp"
          alt="Celebration"
          width={500}
          height={400}
          className="rounded-lg shadow-xl w-full md:w-auto"
        />
      </div>
    </div>
  );
}

export default function DisplayGamePage() {
  const { gameCode } = useParams();
  const { game } = useSocket(gameCode);

  useDocumentTitle("Display");

  if (!game) {
    return (
      <div className="flex justify-center items-center min-h-[50vh] text-lg text-neutral-400">
        <p>Lade Spieldaten...</p>
      </div>
    );
  }

  // Sort players alphabetically for consistent display order
  const sortedPlayerStates = [...game.state.playerStates].sort((a, b) =>
    a.player.name.localeCompare(b.player.name),
  );

  // Calculate global min and max
  const numbers = sortedPlayerStates.map((playerState) =>
    lineChartPointsValues(playerState, game.state.currentRound),
  );
  const allNumbers = numbers.flat();
  const globalMin = Math.min(...allNumbers);
  const globalMax = Math.max(...allNumbers);

  // Calculate rankings based on current points
  const playersWithScores = sortedPlayerStates.map((playerState) => ({
    playerState,
    score: currentPoints(
      playerState.points.predicted,
      playerState.points.actual,
    ),
  }));

  // Sort by score descending to get rankings
  const rankedPlayers = [...playersWithScores].sort(
    (a, b) => b.score - a.score,
  );

  // Create rank map
  const rankMap = new Map<string, number>();
  rankedPlayers.forEach((player, index) => {
    rankMap.set(player.playerState.player.name, index + 1);
  });

  if (game.state.running) {
    return (
      <div className="w-full p-10">
        <RoundInfo game={game} />
        <div className="flex gap-5 mt-12 md:mt-16 flex-wrap md:flex-nowrap">
          {sortedPlayerStates.map((playerState, idx) => (
            <StatsBlock
              playerState={playerState}
              key={playerState.player.name}
              currentRound={game.state.currentRound}
              globalMin={globalMin}
              globalMax={globalMax}
              allNumbers={numbers[idx]}
              rank={rankMap.get(playerState.player.name)}
            />
          ))}
        </div>
      </div>
    );
  } else {
    return <FinalPage game={game} />;
  }
}
