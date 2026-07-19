import type { Game, PlayerState } from "@/api/entities";
import { useSocket } from "@/api/hooks";
import RoundInfo from "@/components/RoundInfo/RoundInfo";
import { currentPoints, lineChartPointsValues } from "@/api/utils";
import SimpleLineChart from "@/components/SimpleLineChart/SimpleLineChart";
import { useParams } from "react-router";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useState, useEffect } from "react";

// Visual treatment per rank. `chart` is a hex color handed to the line chart.
const RANK_STYLE: Record<number, { card: string; chart: string }> = {
  1: {
    card: "border-yellow-500 bg-gradient-to-br from-yellow-500/15 to-neutral-900 shadow-[0_0_40px_-3px_rgba(234,179,8,0.55)] ring-1 ring-yellow-500/40",
    chart: "#eab308",
  },
  2: {
    card: "border-gray-400 bg-gradient-to-br from-gray-400/10 to-neutral-900",
    chart: "#9ca3af",
  },
  3: {
    card: "border-amber-700 bg-gradient-to-br from-amber-700/10 to-neutral-900",
    chart: "#b45309",
  },
};

const DEFAULT_RANK_STYLE = {
  card: "border-neutral-800 bg-neutral-900 hover:border-neutral-700",
  chart: "#8884d8",
};

