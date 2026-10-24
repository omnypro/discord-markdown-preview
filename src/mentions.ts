export type TypedMention = { text: string; name: string; converts: boolean };

const MENTION_REGEX = /(?<![A-Za-z0-9_<&/])@([A-Za-z0-9_]+(?:\.[A-Za-z0-9_]+)*)/g;
const IGNORED_NAMES = new Set(['everyone', 'here']);

function withoutCode(draft: string): string {
  return draft.replace(/```[\s\S]*?(?:```|$)/g, ' ').replace(/``[^`]*``|`[^`\n]*`/g, ' ');
}

export function findTypedMentions(draft: string): TypedMention[] {
  const text = withoutCode(draft);
  const seen = new Set<string>();
  const mentions: TypedMention[] = [];

  for (const match of text.matchAll(MENTION_REGEX)) {
    const name = match[1];
    if (name.length < 2 || name.length > 32 || IGNORED_NAMES.has(name.toLowerCase())) continue;

    const start = match.index ?? 0;
    const before = text[start - 1];
    const after = text[start + match[0].length];
    const precededOk = before === undefined || /\s/.test(before);
    const followedOk = after === undefined || /\s/.test(after) || after === ':';

    const shown = `${precededOk ? '' : before}@${name}${followedOk ? '' : after}`;
    if (seen.has(shown)) continue;
    seen.add(shown);
    mentions.push({ text: shown, name, converts: precededOk && followedOk });
  }

  return mentions;
}
