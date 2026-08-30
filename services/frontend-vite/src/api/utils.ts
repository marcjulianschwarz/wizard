import { type Game, type PlayerState } from "./entities";

// For the "Darf nicht aufgehen" rule: the value the last player to predict is
// forbidden to pick, so the total of all predictions does not equal the round
// number. `predictionOrder` is the players in the order they predict this round
// (index 0 first, last index predicts last). Returns null when it can't apply
// yet (rule off, not all earlier players have predicted, or the forbidden value
// falls outside the valid 0..round range so any pick is fine).
export function forbiddenLastPrediction(props: {
  game: Game;
  predictionOrder: PlayerState[];
}): number | null {
  const { game, predictionOrder } = props;
  if (!game.settings?.mustNotAddUp) return null;
  if (predictionOrder.length < 2) return null;

  const round = game.state.currentRound;
  const earlier = predictionOrder.slice(0, -1);

  let sum = 0;
  for (const ps of earlier) {
    const predicted = ps.points.predicted[round - 1];
    // The rule only becomes determinable once every earlier player predicted.
    if (predicted === undefined) return null;
    sum += predicted;
  }

  const forbidden = round - sum;
  // Out of the pickable range (0..round) — no value is actually blocked.
  if (forbidden < 0 || forbidden > round) return null;
  return forbidden;
}

export function getTimeDifference(
  start: number,
  end: number,
): { minutes: string; hours: string } {
  // Calculate the difference in milliseconds
  const diffMs = end - start;

  // Convert to minutes
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  // Convert to hours with one decimal place
  const diffHours = (diffMs / (1000 * 60 * 60)).toFixed(1);

  return {
    minutes: `${diffMinutes}min`,
    hours: `${diffHours}h`,
  };
}

export function currentPoints(
  predicted: (number | undefined)[],
  actual: (number | undefined)[],
) {
  const n = predicted.length;
  let total = 0;
  for (let i = 0; i < n; i += 1) {
    const predicted_ = predicted[i];
    const actual_ = actual[i];

    // Skip if either value is undefined (round not completed yet)
    if (predicted_ === undefined || actual_ === undefined) {
      continue;
    }

    if (predicted_ == actual_) {
      total += 20; // bonus points
      total += predicted_ * 10; // normal points
    } else {
      const penalty = Math.abs(predicted_ - actual_);
      total -= penalty * 10;
    }
  }
  return total;
}

// Points scored in a single round (1-based). Returns null if that round is not
// fully scored yet (missing prediction or actual). Positive = gained, negative
// = lost — same scoring as currentPoints for one round.
export function roundPoints(
  playerState: PlayerState,
  round: number,
): number | null {
  const predicted = playerState.points.predicted[round - 1];
  const actual = playerState.points.actual[round - 1];
  if (predicted === undefined || actual === undefined) return null;
  if (predicted === actual) return 20 + predicted * 10;
  return -Math.abs(predicted - actual) * 10;
}

export function lineChartPointsValues(
  playerState: PlayerState,
  currentRound: number,
) {
  const numbers = [];
  for (let i = 0; i < currentRound; i++) {
    const predicted = playerState.points.predicted.slice(0, i);
    const actual = playerState.points.actual.slice(0, i);
    numbers.push(currentPoints(predicted, actual));
  }
  return numbers;
}

// Rank each player (1 = best) by their total after the first `roundsScored`
// rounds. Ties share a rank (e.g. 1, 1, 3). Returns a name→rank map. Used to
// compare standings across rounds for the trend indicator.
function rankByNameAfter(
  playerStates: PlayerState[],
  roundsScored: number,
): Map<string, number> {
  const scored = playerStates.map((ps) => ({
    name: ps.player.name,
    score: currentPoints(
      ps.points.predicted.slice(0, roundsScored),
      ps.points.actual.slice(0, roundsScored),
    ),
  }));
  scored.sort((a, b) => b.score - a.score);

  const ranks = new Map<string, number>();
  scored.forEach((entry, idx) => {
    const rank =
      idx > 0 && entry.score === scored[idx - 1].score
        ? ranks.get(scored[idx - 1].name)!
        : idx + 1;
    ranks.set(entry.name, rank);
  });
  return ranks;
}

// How each player's rank moved from the round before `round` to after it.
// Positive = climbed (rank number went down), negative = dropped, 0 = held.
// Returns a name→delta map. `round` is 1-based (the round that just finished);
// there is no trend for round 1 (no prior standing), so it returns all zeros.
export function rankTrends(
  playerStates: PlayerState[],
  round: number,
): Map<string, number> {
  const trends = new Map<string, number>();
  if (round < 2) {
    for (const ps of playerStates) trends.set(ps.player.name, 0);
    return trends;
  }
  const before = rankByNameAfter(playerStates, round - 1);
  const after = rankByNameAfter(playerStates, round);
  for (const ps of playerStates) {
    const name = ps.player.name;
    const prev = before.get(name) ?? 0;
    const curr = after.get(name) ?? 0;
    trends.set(name, prev - curr);
  }
  return trends;
}
