import Button from "../../components/Button/Button";

interface NewGameProps {
  onCreateGame?: () => void;
}

export default function NewGame({ onCreateGame }: NewGameProps) {
  return (
    <div className="border border-neutral-500 rounded-xl p-4 bg-neutral-900 w-full">
      <h2 className="text-lg font-bold">Neues Spiel starten</h2>
      <p className="text-sm mt-4 text-neutral-400">
        Erstelle ein neues Spiel und lade deine Freunde ein
      </p>
      <Button
        onClick={onCreateGame}
        className="bg-[#A2BD53] text-black text-sm font-bold w-full mt-4"
      >
        Neues Spiel erstellen
      </Button>
    </div>
  );
}
