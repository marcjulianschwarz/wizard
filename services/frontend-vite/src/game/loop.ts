// The core game loop as pure, side-effect-free transitions.
//
// Every function here takes a Game (plus arguments) and returns a NEW Game,
// never mutating the input. The UI (controller views, socket layer) is the only
// place that performs effects — it calls these to compute the next state and
// broadcasts the result. Keeping the mechanic isolated and pure means it can be
// exhaustively unit-tested against weird/invalid inputs without React or a
// socket.
//
// Scoring lives in api/utils (currentPoints / roundPoints); this module owns the
// STATE MACHINE (who predicts, when a round advances, corrections) and re-exports
// the scoring selectors so callers have one game API surface.

import type { Game, GameState, Player, PlayerState } from "@/api/entities";
import {
  currentPoints,
  forbiddenLastPrediction,
  roundPoints,
} from "@/api/utils";

export { currentPoints, roundPoints };

// A round holds one predicted/actual entry per player. With a 60-card deck the
// number of rounds is 60 / playerCount (each round deals `round` cards was the
// old rule; here the game runs a fixed number of rounds derived from headcount).
export function maxRounds(game: Game): number {
  const n = game.state.playerStates.length;
  if (n <= 0) return 0;
  return Math.floor(60 / n);
}

// ---------------------------------------------------------------------------
// Creation
// ---------------------------------------------------------------------------

export function createGame(props: {
  joinCode: string;
  players: Player[];
  mustNotAddUp?: boolean;
  leagueId?: string;
  name?: string;
  startTime?: number;
}): Game {
  const { joinCode, players, mustNotAddUp, leagueId, name, startTime } = props;
  return {
    name: name ?? "",
    joinCode,
    leagueId,
    settings: { mustNotAddUp: mustNotAddUp ?? false },
    state: {
      startTime: startTime ?? Date.now(),
      currentRound: 1,
      running: true,
      playerStates: players.map<PlayerState>((player) => ({
        player,
        points: { predicted: [], actual: [] },
      })),
    },
  };
}

// ---------------------------------------------------------------------------
// Internal helpers (pure)
// ---------------------------------------------------------------------------

// The 0-based array index for a 1-based round number.
function idx(round: number): number {
  return round - 1;
}

// Write `value` at `roundIndex`, growing the array with holes so earlier rounds
// are preserved. Returns a new array.
function writeAt<T>(
  arr: (T | undefined)[],
  roundIndex: number,
  value: T | undefined,
): (T | undefined)[] {
  const next = arr.slice();
  while (next.length <= roundIndex) next.push(undefined);
  next[roundIndex] = value;
  return next;
}

// Replace the state on a game immutably.
function withState(game: Game, patch: Partial<GameState>): Game {
  return { ...game, state: { ...game.state, ...patch } };
}

// Map over one player's state (matched by name), leaving the rest untouched.
function mapPlayer(
  game: Game,
  playerName: string,
  fn: (ps: PlayerState) => PlayerState,
): Game {
  return withState(game, {
    playerStates: game.state.playerStates.map((ps) =>
      ps.player.name === playerName ? fn(ps) : ps,
    ),
  });
}

// Clamp a 1-based round into the valid range for this game.
function clampRound(game: Game, round: number): number {
  const max = maxRounds(game);
  if (max <= 0) return 1;
  return Math.min(Math.max(1, Math.round(round)), max);
}

// Clamp a predicted/actual value into the only range that can ever be valid for
// a round: 0..round. A player can neither take a negative number of tricks nor
// more than the round number allows. Undefined (a clear) passes through so
// predictions can still be reset to a hole.
function clampValue(
  value: number | undefined,
  round: number,
): number | undefined {
  if (value === undefined) return undefined;
  if (!Number.isFinite(value)) return 0;
  return Math.min(Math.max(0, Math.round(value)), round);
}

// ---------------------------------------------------------------------------
// Predictions ("Ansagen")
// ---------------------------------------------------------------------------

