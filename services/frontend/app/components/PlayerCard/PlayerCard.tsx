import { Player } from "@/app/api/entities";
import { X } from "lucide-react";
import styles from "./player-card.module.css";

interface PlayerCardProps {
  player: Player;
  onRemove?: (playerName: string) => void;
}

export default function PlayerCard({ player, onRemove }: PlayerCardProps) {
  return (
    <div className={styles.player}>
      <div className={styles.playerInfo}>
        <span className={styles.playerEmoji}>{player.color}</span>
        <span className={styles.playerName}>{player.name}</span>
      </div>
      {onRemove && (
        <button
          className={styles.removeBtn}
          onClick={() => onRemove(player.name)}
          aria-label={`${player.name} entfernen`}
        >
          <X size={18} />
        </button>
      )}
    </div>
  );
}
