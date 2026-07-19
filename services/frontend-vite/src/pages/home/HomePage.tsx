import { useState } from "react";
import { useNavigate } from "react-router";
import Button from "@/components/Button/Button";
import Input from "@/components/Input/Input";

const BLUE = "#737EFC";

export default function HomePage() {
  const navigate = useNavigate();

  function handleJoinGame(code: string) {
    if (!code.trim()) return;
    navigate(`/game/dashboard/${code.trim()}`);
  }

  function handleOpenLeague(code: string) {
    if (!code.trim()) return;
    navigate(`/league/${code.trim()}`);
  }

  return (
    <main className="w-11/12 max-w-4xl m-auto mt-16 sm:mt-28 px-1 sm:px-0 pb-24">
      {/* Hero */}
      <div className="text-center">
        <h1 className="text-6xl sm:text-7xl font-bold tracking-tight">
          Wizard
        </h1>
        <p className="mt-4 text-neutral-400 text-lg">
          Zähle Punkte, führe Ligen und krönt euren Wizard.
        </p>
      </div>

      {/* Spiel */}
      <SectionLabel>Spiel</SectionLabel>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <CardShell
          title="Neues Spiel"
          description="Starte ein Spiel und lade deine Freunde ein."
        >
          <Button
            onClick={() => navigate("/game/new")}
            className="bg-[#A2BD53] text-black font-bold w-full mt-5"
          >
            Erstellen
          </Button>
        </CardShell>

        <CodeCard
          title="Spiel beitreten"
          description="Tritt einem laufenden Spiel mit einem Code bei."
          placeholder="SPIEL CODE"
          buttonLabel="Beitreten"
          buttonColor={BLUE}
          onSubmit={handleJoinGame}
        />
      </div>

      {/* Liga */}
      <SectionLabel>Liga</SectionLabel>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <CardShell
          title="Liga erstellen"
          description="Eine dauerhafte Rangliste über viele Spiele."
        >
          <Button
            onClick={() => navigate("/league/new")}
            className="bg-[#A2BD53] text-black font-bold w-full mt-5"
          >
            Erstellen
          </Button>
        </CardShell>

        <CodeCard
          title="Liga öffnen"
          description="Öffne eine bestehende Liga mit ihrem Code."
          placeholder="LIGA CODE"
          buttonLabel="Öffnen"
          buttonColor={BLUE}
          onSubmit={handleOpenLeague}
        />
      </div>
    </main>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-12 mb-4 text-xs uppercase tracking-[0.2em] text-neutral-500">
      {children}
    </p>
  );
}

function CardShell(props: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5 transition-colors hover:border-neutral-700">
      <h2 className="text-lg font-bold text-white">{props.title}</h2>
      <p className="mt-2 text-sm text-neutral-400">{props.description}</p>
      <div className="mt-auto">{props.children}</div>
    </div>
  );
}

function CodeCard(props: {
  title: string;
  description: string;
  placeholder: string;
  buttonLabel: string;
  buttonColor: string;
  onSubmit: (code: string) => void;
}) {
  const [code, setCode] = useState("");

  return (
    <CardShell title={props.title} description={props.description}>
      <div className="mt-4 flex flex-col gap-3">
        <Input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && props.onSubmit(code)}
          placeholder={props.placeholder}
        />
        <Button
          onClick={() => props.onSubmit(code)}
          className="text-black font-bold w-full"
          style={{ backgroundColor: props.buttonColor }}
        >
          {props.buttonLabel}
        </Button>
      </div>
    </CardShell>
  );
}
