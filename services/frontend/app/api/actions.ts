import { Game } from "./entities";

export async function updateGameState(newState: Game) {
  const res = await fetch("http://localhost:3000/setGameState", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(newState),
  });
  if (res.ok) {
    return true;
  } else {
    return false;
  }
}
