"use client";
import { useState, useRef, useEffect } from "react";
import styles from "./page.module.css";
import { Game, Player, PlayerState } from "@/app/api/entities";
import { useRouter } from "next/navigation";
import { useSocket } from "@/app/api/hooks";
import EmojiPicker, {
  EMOJI_OPTIONS,
} from "@/app/components/EmojiPicker/EmojiPicker";
import PlayerCard from "@/app/components/PlayerCard/PlayerCard";

function getRandomEmoji(): string {
  return EMOJI_OPTIONS[Math.floor(Math.random() * EMOJI_OPTIONS.length)];
}

// function ColorInput() {
//   return <div className={styles.color}></div>;
// }

function generateRandomString(length: number): string {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

export default function Page() {
  const [playerName, setPlayerName] = useState("");
  const [players, setPlayers] = useState<Player[]>([]);
  const [error, setError] = useState("");
  const [selectedEmoji, setSelectedEmoji] = useState(getRandomEmoji());
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const code = generateRandomString(8);
  const router = useRouter();
  const { createGame } = useSocket();

  useEffect(() => {
    document.title = "Wizard - Neues Spiel";
    inputRef.current?.focus();
  }, []);

  function handleAddPlayer() {
    if (!playerName.trim()) {
      setError("Bitte gib einen Spielernamen ein");
      return;
    }
    const foundPlayer = players.find((pl) => pl.name === playerName);
    if (foundPlayer) {
      setError("Dieser Spieler existiert bereits");
      return;
    }
    const newPlayers: Player[] = [
      ...players,
      { name: playerName, color: selectedEmoji },
    ];
    setPlayers(newPlayers);
    setPlayerName("");
    setError("");
    setShowEmojiPicker(false);
    setSelectedEmoji(getRandomEmoji());
    inputRef.current?.focus();
  }

  function handleRemovePlayer(playerName: string) {
    setPlayers(players.filter((p) => p.name !== playerName));
  }

  function handleKeyPress(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      handleAddPlayer();
    }
  }

  async function handleCreateGame() {
    if (players.length < 2) {
      setError("Du brauchst mindestens 2 Spieler");
      return;
    }
    console.log(code);
    const game: Game = {
      name: "",
      joinCode: code,
      state: {
        startTime: Date.now(),
        currentRound: 1,
        running: true,
        playerStates: players.map<PlayerState>((player) => {
          return {
            player,
            points: {
              predicted: [],
              actual: [],
            },
          };
        }),
      },
    };
    try {
      await createGame(game);
      console.log("Game created successfully");
      router.push(`/game/master/${code}`);
    } catch (error) {
      console.error("Failed to create game:", error);
      setError("Fehler beim Erstellen des Spiels");
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1>Neues Spiel erstellen</h1>
        <p className={styles.subtitle}>
          Füge mindestens 2 Spieler hinzu um zu starten
        </p>
      </div>

      <div className={styles.form}>
        <div className={styles.inputGroup}>
          <EmojiPicker
            selectedEmoji={selectedEmoji}
            onSelect={(emoji) => {
              setSelectedEmoji(emoji);
              setShowEmojiPicker(false);
            }}
            onToggle={() => setShowEmojiPicker(!showEmojiPicker)}
            isOpen={showEmojiPicker}
          />
          <input
            ref={inputRef}
            className={styles.nameInput}
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Spielername"
          />
          <button className={styles.addBtn} onClick={handleAddPlayer}>
            Hinzufügen
          </button>
        </div>

        {error && <p className={styles.error}>{error}</p>}
      </div>

      {players.length > 0 && (
        <div className={styles.playersSection}>
          <h2>Spieler ({players.length})</h2>
          <div className={styles.players}>
            {players.map((player) => (
              <PlayerCard
                key={player.name}
                player={player}
                onRemove={handleRemovePlayer}
              />
            ))}
          </div>
        </div>
      )}

      <button
        onClick={handleCreateGame}
        className={styles.startBtn}
        disabled={players.length < 2}
      >
        Spiel starten {players.length >= 2 && `(${players.length} Spieler)`}
      </button>
    </div>
  );
}
