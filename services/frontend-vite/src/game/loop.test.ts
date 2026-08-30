import { describe, expect, it } from "vitest";
import type { Game, Player } from "@/api/entities";
import {
  createGame,
  endGame,
  finishRound,
  maxRounds,
  playerScore,
  predictionEntryOutcome,
  ranking,
  reorderPlayers,
  setActual,
  setCurrentRound,
  setPrediction,
  tricksEntryOutcome,
  validateRound,
} from "./loop";

// A small deterministic game builder for tests: fixed startTime, named players.
function makeGame(names: string[], mustNotAddUp = false): Game {
  const players: Player[] = names.map((name, i) => ({
    name,
    color: "🎩",
    order: i,
  }));
  return createGame({
    joinCode: "TESTCODE",
    players,
    mustNotAddUp,
    startTime: 0,
  });
}

// Play one full round: every player predicts, then their actual is recorded,
// then the round is confirmed. `entries` maps player name -> [predicted, actual].
// Assumes the entries form a valid, complete round (they always do in tests that
// use this helper); throws if finishRound unexpectedly refuses.
function playRound(
  game: Game,
  entries: Record<string, [number, number]>,
): Game {
  let g = game;
  for (const [name, [predicted]] of Object.entries(entries)) {
    g = setPrediction(g, { playerName: name, value: predicted });
  }
  for (const [name, [, actual]] of Object.entries(entries)) {
    g = setActual(g, { playerName: name, value: actual });
  }
  const result = finishRound(g);
  if (!result.ok) {
    throw new Error(`playRound expected a valid round: ${result.errors.join(", ")}`);
  }
  return result.game;
}

describe("createGame", () => {
  it("starts running at round 1 with empty point arrays", () => {
    const g = makeGame(["A", "B", "C"]);
    expect(g.state.running).toBe(true);
    expect(g.state.currentRound).toBe(1);
    expect(g.joinCode).toBe("TESTCODE");
    expect(g.state.playerStates).toHaveLength(3);
    for (const ps of g.state.playerStates) {
      expect(ps.points.predicted).toEqual([]);
      expect(ps.points.actual).toEqual([]);
    }
  });

  it("carries the mustNotAddUp setting and league id", () => {
    const g = createGame({
      joinCode: "X",
      players: [{ name: "A", color: "🎩" }],
      mustNotAddUp: true,
      leagueId: "league-1",
      startTime: 0,
    });
    expect(g.settings?.mustNotAddUp).toBe(true);
    expect(g.leagueId).toBe("league-1");
  });
});

describe("maxRounds", () => {
  it("is 60 divided by the player count", () => {
    expect(maxRounds(makeGame(["A", "B", "C"]))).toBe(20);
    expect(maxRounds(makeGame(["A", "B", "C", "D"]))).toBe(15);
    expect(maxRounds(makeGame(["A", "B", "C", "D", "E", "F"]))).toBe(10);
  });
});

describe("setPrediction / setActual", () => {
  it("writes into the current round without touching other players", () => {
    const g0 = setCurrentRound(makeGame(["A", "B"]), 5);
    const g1 = setPrediction(g0, { playerName: "A", value: 2 });
    expect(g1.state.playerStates[0].points.predicted[4]).toBe(2);
    expect(g1.state.playerStates[1].points.predicted[4]).toBeUndefined();
  });

  it("does not mutate the input game (immutability)", () => {
    const g0 = makeGame(["A", "B"]);
    const before = JSON.stringify(g0);
    setPrediction(g0, { playerName: "A", value: 5 });
    setActual(g0, { playerName: "A", value: 3 });
    expect(JSON.stringify(g0)).toBe(before);
  });

  it("clearing a prediction leaves a hole (undefined), not 0", () => {
    let g = makeGame(["A", "B"]);
    g = setPrediction(g, { playerName: "A", value: 2 });
    g = setPrediction(g, { playerName: "A", value: undefined });
    expect(g.state.playerStates[0].points.predicted[0]).toBeUndefined();
  });

  it("clearing an actual falls back to 0 (dense array)", () => {
    let g = makeGame(["A", "B"]);
    g = setActual(g, { playerName: "A", value: 3 });
    g = setActual(g, { playerName: "A", value: undefined });
    expect(g.state.playerStates[0].points.actual[0]).toBe(0);
  });

  it("writing a later round preserves earlier rounds as holes", () => {
    const g0 = makeGame(["A", "B"]);
    const g1 = setPrediction(g0, { playerName: "A", value: 3, round: 3 });
    const predicted = g1.state.playerStates[0].points.predicted;
    expect(predicted[0]).toBeUndefined();
    expect(predicted[1]).toBeUndefined();
    expect(predicted[2]).toBe(3);
  });

  it("clamps an out-of-range target round into the valid range", () => {
    const g0 = makeGame(["A", "B"]); // maxRounds = 30
    const high = setPrediction(g0, { playerName: "A", value: 1, round: 999 });
    expect(high.state.playerStates[0].points.predicted[29]).toBe(1);
    const low = setPrediction(g0, { playerName: "A", value: 1, round: -5 });
    expect(low.state.playerStates[0].points.predicted[0]).toBe(1);
  });
});

