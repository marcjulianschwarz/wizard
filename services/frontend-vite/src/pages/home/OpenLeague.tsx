import { useState } from "react";
import Button from "../../components/Button/Button";
import Input from "../../components/Input/Input";

interface OpenLeagueProps {
  onOpenLeague?: (code: string) => void;
}

export default function OpenLeague({ onOpenLeague }: OpenLeagueProps) {
  const [code, setCode] = useState("");

  function handleKeyPress(e: React.KeyboardEvent) {
    if (e.key === "Enter" && code.trim()) {
      onOpenLeague?.(code);
    }
  }

  return (
    <div className="border border-neutral-500 rounded-xl p-4 bg-neutral-900 w-full">
      <h2 className="text-lg font-bold">Liga öffnen</h2>
      <p className="text-sm mt-4 text-neutral-400">
        Öffne eine bestehende Liga mit ihrem Code
      </p>
      <div>
        <Input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="LIGA CODE"
          className="mt-5"
        />
        <Button
          onClick={() => onOpenLeague?.(code)}
          className="bg-[#737EFC] text-black text-sm font-bold w-full mt-4"
        >
          Öffnen
        </Button>
      </div>
    </div>
  );
}
