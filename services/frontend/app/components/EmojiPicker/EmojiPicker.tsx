import styles from "./emoji-picker.module.css";

const EMOJI_OPTIONS = [
  "🧙‍♂️",
  "🧙‍♀️",
  "🎩",
  "⚡",
  "🔮",
  "✨",
  "🌟",
  "🎯",
  "🎲",
  "🃏",
  "👑",
  "🦄",
  "🐉",
  "🦊",
  "🐺",
  "🦁",
];

interface EmojiPickerProps {
  selectedEmoji: string;
  onSelect: (emoji: string) => void;
  onToggle: () => void;
  isOpen: boolean;
}

export default function EmojiPicker({
  selectedEmoji,
  onSelect,
  onToggle,
  isOpen,
}: EmojiPickerProps) {
  return (
    <div className={styles.container}>
      <button className={styles.emojiButton} onClick={onToggle} type="button">
        {selectedEmoji}
      </button>

      {isOpen && (
        <div className={styles.emojiPicker}>
          {EMOJI_OPTIONS.map((emoji) => (
            <button
              key={emoji}
              className={`${styles.emojiOption} ${
                selectedEmoji === emoji ? styles.selected : ""
              }`}
              onClick={() => onSelect(emoji)}
              type="button"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export { EMOJI_OPTIONS };
