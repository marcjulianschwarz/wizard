"use client";
import { useState } from "react";
import styles from "./page.module.css";
import { useRouter } from "next/navigation";
import Hero from "./components/Hero/Hero";

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

  function handleKeyPress(e: React.KeyboardEvent) {
    if (e.key === "Enter" && joinCode.trim()) {
      handleJoinGame();
    }
  }

  return (
    <main className={styles.welcome}>
      <Hero title="Wizard" subtitle="" />

      <div className={styles.container}>
        <div className={styles.card}>
          <h2>Neues Spiel starten</h2>
          <p className={styles.description}>
            Erstelle ein neues Spiel und lade deine Freunde ein
          </p>
          <button onClick={handleCreateGame} className={styles.createBtn}>
            Neues Spiel erstellen
          </button>
        </div>

        <div className={styles.divider}>
          <span>oder</span>
        </div>

        <div className={styles.card}>
          <h2>Spiel beitreten</h2>
          <p className={styles.description}>
            Tritt einem bestehenden Spiel mit einem Code bei
          </p>
          <div className={styles.joinForm}>
            <input
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Spiel-Code eingeben"
              className={styles.joinInput}
            />
            <button onClick={handleJoinGame} className={styles.joinBtn}>
              Beitreten
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
