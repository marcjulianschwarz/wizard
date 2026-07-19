import { useEffect, useRef, useState } from "react";
import {
  type Game,
  type LeaguePlayer,
  type Player,
  type PlayerState,
} from "@/api/entities";
import { useSocket } from "@/api/hooks";
import {
  addLeaguePlayer,
  createLeague,
  getLeague,
} from "@/api/leagues";
import EmojiPicker from "@/components/EmojiPicker/EmojiPicker";
import PlayerCard from "@/components/PlayerCard/PlayerCard";
import { useNavigate, useSearchParams } from "react-router";
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

type LeagueMode = "none" | "new" | "existing";

function buildGame(props: {
  code: string;
  players: Player[];
  mustNotAddUp: boolean;
  leagueId?: string;
}): Game {
  const { code, players, mustNotAddUp, leagueId } = props;
  return {
    name: "",
    joinCode: code,
    leagueId,
    settings: { mustNotAddUp },
    state: {
      startTime: Date.now(),
      currentRound: 1,
      running: true,
      playerStates: players.map<PlayerState>((player) => ({
        player,
        points: { predicted: [], actual: [] },
      })),
    },
  };
}

export default function NewGamePage() {
  const [searchParams] = useSearchParams();
  const preselectedLeague = searchParams.get("league") ?? "";

  const [mode, setMode] = useState<LeagueMode>(
    preselectedLeague ? "existing" : "none",
  );
  const [leagueName, setLeagueName] = useState("");
  const [leagueCode, setLeagueCode] = useState(preselectedLeague);

  // For "none" / "new": manually entered players.
  const [playerName, setPlayerName] = useState("");
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedEmoji, setSelectedEmoji] = useState(getRandomEmoji());
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // For "existing": league roster + which players are selected for this game.
  const [leaguePlayers, setLeaguePlayers] = useState<LeaguePlayer[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [error, setError] = useState("");
  const [mustNotAddUp, setMustNotAddUp] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const code = useRef(generateRandomString(8)).current;
  const navigate = useNavigate();
  const { createGame } = useSocket();

  useDocumentTitle("Neues Spiel");

  // Load the league roster when in existing mode with a code.
  useEffect(() => {
    if (mode !== "existing" || !leagueCode.trim()) {
      setLeaguePlayers([]);
      return;
    }
    let cancelled = false;
    getLeague(leagueCode.trim())
      .then((league) => {
        if (cancelled) return;
        setLeaguePlayers(league.players);
        setSelectedIds(new Set(league.players.map((p) => p.id)));
        setError("");
      })
      .catch(() => {
        if (!cancelled) {
          setLeaguePlayers([]);
          setError("Liga nicht gefunden");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [mode, leagueCode]);

  function handleAddPlayer() {
    if (!playerName.trim()) {
      setError("Bitte gib einen Spielernamen ein");
      return;
    }
    if (players.find((pl) => pl.name === playerName)) {
      setError("Dieser Spieler existiert bereits");
      return;
    }
    setPlayers([...players, { name: playerName, color: selectedEmoji }]);
    setPlayerName("");
    setError("");
    setShowEmojiPicker(false);
    setSelectedEmoji(getRandomEmoji());
    inputRef.current?.focus();
  }

  function handleRemovePlayer(name: string) {
    setPlayers(players.filter((p) => p.name !== name));
  }

  function toggleSelected(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function resolvePlayersAndLeague(): Promise<{
    players: Player[];
    leagueId?: string;
  } | null> {
    if (mode === "none") {
      return { players };
    }

    if (mode === "new") {
      const trimmed = leagueName.trim();
      if (!trimmed) {
        setError("Bitte gib einen Liga-Namen ein");
        return null;
      }
      const { id: leagueId } = await createLeague(trimmed);
      // Persist each player in the league so we get a stable playerId to attach
      // to the game.
      const leaguePlayerList = await Promise.all(
        players.map((p) =>
          addLeaguePlayer(leagueId, { name: p.name, color: p.color }),
        ),
      );
      return {
        leagueId,
        players: leaguePlayerList.map((lp) => ({
          name: lp.name,
          color: lp.color,
          playerId: lp.id,
        })),
      };
    }

    // existing
    const chosen = leaguePlayers.filter((p) => selectedIds.has(p.id));
    return {
      leagueId: leagueCode.trim(),
      players: chosen.map((lp) => ({
        name: lp.name,
        color: lp.color,
        playerId: lp.id,
      })),
    };
  }

  async function handleCreateGame() {
    try {
      const resolved = await resolvePlayersAndLeague();
      if (!resolved) return;
      if (resolved.players.length < 2) {
        setError("Du brauchst mindestens 2 Spieler");
        return;
      }
      const game = buildGame({
        code,
        players: resolved.players,
        mustNotAddUp,
        leagueId: resolved.leagueId,
      });
      await createGame(game);
      navigate(`/game/controller/${code}`);
    } catch (err) {
      console.error("Failed to create game:", err);
      setError("Fehler beim Erstellen des Spiels");
    }
  }

  const activePlayerCount =
    mode === "existing" ? selectedIds.size : players.length;

  return (
    <div className="my-4 mx-4 sm:m-20 max-w-3xl sm:mx-auto">
      <LeagueModeToggle mode={mode} onChange={setMode} />

      {mode === "new" && (
        <Input
          className="mt-4"
          value={leagueName}
          onChange={(e) => setLeagueName(e.target.value)}
          placeholder="Liga-Name"
        />
      )}

      {mode === "existing" && (
        <Input
          className="mt-4"
          value={leagueCode}
          onChange={(e) => setLeagueCode(e.target.value)}
          placeholder="Liga-Code"
        />
      )}

      {error && <p className="text-red-500 mt-4">{error}</p>}

      {/* Player entry — manual for none/new, picker for existing. */}
      {mode === "existing" ? (
        <ExistingLeaguePicker
          players={leaguePlayers}
          selectedIds={selectedIds}
          onToggle={toggleSelected}
        />
      ) : (
        <ManualPlayerEntry
          playerName={playerName}
          setPlayerName={setPlayerName}
          selectedEmoji={selectedEmoji}
          setSelectedEmoji={setSelectedEmoji}
          showEmojiPicker={showEmojiPicker}
          setShowEmojiPicker={setShowEmojiPicker}
          players={players}
          onAdd={handleAddPlayer}
          onRemove={handleRemovePlayer}
          inputRef={inputRef}
        />
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
        Spiel starten{" "}
        {activePlayerCount >= 2 && `(${activePlayerCount} Spieler)`}
      </Button>
    </div>
  );
}

function LeagueModeToggle(props: {
  mode: LeagueMode;
  onChange: (mode: LeagueMode) => void;
}) {
  const { mode, onChange } = props;
  const options: { value: LeagueMode; label: string }[] = [
    { value: "none", label: "Ohne Liga" },
    { value: "new", label: "Neue Liga" },
    { value: "existing", label: "Bestehende Liga" },
  ];
  return (
    <div className="flex gap-2 rounded-xl border border-neutral-800 bg-neutral-900 p-1">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`flex-1 rounded-lg px-3 py-2 text-sm transition-colors ${
            mode === o.value
              ? "bg-[#A2BD53] text-black font-medium"
              : "text-neutral-300 hover:bg-neutral-800"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function ManualPlayerEntry(props: {
  playerName: string;
  setPlayerName: (v: string) => void;
  selectedEmoji: string;
  setSelectedEmoji: (v: string) => void;
  showEmojiPicker: boolean;
  setShowEmojiPicker: (v: boolean) => void;
  players: Player[];
  onAdd: () => void;
  onRemove: (name: string) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
}) {
  const {
    playerName,
    setPlayerName,
    selectedEmoji,
    setSelectedEmoji,
    showEmojiPicker,
    setShowEmojiPicker,
    players,
    onAdd,
    onRemove,
    inputRef,
  } = props;

  return (
    <div className="mt-6">
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
          onKeyDown={(e) => e.key === "Enter" && onAdd()}
          placeholder="Spielername"
        />
        <Button onClick={onAdd} className="w-full sm:w-auto">
          Hinzufügen
        </Button>
      </div>

      {players.length > 0 && (
        <div className="mt-10">
          <h2 className="text-xl font-bold">Spieler ({players.length})</h2>
          <div className="mt-4 space-y-2">
            {players.map((player) => (
              <PlayerCard
                key={player.name}
                player={player}
                onRemove={onRemove}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ExistingLeaguePicker(props: {
  players: LeaguePlayer[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
}) {
  const { players, selectedIds, onToggle } = props;

  if (players.length === 0) {
    return (
      <p className="mt-6 text-neutral-400">
        Gib einen gültigen Liga-Code ein, um die Spieler zu laden.
      </p>
    );
  }

  return (
    <div className="mt-6">
      <h2 className="text-xl font-bold">Wer spielt mit?</h2>
      <div className="mt-4 space-y-2">
        {players.map((player) => {
          const selected = selectedIds.has(player.id);
          return (
            <button
              key={player.id}
              onClick={() => onToggle(player.id)}
              className={`w-full flex items-center justify-between px-5 py-4 rounded-lg border transition-all duration-200 ${
                selected
                  ? "bg-neutral-800 border-[#A2BD53]"
                  : "bg-neutral-900 border-neutral-800 hover:bg-neutral-800"
              }`}
            >
              <div className="flex items-center gap-4">
                <span className="text-3xl leading-none">{player.color}</span>
                <span className="text-lg font-medium text-white">
                  {player.name}
                </span>
              </div>
              <span
                className={`h-6 w-6 rounded-md border flex items-center justify-center ${
                  selected
                    ? "bg-[#A2BD53] border-[#A2BD53] text-black"
                    : "border-neutral-600"
                }`}
              >
                {selected && "✓"}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
