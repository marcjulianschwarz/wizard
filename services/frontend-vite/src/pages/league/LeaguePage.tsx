import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import {
  type GameSummary,
  type LeagueDetail,
  type LeaguePlayer,
  type Standing,
} from "@/api/entities";
import {
  addLeaguePlayer,
  deleteLeaguePlayer,
  getLeague,
  getLeagueGames,
  getStandings,
  updateLeaguePlayer,
} from "@/api/leagues";
import EmojiPicker from "@/components/EmojiPicker/EmojiPicker";
import { EMOJI_OPTIONS } from "@/components/EmojiPicker/EmojiOptions";
import Input from "@/components/Input/Input";
import Button from "@/components/Button/Button";
import Hero from "@/components/Hero/Hero";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { Check, Copy, Pencil, Trash2, X } from "lucide-react";

function getRandomEmoji(): string {
  return EMOJI_OPTIONS[Math.floor(Math.random() * EMOJI_OPTIONS.length)];
}

function formatDate(ms: number): string {
  return new Date(ms).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function LeaguePage() {
  const { leagueId } = useParams<{ leagueId: string }>();
  const navigate = useNavigate();

  const [league, setLeague] = useState<LeagueDetail | null>(null);
  const [standings, setStandings] = useState<Standing[]>([]);
  const [games, setGames] = useState<GameSummary[]>([]);
  const [loadError, setLoadError] = useState("");

  useDocumentTitle(league ? `Liga: ${league.name}` : "Liga");

  async function reload() {
    if (!leagueId) return;
    try {
      const [l, s, g] = await Promise.all([
        getLeague(leagueId),
        getStandings(leagueId),
        getLeagueGames(leagueId),
      ]);
      setLeague(l);
      setStandings(s);
      setGames(g);
    } catch {
      setLoadError("Liga konnte nicht geladen werden.");
    }
  }

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leagueId]);

  if (loadError) {
    return (
      <main className="w-11/12 max-w-3xl m-auto mt-10">
        <p className="text-red-500">{loadError}</p>
      </main>
    );
  }

  if (!league || !leagueId) {
    return (
      <main className="w-11/12 max-w-3xl m-auto mt-10">
        <p className="text-neutral-400">Lädt…</p>
      </main>
    );
  }

  return (
    <main className="w-11/12 sm:w-10/12 max-w-3xl m-auto mt-10 sm:mt-20 px-2 sm:px-0 pb-20">
      <Hero title={league.name} subtitle="Liga" />

      <div className="mt-6 flex flex-wrap gap-3">
        <CopyLinkButton
          label="Liga-Link kopieren"
          value={window.location.href}
        />
        <Button
          className="border border-[#A2BD53] bg-[#A2BD53] text-black"
          onClick={() => navigate(`/game/new?league=${leagueId}`)}
        >
          Neues Spiel
        </Button>
      </div>

      <StandingsTable standings={standings} />

      <GamesList games={games} onOpen={(code) => navigate(`/game/display/${code}`)} />

      <PlayerManagement
        leagueId={leagueId}
        players={league.players}
        onChanged={reload}
      />
    </main>
  );
}

function CopyLinkButton(props: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(props.value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <Button
      className="border border-neutral-700 bg-neutral-900"
      onClick={handleCopy}
      leftIcon={copied ? <Check size={16} /> : <Copy size={16} />}
    >
      {copied ? "Kopiert!" : props.label}
    </Button>
  );
}

