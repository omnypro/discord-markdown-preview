import { expect, test } from 'bun:test';
import { parse } from 'discord-markdown-parser';

test('the parser is installed and reads a heading', () => {
  const node = parse('# H1', 'normal')[0];
  expect(node.type).toBe('heading');
  expect((node as { level?: number }).level).toBe(1);
});
