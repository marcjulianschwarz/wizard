import { useRef, useState } from "react";
import { useNavigate } from "react-router";
import { createLeague } from "@/api/leagues";
import Input from "@/components/Input/Input";
import Button from "@/components/Button/Button";
import Hero from "@/components/Hero/Hero";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

export default function NewLeaguePage() {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useDocumentTitle("Neue Liga");

  async function handleCreate() {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Bitte gib einen Liga-Namen ein");
      inputRef.current?.focus();
      return;
    }
    setCreating(true);
    setError("");
    try {
      const { id } = await createLeague(trimmed);
      navigate(`/league/${id}`);
    } catch {
      setError("Fehler beim Erstellen der Liga");
      setCreating(false);
    }
  }

  return (
    <main className="w-11/12 sm:w-10/12 max-w-xl m-auto mt-10 sm:mt-20 px-2 sm:px-0">
      <Hero title="Neue Liga" subtitle="Eine dauerhafte Rangliste über mehrere Spiele" />

      <div className="mt-10">
        <Input
          ref={inputRef}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          placeholder="Liga-Name"
          autoFocus
        />
        {error && <p className="text-red-500 mt-3">{error}</p>}

        <Button
          onClick={handleCreate}
          disabled={creating}
          className="border border-[#A2BD53] bg-[#A2BD53] text-black w-full mt-6"
        >
          {creating ? "Erstelle…" : "Liga erstellen"}
        </Button>

        <p className="text-sm text-neutral-400 mt-4">
          Danach kannst du Spieler hinzufügen und Spiele starten. Merke dir den
          Liga-Code — er ist der einzige Zugang zur Liga.
        </p>
      </div>
    </main>
  );
}
