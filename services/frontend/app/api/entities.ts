export enum CardColor {
  RED = "red",
  GREEN = "green",
  BLUE = "blue",
  YELLOW = "yellow",
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
}