// Set a player's prediction for `round` (defaults to the current round). Pass
// undefined to clear it back to a hole (distinct from predicting 0).
export function setPrediction(
  game: Game,
  args: { playerName: string; value: number | undefined; round?: number },
): Game {
  const round = clampRound(game, args.round ?? game.state.currentRound);
  const value = clampValue(args.value, round);
  return mapPlayer(game, args.playerName, (ps) => ({
    ...ps,
    points: {
      ...ps.points,
      predicted: writeAt(ps.points.predicted, idx(round), value),
    },
  }));
}

// ---------------------------------------------------------------------------
// Tricks made ("Stiche")
// ---------------------------------------------------------------------------

// Set a player's actual tricks for `round` (defaults to current). `actual` is a
// dense number[] in the model, so a cleared value falls back to 0.
export function setActual(
  game: Game,
  args: { playerName: string; value: number | undefined; round?: number },
): Game {
  const round = clampRound(game, args.round ?? game.state.currentRound);
  const value = clampValue(args.value, round);
  return mapPlayer(game, args.playerName, (ps) => {
    const written = writeAt(ps.points.actual, idx(round), value);
    return {
      ...ps,
      points: {
        ...ps.points,
        actual: written.map((v) => v ?? 0),
      },
    };
  });
}

// ---------------------------------------------------------------------------
// Turn order
// ---------------------------------------------------------------------------

// Reorder players to `order` (an array of the CURRENT playerStates indices in
// their new sequence) and stamp each player's fixed display `order`.
export function reorderPlayers(game: Game, order: number[]): Game {
  const reordered = order.map((originalIndex, i) => {
    const ps = game.state.playerStates[originalIndex];
    return { ...ps, player: { ...ps.player, order: i } };
  });
  return withState(game, { playerStates: reordered });
}

// ---------------------------------------------------------------------------
// Round advancement
// ---------------------------------------------------------------------------

// A round is only finishable when it is fully and legally entered. These are the
// checks that must hold at the COMMIT point (unlike mid-entry, which is free-form
// and only value-clamped). Kept rule-agnostic on purpose: there is no fixed
// trick-sum target in this game (round number is not the cards dealt, and
// predictions must NOT add up), so the only invariants are completeness and the
// "darf nicht aufgehen" forbidden prediction.
export interface RoundValidation {
  valid: boolean;
  errors: string[];
}

export function validateRound(game: Game, round?: number): RoundValidation {
  const r = clampRound(game, round ?? game.state.currentRound);
  const i = idx(r);
  const errors: string[] = [];

  // Completeness: every player needs both a prediction and a trick count.
  const missingPrediction: string[] = [];
  const missingActual: string[] = [];
  for (const ps of game.state.playerStates) {
    if (ps.points.predicted[i] === undefined) {
      missingPrediction.push(ps.player.name);
    }
    if (ps.points.actual[i] === undefined) {
      missingActual.push(ps.player.name);
    }
  }
  if (missingPrediction.length > 0) {
    errors.push(`Ansage fehlt: ${missingPrediction.join(", ")}`);
  }
  if (missingActual.length > 0) {
    errors.push(`Stiche fehlen: ${missingActual.join(", ")}`);
  }

  // "Darf nicht aufgehen": the last predictor must not have picked the forbidden
  // value. Enforced here too so the correction panel can't bypass the numpad
  // guard. Only meaningful once all predictions are in (forbidden is null until
  // then), so it never fires on an already-incomplete round.
  const forbidden = forbiddenLastPrediction({
    game,
    predictionOrder: game.state.playerStates,
  });
  if (forbidden !== null) {
    const lastPredictor =
      game.state.playerStates[game.state.playerStates.length - 1];
    if (lastPredictor?.points.predicted[i] === forbidden) {
      errors.push(
        `${lastPredictor.player.name} darf nicht ${forbidden} ansagen.`,
      );
    }
  }

  return { valid: errors.length === 0, errors };
}

// The result of attempting to finish a round: either the advanced game, or the
// reasons it was refused. Callers must handle both — a bad round can never be
// committed.
export type FinishResult =
  | { ok: true; game: Game }
  | { ok: false; errors: string[] };

