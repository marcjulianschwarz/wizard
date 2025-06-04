import { PlayerState } from "./entities";

export function getTimeDifference(
  start: number,
  end: number
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

export function currentPoints(predicted: number[], actual: number[]) {
  const n = predicted.length;
  let total = 0;
  for (let i = 0; i < n; i += 1) {
    const predicted_ = predicted[i];
    const actual_ = actual[i];

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

export function lineChartPointsValues(
  playerState: PlayerState,
  currentRound: number
) {
  const numbers = [];
  for (let i = 0; i < currentRound; i++) {
    const actual = playerState.points.actual.slice(0, i);
    const predicted = playerState.points.predicted.slice(0, i);
    numbers.push(currentPoints(actual, predicted));
  }
  return numbers;
}
