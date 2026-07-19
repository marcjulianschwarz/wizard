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
  deleteLeagueGame,
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
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { Check, ChevronDown, Pencil, Trash2, X } from "lucide-react";

const ACCENT = "#A2BD53";

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

// One consistent card shell used everywhere on the page.
function Card(props: { className?: string; children: React.ReactNode }) {
  return (
    <div
      className={`rounded-2xl border border-neutral-800 bg-neutral-900/60 ${
        props.className ?? ""
      }`}
    >
      {props.children}
    </div>
  );
}

function SectionHeading(props: { title: string; count?: number }) {
  return (
    <h2 className="text-lg font-bold text-white">
      {props.title}
      {props.count !== undefined && (
        <span className="ml-2 text-neutral-500 font-normal">
          {props.count}
        </span>
      )}
    </h2>
  );
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
      <main className="w-11/12 max-w-4xl m-auto mt-20 text-center">
        <p className="text-red-500">{loadError}</p>
      </main>
    );
  }

  if (!league || !leagueId) {
    return (
      <main className="w-11/12 max-w-4xl m-auto mt-20 text-center">
        <p className="text-neutral-400">Lädt…</p>
      </main>
    );
  }

  return (
    <main className="w-11/12 max-w-4xl m-auto mt-10 sm:mt-16 px-1 sm:px-0 pb-24">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">
            Liga
          </p>
          <h1 className="mt-1 text-4xl sm:text-5xl font-bold leading-tight">
            {league.name}
          </h1>
        </div>
        <Button
          className="bg-[#A2BD53] text-black font-bold w-full sm:w-auto"
          onClick={() => navigate(`/game/new?league=${leagueId}`)}
        >
          Neues Spiel
        </Button>
      </header>

      <div className="mt-8 space-y-8">
        <LeagueCodePanel code={leagueId} link={window.location.href} />
        <StandingsSection standings={standings} />
        <GamesSection
          leagueId={leagueId}
          games={games}
          onOpen={(code) => navigate(`/game/display/${code}`)}
          onDeleted={reload}
        />
        <PlayerManagement
          leagueId={leagueId}
          players={league.players}
          onChanged={reload}
        />
      </div>
    </main>
  );
}

function LeagueCodePanel(props: { code: string; link: string }) {
  const { code, link } = props;
  return (
    <Card className="p-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
        <p className="text-sm font-medium text-white">Liga-Code</p>
      </div>
      <p className="mt-1 text-sm text-neutral-500">
        Der einzige Zugang zur Liga — gut abspeichern.
      </p>
      <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-2">
        <code className="flex-1 select-all break-all rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3 text-lg font-mono tracking-wide text-white">
          {code}
        </code>
        <div className="flex gap-2">
          <CopyButton label="Code" value={code} />
          <CopyButton label="Link" value={link} />
        </div>
      </div>
    </Card>
  );
}

function CopyButton(props: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(props.value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`h-12 px-4 shrink-0 rounded-xl border text-sm font-medium transition-colors ${
        copied
          ? "border-[#A2BD53] text-[#A2BD53]"
          : "border-neutral-800 bg-neutral-950 text-neutral-300 hover:bg-neutral-800"
      }`}
    >
      {copied ? "Kopiert!" : props.label}
    </button>
  );
}

