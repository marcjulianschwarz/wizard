import { getTimeDifference } from "@/app/api/utils";
import styles from "./round-info.module.css";
import { Game } from "@/app/api/entities";

export default function RoundInfo(props: { game: Game }) {
  const { game } = props;

  const maxRounds = 60 / game.state.playerStates.length;

  function getStyle(color: string | undefined) {
    if (color === "green") {
      return styles.green;
    }
    if (color === "red") {
      return styles.red;
    }
    if (color === "blue") {
      return styles.blue;
    }
    if (color === "yellow") {
      return styles.yellow;
    }
    return "";
  }

  return (
    <div className={styles.container}>
      <div>
        <h1 className={styles.round}>Runde {game.state.currentRound}</h1>
        <p className={styles.time}>
          {getTimeDifference(game.state.startTime, Date.now()).minutes}{" "}
          Spielzeit
        </p>
        <p className={styles.time}>{maxRounds} Runden</p>
      </div>
      <div className={styles.colors}>
        <p className={getStyle(game.state.currentTrumpCardColor)}>Trumpf</p>
        <p className={getStyle(game.state.currentConditionCardColor)}>
          Bedienung
        </p>
      </div>
    </div>
  );
}
