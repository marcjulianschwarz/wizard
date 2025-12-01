"use client";

import { CardColor, Game } from "@/app/api/entities";
import styles from "./page.module.css";
import { useSocket } from "@/app/api/hooks";
import { useState } from "react";
import RoundInfo from "@/app/components/RoundInfo/RoundInfo";
import { currentPoints } from "@/app/api/utils";
import CopyToClipboard from "@/app/components/CopyToClipboard/CopyToClipboard";

function TrumpCardSelection(props: {
  handleColorClick: (color: string, card: string) => void;
  selectedTrump: string;
  selectedConstraint: string;
}) {
  return (
    <div>
      <div className={styles.content}>
        <div className={styles.cards}>
          <div className={styles.card}>
            <p className={styles.title}>Trumpf</p>
            <div className={styles.colors}>
              <div
                className={`${styles.color} ${styles.green} ${
                  props.selectedTrump === "greentrump" ? styles.selected : ""
                }`}
                onClick={() => props.handleColorClick("green", "trump")}
              ></div>
              <div
                className={`${styles.color} ${styles.blue} ${
                  props.selectedTrump === "bluetrump" ? styles.selected : ""
                }`}
                onClick={() => props.handleColorClick("blue", "trump")}
              ></div>
              <div
                className={`${styles.color} ${styles.red} ${
                  props.selectedTrump === "redtrump" ? styles.selected : ""
                }`}
                onClick={() => props.handleColorClick("red", "trump")}
              ></div>
              <div
                className={`${styles.color} ${styles.yellow} ${
                  props.selectedTrump === "yellowtrump" ? styles.selected : ""
                }`}
                onClick={() => props.handleColorClick("yellow", "trump")}
              ></div>
            </div>
          </div>
          <div className={styles.card}>
            <p className={styles.title}>Bedienung</p>
            <div className={styles.colors}>
              <div
                className={`${styles.color} ${styles.green} ${
                  props.selectedConstraint === "greenconstraint"
                    ? styles.selected
                    : ""
                }`}
                onClick={() => props.handleColorClick("green", "constraint")}
              ></div>
              <div
                className={`${styles.color} ${styles.blue} ${
                  props.selectedConstraint === "blueconstraint"
                    ? styles.selected
                    : ""
                }`}
                onClick={() => props.handleColorClick("blue", "constraint")}
              ></div>
              <div
                className={`${styles.color} ${styles.red} ${
                  props.selectedConstraint === "redconstraint"
                    ? styles.selected
                    : ""
                }`}
                onClick={() => props.handleColorClick("red", "constraint")}
              ></div>
              <div
                className={`${styles.color} ${styles.yellow} ${
                  props.selectedConstraint === "yellowconstraint"
                    ? styles.selected
                    : ""
                }`}
                onClick={() => props.handleColorClick("yellow", "constraint")}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PredictedPage(props: {
  game: Game;
  updateGame: (game: Game) => void;
}) {
  const { game, updateGame } = props;

  return (
    <div>
      <h2>Vorhergesagte Stiche</h2>
      <br />
      <div className={styles.playersbox}>
        {game.state.playerStates.map((playerState) => (
          <div key={playerState.player.name} className={styles.playerbox}>
            <p>{playerState.player.name}</p>
            <input
              type="number"
              min="0"
              className={styles.input}
              placeholder="0"
              defaultValue={
                playerState.points.predicted[game.state.currentRound - 1] ?? ""
              }
              onChange={(e) => {
                const value = e.target.value ? parseInt(e.target.value) : 0;
                playerState.points.predicted[game.state.currentRound - 1] =
                  value;
                updateGame(game);
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function MadePage(props: { game: Game; updateGame: (game: Game) => void }) {
  const { game, updateGame } = props;

  return (
    <div>
      <h2>Gemachte Stiche</h2>
      <br />
      <div className={styles.playersbox}>
        {game.state.playerStates.map((playerState) => (
          <div key={playerState.player.name} className={styles.playerbox}>
            <p>{playerState.player.name}</p>
            <input
              type="number"
              min="0"
              className={styles.input}
              placeholder="0"
              defaultValue={
                playerState.points.actual[game.state.currentRound - 1] ?? ""
              }
              onChange={(e) => {
                const value = e.target.value ? parseInt(e.target.value) : 0;
                playerState.points.actual[game.state.currentRound - 1] = value;
                updateGame(game);
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function FinalPage(props: { game: Game; updateGame: (game: Game) => void }) {
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

export default function ClientMaster(props: { slug: string }) {
  const { game, updateGame } = useSocket(props.slug);

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

  function handlePreviousPage() {
    if (currentPage > 0) {
      setCurrentPage((currentPage) => currentPage - 1);
    }
  }

  function handleRoundDonePage() {
    if (!game) return;
    game.state.currentRound += 1;
    updateGame(game);
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
    game.state.running = false;
    updateGame(game);
    setCurrentPage(3);
  }

  if (!game) {
    return (
      <div className={styles.loading}>
        <p>Lade Spieldaten...</p>
      </div>
    );
  }

  const maxRounds = 60 / game.state.playerStates.length;

  const pages = [
    <TrumpCardSelection
      key="trump"
      handleColorClick={handleColorClick}
      selectedTrump={selectedTrump}
      selectedConstraint={selectedConstraint}
    />,
    <PredictedPage key="pred" game={game} updateGame={updateGame} />,
    <MadePage key="made" game={game} updateGame={updateGame} />,
    <FinalPage key="final" game={game} updateGame={updateGame} />,
  ];

  return (
    <div>
      <RoundInfo game={game} />
      <br />
      <div className={styles.joinCodeBox}>
        <div className={styles.codeInfo}>
          <label className={styles.joinCodeLabel}>Beitrittscode:</label>
          <span className={styles.codeValue}>{game.joinCode}</span>
        </div>
        <div className={styles.codeActions}>
          <CopyToClipboard text={game.joinCode} />
          <button
            onClick={() =>
              window.open(`/game/dashboard/${game.joinCode}`, "_blank")
            }
            className={styles.dashboardBtn}
          >
            Dashboard öffnen
          </button>
        </div>
      </div>
      <div className={styles.page}>
        <div className={styles.pagecontent}>
          {pages[currentPage]}
          <br />
          <br />
          <div className={styles.buttonbox}>
            {currentPage != 0 ? (
              <button className={styles.button} onClick={handlePreviousPage}>
                Zurück
              </button>
            ) : null}
            {currentPage != 2 ? (
              <button className={styles.button} onClick={handleNextPage}>
                Weiter
              </button>
            ) : null}
            {currentPage === 2 ? (
              <button className={styles.button} onClick={handleRoundDonePage}>
                Beende Runde
              </button>
            ) : null}
          </div>
          <br />
          {maxRounds === game.state.currentRound ? (
            <button className={styles.warning} onClick={handleFinale}>
              Spiel beenden
            </button>
          ) : (
            <button className={styles.warning} onClick={handleFinale}>
              Vorzeitig Spiel beenden
            </button>
          )}
        </div>
        <br />
      </div>
    </div>
  );
}
