import { useEffect, useState } from "react";
import { Clock, ExternalLink, MoreHorizontal } from "lucide-react";
import { type Game } from "@/api/entities";
import { getTimeDifference } from "@/api/utils";

// The dense single-row header for the mobile full-screen controller: round
// progress, live playtime, the join code (tap to copy), a dashboard-open button,
// and a "More" trigger for the secondary controls sheet. Desktop uses the taller
// ControllerRoundInfo instead — this is only mounted below `md`.
export default function CompactControllerHeader(props: {
  game: Game;
  onOpenMore: () => void;
}) {
  const { game, onOpenMore } = props;
  const [now, setNow] = useState(() => Date.now());
  const [copied, setCopied] = useState(false);
  const maxRounds = 60 / game.state.playerStates.length;

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const copyCode = async () => {
    if (!("clipboard" in navigator)) return;
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/game/display/${game.joinCode}`,
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error("Failed to copy: ", err);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* Round progress */}
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold leading-none tabular-nums text-white">
          {game.state.currentRound}
        </span>
        <span className="text-sm font-medium leading-none text-neutral-500">
          / {maxRounds}
        </span>
      </div>

      {/* Playtime */}
      <div className="flex items-center gap-1 text-neutral-400">
        <Clock size={13} strokeWidth={2} />
        <span className="text-sm font-medium tabular-nums text-white">
          {getTimeDifference(game.state.startTime, now).minutes}
        </span>
      </div>

      <div className="ml-auto flex items-center gap-1.5">
        {/* Join code (tap to copy) */}
        <button
          onClick={copyCode}
          aria-label="Code kopieren"
          className="rounded-lg border border-neutral-800 bg-neutral-900 px-2.5 py-1.5 font-mono text-sm font-bold tracking-wide text-blue-400 active:bg-neutral-800"
        >
          {copied ? "✓" : game.joinCode}
        </button>

        {/* Open dashboard */}
        <button
          onClick={() => window.open(`/game/display/${game.joinCode}`, "_blank")}
          aria-label="Dashboard öffnen"
          className="rounded-lg border border-blue-500/40 bg-blue-500/20 p-2 text-blue-400 active:bg-blue-500/40"
        >
          <ExternalLink size={16} />
        </button>

        {/* Secondary controls sheet */}
        <button
          onClick={onOpenMore}
          aria-label="Mehr"
          className="rounded-lg border border-neutral-800 bg-neutral-900 p-2 text-neutral-300 active:bg-neutral-800"
        >
          <MoreHorizontal size={16} />
        </button>
      </div>
    </div>
  );
}
