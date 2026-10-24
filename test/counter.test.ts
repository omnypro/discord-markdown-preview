import { describe, expect, test } from 'bun:test';
import { LIMITS, countCharacters } from '../src/counter';

describe('countCharacters', () => {
  test('an empty draft is zero', () => {
    expect(countCharacters('')).toBe(0);
  });

  test('plain text counts each character', () => {
    expect(countCharacters('abc')).toBe(3);
  });

  test('an emoji outside the basic plane counts as one', () => {
    expect(countCharacters('a😀b')).toBe(3);
  });

  test('a newline counts as one', () => {
    expect(countCharacters('a\nb')).toBe(3);
  });
});

describe('LIMITS', () => {
  test('the standard limit is 2000 and the Nitro limit is 4000', () => {
    expect(LIMITS.standard).toBe(2000);
    expect(LIMITS.nitro).toBe(4000);
  });

  test('a 2001-character draft is over standard and under Nitro', () => {
    const count = countCharacters('x'.repeat(2001));
    expect(count).toBeGreaterThan(LIMITS.standard);
    expect(count).toBeLessThanOrEqual(LIMITS.nitro);
  });
});
