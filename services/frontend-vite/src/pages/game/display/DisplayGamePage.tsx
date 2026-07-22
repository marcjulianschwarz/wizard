import type { Game, PlayerState } from "@/api/entities";
import { useSocket } from "@/api/hooks";
import DisplayRoundInfo from "@/components/RoundInfo/DisplayRoundInfo";
import TurnOverlay from "@/components/TurnOverlay/TurnOverlay";
import FortuneWheel from "@/components/FortuneWheel/FortuneWheel";
import RoundPointsBadge from "@/components/RoundPointsBadge/RoundPointsBadge";
import {
  currentPoints,
  lineChartPointsValues,
  forbiddenLastPrediction,
  roundPoints,
} from "@/api/utils";
import SimpleLineChart from "@/components/SimpleLineChart/SimpleLineChart";
import { useParams } from "react-router";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "motion/react";
import confetti from "canvas-confetti";

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
  chartHeight?: number;
  // Round number the controller last confirmed done; pops the round-points
  // badge for that round.
  roundResultTrigger?: number;
  // "Darf nicht aufgehen": value this (last-to-predict) player may not choose,
  // and whether they are being warned or have actually picked it (blocked).
  forbiddenValue?: number | null;
  forbiddenState?: "warn" | "blocked" | null;
}) {
  const {
    playerState,
    currentRound,
    allNumbers,
    globalMax,
    globalMin,
    rank,
    chartHeight = 300,
    roundResultTrigger,
    forbiddenValue,
    forbiddenState,
  } = props;

  const isBlocked = forbiddenState === "blocked";
  const showForbidden =
    forbiddenState != null && forbiddenValue !== null && forbiddenValue !== undefined;

  const style = (rank && RANK_STYLE[rank]) || DEFAULT_RANK_STYLE;

  const predicted = playerState.points.predicted[currentRound - 1];
  const actual = playerState.points.actual[currentRound - 1];

  const points = currentPoints(
    playerState.points.predicted,
    playerState.points.actual,
  );

  return (
    <div
      className={`relative overflow-hidden grow p-4 border-2 rounded-xl transition-transform duration-200 hover:-translate-y-1 ${
        showForbidden
          ? isBlocked
            ? "border-red-500 shadow-[0_0_40px_-6px_rgba(239,68,68,0.7)]"
            : "border-orange-500 shadow-[0_0_40px_-6px_rgba(249,115,22,0.6)]"
          : style.card
      }`}
    >
      {/* Floating "+50 / -20" that pops when this player's round score lands. */}
      <RoundPointsBadge
        points={
          roundResultTrigger !== undefined
            ? roundPoints(playerState, roundResultTrigger)
            : null
        }
        trigger={roundResultTrigger}
      />

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
      {/* "Darf nicht aufgehen": orange warns, red = value was picked. Replaces
          the number/chart area so the player name, points and rank stay
          visible. */}
      {/* Reserve the number/chart area so the card keeps a stable height even
          when the number is absolutely centered over the whole card. */}
      {(showForbidden || predicted !== undefined) && (
        <div style={{ height: chartHeight }} aria-hidden />
      )}
      {showForbidden ? (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 pt-8 text-center pointer-events-none">
          <span
            className={`text-sm font-semibold uppercase tracking-wider ${
              isBlocked ? "text-red-400" : "text-orange-400"
            }`}
          >
            {isBlocked ? "Nicht erlaubt" : "Darf nicht"}
          </span>
          <span
            className={`text-7xl md:text-8xl font-black tabular-nums leading-none ${
              isBlocked ? "text-red-500" : "text-orange-500"
            }`}
          >
            {forbiddenValue}
          </span>
          <span
            className={`text-sm ${
              isBlocked ? "text-red-300/80" : "text-orange-300/80"
            }`}
          >
            ansagen
          </span>
        </div>
      ) : predicted !== undefined ? (
        // A value for this round exists: show the big number instead of chart.
        <div className="absolute inset-0 flex items-center justify-center pt-8 pointer-events-none">
          <span
            className={`text-6xl md:text-7xl font-black tabular-nums tracking-tight ${
              actual === undefined
                ? ""
                : predicted === actual
                  ? "text-green-400"
                  : "text-red-400"
            }`}
            style={actual === undefined ? { color: style.chart } : undefined}
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
          height={chartHeight}
        />
      )}
    </div>
  );
}

