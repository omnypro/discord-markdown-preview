export const DRAFT_KEY = 'discord-markdown-preview:draft';
export const LIMIT_KEY = 'discord-markdown-preview:limit';

export function readStored(key: string): string | null {
  try {
    return globalThis.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeStored(key: string, value: string): void {
  try {
    globalThis.localStorage.setItem(key, value);
  } catch {
    return;
  }
}
