import { describe, expect, test } from 'bun:test';
import { findTypedMentions } from '../src/mentions';

describe('typed mentions that convert on paste', () => {
  test('a name followed by a space', () => {
    expect(findTypedMentions('hi @dayvemsee there')).toEqual([{ text: '@dayvemsee', name: 'dayvemsee', converts: true }]);
  });

  test('a name followed by a colon', () => {
    expect(findTypedMentions('@dayvemsee: hello')).toEqual([{ text: '@dayvemsee', name: 'dayvemsee', converts: true }]);
  });

  test('a name at the start of a new line', () => {
    expect(findTypedMentions('hi\n@dayvemsee\nbye')[0].converts).toBe(true);
  });

  test('a name at the end of the draft', () => {
    expect(findTypedMentions('hi @dayvemsee')[0].converts).toBe(true);
  });
});

describe('typed mentions that do not convert on paste', () => {
  const cases: [string, string][] = [
    ['comma', '@dayvemsee, hello'],
    ['period', '@dayvemsee. hello'],
    ['exclamation mark', '@dayvemsee! hello'],
    ['question mark', '@dayvemsee? hello'],
    ['semicolon', '@dayvemsee; hello'],
    ['possessive', "@dayvemsee's hello"],
  ];

  for (const [label, draft] of cases) {
    test(`a name followed by a ${label}`, () => {
      const [mention] = findTypedMentions(draft);
      expect(mention.name).toBe('dayvemsee');
      expect(mention.converts).toBe(false);
    });
  }

  test('the offending character is shown with the name', () => {
    expect(findTypedMentions('@dayvemsee, hello')[0].text).toBe('@dayvemsee,');
  });

  test('a name in parentheses', () => {
    const [mention] = findTypedMentions('hello (@dayvemsee) there');
    expect(mention.converts).toBe(false);
    expect(mention.text).toBe('(@dayvemsee)');
  });
});

describe('what is not a typed mention', () => {
  test('@everyone and @here', () => {
    expect(findTypedMentions('@everyone and @here and @EVERYONE')).toEqual([]);
  });

  test('a raw mention by id', () => {
    expect(findTypedMentions('<@838122095404687360> <@&838122095404687360>')).toEqual([]);
  });

  test('an email address', () => {
    expect(findTypedMentions('write to me@example.com')).toEqual([]);
  });

  test('a handle in a URL path', () => {
    expect(findTypedMentions('https://example.com/@dayvemsee')).toEqual([]);
  });

  test('a name inside inline code', () => {
    expect(findTypedMentions('use `@dayvemsee` here')).toEqual([]);
  });

  test('a name inside a code block', () => {
    expect(findTypedMentions('```\n@dayvemsee\n```')).toEqual([]);
  });

  test('a one-letter name', () => {
    expect(findTypedMentions('@a hello')).toEqual([]);
  });

  test('an empty draft and an unclosed code fence do not throw', () => {
    expect(findTypedMentions('')).toEqual([]);
    expect(findTypedMentions('```\n@dayvemsee')).toEqual([]);
  });
});

describe('names with periods and underscores', () => {
  test('are one name', () => {
    const [mention] = findTypedMentions('@day.vem_see hi');
    expect(mention.name).toBe('day.vem_see');
    expect(mention.converts).toBe(true);
  });

  test('a trailing period is punctuation, not part of the name', () => {
    expect(findTypedMentions('@day.vem. hi')[0].name).toBe('day.vem');
  });
});

describe('several mentions', () => {
  test('are listed in order and the same text is listed once', () => {
    const mentions = findTypedMentions('@aa hi @bb, and @aa again');
    expect(mentions.map((mention) => mention.text)).toEqual(['@aa', '@bb,']);
  });
});
