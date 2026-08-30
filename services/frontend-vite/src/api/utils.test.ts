import { describe, expect, it } from "vitest";
import type { Game, PlayerState } from "./entities";
import {
  currentPoints,
  forbiddenLastPrediction,
  lineChartPointsValues,
  rankTrends,
  roundPoints,
} from "./utils";

// Build a game at a given round with the "mustNotAddUp" rule optionally on, and
// a list of predictions for the current round (undefined = not yet predicted).
function gameWithPredictions(props: {
  round: number;
  mustNotAddUp: boolean;
  predictions: (number | undefined)[];
}): Game {
  const { round, mustNotAddUp, predictions } = props;
  const playerStates: PlayerState[] = predictions.map((p, i) => {
    const predicted: (number | undefined)[] = [];
    predicted[round - 1] = p;
    return {
      player: { name: `P${i}`, color: "🎩", order: i },
      points: { predicted, actual: [] },
    };
  });
  return {
    joinCode: "X",
    settings: { mustNotAddUp },
    state: {
      startTime: 0,
      currentRound: round,
      running: true,
      playerStates,
    },
  };
}

describe("currentPoints", () => {
  it("scores a single exact hit as 20 + 10*prediction", () => {
    expect(currentPoints([3], [3])).toBe(50);
    expect(currentPoints([0], [0])).toBe(20);
  });

  it("penalises 10 per trick of error on a miss", () => {
    expect(currentPoints([3], [1])).toBe(-20);
    expect(currentPoints([0], [2])).toBe(-20);
  });

  it("skips rounds missing either value", () => {
    expect(currentPoints([3, undefined], [3])).toBe(50);
    expect(currentPoints([3], [])).toBe(0);
  });

  it("is symmetric under swapping predicted/actual (documents the invariant)", () => {
    // The scoring only differs on the bonus term (uses predicted), but on a hit
    // predicted === actual, and the miss penalty is |a-b| — so swapping never
    // changes the result. lineChartPointsValues historically relied on this.
    for (const [a, b] of [
      [3, 3],
      [3, 1],
      [0, 2],
      [5, 5],
    ]) {
      expect(currentPoints([a], [b])).toBe(currentPoints([b], [a]));
    }
  });
});

describe("roundPoints", () => {
  const ps = (predicted: (number | undefined)[], actual: number[]): PlayerState => ({
    player: { name: "P", color: "🎩" },
    points: { predicted, actual },
  });

  it("returns the single round's score for a 1-based round", () => {
    expect(roundPoints(ps([2, 3], [2, 0]), 1)).toBe(40); // hit 2
    expect(roundPoints(ps([2, 3], [2, 0]), 2)).toBe(-30); // missed by 3
  });

  it("returns null when the round is not fully scored", () => {
    expect(roundPoints(ps([undefined], []), 1)).toBeNull();
    expect(roundPoints(ps([2], []), 1)).toBeNull();
  });
});

describe("rankTrends", () => {
  const player = (
    name: string,
    predicted: number[],
    actual: number[],
  ): PlayerState => ({
    player: { name, color: "🎩" },
    points: { predicted, actual },
  });

  it("reports who climbed and who dropped over the round", () => {
    // After R1: B=30 (rank 1), A=20 (rank 2).
    // After R2: A=60 (rank 1), B=20 (rank 2) — they swap.
    const a = player("A", [0, 2], [0, 2]);
    const b = player("B", [1, 1], [1, 0]);
    const trends = rankTrends([a, b], 2);
    expect(trends.get("A")).toBe(1); // 2nd -> 1st
    expect(trends.get("B")).toBe(-1); // 1st -> 2nd
  });

  it("is all zeros for round 1 (no prior standing)", () => {
    const a = player("A", [0], [0]);
    const b = player("B", [1], [1]);
    const trends = rankTrends([a, b], 1);
    expect(trends.get("A")).toBe(0);
    expect(trends.get("B")).toBe(0);
  });

  it("reports 0 for a player whose rank held", () => {
    // A leads both rounds; C stays last. Only the middle can move.
    const a = player("A", [2, 2], [2, 2]); // 40, then 80
    const b = player("B", [1, 1], [1, 1]); // 30, then 60
    const c = player("C", [0, 0], [0, 0]); // 20, then 40
    const trends = rankTrends([a, b, c], 2);
    expect(trends.get("A")).toBe(0);
    expect(trends.get("B")).toBe(0);
    expect(trends.get("C")).toBe(0);
  });
});

describe("lineChartPointsValues", () => {
  it("produces a cumulative running total, one point per completed round", () => {
    const ps: PlayerState = {
      player: { name: "P", color: "🎩" },
      // R1 hit 1 (+30), R2 missed by 2 (-20), R3 hit 0 (+20)
      points: { predicted: [1, 3, 0], actual: [1, 1, 0] },
    };
    const values = lineChartPointsValues(ps, 3);
    // index i uses the first i rounds: [] -> 0, [R1] -> 30, [R1,R2] -> 10
    expect(values).toEqual([0, 30, 10]);
  });
});

describe("forbiddenLastPrediction", () => {
  it("returns null when the rule is off", () => {
    const game = gameWithPredictions({
      round: 3,
      mustNotAddUp: false,
      predictions: [1, 1, undefined],
    });
    expect(
      forbiddenLastPrediction({ game, predictionOrder: game.state.playerStates }),
    ).toBeNull();
  });

  it("returns null until every earlier player has predicted", () => {
    const game = gameWithPredictions({
      round: 3,
      mustNotAddUp: true,
      predictions: [1, undefined, undefined],
    });
    expect(
      forbiddenLastPrediction({ game, predictionOrder: game.state.playerStates }),
    ).toBeNull();
  });

  it("forbids the value that would make predictions sum to the round", () => {
    // round 3, earlier predictions sum to 1 -> forbidden = 3 - 1 = 2
    const game = gameWithPredictions({
      round: 3,
      mustNotAddUp: true,
      predictions: [1, 0, undefined],
    });
    expect(
      forbiddenLastPrediction({ game, predictionOrder: game.state.playerStates }),
    ).toBe(2);
  });

  it("returns null when the forbidden value is outside 0..round", () => {
    // earlier predictions already sum to 5 in round 3 -> forbidden = -2, unpickable
    const game = gameWithPredictions({
      round: 3,
      mustNotAddUp: true,
      predictions: [3, 2, undefined],
    });
    expect(
      forbiddenLastPrediction({ game, predictionOrder: game.state.playerStates }),
    ).toBeNull();
  });

  it("allows a forbidden value of exactly 0 (in range)", () => {
    // round 3, earlier sum to 3 -> forbidden = 0, which is pickable so blocked
    const game = gameWithPredictions({
      round: 3,
      mustNotAddUp: true,
      predictions: [2, 1, undefined],
    });
    expect(
      forbiddenLastPrediction({ game, predictionOrder: game.state.playerStates }),
    ).toBe(0);
  });

  it("returns null with fewer than two players", () => {
    const game = gameWithPredictions({
      round: 1,
      mustNotAddUp: true,
      predictions: [0],
    });
    expect(
      forbiddenLastPrediction({ game, predictionOrder: game.state.playerStates }),
    ).toBeNull();
  });
});
