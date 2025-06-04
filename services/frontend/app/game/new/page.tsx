"use client";
import { useState } from "react";
import styles from "./page.module.css";
import { Game, Player, PlayerState } from "@/app/api/entities";
import { useRouter } from "next/navigation";
import { useSocket } from "@/app/api/hooks";

// function ColorInput() {
//   return <div className={styles.color}></div>;
// }

function generateRandomString(length: number): string {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

export default function Page() {
  const [playerName, setPlayerName] = useState("");
  const [players, setPlayers] = useState<Player[]>([]);
  const code = generateRandomString(8);
  const router = useRouter();
  const { createGame } = useSocket();

  function handleAddPlayer() {
    const foundPlayer = players.find((pl) => pl.name === playerName);
    if (foundPlayer) {
      return;
    }
    const newPlayers: Player[] = [
      ...players,
      { name: playerName, color: "red" },
    ];
    setPlayers(newPlayers);
  }

  async function handleCreateGame() {
    console.log(code);
    const game: Game = {
      name: "",
      joinCode: code,
      state: {
        startTime: Date.now(),
        currentRound: 1,
        running: true,
        playerStates: players.map<PlayerState>((player) => {
          return {
            player,
            points: {
              predicted: [],
              actual: [],
            },
          };
        }),
      },
    };
    try {
      await createGame(game);
      console.log("Game created successfully");
      router.push(`/game/master/${code}`);
    } catch (error) {
      console.error("Failed to create game:", error);
    }
  }

  return (
    <div className={styles.page}>
      <h1>Spieler hinzufügen</h1>
      <div className={styles.form}>
        <div className={styles.nameRow}>
          <input
            className={styles.nameInput}
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Spielername"
          />
          <button className={styles.addBtn} onClick={handleAddPlayer}>
            +
          </button>
        </div>
      </div>

      <div className={styles.players}>
        {players.map((player) => (
          <div className={styles.player} key={player.name}>
            <p>{player.name}</p>
          </div>
        ))}
      </div>

      <div>
        <button onClick={handleCreateGame}>Starten</button>
      </div>
    </div>
  );
}
