import { useState, useRef } from "react";
import { type Game, type Player, type PlayerState } from "@/api/entities";
import { useSocket } from "@/api/hooks";
import EmojiPicker from "@/components/EmojiPicker/EmojiPicker";
import PlayerCard from "@/components/PlayerCard/PlayerCard";
import { useNavigate } from "react-router";
import { EMOJI_OPTIONS } from "@/components/EmojiPicker/EmojiOptions";
import Input from "@/components/Input/Input";
import Button from "@/components/Button/Button";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

function getRandomEmoji(): string {
  return EMOJI_OPTIONS[Math.floor(Math.random() * EMOJI_OPTIONS.length)];
}

function generateRandomString(length: number): string {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

export default function NewGamePage() {
  const [playerName, setPlayerName] = useState("");
  const [players, setPlayers] = useState<Player[]>([]);
  const [error, setError] = useState("");
  const [selectedEmoji, setSelectedEmoji] = useState(getRandomEmoji());
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [mustNotAddUp, setMustNotAddUp] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const code = generateRandomString(8);
  const navigate = useNavigate();
  const { createGame } = useSocket();

  useDocumentTitle("Neues Spiel");

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
      settings: { mustNotAddUp },
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
      navigate(`/game/controller/${code}`);
    } catch (error) {
      console.error("Failed to create game:", error);
      setError("Fehler beim Erstellen des Spiels");
    }
  }

  return (
    <div className="my-4 mx-4 sm:m-20 max-w-3xl sm:mx-auto">
      <div>
        {error && <p className="text-red-500 mb-4">{error}</p>}

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-5">
          <EmojiPicker
            selectedEmoji={selectedEmoji}
            onSelect={(emoji) => {
              setSelectedEmoji(emoji);
              setShowEmojiPicker(false);
            }}
            onToggle={() => setShowEmojiPicker(!showEmojiPicker)}
            isOpen={showEmojiPicker}
          />
          <Input
            ref={inputRef}
            className="flex-1"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Spielername"
          />
          <Button onClick={handleAddPlayer} className="w-full sm:w-auto">
            Hinzufügen
          </Button>
        </div>
      </div>

      {players.length > 0 && (
        <div className="mt-10 sm:mt-20">
          <h2 className="text-xl font-bold">Spieler ({players.length})</h2>
          <div className="mt-4 space-y-2">
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

      <label className="mt-10 flex items-center gap-3 cursor-pointer select-none rounded-xl border border-neutral-800 bg-neutral-900 p-4">
        <input
          type="checkbox"
          checked={mustNotAddUp}
          onChange={(e) => setMustNotAddUp(e.target.checked)}
          className="h-5 w-5 accent-[#A2BD53]"
        />
        <div>
          <p className="m-0 font-medium text-white">Darf nicht aufgehen</p>
          <p className="m-0 text-sm text-neutral-400">
            Die Summe aller angesagten Stiche darf nicht der Rundenzahl
            entsprechen.
          </p>
        </div>
      </label>

      <Button
        onClick={handleCreateGame}
        className="border border-[#A2BD53] bg-[#A2BD53] text-black w-full mt-6"
      >
        Spiel starten {players.length >= 2 && `(${players.length} Spieler)`}
      </Button>
    </div>
  );
}
