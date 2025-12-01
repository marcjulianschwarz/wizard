import styles from "./color-button.module.css";

interface ColorButtonProps {
  color: "red" | "blue" | "yellow" | "green";
  selected?: boolean;
  onClick?: () => void;
}

export default function ColorButton({
  color,
  selected = false,
  onClick,
}: ColorButtonProps) {
  return (
    <div
      className={`${styles.color} ${styles[color]} ${
        selected ? styles.selected : ""
      }`}
      onClick={onClick}
    />
  );
}
