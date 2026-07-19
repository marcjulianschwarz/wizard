import { forwardRef } from "react";
import type { Game } from "@/api/entities";
import { currentPoints, lineChartPointsValues } from "@/api/utils";
import SimpleLineChart from "@/components/SimpleLineChart/SimpleLineChart";

// Fixed 16:9 canvas rendered off-screen and screenshotted for export. It shows
// the winners + leaderboard on the left and the points charts on the right,
// mirroring the display's charts view but without any animations or timers.
const EXPORT_WIDTH = 1920;
const EXPORT_HEIGHT = 1080;

// gold / silver / bronze card + matching line color per rank; else neutral.
const RANK_CARD: Record<number, string> = {
  1: "border-yellow-500 bg-gradient-to-br from-yellow-500/15 to-neutral-900",
  2: "border-gray-400 bg-gradient-to-br from-gray-400/10 to-neutral-900",
  3: "border-amber-700 bg-gradient-to-br from-amber-700/10 to-neutral-900",
};

const RANK_LINE: Record<number, string> = {
  1: "#eab308",
  2: "#9ca3af",
  3: "#b45309",
};

const DEFAULT_LINE = "#8884d8";

const placeMedal = (idx: number) => ["🥇", "🥈", "🥉"][idx] ?? `${idx + 1}.`;

const FinalExport = forwardRef<HTMLDivElement, { game: Game }>(
  function FinalExport({ game }, ref) {
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

    const allChartNumbers = ranked.flatMap(({ ps }) =>
      lineChartPointsValues(ps, game.state.currentRound),
    );
    const chartMin = allChartNumbers.length ? Math.min(...allChartNumbers) : 0;
    const chartMax = allChartNumbers.length ? Math.max(...allChartNumbers) : 0;

    const rankForIndex = (idx: number) =>
      ranked.filter((r) => r.score > ranked[idx].score).length + 1;

    // Size charts so all rows fit the fixed canvas height without scrolling.
    // Per card, everything above the chart (avatar + points + padding) plus the
    // gap between rows eats into the height budget.
    const chartRows = Math.ceil(ranked.length / 2);
    const CARD_CHROME = 150; // avatar row + points row + card padding
    const ROW_GAP = 16;
    const CANVAS_PADDING = 128; // p-16 top + bottom
    const budget =
      EXPORT_HEIGHT - CANVAS_PADDING - (chartRows - 1) * ROW_GAP;
    const chartHeight = Math.max(
      120,
      Math.min(280, Math.floor(budget / chartRows) - CARD_CHROME),
    );

    return (
      <div
        ref={ref}
        style={{ width: EXPORT_WIDTH, height: EXPORT_HEIGHT }}
        className="flex items-stretch justify-center gap-24 bg-black p-16 text-white"
      >
        {/* Left: winners + leaderboard */}
        <div className="flex w-1/2 max-w-2xl flex-col justify-center gap-8">
          <div className="flex flex-col items-center gap-5">
            {winners.length > 0 && (
              <div className="flex gap-4">
                {winners.map((w) => (
                  <span key={w.player.name} className="text-8xl leading-none">
                    {w.player.color}
                  </span>
                ))}
              </div>
            )}
            <h1 className="text-shimmer m-0 py-1 text-center text-6xl font-black leading-normal tracking-tight">
              {winnerTitle}
            </h1>
          </div>

          <div className="flex w-full flex-col gap-4">
            {ranked.map(({ ps, score }, idx) => (
              <div
                key={ps.player.name}
                className={`flex items-center justify-between rounded-xl border p-5 ${
                  score === topScore
                    ? "border-green-500 bg-gradient-to-r from-green-500/15 to-neutral-900"
                    : "border-neutral-800 bg-neutral-900"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="w-8 text-center text-2xl leading-none tabular-nums text-neutral-400">
                    {placeMedal(idx)}
                  </span>
                  <span className="text-3xl leading-none">{ps.player.color}</span>
                  <span className="text-xl font-medium text-white">
                    {ps.player.name}
                  </span>
                </div>
                <span
                  className={`text-2xl font-bold tabular-nums ${
                    score === topScore ? "text-green-400" : "text-neutral-200"
                  }`}
                >
                  {score} pkt
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: points charts */}
        <div className="grid w-1/2 max-w-4xl grid-cols-2 content-center gap-4 self-center">
          {ranked.map(({ ps, score }, idx) => {
            const rank = rankForIndex(idx);
            const color = RANK_LINE[rank] ?? DEFAULT_LINE;
            return (
              <div
                key={ps.player.name}
                className={`relative overflow-hidden rounded-xl border-2 p-4 ${
                  RANK_CARD[rank] ??
                  "border-neutral-800 bg-neutral-900"
                }`}
              >
                <span className="pointer-events-none absolute right-4 top-2 select-none text-7xl font-black leading-none text-white/5">
                  {rank}
                </span>
                <div className="relative z-10 mb-3 flex items-center gap-3">
                  <span className="text-4xl leading-none">{ps.player.color}</span>
                  <p className="m-0 truncate text-xl font-semibold text-white">
                    {ps.player.name}
                  </p>
                </div>
                <div className="relative z-10 mb-2 flex items-baseline gap-1">
                  <span className="text-5xl font-black tabular-nums tracking-tight text-white">
                    {score}
                  </span>
                  <span className="text-sm uppercase tracking-wider text-neutral-400">
                    pkt
                  </span>
                </div>
                <SimpleLineChart
                  numbers={lineChartPointsValues(ps, game.state.currentRound)}
                  globalMin={chartMin}
                  globalMax={chartMax}
                  color={color}
                  height={chartHeight}
                />
              </div>
            );
          })}
        </div>
      </div>
    );
  },
);

export default FinalExport;
