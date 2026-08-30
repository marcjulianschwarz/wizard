import { useRef, useState } from "react";
import { toPng } from "html-to-image";
import { Link } from "react-router";
import type { Game } from "@/api/entities";
import { currentPoints } from "@/api/utils";
import Button from "@/components/Button/Button";
import FinalExport from "./FinalExport";
import CorrectionPanel from "./CorrectionPanel";

export default function FinalView(props: {
  game: Game;
  updateGame: (game: Game) => void;
}) {
  const { game, updateGame } = props;
  const exportRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

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

  const showCharts = game.state.showCharts ?? false;

  function setShowCharts(showCharts: boolean) {
    updateGame({
      ...game,
      state: { ...game.state, showCharts },
    });
  }

  async function handleExport() {
    if (!exportRef.current) return;
    setIsExporting(true);
    try {
      // Render at native 1920x1080 regardless of the on-screen scale.
      const dataUrl = await toPng(exportRef.current, {
        pixelRatio: 1,
        width: 1920,
        height: 1080,
        cacheBust: true,
      });
      const link = document.createElement("a");
      link.download = `wizard-${game.joinCode}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <h1>Du hast gewonnen {getPlayerWithMostPoints(game)}</h1>
      <div className="flex gap-3">
        <Button
          className={showCharts ? "bg-neutral-700" : "bg-green-600"}
          onClick={() => setShowCharts(false)}
        >
          Feier
        </Button>
        <Button
          className={showCharts ? "bg-green-600" : "bg-neutral-700"}
          onClick={() => setShowCharts(true)}
        >
          Charts
        </Button>
        <Button
          className="bg-blue-600"
          onClick={handleExport}
          disabled={isExporting}
        >
          {isExporting ? "Exportiere…" : "Export"}
        </Button>
        {game.leagueId && (
          <Link to={`/league/${game.leagueId}`}>
            <Button className="border border-[#A2BD53] bg-[#A2BD53] text-black">
              Zur Liga
            </Button>
          </Link>
        )}
      </div>

      <CorrectionPanel game={game} updateGame={updateGame} />

      {/* Off-screen 16:9 canvas used purely as the screenshot source. Shifted
          out of view (not hidden) so recharts can measure and render. */}
      <div
        aria-hidden
        className="fixed top-0 pointer-events-none"
        style={{ left: -99999 }}
      >
        <FinalExport ref={exportRef} game={game} />
      </div>
    </div>
  );
}
