import { type Game } from "./entities";

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL;

export async function updateGameState(newState: Game) {
  const res = await fetch(`${API_BASE_URL}/setGameState`, {
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