describe("scoring (playerScore)", () => {
  it("awards 20 + 10*prediction on an exact hit", () => {
    // Round 3 so a prediction of 3 is within the 0..round bound.
    let g = setCurrentRound(makeGame(["A", "B"]), 3);
    g = setPrediction(g, { playerName: "A", value: 3 });
    g = setActual(g, { playerName: "A", value: 3 });
    expect(playerScore(g.state.playerStates[0])).toBe(50); // 20 + 30
  });

  it("penalises 10 per trick off on a miss", () => {
    let g = setCurrentRound(makeGame(["A", "B"]), 3);
    g = setPrediction(g, { playerName: "A", value: 3 });
    g = setActual(g, { playerName: "A", value: 1 });
    expect(playerScore(g.state.playerStates[0])).toBe(-20); // |3-1| * -10
  });

  it("ignores rounds that are not fully scored yet", () => {
    let g = setCurrentRound(makeGame(["A", "B"]), 3);
    g = setPrediction(g, { playerName: "A", value: 3 }); // no actual yet
    expect(playerScore(g.state.playerStates[0])).toBe(0);
  });

  it("sums across multiple completed rounds", () => {
    // Rounds 3 and 4 so the multi-trick values are all within bounds.
    let g = setCurrentRound(makeGame(["A", "B"]), 3);
    // Round 3: A hits 2 (+40), B misses by 1 (-10)
    g = playRound(g, { A: [2, 2], B: [1, 0] });
    // Round 4: A misses by 2 (-20), B hits 0 (+20)
    g = playRound(g, { A: [1, 3], B: [0, 0] });
    const a = g.state.playerStates.find((p) => p.player.name === "A")!;
    const b = g.state.playerStates.find((p) => p.player.name === "B")!;
    expect(playerScore(a)).toBe(20); // 40 - 20
    expect(playerScore(b)).toBe(10); // -10 + 20
  });
});

// Fill the current round with a valid, complete set of entries (every player
// predicts and makes 0) so finishRound will accept it.
function fillCurrentRound(game: Game): Game {
  let g = game;
  for (const ps of game.state.playerStates) {
    g = setPrediction(g, { playerName: ps.player.name, value: 0 });
    g = setActual(g, { playerName: ps.player.name, value: 0 });
  }
  return g;
}

function finishOrThrow(game: Game): Game {
  const result = finishRound(game);
  if (!result.ok) throw new Error(result.errors.join(", "));
  return result.game;
}

describe("finishRound", () => {
  it("advances the round and stamps the finished round as the trigger", () => {
    const g1 = finishOrThrow(fillCurrentRound(makeGame(["A", "B", "C"])));
    expect(g1.state.currentRound).toBe(2);
    expect(g1.state.roundResultTrigger).toBe(1);
  });

  it("rotates the turn order (first player moves to the end)", () => {
    const g1 = finishOrThrow(fillCurrentRound(makeGame(["A", "B", "C"])));
    expect(g1.state.playerStates.map((p) => p.player.name)).toEqual([
      "B",
      "C",
      "A",
    ]);
  });

  it("returns to the original order after a full rotation", () => {
    let g = makeGame(["A", "B", "C"]);
    for (let i = 0; i < 3; i++) g = finishOrThrow(fillCurrentRound(g));
    expect(g.state.playerStates.map((p) => p.player.name)).toEqual([
      "A",
      "B",
      "C",
    ]);
  });

  it("never advances past the last round", () => {
    let g = makeGame(["A", "B", "C", "D", "E", "F"]); // maxRounds = 10
    for (let i = 0; i < 15; i++) g = finishOrThrow(fillCurrentRound(g));
    expect(g.state.currentRound).toBe(10);
  });

  it("refuses to finish an incomplete round without mutating state", () => {
    const g0 = makeGame(["A", "B", "C"]);
    const result = finishRound(g0);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.join(" ")).toMatch(/Ansage fehlt/);
      expect(result.errors.join(" ")).toMatch(/Stiche fehlen/);
    }
  });

  it("refuses when only some players are missing tricks", () => {
    let g = makeGame(["A", "B"]);
    g = setPrediction(g, { playerName: "A", value: 1 });
    g = setActual(g, { playerName: "A", value: 1 });
    g = setPrediction(g, { playerName: "B", value: 0 });
    // B has no actual yet.
    const result = finishRound(g);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.join(" ")).toContain("B");
    }
  });
});

