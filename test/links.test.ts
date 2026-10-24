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

  test('the same URL twice gives one entry, as Discord makes one embed', () => {
    expect(unfurling('https://avalonstar.com\nhttps://avalonstar.com')).toEqual(['https://avalonstar.com']);
  });

  test('the same URL with and without a trailing slash gives one entry', () => {
    expect(unfurling('https://avalonstar.com\nhttps://avalonstar.com/')).toEqual(['https://avalonstar.com']);
  });

  test('two different paths on one site stay two entries', () => {
    expect(unfurling('https://a.com/x https://a.com/y')).toEqual(['https://a.com/x', 'https://a.com/y']);
  });

  test('the same URL as a bare link and a masked link gives one entry', () => {
    expect(unfurling('https://a.com and [t](https://a.com)')).toEqual(['https://a.com']);
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

  test('a masked link whose target is not http or https', () => {
    expect(unfurling('[x](javascript:alert(1))')).toEqual([]);
    expect(unfurling('[x](ftp://a.com)')).toEqual([]);
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
