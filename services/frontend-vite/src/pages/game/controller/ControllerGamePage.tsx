import { useSocket } from "@/api/hooks";
import { useState } from "react";
import ControllerRoundInfo from "@/components/RoundInfo/ControllerRoundInfo";
import { useParams } from "react-router";
import PlayerOrderingView from "./views/PlayerOrderingView";
import FortuneWheelView from "./views/FortuneWheelView";
import PredictedHitsView from "./views/PredictedHitsView";
import ActualHitsView from "./views/ActualHitsView";
import FinalView from "./views/FinalView";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import Button from "@/components/Button/Button";

export default function ControllerGamePage() {
  const { gameCode } = useParams();
  const { game, updateGame } = useSocket(gameCode);
  useDocumentTitle("Controller");

  const [currentPage, setCurrentPage] = useState(0);

  function handleNextPage() {
    if (currentPage < pages.length - 1) {
      setCurrentPage((currentPage) => currentPage + 1);
    }
  }

  function toggleTurnOverlay(kind: "predict" | "play") {
    if (!game) return;
    // Toggle off if this kind is already showing, otherwise show it.
    const next =
      game.state.turnOverlay?.kind === kind ? undefined : { kind };
    updateGame({
      ...game,
      state: { ...game.state, turnOverlay: next },
    });
  }

  function handleRoundDonePage() {
    if (!game) return;

    // Rotate player order for next round (move first player to end)
    const rotatedPlayerStates = [
      ...game.state.playerStates.slice(1),
      game.state.playerStates[0],
    ];

    const updatedGame = {
      ...game,
      state: {
        ...game.state,
        playerStates: rotatedPlayerStates,
        currentRound: game.state.currentRound + 1,
        // Tell the display to pop the round-points badges for the round just
        // finished (before the increment above).
        roundResultTrigger: game.state.currentRound,
      },
    };
    updateGame(updatedGame);
    // Skip player ordering + fortune wheel for subsequent rounds; jump straight
    // to the prediction view.
    setCurrentPage(2);
  }

  function handleFinale() {
    if (!game) return;
    const confirmed = window.confirm(
      maxRounds === game.state.currentRound
        ? "Möchtest du das Spiel jetzt beenden?"
        : "Möchtest du das Spiel wirklich vorzeitig beenden?",
    );
    if (!confirmed) return;
    const updatedGame = {
      ...game,
      state: {
        ...game.state,
        running: false,
      },
    };
    updateGame(updatedGame);
  }

  if (!game) {
    return <p>Lade Spieldaten...</p>;
  }

  const maxRounds = 60 / game.state.playerStates.length;

  // Once the game is over, drop the round UI entirely and show the final screen.
  if (!game.state.running) {
    return (
      <div className="flex flex-col justify-center p-10">
        <FinalView game={game} updateGame={updateGame} />
      </div>
    );
  }

  const pages = [
    <PlayerOrderingView
      key="order"
      game={game}
      updateGame={updateGame}
      onComplete={handleNextPage}
    />,
    <FortuneWheelView
      key="wheel"
      game={game}
      updateGame={updateGame}
      onComplete={handleNextPage}
    />,
    <PredictedHitsView
      key="pred"
      game={game}
      updateGame={updateGame}
      onComplete={handleNextPage}
    />,
    <ActualHitsView
      key="made"
      game={game}
      updateGame={updateGame}
      onComplete={handleRoundDonePage}
    />,
  ];

  return (
    <div className="w-full p-6">
      <ControllerRoundInfo game={game} />
      <div className="flex flex-col justify-center mt-8">
        <div>{pages[currentPage]}</div>

        <div className="flex flex-wrap gap-3 mt-8">
          <Button
            className={`w-fit ${
              game.state.turnOverlay?.kind === "predict"
                ? "bg-blue-500"
                : "bg-neutral-800"
            }`}
            onClick={() => toggleTurnOverlay("predict")}
          >
            Stiche angeben
          </Button>
          <Button
            className={`w-fit ${
              game.state.turnOverlay?.kind === "play"
                ? "bg-blue-500"
                : "bg-neutral-800"
            }`}
            onClick={() => toggleTurnOverlay("play")}
          >
            Am Zug
          </Button>
        </div>

        {maxRounds === game.state.currentRound ? (
          <Button className="bg-red-500 mt-12 w-fit" onClick={handleFinale}>
            Spiel beenden
          </Button>
        ) : (
          <Button className="bg-red-500 mt-12 w-fit" onClick={handleFinale}>
            Vorzeitig Spiel beenden
          </Button>
        )}
      </div>
    </div>
  );
}
