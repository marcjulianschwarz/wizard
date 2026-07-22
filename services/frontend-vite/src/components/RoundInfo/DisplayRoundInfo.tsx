import { type Game } from "@/api/entities";
import RoundHeader from "./RoundHeader";

interface DisplayRoundInfoProps {
  game: Game;
}

export default function DisplayRoundInfo({ game }: DisplayRoundInfoProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center gap-6">
      <RoundHeader game={game} />
    </div>
  );
}
