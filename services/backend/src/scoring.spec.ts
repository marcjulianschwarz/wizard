import { currentPoints, generateRandomString } from './scoring';

describe('currentPoints', () => {
  it('awards 20 + 10*prediction on an exact hit', () => {
    expect(currentPoints([3], [3])).toBe(50);
    expect(currentPoints([0], [0])).toBe(20);
  });

  it('penalises 10 per trick of error on a miss', () => {
    expect(currentPoints([3], [1])).toBe(-20);
    expect(currentPoints([0], [2])).toBe(-20);
  });

  it('sums across multiple rounds', () => {
    // R1 hit 2 (+40), R2 missed by 1 (-10), R3 hit 0 (+20)
    expect(currentPoints([2, 1, 0], [2, 0, 0])).toBe(50);
  });

  it('skips rounds missing either value', () => {
    expect(currentPoints([3, undefined as never], [3])).toBe(50);
    expect(currentPoints([3], [])).toBe(0);
  });

  it('stays in sync with the frontend scoring rule', () => {
    // Mirror of frontend-vite currentPoints: bonus 20 + predicted*10 on a hit,
    // -10 per trick of deviation on a miss. If these diverge, league standings
    // and the live dashboard would disagree.
    expect(currentPoints([1, 2, 3], [1, 2, 3])).toBe(
      20 + 10 + (20 + 20) + (20 + 30),
    );
  });
});

describe('generateRandomString', () => {
  it('returns a string of the requested length', () => {
    expect(generateRandomString(8)).toHaveLength(8);
    expect(generateRandomString(0)).toHaveLength(0);
  });

  it('uses only alphanumeric characters', () => {
    const s = generateRandomString(200);
    expect(s).toMatch(/^[A-Za-z0-9]+$/);
  });

  it('is practically unique across many calls', () => {
    const seen = new Set<string>();
    for (let i = 0; i < 1000; i++) seen.add(generateRandomString(10));
    // Collisions in 1000 draws of a 62^10 space are astronomically unlikely.
    expect(seen.size).toBe(1000);
  });
});