function StatsBlock(props: {
  playerState: PlayerState;
  currentRound: number;
  globalMin: number;
  globalMax: number;
  allNumbers: number[];
  rank?: number;
  isNext?: boolean;
}) {
  const {
    playerState,
    currentRound,
    allNumbers,
    globalMax,
    globalMin,
    rank,
    isNext,
  } = props;

  const style = (rank && RANK_STYLE[rank]) || DEFAULT_RANK_STYLE;

  const predicted = playerState.points.predicted[currentRound - 1];
  const actual = playerState.points.actual[currentRound - 1];

  const points = currentPoints(
    playerState.points.predicted,
    playerState.points.actual,
  );

  return (
    <div
      className={`relative overflow-hidden grow p-4 border-2 rounded-xl transition-transform duration-200 hover:-translate-y-1 ${style.card} ${
        isNext ? "ring-4 ring-blue-500 shadow-[0_0_35px_-3px_rgba(59,130,246,0.6)]" : ""
      }`}
    >
      {/* Oversized rank number watermark */}
      {rank ? (
        <span className="pointer-events-none select-none absolute top-2 right-4 text-7xl font-black text-white/5 leading-none">
          {rank}
        </span>
      ) : null}

      <div className="relative z-10 flex items-center gap-3 mb-3">
        <span className="text-3xl md:text-4xl leading-none">
          {playerState.player.color}
        </span>
        <p className="text-lg md:text-xl font-semibold text-white m-0 truncate">
          {playerState.player.name}
        </p>
        {isNext ? (
          <span className="ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold uppercase tracking-wider whitespace-nowrap">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            am Zug
          </span>
        ) : null}
      </div>
      {points !== null && points !== undefined ? (
        <div className="relative z-10 mb-2 flex items-baseline gap-1">
          <span className="text-4xl md:text-5xl font-black text-white tabular-nums tracking-tight">
            {points}
          </span>
          <span className="text-sm text-neutral-400 uppercase tracking-wider">
            pkt
          </span>
        </div>
      ) : null}
      {/* While there's a value for this round, show the big number instead of
          the chart; otherwise show the points progression chart. */}
      {predicted !== undefined ? (
        <div className="flex items-center justify-center h-[300px]">
          <span
            className={`text-6xl md:text-7xl font-black tabular-nums tracking-tight ${
              predicted === actual ? "text-green-400" : "text-red-400"
            }`}
          >
            {actual !== undefined ? actual : "—"} / {predicted}
          </span>
        </div>
      ) : (
        <SimpleLineChart
          numbers={allNumbers}
          globalMax={globalMax}
          globalMin={globalMin}
          color={style.chart}
        />
      )}
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

  const ranked = game.state.playerStates
    .map((ps) => ({
      ps,
      score: currentPoints(ps.points.predicted, ps.points.actual),
    }))
    .sort((a, b) => b.score - a.score);

  const topScore = ranked.length ? ranked[0].score : -Infinity;
  const winners = ranked.filter((r) => r.score === topScore).map((r) => r.ps);
  const isTie = winners.length > 1;

  const winnerTitle = !ranked.length
    ? "No players in the game"
    : isTie
      ? `${winners.map((w) => w.player.name).join(" & ")} haben gewonnen!`
      : `${winners[0].player.name} hat gewonnen!`;

  const placeMedal = (idx: number) =>
    ["🥇", "🥈", "🥉"][idx] ?? `${idx + 1}.`;

  return (
    <div className="w-full mt-20 p-5 md:p-8 flex flex-col items-center gap-10">
      <div className="relative flex flex-col items-center gap-5">
        {/* Soft glow behind the winners */}
        <div className="pointer-events-none absolute -top-10 h-64 w-64 rounded-full bg-green-500/20 blur-3xl" />
        {winners.length > 0 && (
          <div className="relative flex gap-4">
            {winners.map((w) => (
              <span
                key={w.player.name}
                className="text-6xl md:text-8xl leading-none mt-5 animate-bounce drop-shadow-[0_0_25px_rgba(34,197,94,0.6)]"
              >
                {w.player.color}
              </span>
            ))}
          </div>
        )}
        <h1 className="relative text-4xl md:text-6xl text-center font-black tracking-tight text-shimmer m-0">
          {winnerTitle}
        </h1>
        <p className="text-lg md:text-xl text-neutral-400 m-0 text-center">
          Spielzeit: {formatPlayTime(game.state.startTime, currentTime)}
        </p>
      </div>

      <div className="flex flex-col items-center gap-10 w-full max-w-3xl">
        <div className="flex flex-col gap-4 w-full max-w-lg">
          {ranked.map(({ ps, score }, idx) => (
              <div
                key={ps.player.name}
                className={`flex justify-between items-center p-4 md:p-5 border rounded-xl transition-all duration-200 hover:translate-x-1 ${
                  score === topScore
                    ? "border-green-500 bg-gradient-to-r from-green-500/15 to-neutral-900 shadow-[0_0_25px_-8px_rgba(34,197,94,0.6)]"
                    : "border-neutral-800 bg-neutral-900 hover:border-neutral-700"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl md:text-2xl w-8 text-center leading-none tabular-nums text-neutral-400">
                    {placeMedal(idx)}
                  </span>
                  <span className="text-2xl md:text-3xl leading-none">
                    {ps.player.color}
                  </span>
                  <span className="text-lg md:text-xl font-medium text-white">
                    {ps.player.name}
                  </span>
                </div>
                <span
                  className={`text-xl md:text-2xl font-bold tabular-nums ${
                    score === topScore ? "text-green-400" : "text-neutral-200"
                  }`}
                >
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

  // Rank players by current points (leader first); break ties by name for a
  // stable display order.
  const rankedPlayers = game.state.playerStates
    .map((playerState) => ({
      playerState,
      score: currentPoints(
        playerState.points.predicted,
        playerState.points.actual,
      ),
    }))
    .sort(
      (a, b) =>
        b.score - a.score ||
        a.playerState.player.name.localeCompare(b.playerState.player.name),
    );

  // Global min and max across all line charts so they share one scale.
  const numbers = rankedPlayers.map(({ playerState }) =>
    lineChartPointsValues(playerState, game.state.currentRound),
  );
  const allNumbers = numbers.flat();
  const globalMin = Math.min(...allNumbers);
  const globalMax = Math.max(...allNumbers);

  // Standard competition ranking: equal scores share a rank (e.g. 1, 1, 3).
  const ranks = rankedPlayers.map((player, idx) =>
    idx > 0 && player.score === rankedPlayers[idx - 1].score
      ? -1 // placeholder, replaced below
      : idx + 1,
  );
  ranks.forEach((rank, idx) => {
    if (rank === -1) ranks[idx] = ranks[idx - 1];
  });

  // The controller predicts hits in playerStates order and saves each one
  // immediately, so the next player up is the first one (in that order) who
  // has no prediction for the current round yet.
  const nextToPredict = game.state.playerStates.find(
    (ps) => ps.points.predicted[game.state.currentRound - 1] === undefined,
  );

  if (game.state.running) {
    return (
      <div className="w-full p-10">
        <RoundInfo game={game} />
        <div className="grid gap-5 mt-12 md:mt-16 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {rankedPlayers.map(({ playerState }, idx) => (
            <StatsBlock
              playerState={playerState}
              key={playerState.player.name}
              currentRound={game.state.currentRound}
              globalMin={globalMin}
              globalMax={globalMax}
              allNumbers={numbers[idx]}
              rank={ranks[idx]}
              isNext={playerState.player.name === nextToPredict?.player.name}
            />
          ))}
        </div>
      </div>
    );
  } else {
    return <FinalPage game={game} />;
  }
}