function StandingsSection({ standings }: { standings: Standing[] }) {
  return (
    <section>
      <SectionHeading title="Rangliste" />
      <div className="mt-4">
        {standings.length === 0 ? (
          <Card className="p-6 text-center text-neutral-400 text-sm">
            Noch keine beendeten Spiele — die Rangliste füllt sich, sobald ein
            Spiel fertig ist.
          </Card>
        ) : (
          <Card className="overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="text-neutral-500">
                <tr className="border-b border-neutral-800">
                  <th className="px-4 py-3 font-medium w-10">#</th>
                  <th className="px-4 py-3 font-medium">Spieler</th>
                  <th className="px-2 py-3 font-medium text-right">Sp.</th>
                  <th className="px-2 py-3 font-medium text-right">Siege</th>
                  <th className="px-2 py-3 font-medium text-right">Ø</th>
                  <th className="px-4 py-3 font-medium text-right">Punkte</th>
                </tr>
              </thead>
              <tbody>
                {standings.map((s, i) => (
                  <tr
                    key={s.playerId || s.name}
                    className="border-b border-neutral-800/60 last:border-0"
                  >
                    <td className="px-4 py-3">
                      <RankBadge rank={i + 1} />
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-3">
                        <span className="text-xl">{s.color}</span>
                        <span className="font-medium text-white">
                          {s.name}
                        </span>
                      </span>
                    </td>
                    <td className="px-2 py-3 text-right text-neutral-400">
                      {s.gamesPlayed}
                    </td>
                    <td className="px-2 py-3 text-right text-neutral-400">
                      {s.wins}
                    </td>
                    <td className="px-2 py-3 text-right text-neutral-400">
                      {s.averagePoints}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-white tabular-nums">
                      {s.totalPoints}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </div>
    </section>
  );
}

function RankBadge({ rank }: { rank: number }) {
  const medal: Record<number, string> = {
    1: "bg-yellow-400/15 text-yellow-300 border-yellow-400/30",
    2: "bg-neutral-400/15 text-neutral-200 border-neutral-400/30",
    3: "bg-amber-700/20 text-amber-500 border-amber-700/40",
  };
  const cls = medal[rank] ?? "text-neutral-500 border-transparent";
  return (
    <span
      className={`inline-flex h-7 w-7 items-center justify-center rounded-full border text-sm font-bold ${cls}`}
    >
      {rank}
    </span>
  );
}

function GamesSection(props: {
  leagueId: string;
  games: GameSummary[];
  onOpen: (joinCode: string) => void;
  onDeleted: () => void;
}) {
  const { leagueId, games, onOpen, onDeleted } = props;
  return (
    <section>
      <SectionHeading title="Spielverlauf" count={games.length} />
      <div className="mt-4 space-y-2">
        {games.length === 0 ? (
          <Card className="p-6 text-center text-neutral-400 text-sm">
            Noch keine Spiele in dieser Liga.
          </Card>
        ) : (
          games.map((g) => (
            <GameHistoryItem
              key={g.joinCode}
              leagueId={leagueId}
              game={g}
              onOpen={onOpen}
              onDeleted={onDeleted}
            />
          ))
        )}
      </div>
    </section>
  );
}

function GameHistoryItem(props: {
  leagueId: string;
  game: GameSummary;
  onOpen: (joinCode: string) => void;
  onDeleted: () => void;
}) {
  const { leagueId, game, onOpen, onDeleted } = props;
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!window.confirm("Dieses Spiel wirklich aus der Liga löschen?")) return;
    setDeleting(true);
    try {
      await deleteLeagueGame(leagueId, game.joinCode);
      onDeleted();
    } catch {
      setDeleting(false);
    }
  }

  return (
    <Card className="overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left transition-colors hover:bg-neutral-800/50"
      >
        <div className="min-w-0">
          <div className="text-white font-medium truncate">
            {game.name?.trim() || `Spiel ${game.joinCode}`}
          </div>
          <div className="text-sm text-neutral-500">
            {formatDate(game.createdAt)} · {game.playerCount} Spieler ·{" "}
            {game.finished ? "Beendet" : "Läuft"}
          </div>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          {game.winner && (
            <div className="hidden sm:block text-right text-sm">
              <div className="text-neutral-500 text-xs">
                {game.finished ? "Sieger" : "Führend"}
              </div>
              <div className="text-white">
                <span className="mr-1">{game.winner.color}</span>
                {game.winner.name}
              </div>
            </div>
          )}
          <ChevronDown
            size={18}
            className={`text-neutral-500 transition-transform ${
              open ? "rotate-180" : ""
            }`}
          />
        </div>
      </button>

      {open && (
        <div className="border-t border-neutral-800 px-5 py-4">
          <ol className="space-y-2">
            {game.scores.map((s, i) => (
              <li
                key={`${s.name}-${i}`}
                className="flex items-center justify-between text-sm"
              >
                <span className="flex items-center gap-3">
                  <span className="w-4 text-neutral-500 text-right">
                    {i + 1}
                  </span>
                  <span className="text-lg">{s.color}</span>
                  <span className="text-white">{s.name}</span>
                </span>
                <span className="font-bold text-white tabular-nums">
                  {s.points}
                </span>
              </li>
            ))}
          </ol>
          <div className="mt-4 flex items-center justify-between">
            <button
              onClick={() => onOpen(game.joinCode)}
              className="text-sm font-medium hover:underline"
              style={{ color: ACCENT }}
            >
              Spiel öffnen →
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-1.5 text-sm text-red-400 hover:text-red-300 disabled:opacity-50"
            >
              <Trash2 size={15} />
              {deleting ? "Löschen…" : "Löschen"}
            </button>
          </div>
        </div>
      )}
    </Card>
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
    <section>
      <SectionHeading title="Spieler" count={players.length} />

      <Card className="mt-4 p-4">
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
            className="bg-[#A2BD53] text-black font-bold w-full sm:w-auto"
          >
            Hinzufügen
          </Button>
        </div>
        {error && <p className="text-red-500 mt-2 text-sm">{error}</p>}
      </Card>

      {players.length > 0 && (
        <div className="mt-3 space-y-2">
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
              <Card
                key={player.id}
                className="flex items-center justify-between px-5 py-3"
              >
                <div className="flex items-center gap-4">
                  <span className="text-2xl leading-none">{player.color}</span>
                  <span className="text-base font-medium text-white">
                    {player.name}
                  </span>
                </div>
                <div className="flex gap-2">
                  <IconButton
                    label={`${player.name} bearbeiten`}
                    onClick={() => setEditingId(player.id)}
                  >
                    <Pencil size={16} />
                  </IconButton>
                  <IconButton
                    label={`${player.name} entfernen`}
                    danger
                    onClick={async () => {
                      try {
                        await deleteLeaguePlayer(leagueId, player.id);
                        onChanged();
                      } catch {
                        // Player has games — deletion not allowed in v1.
                      }
                    }}
                  >
                    <Trash2 size={16} />
                  </IconButton>
                </div>
              </Card>
            ),
          )}
        </div>
      )}
    </section>
  );
}

function IconButton(props: {
  label: string;
  danger?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  const base =
    "h-9 w-9 flex items-center justify-center rounded-lg border transition-colors";
  const style = props.danger
    ? "border-neutral-800 text-red-400 hover:bg-red-500/15 hover:border-red-500/40"
    : "border-neutral-800 text-neutral-300 hover:bg-neutral-800";
  return (
    <button
      type="button"
      className={`${base} ${style}`}
      onClick={props.onClick}
      aria-label={props.label}
    >
      {props.children}
    </button>
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
    <Card className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 px-4 py-3 border-neutral-700">
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
          className="h-11 w-11 flex items-center justify-center rounded-lg border border-[#A2BD53] text-[#A2BD53] hover:bg-[#A2BD53]/15"
          onClick={handleSave}
          aria-label="Speichern"
        >
          <Check size={18} />
        </button>
        <button
          className="h-11 w-11 flex items-center justify-center rounded-lg border border-neutral-700 text-neutral-300 hover:bg-neutral-800"
          onClick={onCancel}
          aria-label="Abbrechen"
        >
          <X size={18} />
        </button>
      </div>
    </Card>
  );
}