function StandingsTable({ standings }: { standings: Standing[] }) {
  return (
    <section className="mt-10">
      <h2 className="text-xl font-bold mb-4">Rangliste</h2>
      {standings.length === 0 ? (
        <p className="text-neutral-400">
          Noch keine beendeten Spiele — die Rangliste füllt sich, sobald ein
          Spiel fertig ist.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-neutral-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-900 text-neutral-400">
              <tr>
                <th className="px-3 py-3">#</th>
                <th className="px-3 py-3">Spieler</th>
                <th className="px-3 py-3 text-right">Spiele</th>
                <th className="px-3 py-3 text-right">Punkte</th>
                <th className="px-3 py-3 text-right">Siege</th>
                <th className="px-3 py-3 text-right">Ø</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((s, i) => (
                <tr
                  key={s.playerId || s.name}
                  className="border-t border-neutral-800"
                >
                  <td className="px-3 py-3 font-bold text-neutral-500">
                    {i + 1}
                  </td>
                  <td className="px-3 py-3">
                    <span className="mr-2 text-xl">{s.color}</span>
                    {s.name}
                  </td>
                  <td className="px-3 py-3 text-right">{s.gamesPlayed}</td>
                  <td className="px-3 py-3 text-right font-semibold">
                    {s.totalPoints}
                  </td>
                  <td className="px-3 py-3 text-right">{s.wins}</td>
                  <td className="px-3 py-3 text-right text-neutral-400">
                    {s.averagePoints}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function GamesList(props: {
  games: GameSummary[];
  onOpen: (joinCode: string) => void;
}) {
  const { games, onOpen } = props;
  return (
    <section className="mt-10">
      <h2 className="text-xl font-bold mb-4">Spiele ({games.length})</h2>
      {games.length === 0 ? (
        <p className="text-neutral-400">Noch keine Spiele in dieser Liga.</p>
      ) : (
        <div className="space-y-2">
          {games.map((g) => (
            <button
              key={g.joinCode}
              onClick={() => onOpen(g.joinCode)}
              className="w-full flex items-center justify-between px-5 py-4 bg-neutral-900 border border-neutral-800 rounded-lg text-left transition-all duration-200 hover:bg-neutral-800 hover:translate-x-1"
            >
              <div>
                <div className="text-white font-medium">
                  {g.name?.trim() || `Spiel ${g.joinCode}`}
                </div>
                <div className="text-sm text-neutral-400">
                  {formatDate(g.createdAt)} · {g.playerCount} Spieler ·{" "}
                  {g.finished ? "Beendet" : "Läuft"}
                </div>
              </div>
              {g.winner && (
                <div className="text-right text-sm">
                  <div className="text-neutral-400">
                    {g.finished ? "Sieger" : "Führend"}
                  </div>
                  <div className="text-white">
                    <span className="mr-1">{g.winner.color}</span>
                    {g.winner.name} ({g.winner.points})
                  </div>
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

function PlayerManagement(props: {
  leagueId: string;
  players: LeaguePlayer[];
  onChanged: () => void;
}) {
  const { leagueId, players, onChanged } = props;

  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState(getRandomEmoji());
  const [pickerOpen, setPickerOpen] = useState(false);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  async function handleAdd() {
    if (!name.trim()) {
      setError("Bitte gib einen Spielernamen ein");
      return;
    }
    await addLeaguePlayer(leagueId, { name: name.trim(), color: emoji });
    setName("");
    setEmoji(getRandomEmoji());
    setPickerOpen(false);
    setError("");
    onChanged();
  }

  return (
    <section className="mt-10">
      <h2 className="text-xl font-bold mb-4">Spieler ({players.length})</h2>

      <div className="flex flex-col sm:flex-row gap-3">
        <EmojiPicker
          selectedEmoji={emoji}
          onSelect={(e) => {
            setEmoji(e);
            setPickerOpen(false);
          }}
          onToggle={() => setPickerOpen(!pickerOpen)}
          isOpen={pickerOpen}
        />
        <Input
          className="flex-1"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder="Spielername"
        />
        <Button
          onClick={handleAdd}
          className="border border-[#A2BD53] bg-[#A2BD53] text-black w-full sm:w-auto"
        >
          Hinzufügen
        </Button>
      </div>
      {error && <p className="text-red-500 mt-2">{error}</p>}

      <div className="mt-4 space-y-2">
        {players.map((player) =>
          editingId === player.id ? (
            <EditPlayerRow
              key={player.id}
              leagueId={leagueId}
              player={player}
              onDone={() => {
                setEditingId(null);
                onChanged();
              }}
              onCancel={() => setEditingId(null)}
            />
          ) : (
            <div
              key={player.id}
              className="flex items-center justify-between px-5 py-4 bg-neutral-900 border border-neutral-800 rounded-lg"
            >
              <div className="flex items-center gap-4">
                <span className="text-3xl leading-none">{player.color}</span>
                <span className="text-lg font-medium text-white">
                  {player.name}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  className="w-9 h-9 flex items-center justify-center text-neutral-300 border border-neutral-700 bg-transparent rounded-lg hover:bg-neutral-800"
                  onClick={() => setEditingId(player.id)}
                  aria-label={`${player.name} bearbeiten`}
                >
                  <Pencil size={16} />
                </button>
                <button
                  className="w-9 h-9 flex items-center justify-center text-red-500 border border-red-500 bg-transparent rounded-lg hover:bg-red-500/15"
                  onClick={async () => {
                    try {
                      await deleteLeaguePlayer(leagueId, player.id);
                      onChanged();
                    } catch {
                      // Player has games — deletion not allowed in v1.
                    }
                  }}
                  aria-label={`${player.name} entfernen`}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ),
        )}
      </div>
    </section>
  );
}

function EditPlayerRow(props: {
  leagueId: string;
  player: LeaguePlayer;
  onDone: () => void;
  onCancel: () => void;
}) {
  const { leagueId, player, onDone, onCancel } = props;
  const [name, setName] = useState(player.name);
  const [emoji, setEmoji] = useState(player.color);
  const [pickerOpen, setPickerOpen] = useState(false);

  async function handleSave() {
    if (!name.trim()) return;
    await updateLeaguePlayer(leagueId, player.id, {
      name: name.trim(),
      color: emoji,
    });
    onDone();
  }

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 px-5 py-4 bg-neutral-900 border border-neutral-700 rounded-lg">
      <EmojiPicker
        selectedEmoji={emoji}
        onSelect={(e) => {
          setEmoji(e);
          setPickerOpen(false);
        }}
        onToggle={() => setPickerOpen(!pickerOpen)}
        isOpen={pickerOpen}
      />
      <Input
        className="flex-1"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSave()}
      />
      <div className="flex gap-2">
        <button
          className="w-11 h-11 flex items-center justify-center text-green-500 border border-green-600 bg-transparent rounded-lg hover:bg-green-600/15"
          onClick={handleSave}
          aria-label="Speichern"
        >
          <Check size={18} />
        </button>
        <button
          className="w-11 h-11 flex items-center justify-center text-neutral-300 border border-neutral-700 bg-transparent rounded-lg hover:bg-neutral-800"
          onClick={onCancel}
          aria-label="Abbrechen"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
