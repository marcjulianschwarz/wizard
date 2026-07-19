// Per-game scoring, kept in sync with the frontend `currentPoints` in
// services/frontend-vite/src/api/utils.ts. Duplicated (not shared) because the
// two build separately; the function is tiny and its behaviour is fixed.
export function currentPoints(predicted: number[], actual: number[]): number {
  const n = predicted.length;
  let total = 0;
  for (let i = 0; i < n; i += 1) {
    const predicted_ = predicted[i];
    const actual_ = actual[i];

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

const CHARACTERS =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890';

export function generateRandomString(length: number): string {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += CHARACTERS.charAt(Math.floor(Math.random() * CHARACTERS.length));
  }
  return result;
}
