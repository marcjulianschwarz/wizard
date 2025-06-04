import { Player } from "@/app/api/entities";
import styles from "./player.module.css";

function PlayerAvatar() {
  return <div className={styles.avatar}></div>;
}

function PlayerView(props: { player: Player }) {
  const { player } = props;

  return (
    <div className={styles.container}>
      <PlayerAvatar />
      <p>{player.name}</p>
    </div>
  );
}

export default PlayerView;
