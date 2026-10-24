import { describe, expect, test } from 'bun:test';
import { processDraft } from '../src/draft';

describe('processDraft', () => {
  test('returns rendered HTML and the links that will unfurl', () => {
    const result = processDraft('**hi** https://x.com');
    expect(result.html).toContain('<strong>hi</strong>');
    expect(result.unfurlLinks).toEqual(['https://x.com']);
  });

  test('an empty draft renders nothing', () => {
    expect(processDraft('')).toEqual({ html: '', unfurlLinks: [], mentions: [] });
  });

  test('typed mentions are reported', () => {
    const result = processDraft('hi @dayvemsee, and @someone ok');
    expect(result.mentions.map((mention) => [mention.text, mention.converts])).toEqual([
      ['@dayvemsee,', false],
      ['@someone', true],
    ]);
  });

  test('input that makes the parser throw falls back to the escaped draft', () => {
    const draft = '*'.repeat(20000);
    const result = processDraft(draft);
    expect(result.html).toBe(draft);
    expect(result.unfurlLinks).toEqual([]);
    expect(result.mentions).toEqual([]);
  });
});
