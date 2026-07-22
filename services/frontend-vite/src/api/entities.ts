export type CardColor = "red" | "green" | "blue" | "yellow";

export interface Settings {
  someSetting?: string;
  // "Darf nicht aufgehen": the total of all players' predicted hits must not
  // equal the round number, so the last player to predict is forbidden the one
  // value that would make it add up exactly.
  mustNotAddUp?: boolean;
}

export interface PointsState {
  // A cleared prediction is a hole (undefined) rather than 0, so the display can
  // distinguish "not yet predicted" from "predicted 0".
  predicted: (number | undefined)[];
  actual: number[];
}

export interface Player {
  name: string;
  color: string;
  // Fixed display order set once at the initial player ordering. Used so the
  // display never re-orders cards even though the turn order rotates per round.
  order?: number;
  // League Player.id when this game belongs to a league. Absent for standalone
  // games. Lets standings aggregate across games and survive renames.
  playerId?: string;
}

export interface PlayerState {
  player: Player;
  points: PointsState;
}

export interface GameState {
  playerStates: PlayerState[];
  startTime: number;
  currentRound: number;
  currentTrumpCardColor?: CardColor;
  currentConditionCardColor?: CardColor;
  running: boolean;
  // On the final screen, show the points charts instead of the celebration gif.
  showCharts?: boolean;
  // Controls the full-screen turn overlay on the display. `kind` picks which
  // player is announced; the overlay stays visible until the controller toggles
  // it off (field cleared/undefined).
  turnOverlay?: { kind: "predict" | "play" };
  // The round number the controller last confirmed as done (via "Fertig"). The
  // display uses this to pop the round-points badges for that round.
  roundResultTrigger?: number;
}

export interface Game {
  name?: string;
  state: GameState;
  settings?: Settings;
  joinCode: string;
  // Nullable: standalone games have no league. When set, the game shows up in
  // the league's games list and feeds its standings.
  leagueId?: string;
}

export interface League {
  id: string;
  name: string;
  createdAt: number;
}

export interface LeaguePlayer {
  id: string;
  leagueId: string;
  name: string;
  color: string;
}

export interface LeagueDetail extends League {
  players: LeaguePlayer[];
}

export interface Standing {
  playerId: string;
  name: string;
  color: string;
  gamesPlayed: number;
  totalPoints: number;
  wins: number;
  averagePoints: number;
  bestGame: number;
}

export interface PlayerScore {
  name: string;
  color: string;
  points: number;
}

export interface GameSummary {
  joinCode: string;
  name?: string;
  createdAt: number;
  finished: boolean;
  winner?: PlayerScore;
  // All players' final scores, ranked high-to-low. Powers the game history.
  scores: PlayerScore[];
  playerCount: number;
}
