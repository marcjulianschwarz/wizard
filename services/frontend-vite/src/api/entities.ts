export type CardColor = "red" | "green" | "blue" | "yellow";

export interface Settings {
  someSetting?: string;
  // "Darf nicht aufgehen": the total of all players' predicted hits must not
  // equal the round number, so the last player to predict is forbidden the one
  // value that would make it add up exactly.
  mustNotAddUp?: boolean;
}

export interface PointsState {
  predicted: number[];
  actual: number[];
}

export interface Player {
  name: string;
  color: string;
  // Fixed display order set once at the initial player ordering. Used so the
  // display never re-orders cards even though the turn order rotates per round.
  order?: number;
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
}

export interface Game {
  name?: string;
  state: GameState;
  settings?: Settings;
  joinCode: string;
}