describe("value clamping on entry", () => {
  it("clamps a prediction above the round number down to the round", () => {
    const g0 = makeGame(["A", "B"]); // round 1
    const g1 = setPrediction(g0, { playerName: "A", value: 9 });
    expect(g1.state.playerStates[0].points.predicted[0]).toBe(1);
  });

  it("clamps negative values up to 0", () => {
    const g0 = makeGame(["A", "B"]);
    const g1 = setActual(g0, { playerName: "A", value: -5 });
    expect(g1.state.playerStates[0].points.actual[0]).toBe(0);
  });

  it("clamps against the target round, not the current round", () => {
    const g0 = makeGame(["A", "B"]); // maxRounds 30
    const g1 = setPrediction(g0, { playerName: "A", value: 99, round: 4 });
    expect(g1.state.playerStates[0].points.predicted[3]).toBe(4);
  });
});

describe("validateRound", () => {
  it("is valid for a complete, legal round", () => {
    let g = makeGame(["A", "B"]);
    g = setPrediction(g, { playerName: "A", value: 1 });
    g = setActual(g, { playerName: "A", value: 1 });
    g = setPrediction(g, { playerName: "B", value: 0 });
    g = setActual(g, { playerName: "B", value: 0 });
    expect(validateRound(g)).toEqual({ valid: true, errors: [] });
  });

  it("flags the forbidden 'darf nicht aufgehen' prediction at commit", () => {
    // round 3, mustNotAddUp. A predicts 1, B predicts 0 -> forbidden for C is 2.
    let g = makeGame(["A", "B", "C"], true);
    g = setCurrentRound(g, 3);
    g = setPrediction(g, { playerName: "A", value: 1 });
    g = setPrediction(g, { playerName: "B", value: 0 });
    g = setPrediction(g, { playerName: "C", value: 2 }); // forbidden
    for (const name of ["A", "B", "C"]) {
      g = setActual(g, { playerName: name, value: 0 });
    }
    const result = validateRound(g);
    expect(result.valid).toBe(false);
    expect(result.errors.join(" ")).toMatch(/darf nicht 2/);
  });

  it("allows the last predictor's value when it is not the forbidden one", () => {
    let g = makeGame(["A", "B", "C"], true);
    g = setCurrentRound(g, 3);
    g = setPrediction(g, { playerName: "A", value: 1 });
    g = setPrediction(g, { playerName: "B", value: 0 });
    g = setPrediction(g, { playerName: "C", value: 1 }); // sum 2 != 3, fine
    for (const name of ["A", "B", "C"]) {
      g = setActual(g, { playerName: name, value: 0 });
    }
    expect(validateRound(g).valid).toBe(true);
  });
});

describe("reorderPlayers", () => {
  it("reorders and stamps a fresh display order", () => {
    const g0 = makeGame(["A", "B", "C"]);
    const g1 = reorderPlayers(g0, [2, 0, 1]);
    expect(g1.state.playerStates.map((p) => p.player.name)).toEqual([
      "C",
      "A",
      "B",
    ]);
    expect(g1.state.playerStates.map((p) => p.player.order)).toEqual([0, 1, 2]);
  });

  it("preserves each player's accumulated points through a reorder", () => {
    let g = setCurrentRound(makeGame(["A", "B", "C"]), 3);
    g = playRound(g, { A: [2, 2], B: [0, 0], C: [1, 1] });
    // after finishRound the order rotated to B, C, A
    g = reorderPlayers(g, [2, 1, 0]); // A, C, B
    const a = g.state.playerStates.find((p) => p.player.name === "A")!;
    expect(playerScore(a)).toBe(40);
  });
});

describe("corrections", () => {
  it("setCurrentRound jumps to any valid round, clamped", () => {
    const g0 = makeGame(["A", "B"]); // maxRounds = 30
    expect(setCurrentRound(g0, 5).state.currentRound).toBe(5);
    expect(setCurrentRound(g0, 0).state.currentRound).toBe(1);
    expect(setCurrentRound(g0, 999).state.currentRound).toBe(30);
  });

  it("correcting a past round's value updates the total silently", () => {
    let g = setCurrentRound(makeGame(["A", "B"]), 3);
    g = playRound(g, { A: [2, 2], B: [0, 0] }); // round 3: A +40, trigger=3
    const triggerAfterRound = g.state.roundResultTrigger;
    // Correct round 3: A actually made 1, not 2 -> now a miss by 1 (-10)
    g = setActual(g, { playerName: "A", value: 1, round: 3 });
    const a = g.state.playerStates.find((p) => p.player.name === "A")!;
    expect(playerScore(a)).toBe(-10);
    // The correction must not re-fire the round badge.
    expect(g.state.roundResultTrigger).toBe(triggerAfterRound);
  });
});

