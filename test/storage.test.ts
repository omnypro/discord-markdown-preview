import { afterEach, describe, expect, test } from 'bun:test';
import { DRAFT_KEY, LIMIT_KEY, readStored, writeStored } from '../src/storage';

const original = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');

function stubStorage(stub: unknown): void {
  Object.defineProperty(globalThis, 'localStorage', { value: stub, configurable: true, writable: true });
}

function memoryStorage() {
  const data = new Map<string, string>();
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
  };
}

afterEach(() => {
  if (original) Object.defineProperty(globalThis, 'localStorage', original);
  else delete (globalThis as { localStorage?: unknown }).localStorage;
});

describe('keys', () => {
  test('keys are prefixed with the tool route', () => {
    expect(DRAFT_KEY).toBe('discord-markdown-preview:draft');
    expect(LIMIT_KEY).toBe('discord-markdown-preview:limit');
  });
});

describe('with working storage', () => {
  test('a written value reads back', () => {
    stubStorage(memoryStorage());
    writeStored(DRAFT_KEY, 'hello');
    expect(readStored(DRAFT_KEY)).toBe('hello');
  });

  test('a missing key reads as null', () => {
    stubStorage(memoryStorage());
    expect(readStored('nothing-here')).toBeNull();
  });
});

describe('with storage that fails', () => {
  test('reads and writes do not throw when storage throws', () => {
    stubStorage({
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
    });
    expect(readStored(DRAFT_KEY)).toBeNull();
    expect(() => writeStored(DRAFT_KEY, 'hello')).not.toThrow();
  });

  test('reads and writes do not throw when storage is missing', () => {
    stubStorage(undefined);
    expect(readStored(DRAFT_KEY)).toBeNull();
    expect(() => writeStored(DRAFT_KEY, 'hello')).not.toThrow();
  });
});
