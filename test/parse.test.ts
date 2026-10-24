import { describe, expect, test } from 'bun:test';
import { parseDraft, type Node } from '../src/parse';

const plainText = (nodes: Node[]): string =>
  nodes
    .map((node) => {
      if (node.type === 'br') return '\n';
      if (typeof node.content === 'string') return node.content;
      if (Array.isArray(node.content)) return plainText(node.content);
      return '';
    })
    .join('');

describe('masked links', () => {
  test('a masked link carries its target and is not suppressed', () => {
    const nodes = parseDraft('[this thread](https://discord.com/channels/1/2/3)');
    expect(nodes).toHaveLength(1);
    expect(nodes[0].type).toBe('maskedLink');
    expect(nodes[0].target).toBe('https://discord.com/channels/1/2/3');
    expect(nodes[0].suppressed).toBe(false);
  });

  test('a masked link with an angle-bracketed target is suppressed', () => {
    const nodes = parseDraft('[t](<https://x.com>)');
    expect(nodes[0].type).toBe('maskedLink');
    expect(nodes[0].target).toBe('https://x.com');
    expect(nodes[0].suppressed).toBe(true);
  });
});

describe('lists', () => {
  test('dashes make an unordered list of two items', () => {
    const nodes = parseDraft('- a\n- b');
    expect(nodes).toHaveLength(1);
    expect(nodes[0].type).toBe('list');
    expect(nodes[0].ordered).toBe(false);
    expect(nodes[0].items).toHaveLength(2);
  });

  test('numbers make an ordered list', () => {
    const nodes = parseDraft('1. a\n2. b');
    expect(nodes[0].type).toBe('list');
    expect(nodes[0].ordered).toBe(true);
    expect(nodes[0].items).toHaveLength(2);
  });
});

describe('blocks directly after a list', () => {
  test('a heading on the line after a list is a heading', () => {
    const nodes = parseDraft('- a\n- b\n### Heading');
    expect(nodes.map((node) => node.type)).toEqual(['list', 'heading']);
    expect(nodes[1].level).toBe(3);
  });

  test('subtext on the line after a list is subtext', () => {
    const nodes = parseDraft('- a\n-# note');
    expect(nodes.map((node) => node.type)).toEqual(['list', 'subtext']);
  });

  test('a heading on the line after a block quote is a heading', () => {
    const nodes = parseDraft('> q\n### Heading');
    expect(nodes.map((node) => node.type)).toEqual(['blockQuote', 'heading']);
  });

  test('a hash run in the middle of a line is not a heading', () => {
    expect(parseDraft('a ### b').some((node) => node.type === 'heading')).toBe(false);
  });
});

describe('what the library already parses', () => {
  test('a level-three heading', () => {
    const nodes = parseDraft('### H3');
    expect(nodes[0].type).toBe('heading');
    expect(nodes[0].level).toBe(3);
  });

  test('subtext', () => {
    expect(parseDraft('-# note')[0].type).toBe('subtext');
  });

  test('a user mention', () => {
    expect(parseDraft('<@838122095404687360>')[0].type).toBe('user');
  });

  test('a timestamp', () => {
    expect(parseDraft('<t:1700000000:R>')[0].type).toBe('timestamp');
  });
});

describe('malformed input', () => {
  const inputs = ['', '```js\nlet a', '**unclosed', '<', '[x]('];

  for (const input of inputs) {
    test(`${JSON.stringify(input)} does not throw and shows literally`, () => {
      const nodes = parseDraft(input);
      expect(plainText(nodes)).toBe(input);
    });
  }
});
