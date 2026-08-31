import type { ReactNode } from "react";
import type { PlayerStats } from "@/api/utils";

// One headline stat: a big value over a small label, colour-toned per metric.
function StatTile({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "green" | "red" | "blue" | "neutral";
}) {
  const color =
    tone === "green"
      ? "text-green-400"
      : tone === "red"
        ? "text-red-400"
        : tone === "blue"
          ? "text-blue-300"
          : "text-neutral-200";
  return (
    <div className="flex flex-col items-center justify-center rounded-lg bg-white/5 px-2 py-2 text-center">
      <span className={`text-2xl md:text-3xl font-black tabular-nums leading-none ${color}`}>
        {value}
      </span>
      <span className="mt-1 text-[10px] md:text-xs font-medium uppercase tracking-wider text-neutral-500">
        {label}
      </span>
    </div>
  );
}

// A tiny per-round bar chart: one bar per played round, green up for a gain,
// red down for a loss, drawn from a shared middle baseline. Bars share a scale
// (the largest absolute delta) so heights are comparable within the card.
function DeltaBars({ perRound }: { perRound: PlayerStats["perRound"] }) {
  if (perRound.length === 0) return null;
  const maxAbs = Math.max(1, ...perRound.map((r) => Math.abs(r.delta)));
  return (
    <div className="flex h-16 items-stretch gap-[3px]">
      {perRound.map((r) => {
        const frac = Math.abs(r.delta) / maxAbs; // 0..1 of the half-height
        const gained = r.delta >= 0;
        return (
          <div
            key={r.round}
            className="flex flex-1 flex-col justify-center"
            title={`Runde ${r.round}: ${r.delta >= 0 ? "+" : ""}${r.delta}`}
          >
            {/* Top half: gains grow upward from the middle. */}
            <div className="flex flex-1 flex-col justify-end">
              {gained && (
                <div
                  className="rounded-sm bg-green-500/80"
                  style={{ height: `${frac * 100}%` }}
                />
              )}
            </div>
            {/* Bottom half: losses grow downward from the middle. */}
            <div className="flex flex-1 flex-col justify-start">
              {!gained && (
                <div
                  className="rounded-sm bg-red-500/80"
                  style={{ height: `${frac * 100}%` }}
                />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// The back side of a player card: their aggregate stats over the game so far.
// `chart` is the same points line chart shown on the front, placed between the
// metrics and the per-round bars so the two round views line up visually.
export default function PlayerStatsCard({
  stats,
  chart,
}: {
  stats: PlayerStats;
  chart?: ReactNode;
}) {
  const accuracyPct = Math.round(stats.accuracy * 100);
  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="grid grid-cols-2 gap-2">
        <StatTile
          label="⌀ pro Runde"
          value={`${stats.averagePerRound >= 0 ? "+" : ""}${stats.averagePerRound}`}
          tone={stats.averagePerRound >= 0 ? "green" : "red"}
        />
        <StatTile
          label="Treffer"
          value={`${accuracyPct}%`}
          tone="blue"
        />
        <StatTile
          label="Bestes"
          value={stats.maxWon > 0 ? `+${stats.maxWon}` : "—"}
          tone="green"
        />
        <StatTile
          label="Schlechtestes"
          value={stats.maxLost < 0 ? `${stats.maxLost}` : "—"}
          tone="red"
        />
      </div>

      {/* Points progression, same as the front — sits between the metrics and
          the per-round bars so both round views share the same x-order. It owns
          the remaining vertical space (the chart sizes to its parent), while the
          metrics and per-round bars keep their intrinsic height. */}
      {chart && (
        <div className="min-h-0 flex-1 overflow-hidden">{chart}</div>
      )}

      <div className={`shrink-0 ${chart ? "" : "mt-auto"}`}>
        <div className="mb-1 flex items-center justify-between text-[10px] md:text-xs uppercase tracking-wider text-neutral-500">
          <span>Rundenverlauf</span>
          <span className="tabular-nums">
            {stats.correctRounds}/{stats.roundsPlayed} richtig
          </span>
        </div>
        <DeltaBars perRound={stats.perRound} />
      </div>
    </div>
  );
}
