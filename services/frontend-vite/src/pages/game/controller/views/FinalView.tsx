import type { Game } from "@/api/entities";
import { currentPoints } from "@/api/utils";

export default function FinalView(props: {
  game: Game;
  updateGame: (game: Game) => void;
}) {
  const { game } = props;

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

  return (
    <div>
      <h1>Du hast gewonnen {getPlayerWithMostPoints(game)}</h1>
    </div>
  );
}
