import {
  type GameSummary,
  type LeagueDetail,
  type LeaguePlayer,
  type Standing,
} from "./entities";

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL;

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    ...init,
  });
  if (!res.ok) {
    throw new Error(`Request failed: ${res.status}`);
  }
  if (res.status === 204) {
    return undefined as T;
  }
  return (await res.json()) as T;
}

export function createLeague(name: string): Promise<{ id: string }> {
  return request<{ id: string }>(`/leagues`, {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

export function getLeague(id: string): Promise<LeagueDetail> {
  return request<LeagueDetail>(`/leagues/${id}`);
}

export function addLeaguePlayer(
  leagueId: string,
  player: { name: string; color: string },
): Promise<LeaguePlayer> {
  return request<LeaguePlayer>(`/leagues/${leagueId}/players`, {
    method: "POST",
    body: JSON.stringify(player),
  });
}

export function updateLeaguePlayer(
  leagueId: string,
  playerId: string,
  fields: { name?: string; color?: string },
): Promise<LeaguePlayer> {
  return request<LeaguePlayer>(`/leagues/${leagueId}/players/${playerId}`, {
    method: "PATCH",
    body: JSON.stringify(fields),
  });
}

export function deleteLeaguePlayer(
  leagueId: string,
  playerId: string,
): Promise<void> {
  return request<void>(`/leagues/${leagueId}/players/${playerId}`, {
    method: "DELETE",
  });
}

export function getStandings(leagueId: string): Promise<Standing[]> {
  return request<Standing[]>(`/leagues/${leagueId}/standings`);
}

export function getLeagueGames(leagueId: string): Promise<GameSummary[]> {
  return request<GameSummary[]>(`/leagues/${leagueId}/games`);
}

export function deleteLeagueGame(
  leagueId: string,
  joinCode: string,
): Promise<void> {
  return request<void>(`/leagues/${leagueId}/games/${joinCode}`, {
    method: "DELETE",
  });
}
