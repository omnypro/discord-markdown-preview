export const LIMITS = { standard: 2000, nitro: 4000 } as const;

export function countCharacters(text: string): number {
  return Array.from(text).length;
}
