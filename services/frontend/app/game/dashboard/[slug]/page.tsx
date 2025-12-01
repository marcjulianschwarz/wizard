"use client";
import { Game, PlayerState } from "@/app/api/entities";
const SimpleLineChart = dynamic(
  () => import("../../../components/SimpleLineChart/SimpleLineChart"),
  { ssr: false },
);
import styles from "./page.module.css";
import { useSocket } from "@/app/api/hooks";
import RoundInfo from "@/app/components/RoundInfo/RoundInfo";
import dynamic from "next/dynamic";
import { currentPoints, lineChartPointsValues } from "@/app/api/utils";
import Image from "next/image";

function StatsBlock(props: {
  playerState: PlayerState;
  currentRound: number;
  globalMin: number;
  globalMax: number;
  allNumbers: number[];
}) {
  const { playerState, currentRound, allNumbers, globalMax, globalMin } = props;

  const predicted = playerState.points.predicted[currentRound - 1];
  const actual = playerState.points.actual[currentRound - 1];

  const points = currentPoints(
    playerState.points.predicted,
    playerState.points.actual,
  );

  return (
    <div className={styles.statsblock}>
      <div className={styles.playerHeader}>
        <span className={styles.playerEmoji}>{playerState.player.color}</span>
        <p className={styles.name}>{playerState.player.name}</p>
      </div>
      {points ? (
        <div>
          <span className={styles.points}>{points}</span>
          <span>pkt</span>
        </div>
      ) : null}
      {predicted ? (
        <p className={predicted === actual ? styles.green : styles.red}>
          {actual} / {predicted}
        </p>
      ) : null}
      <SimpleLineChart
        numbers={allNumbers}
        globalMax={globalMax}
        globalMin={globalMin}
      />
    </div>
  );
}

function FinalPage(props: { game: Game }) {
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

  const scores = game.state.playerStates.map((playerState) => {
    return currentPoints(
      playerState.points.predicted,
      playerState.points.actual,
    );
  });

  const winner = game.state.playerStates.find(
    (ps) => ps.player.name === getPlayerWithMostPoints(game),
  );

  return (
    <div className={styles.finalPage}>
      <div className={styles.winnerHeader}>
        {winner && (
          <span className={styles.winnerEmoji}>{winner.player.color}</span>
        )}
        <h1 className={styles.winnerTitle}>
          {getPlayerWithMostPoints(game)} hat gewonnen!
        </h1>
      </div>

      <div className={styles.finalContent}>
        <div className={styles.playerScores}>
          {game.state.playerStates
            .map((ps, idx) => ({ ps, score: scores[idx] }))
            .sort((a, b) => b.score - a.score)
            .map(({ ps, score }) => (
              <div key={ps.player.name} className={styles.scoreRow}>
                <div className={styles.scorePlayer}>
                  <span className={styles.scoreEmoji}>{ps.player.color}</span>
                  <span className={styles.scoreName}>{ps.player.name}</span>
                </div>
                <span className={styles.scorePoints}>{score} pkt</span>
              </div>
            ))}
        </div>
        <Image
          src="/IwAZ6dvvvaTtdI8SD5.webp"
          alt="Celebration"
          width={500}
          height={400}
          className={styles.celebrationImage}
        />
      </div>
    </div>
  );
}

export default function Page({ params }: { params: { slug: string } }) {
  const { game } = useSocket(params.slug);

  if (!game) {
    return (
      <div className={styles.loading}>
        <p>Lade Spieldaten...</p>
      </div>
    );
  }

  // Calculate global min and max
  const numbers = game.state.playerStates.map((playerState) =>
    lineChartPointsValues(playerState, game.state.currentRound),
  );
  const allNumbers = numbers.flat();
  const globalMin = Math.min(...allNumbers);
  const globalMax = Math.max(...allNumbers);

  if (game.state.running) {
    return (
      <div className={styles.dashboard}>
        <RoundInfo game={game} />
        <div className={styles.statsBlocks}>
          {game.state.playerStates.map((playerState, idx) => (
            <StatsBlock
              playerState={playerState}
              key={playerState.player.name}
              currentRound={game.state.currentRound}
              globalMin={globalMin}
              globalMax={globalMax}
              allNumbers={numbers[idx]}
            />
          ))}
        </div>
      </div>
    );
  } else {
    return <FinalPage game={game} />;
  }
}
