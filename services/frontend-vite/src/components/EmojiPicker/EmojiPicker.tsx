import styles from "./emoji-picker.module.css";
import { EMOJI_OPTIONS } from "./EmojiOptions";

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
    <div className="relative">
      <button
        className="w-[60px] h-[60px] text-3xl border rounded-xl border-neutral-400 bg-neutral-900 cursor-pointer transition-all duration-200 hover:scale-105 hover:bg-neutral-700"
        onClick={onToggle}
        type="button"
      >
        {selectedEmoji}
      </button>

      {isOpen && (
        <div
          className={`absolute flex w-[calc(100vw-2rem)] sm:w-[450px] max-w-[450px] flex-wrap p-1 gap-3 z-10 bg-black top-[120%] left-0 sm:left-auto ${styles.emojiPickerAnimation}`}
        >
          {EMOJI_OPTIONS.map((emoji) => (
            <button
              key={emoji}
              className={`w-[60px] h-[60px] text-3xl border border-neutral-700 rounded-xl cursor-pointer transition:all duration-100 hover:scale-110 ${
                selectedEmoji === emoji
                  ? "bg-neutral-800 border-neutral-600"
                  : ""
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
