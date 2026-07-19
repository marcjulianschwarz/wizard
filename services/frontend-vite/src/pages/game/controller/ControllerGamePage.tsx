import { type CardColor } from "@/api/entities";
import { useSocket } from "@/api/hooks";
import { useState } from "react";
import ControllerRoundInfo from "@/components/RoundInfo/ControllerRoundInfo";
import { useParams } from "react-router";
import PlayerOrderingView from "./views/PlayerOrderingView";
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

  function setTrumpColor(color: CardColor) {
    if (!game) return;
    updateGame({
      ...game,
      state: { ...game.state, currentTrumpCardColor: color },
    });
  }

  function setConditionColor(color: CardColor) {
    if (!game) return;
    updateGame({
      ...game,
      state: { ...game.state, currentConditionCardColor: color },
    });
  }

  function handleNextPage() {
    if (currentPage < pages.length - 1) {
      setCurrentPage((currentPage) => currentPage + 1);
    }
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
      },
    };
    updateGame(updatedGame);
    setCurrentPage(1); // Skip player ordering view for subsequent rounds
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
    <div>
      <ControllerRoundInfo
        game={game}
        onSelectTrump={setTrumpColor}
        onSelectCondition={setConditionColor}
      />
      <div className="flex flex-col justify-center p-10">
        <div>{pages[currentPage]}</div>

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
