import { describe, expect, test } from 'bun:test';
import { findUnfurlingLinks } from '../src/links';
import { parseDraft } from '../src/parse';

const unfurling = (draft: string): string[] => findUnfurlingLinks(parseDraft(draft));

describe('links that unfurl', () => {
  test('a bare link unfurls', () => {
    expect(unfurling('Stream: https://altair.tv')).toEqual(['https://altair.tv']);
  });

  test('a masked link unfurls', () => {
    expect(unfurling('[t](https://altair.tv)')).toEqual(['https://altair.tv']);
  });

  test('a link inside bold is found', () => {
    expect(unfurling('**https://altair.tv**')).toEqual(['https://altair.tv']);
  });

  test('a link inside a list item is found', () => {
    expect(unfurling('- https://altair.tv')).toEqual(['https://altair.tv']);
  });

  test('two bare links give two entries in document order', () => {
    expect(unfurling('https://a.com and https://b.com')).toEqual(['https://a.com', 'https://b.com']);
  });

  test('a masked link whose label is a URL counts only its target', () => {
    expect(unfurling('[https://a.com](https://b.com)')).toEqual(['https://b.com']);
  });
});

describe('links that do not unfurl', () => {
  test('a link wrapped in angle brackets', () => {
    expect(unfurling('<https://altair.tv>')).toEqual([]);
  });

  test('a masked link with an angle-bracketed target', () => {
    expect(unfurling('[t](<https://altair.tv>)')).toEqual([]);
  });

  test('a link inside inline code', () => {
    expect(unfurling('`https://x.com`')).toEqual([]);
  });

  test('a link inside a code block', () => {
    expect(unfurling('```\nhttps://x.com\n```')).toEqual([]);
  });

  test('a draft with no links', () => {
    expect(unfurling('just words')).toEqual([]);
  });
});