// Confirm the current round is done: validate it, then rotate the turn order
// (first player moves to the end), advance the round, and stamp
// roundResultTrigger with the round that just finished so the display pops its
// per-round badges. Refuses (ok: false) if the round is incomplete or illegal,
// so state can never advance out of a valid round into a committed bad one.
// Never advances past the last round.
export function finishRound(game: Game): FinishResult {
  const validation = validateRound(game);
  if (!validation.valid) {
    return { ok: false, errors: validation.errors };
  }
  const finished = game.state.currentRound;
  const [first, ...rest] = game.state.playerStates;
  const rotated = first ? [...rest, first] : game.state.playerStates;
  return {
    ok: true,
    game: withState(game, {
      playerStates: rotated,
      currentRound: clampRound(game, finished + 1),
      roundResultTrigger: finished,
    }),
  };
}

// ---------------------------------------------------------------------------
// Corrections (silent — never touch roundResultTrigger)
// ---------------------------------------------------------------------------

// Jump the current round to any valid round without animating anything.
export function setCurrentRound(game: Game, round: number): Game {
  return withState(game, { currentRound: clampRound(game, round) });
}

// ---------------------------------------------------------------------------
// End
// ---------------------------------------------------------------------------

export function endGame(game: Game): Game {
  return withState(game, { running: false });
}

// ---------------------------------------------------------------------------
// Numpad entry flow (pure decisions for the controller's number pad)
// ---------------------------------------------------------------------------
//
// The controller types each player's value on a numpad, one player at a time,
// then auto-advances to the next. Whether a keypress should advance depends on
// the phase (predictions advance on the first digit; tricks wait for a possible
// second digit) and the "Darf nicht aufgehen" rule. These functions are the
// decision logic only — they hold no state and touch no React.

// What the caller should do after appending a digit to the current entry.
export type EntryOutcome =
  | { kind: "wait" } // keep the field open for another digit
  | { kind: "advance" } // move to the next player
  | { kind: "finish" } // last player done -> complete the phase
  | { kind: "blocked" }; // forbidden value: do nothing, keep field as-is

// Whether typing another digit onto `value` could still form a valid count in
// 0..maxTricks. Only then should the tricks entry wait for a second digit.
function twoDigitReachable(value: number, maxTricks: number): boolean {
  return value * 10 <= maxTricks;
}

// Decide the outcome after a prediction digit is entered.
// - Advances on the first digit (most predictions are single-digit; a two-digit
//   prediction is entered by re-selecting the player and appending).
// - The last player is blocked from the forbidden "Darf nicht aufgehen" value.
export function predictionEntryOutcome(args: {
  value: number;
  playerIndex: number;
  totalPlayers: number;
  forbiddenValue: number | null;
}): EntryOutcome {
  const { value, playerIndex, totalPlayers, forbiddenValue } = args;
  const isLast = playerIndex === totalPlayers - 1;
  if (isLast && forbiddenValue !== null && value === forbiddenValue) {
    return { kind: "blocked" };
  }
  return isLast ? { kind: "finish" } : { kind: "advance" };
}

// Decide the outcome after a tricks (actual) digit is entered.
// - Waits for a second digit only while a valid two-digit count is reachable and
//   only one digit has been typed so far.
// - The last player never auto-finishes — the round is completed by a deliberate
//   "Fertig" click, never by a keypress, so results aren't fired by accident.
export function tricksEntryOutcome(args: {
  value: number;
  digitsEntered: number;
  playerIndex: number;
  totalPlayers: number;
  maxTricks: number;
}): EntryOutcome {
  const { value, digitsEntered, playerIndex, totalPlayers, maxTricks } = args;
  const canGrow = digitsEntered === 1 && twoDigitReachable(value, maxTricks);
  if (canGrow) return { kind: "wait" };
  const isLast = playerIndex === totalPlayers - 1;
  return isLast ? { kind: "wait" } : { kind: "advance" };
}

// ---------------------------------------------------------------------------
// Selectors
// ---------------------------------------------------------------------------

// The player's total score from all fully-scored rounds.
export function playerScore(ps: PlayerState): number {
  return currentPoints(ps.points.predicted, ps.points.actual);
}

// Players ranked high-to-low by score, ties broken by original array order.
export function ranking(
  game: Game,
): { playerState: PlayerState; score: number }[] {
  return game.state.playerStates
    .map((playerState) => ({ playerState, score: playerScore(playerState) }))
    .sort((a, b) => b.score - a.score);
}
