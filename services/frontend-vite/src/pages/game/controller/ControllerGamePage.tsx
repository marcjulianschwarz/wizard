import { type CardColor } from "@/api/entities";
import { useSocket } from "@/api/hooks";
import { useState } from "react";
import RoundInfo from "@/components/RoundInfo/RoundInfo";
import { useParams } from "react-router";
import TrumpCardSelectionView from "./views/TrumpCardSelectionView";
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
  const [selectedTrump, setSelectedTrump] = useState("");
  const [selectedConstraint, setSelectedConstraint] = useState("");

  function handleColorClick(color: string, card: string) {
    if (!game) return;

    if (card === "trump") {
      const updatedGame = {
        ...game,
        state: {
          ...game.state,
          currentTrumpCardColor: color as CardColor,
        },
      };
      setSelectedTrump(color + card);
      updateGame(updatedGame);
    }

    if (card === "constraint") {
      const updatedGame = {
        ...game,
        state: {
          ...game.state,
          currentConditionCardColor: color as CardColor,
        },
      };
      setSelectedConstraint(color + card);
      updateGame(updatedGame);
    }
  }

  function handleNextPage() {
    if (currentPage < pages.length - 1) {
      setCurrentPage((currentPage) => currentPage + 1);
    }
  }

  function handleRoundDonePage() {
    if (!game) return;
    const updatedGame = {
      ...game,
      state: {
        ...game.state,
        currentRound: game.state.currentRound + 1,
      },
    };
    updateGame(updatedGame);
    setCurrentPage(0);
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
    setCurrentPage(3);
  }

  if (!game) {
    return <p>Lade Spieldaten...</p>;
  }

  const maxRounds = 60 / game.state.playerStates.length;

  const pages = [
    <TrumpCardSelectionView
      key="trump"
      handleColorClick={handleColorClick}
      selectedTrump={selectedTrump}
      selectedConstraint={selectedConstraint}
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
    <FinalView key="final" game={game} updateGame={updateGame} />,
  ];

  return (
    <div>
      <RoundInfo game={game} showGameCode={true} showDashboardLink={true} />
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
