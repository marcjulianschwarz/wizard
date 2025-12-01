import CopyToClipboard from "../CopyToClipboard/CopyToClipboard";
import styles from "./game-code-display.module.css";

interface GameCodeDisplayProps {
  code: string;
  showDashboardLink?: boolean;
}

export default function GameCodeDisplay({
  code,
  showDashboardLink = false,
}: GameCodeDisplayProps) {
  return (
    <div className={styles.joinCodeBox}>
      <div className={styles.codeInfo}>
        <label className={styles.joinCodeLabel}>Beitrittscode:</label>
        <span className={styles.codeValue}>{code}</span>
      </div>
      <div className={styles.codeActions}>
        <CopyToClipboard text={code} />
        {showDashboardLink && (
          <button
            onClick={() => window.open(`/game/dashboard/${code}`, "_blank")}
            className={styles.dashboardBtn}
          >
            Dashboard öffnen
          </button>
        )}
      </div>
    </div>
  );
}
