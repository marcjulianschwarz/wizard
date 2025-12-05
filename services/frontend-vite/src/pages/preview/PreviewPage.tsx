import { EMOJI_OPTIONS } from "@/components/EmojiPicker/EmojiOptions";
import EmojiPicker from "@/components/EmojiPicker/EmojiPicker";
import { useState } from "react";
import ColorButton from "@/components/ColorButton/ColorButton";
import TrumpCardSelectionView from "../game/controller/views/TrumpCardSelectionView";

function getRandomEmoji(): string {
  return EMOJI_OPTIONS[Math.floor(Math.random() * EMOJI_OPTIONS.length)];
}

export default function PreviewPage() {
  const [selectedEmoji, setSelectedEmoji] = useState(getRandomEmoji());
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  return (
    <>
      <EmojiPicker
        selectedEmoji={selectedEmoji}
        onSelect={(emoji) => {
          setSelectedEmoji(emoji);
          setShowEmojiPicker(false);
        }}
        onToggle={() => setShowEmojiPicker(!showEmojiPicker)}
        isOpen={showEmojiPicker}
      />
      <ColorButton color="green" />
      <ColorButton color="red" />
      <TrumpCardSelectionView />
    </>
  );
}
