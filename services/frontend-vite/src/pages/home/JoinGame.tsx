import { useState } from "react";
import Button from "../../components/Button/Button";
import Input from "../../components/Input/Input";

interface JoinGameProps {
  onJoinGame?: (code: string) => void;
}

export default function JoinGame({ onJoinGame }: JoinGameProps) {
  const [joinCode, setJoinCode] = useState("");

  function handleKeyPress(e: React.KeyboardEvent) {
    if (e.key === "Enter" && joinCode.trim()) {
      onJoinGame?.(joinCode);
    }
  }

  return (
    <div className="border border-neutral-500 rounded-xl p-4 bg-neutral-900 w-full">
      <h2 className="text-lg font-bold">Spiel beitreten</h2>
      <p className="text-sm mt-4 text-neutral-400">
        Tritt einem bestehenden Spiel mit einem Code bei
      </p>
      <div>
        <Input
          value={joinCode}
          onChange={(e) => setJoinCode(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="SPIEL CODE"
          className="mt-5"
        />
        <Button
          onClick={() => onJoinGame?.(joinCode)}
          className="bg-[#737EFC] text-black text-sm font-bold w-full mt-4"
        >
          Beitreten
        </Button>
      </div>
    </div>
  );
}