const CONFETTI_COLORS = [
  "#22c55e",
  "#a3e635",
  "#eab308",
  "#3b82f6",
  "#ec4899",
  "#f97316",
];

// Bursts confetti outward from the center of the given element (the winner's
// name / avatar) on mount, then keeps a gentle stream going.
function useConfetti(anchorRef: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const fire = () => {
      const el = anchorRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const origin = {
        x: (rect.left + rect.width / 2) / window.innerWidth,
        y: (rect.top + rect.height * 1.5) / window.innerHeight,
      };
      confetti({
        particleCount: 80,
        spread: 100,
        startVelocity: 35,
        origin,
        colors: CONFETTI_COLORS,
      });
    };

    fire();
    const interval = setInterval(fire, 2500);
    return () => clearInterval(interval);
  }, [anchorRef]);
}

function FinalPage(props: { game: Game }) {
  const { game } = props;
  const [currentTime, setCurrentTime] = useState(() => Date.now());
  const winnersRef = useRef<HTMLDivElement>(null);
  const showCharts = game.state.showCharts ?? false;

  useConfetti(winnersRef);

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

  // Shared scale so all opened charts line up.
  const allChartNumbers = ranked.flatMap(({ ps }) =>
    lineChartPointsValues(ps, game.state.currentRound),
  );
  const chartMin = allChartNumbers.length ? Math.min(...allChartNumbers) : 0;
  const chartMax = allChartNumbers.length ? Math.max(...allChartNumbers) : 0;

  // Rank for a position in `ranked` (already score-sorted), sharing a rank on
  // ties (e.g. 1, 1, 3).
  const rankForIndex = (idx: number) =>
    ranked.filter((r) => r.score > ranked[idx].score).length + 1;

  // The charts grid is 2 columns. Shrink each chart so all rows fit the
  // viewport without scrolling once we go past two rows (4 players).
  const chartRows = Math.ceil(ranked.length / 2);
  const CARD_CHROME = 130; // padding + name + points above the chart
  const availableChartArea = 0.85 * window.innerHeight - chartRows * CARD_CHROME;
  const finalChartHeight = Math.max(
    120,
    Math.min(300, Math.floor(availableChartArea / chartRows)),
  );

  return (
    <div className="w-full min-h-screen p-5 md:p-8 flex flex-col lg:flex-row items-center lg:items-stretch justify-center gap-8 lg:gap-40">
      {/* Left: winners + leaderboard */}
      <div className="flex flex-col items-center gap-8 w-full min-w-0 lg:w-1/2 lg:max-w-xl lg:justify-center">
        <div className="relative flex flex-col items-center gap-5">
          {/* Soft glow behind the winners */}
          <div className="pointer-events-none absolute -top-10 h-64 w-64 rounded-full bg-green-500/20 blur-3xl" />
          {winners.length > 0 && (
            <div ref={winnersRef} className="relative flex gap-4">
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
          <h1 className="relative text-4xl md:text-6xl leading-normal py-1 text-center font-black tracking-tight text-shimmer m-0">
            {winnerTitle}
          </h1>
          <p className="text-lg md:text-xl text-neutral-400 m-0 text-center">
            Spielzeit: {formatPlayTime(game.state.startTime, currentTime)}
          </p>
        </div>

        <div className="flex flex-col gap-4 w-full max-w-lg">
          {ranked.map(({ ps, score }, idx) => (
            <div
              key={ps.player.name}
              className={`flex justify-between items-center p-4 md:p-5 border rounded-xl ${
                score === topScore
                  ? "border-green-500 bg-gradient-to-r from-green-500/15 to-neutral-900 shadow-[0_0_25px_-8px_rgba(34,197,94,0.6)]"
                  : "border-neutral-800 bg-neutral-900"
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
      </div>

      {/* Right: celebration gif or points charts, toggled from the controller */}
      <div className="flex items-center justify-center w-full min-w-0 lg:w-1/2 lg:h-auto">
        {showCharts ? (
          <div className="grid gap-4 w-full max-w-4xl p-4 grid-cols-1 sm:grid-cols-2">
            {ranked.map(({ ps }, idx) => (
              <StatsBlock
                key={ps.player.name}
                playerState={ps}
                // Past the last round so no per-round number shows — the card
                // renders the points progression chart instead.
                currentRound={game.state.currentRound + 1}
                globalMin={chartMin}
                globalMax={chartMax}
                allNumbers={lineChartPointsValues(ps, game.state.currentRound)}
                rank={rankForIndex(idx)}
                chartHeight={finalChartHeight}
              />
            ))}
          </div>
        ) : (
          <img
            src="/IwAZ6dvvvaTtdI8SD5.webp"
            alt="Celebration"
            className="rounded-lg shadow-xl w-full max-w-2xl lg:max-w-full max-h-[85vh] object-contain"
          />
        )}
      </div>
    </div>
  );
}

export default function DisplayGamePage() {
  const { gameCode } = useParams();
  const { game, updateGame } = useSocket(gameCode);

  useDocumentTitle("Display");

  if (!game) {
    return (
      <div className="flex justify-center items-center min-h-[50vh] text-lg text-neutral-400">
        <p>Lade Spieldaten...</p>
      </div>
    );
  }

  // Keep the cards in their fixed initial order. The controller rotates the
  // playerStates array every round for turn order, so we sort by the stable
  // `player.order` stamped at the initial ordering (falls back to array order
  // for older games that predate that field).
  const orderedPlayers = game.state.playerStates
    .map((playerState, idx) => ({
      playerState,
      score: currentPoints(
        playerState.points.predicted,
        playerState.points.actual,
      ),
      order: playerState.player.order ?? idx,
    }))
    .sort((a, b) => a.order - b.order);

  // Global min and max across all line charts so they share one scale.
  const numbers = orderedPlayers.map(({ playerState }) =>
    lineChartPointsValues(playerState, game.state.currentRound),
  );
  const allNumbers = numbers.flat();
  const globalMin = Math.min(...allNumbers);
  const globalMax = Math.max(...allNumbers);

  // Rank badge reflects the current standing by score (equal scores share a
  // rank, e.g. 1, 1, 3), mapped back onto the fixed card order.
  const byScore = [...orderedPlayers].sort((a, b) => b.score - a.score);
  const rankByName = new Map<string, number>();
  byScore.forEach((player, idx) => {
    const rank =
      idx > 0 && player.score === byScore[idx - 1].score
        ? rankByName.get(byScore[idx - 1].playerState.player.name)!
        : idx + 1;
    rankByName.set(player.playerState.player.name, rank);
  });
  const ranks = orderedPlayers.map(
    ({ playerState }) => rankByName.get(playerState.player.name)!,
  );

  // playerStates is rotated once per round so index 0 is the round's starting
  // player. These stay fixed for the whole prediction phase and only change
  // when the round rotates: "Stiche angeben" starts, "am Zug" follows.
  const nextToPredict = game.state.playerStates[0];

  const overlay = game.state.turnOverlay;
  const roundResultTrigger = game.state.roundResultTrigger;

  // "Darf nicht aufgehen": once all earlier players predicted, the last player
  // has one forbidden value. Warn in orange until they pick; if they actually
  // enter that value, flip the card to a red "not allowed" state.
  const lastPredictor =
    game.state.playerStates[game.state.playerStates.length - 1];
  const forbiddenValue = forbiddenLastPrediction({
    game,
    predictionOrder: game.state.playerStates,
  });
  const lastPrediction =
    lastPredictor?.points.predicted[game.state.currentRound - 1];
  const forbiddenState: "warn" | "blocked" | null =
    forbiddenValue === null
      ? null
      : lastPrediction === forbiddenValue
        ? "blocked"
        : lastPrediction === undefined
          ? "warn"
          : null;

  const fortuneWheel = game.state.fortuneWheel;

  if (game.state.running) {
    return (
      <div className="w-full p-10">
        {/* Pre-round fortune wheel: full-screen focus while the controller spins
            to decide who predicts first. Mirrors the same spin via broadcast
            state (targetIndex / spinNonce). */}
        <AnimatePresence>
          {fortuneWheel && (
            <motion.div
              key="fortune-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-24 bg-neutral-950/95 backdrop-blur-sm"
            >
              <div className="text-center">
                <h1 className="text-shimmer m-0 text-5xl font-black tracking-tight md:text-6xl">
                  Glücksrad
                </h1>
                <p className="mt-3 text-xl text-neutral-400">
                  Wer beginnt die erste Runde?
                </p>
              </div>
              <FortuneWheel
                players={game.state.playerStates}
                size={Math.min(window.innerWidth * 0.65, window.innerHeight * 0.5, 520)}
                targetIndex={fortuneWheel.targetIndex}
                spinNonce={fortuneWheel.spinNonce}
                onSettled={(index) =>
                  // The dashboard owns the spin: once it lands, report back so
                  // the controller can reveal the result and enable "Übernehmen".
                  updateGame({
                    ...game,
                    state: {
                      ...game.state,
                      fortuneWheel: {
                        targetIndex: index,
                        spinNonce: fortuneWheel.spinNonce,
                        settled: true,
                      },
                    },
                  })
                }
              />
              <AnimatePresence>
                {fortuneWheel.settled && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.6, y: 12 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                    className="flex items-center gap-4 rounded-2xl border border-blue-500/50 bg-blue-500/10 px-8 py-5"
                  >
                    <span className="text-5xl leading-none">
                      {game.state.playerStates[fortuneWheel.targetIndex]?.player
                        .color}
                    </span>
                    <span className="text-3xl font-black text-blue-300 md:text-4xl">
                      {game.state.playerStates[fortuneWheel.targetIndex]?.player
                        .name}{" "}
                      beginnt!
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Full-screen turn announcement, toggled from the controller (via
            turnOverlay). Its `kind` selects which player is shown: "predict" =
            round starter ("gibt Stiche an"), "play" = second player who "ist am
            Zug". */}
        <TurnOverlay
          visible={overlay !== undefined}
          action={overlay?.kind === "play" ? "ist am Zug" : "gibt Stiche an"}
          player={
            overlay?.kind === "play"
              ? game.state.playerStates[1 % game.state.playerStates.length]
                  ?.player
              : nextToPredict?.player
          }
          accent={
            overlay?.kind === "play" ? "text-neutral-300" : "text-blue-300"
          }
        />

        <DisplayRoundInfo game={game} />
        <div
          className={`grid gap-5 mt-12 md:mt-16 grid-cols-1 sm:grid-cols-2 ${
            // From lg up, use as many columns as players (capped at 4) so the
            // cards always fill the width instead of leaving an empty gap.
            {
              1: "lg:grid-cols-1",
              2: "lg:grid-cols-2",
              3: "lg:grid-cols-3",
            }[orderedPlayers.length] ?? "lg:grid-cols-3 xl:grid-cols-4"
          }`}
        >
          {orderedPlayers.map(({ playerState }, idx) => (
            <StatsBlock
              playerState={playerState}
              key={playerState.player.name}
              currentRound={game.state.currentRound}
              globalMin={globalMin}
              globalMax={globalMax}
              allNumbers={numbers[idx]}
              rank={ranks[idx]}
              roundResultTrigger={roundResultTrigger}
              forbiddenValue={
                playerState.player.name === lastPredictor?.player.name
                  ? forbiddenValue
                  : null
              }
              forbiddenState={
                playerState.player.name === lastPredictor?.player.name
                  ? forbiddenState
                  : null
              }
            />
          ))}
        </div>
      </div>
    );
  } else {
    return <FinalPage game={game} />;
  }
}
