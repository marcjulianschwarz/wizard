import Button from "../../components/Button/Button";

interface CreateLeagueProps {
  onCreateLeague?: () => void;
}

export default function CreateLeague({ onCreateLeague }: CreateLeagueProps) {
  return (
    <div className="border border-neutral-500 rounded-xl p-4 bg-neutral-900 w-full">
      <h2 className="text-lg font-bold">Liga erstellen</h2>
      <p className="text-sm mt-4 text-neutral-400">
        Erstelle eine Liga für eine dauerhafte Rangliste über mehrere Spiele
      </p>
      <Button
        onClick={onCreateLeague}
        className="bg-[#A2BD53] text-black text-sm font-bold w-full mt-4"
      >
        Liga erstellen
      </Button>
    </div>
  );
}
