export enum CardColor {
  RED = 'red',
  GREEN = 'green',
  BLUE = 'blue',
  YELLOW = 'yellow',
}

export interface Settings {
  someSetting: string;
}

export interface PointsState {
  predicted: number[];
  actual: number[];
}

export interface Player {
  name: string;
  color: string;
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
