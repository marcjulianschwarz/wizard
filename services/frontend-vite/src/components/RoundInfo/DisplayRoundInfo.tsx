import { type Game, type Player } from "@/api/entities";
import RoundHeader from "./RoundHeader";

interface DisplayRoundInfoProps {
  game: Game;
  nextPlayer?: Player;
  afterNextPlayer?: Player;
}

function colorClasses(color: string | undefined) {
  if (color === "green") return "bg-green-500 text-white";
  if (color === "red") return "bg-red-500 text-white";
  if (color === "blue") return "bg-blue-500 text-white";
  if (color === "yellow") return "bg-yellow-400 text-black";
  return "bg-neutral-800 text-neutral-400";
}

function TurnPlayer(props: { label: string; player: Player; accent: string }) {
  const { label, player, accent } = props;
  return (
    <div className="flex flex-col items-center justify-center gap-1">
      <span className={`text-xs uppercase tracking-wider ${accent}`}>
        {label}
      </span>
      <div className="flex items-center gap-2">
        <span className="text-3xl leading-none">{player.color}</span>
        <span className="text-2xl font-bold text-white">{player.name}</span>
      </div>
    </div>
  );
}

export default function DisplayRoundInfo({
  game,
  nextPlayer,
  afterNextPlayer,
}: DisplayRoundInfoProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6 p-4 bg-neutral-900 rounded-xl border border-neutral-800">
      <RoundHeader game={game} />

      {(nextPlayer || afterNextPlayer) && (
        <div className="flex items-center justify-center gap-8 grow">
          {nextPlayer && (
            <TurnPlayer
              label="Stiche angeben"
              player={nextPlayer}
              accent="text-blue-300"
            />
          )}
          {afterNextPlayer && (
            <TurnPlayer
              label="am Zug"
              player={afterNextPlayer}
              accent="text-neutral-400"
            />
          )}
        </div>
      )}

      <div className="flex flex-row md:flex-col gap-3">
        <div
          className={`px-4 py-2 rounded-lg text-sm font-medium ${colorClasses(game.state.currentTrumpCardColor)}`}
        >
          Trumpf
        </div>
        <div
          className={`px-4 py-2 rounded-lg text-sm font-medium ${colorClasses(game.state.currentConditionCardColor)}`}
        >
          Bedienung
        </div>
      </div>
    </div>
  );
}
