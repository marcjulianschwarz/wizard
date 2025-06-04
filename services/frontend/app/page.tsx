"use client";
import { useState } from "react";
import styles from "./page.module.css";
import { useRouter } from "next/navigation";

export default function Home() {
  const [joinCode, setJoinCode] = useState("");
  const router = useRouter();

  function handleCreateGame() {
    router.push("/game/new");
  }

  function handleJoinGame() {
    const link = `/game/dashboard/${joinCode}`;
    console.log(link);
    router.push(link);
  }

  return (
    <main className={styles.welcome}>
      <h1>Wizard</h1>
      <br />
      <br />

      <div className={styles.form}>
        <button onClick={handleCreateGame} className={styles.create}>
          Neues Spiel
        </button>
        <hr />
        <div className={styles.joinForm}>
          <input
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
            placeholder="Game Code"
          />
          <button onClick={handleJoinGame} className={styles.join}>
            Spiel beitreten
          </button>
        </div>
      </div>
    </main>
  );
}
