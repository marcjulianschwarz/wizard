"use client";
import { Game, PlayerState } from "@/app/api/entities";
const SimpleLineChart = dynamic(
  () => import("../../../components/SimpleLineChart/SimpleLineChart"),
  { ssr: false }
);
import styles from "./page.module.css";
import { useSocket } from "@/app/api/hooks";
import RoundInfo from "@/app/components/RoundInfo/RoundInfo";
import dynamic from "next/dynamic";
import { currentPoints, lineChartPointsValues } from "@/app/api/utils";
import SimpleBarChart from "@/app/components/SimpleBarChart/SimpleBarChart";
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
    playerState.points.actual
  );

  return (
    <div className={styles.statsblock}>
      <p className={styles.name}>{playerState.player.name}</p>
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
        playerState.points.actual
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
      playerState.points.actual
    );
  });

  return (
    <div>
      <h1 style={{ textAlign: "center", fontSize: "3em" }}>
        Du hast gewonnen {getPlayerWithMostPoints(game)} 🎉
      </h1>
      <br />
      <br />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 40,
        }}
      >
        <SimpleBarChart
          numbers={scores}
          labels={game.state.playerStates.map((s) => s.player.name)}
        />
        <Image src="/IwAZ6dvvvaTtdI8SD5.webp" alt="" width={500} height={400} />
      </div>
      {/* <br />
      <br />
      <button style={{ width: "fit-content" }}>Fertig</button> */}
    </div>
  );
}

export default function Page({ params }: { params: { slug: string } }) {
  const { game } = useSocket(params.slug);

  if (!game) {
    return <p>Loading</p>;
  }

  // Calculate global min and max
  const numbers = game.state.playerStates.map((playerState) =>
    lineChartPointsValues(playerState, game.state.currentRound)
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