describe("ranking", () => {
  it("orders players high-to-low by score", () => {
    let g = setCurrentRound(makeGame(["A", "B", "C"]), 3);
    g = playRound(g, { A: [1, 1], B: [3, 3], C: [0, 2] });
    // A: +30, B: +50, C: -20
    const r = ranking(g);
    expect(r.map((x) => x.playerState.player.name)).toEqual(["B", "A", "C"]);
    expect(r.map((x) => x.score)).toEqual([50, 30, -20]);
  });
});

describe("endGame", () => {
  it("stops the game without touching scores", () => {
    let g = setCurrentRound(makeGame(["A", "B"]), 3);
    g = playRound(g, { A: [2, 2], B: [0, 0] });
    const ended = endGame(g);
    expect(ended.state.running).toBe(false);
    expect(ended.state.playerStates).toEqual(g.state.playerStates);
  });
});

describe("predictionEntryOutcome", () => {
  const base = { totalPlayers: 3, forbiddenValue: null as number | null };

  it("advances after a non-last player predicts", () => {
    expect(
      predictionEntryOutcome({ ...base, value: 2, playerIndex: 0 }),
    ).toEqual({ kind: "advance" });
  });

  it("finishes the phase after the last player predicts", () => {
    expect(
      predictionEntryOutcome({ ...base, value: 2, playerIndex: 2 }),
    ).toEqual({ kind: "finish" });
  });

  it("blocks the last player from the forbidden value", () => {
    expect(
      predictionEntryOutcome({
        totalPlayers: 3,
        forbiddenValue: 1,
        value: 1,
        playerIndex: 2,
      }),
    ).toEqual({ kind: "blocked" });
  });

  it("does not block a non-last player who types the forbidden value", () => {
    expect(
      predictionEntryOutcome({
        totalPlayers: 3,
        forbiddenValue: 1,
        value: 1,
        playerIndex: 0,
      }),
    ).toEqual({ kind: "advance" });
  });

  it("lets the last player finish with a non-forbidden value", () => {
    expect(
      predictionEntryOutcome({
        totalPlayers: 3,
        forbiddenValue: 1,
        value: 2,
        playerIndex: 2,
      }),
    ).toEqual({ kind: "finish" });
  });
});

describe("tricksEntryOutcome", () => {
  it("waits for a second digit while a two-digit count is reachable", () => {
    // round 15: value 1 could still become 10..15
    expect(
      tricksEntryOutcome({
        value: 1,
        digitsEntered: 1,
        playerIndex: 0,
        totalPlayers: 3,
        maxTricks: 15,
      }),
    ).toEqual({ kind: "wait" });
  });

  it("advances on the first digit when no two-digit count is reachable", () => {
    // round 8: value 1 * 10 = 10 > 8, so no second digit possible
    expect(
      tricksEntryOutcome({
        value: 1,
        digitsEntered: 1,
        playerIndex: 0,
        totalPlayers: 3,
        maxTricks: 8,
      }),
    ).toEqual({ kind: "advance" });
  });

  it("advances after a completed two-digit entry", () => {
    expect(
      tricksEntryOutcome({
        value: 12,
        digitsEntered: 2,
        playerIndex: 0,
        totalPlayers: 3,
        maxTricks: 15,
      }),
    ).toEqual({ kind: "advance" });
  });

  it("never auto-advances on the last player (waits for a deliberate Fertig)", () => {
    expect(
      tricksEntryOutcome({
        value: 0,
        digitsEntered: 1,
        playerIndex: 2,
        totalPlayers: 3,
        maxTricks: 8,
      }),
    ).toEqual({ kind: "wait" });
  });
});

describe("full game invariants", () => {
  it("keeps the player set stable across an entire game", () => {
    let g = makeGame(["A", "B", "C", "D"]); // 15 rounds
    for (let round = 1; round <= maxRounds(g); round++) {
      g = playRound(g, {
        A: [1, 1],
        B: [0, 0],
        C: [2, 1],
        D: [0, 0],
      });
    }
    const names = g.state.playerStates.map((p) => p.player.name).sort();
    expect(names).toEqual(["A", "B", "C", "D"]);
    // Each player has exactly one entry per played round.
    for (const ps of g.state.playerStates) {
      expect(ps.points.predicted).toHaveLength(15);
      expect(ps.points.actual).toHaveLength(15);
    }
    // Round never overshoots the max.
    expect(g.state.currentRound).toBe(15);
  });
});
