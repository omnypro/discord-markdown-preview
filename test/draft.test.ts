import { describe, expect, test } from 'bun:test';
import { processDraft } from '../src/draft';

describe('processDraft', () => {
  test('returns rendered HTML and the links that will unfurl', () => {
    const result = processDraft('**hi** https://x.com');
    expect(result.html).toContain('<strong>hi</strong>');
    expect(result.unfurlLinks).toEqual(['https://x.com']);
  });

  test('an empty draft renders nothing', () => {
    expect(processDraft('')).toEqual({ html: '', unfurlLinks: [] });
  });

  test('input that makes the parser throw falls back to the escaped draft', () => {
    const draft = '*'.repeat(20000);
    const result = processDraft(draft);
    expect(result.html).toBe(draft);
    expect(result.unfurlLinks).toEqual([]);
  });
});
