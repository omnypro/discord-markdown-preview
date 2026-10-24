import { describe, expect, test } from 'bun:test';
import { parseDraft } from '../src/parse';
import { renderHtml } from '../src/render';

const render = (draft: string, options?: Parameters<typeof renderHtml>[1]): string =>
  renderHtml(parseDraft(draft), options);

describe('headings and text styles', () => {
  test('a level-three heading', () => {
    const html = render('### Title');
    expect(html).toContain('class="md-h3"');
    expect(html).toContain('Title');
  });

  test('subtext', () => {
    expect(render('-# note')).toContain('class="md-subtext"');
  });

  test('bold, italic, underline and strikethrough', () => {
    const html = render('**b** *i* __u__ ~~s~~');
    expect(html).toContain('<strong>b</strong>');
    expect(html).toContain('<em>i</em>');
    expect(html).toContain('<u>u</u>');
    expect(html).toContain('<s>s</s>');
  });

  test('a spoiler', () => {
    expect(render('||secret||')).toContain('class="md-spoiler"');
  });

  test('spoiler content sits in its own wrapper so hiding it hides styled children', () => {
    const html = render('||https://x.com||');
    expect(html).toMatch(/<span class="md-spoiler"><span class="md-spoiler-content">.*<a .*<\/a><\/span><\/span>/);
  });

  test('a block quote', () => {
    expect(render('> quoted')).toContain('class="md-quote"');
  });

  test('lists', () => {
    expect(render('- a\n- b')).toContain('<ul class="md-list">');
    expect(render('1. a\n2. b')).toContain('<ol class="md-list"');
  });

  test('an ordered list that starts at 1 has no start attribute', () => {
    expect(render('1. a\n2. b')).not.toContain('start=');
  });

  test('an ordered list keeps the number it starts at', () => {
    expect(render('3. a\n4. b')).toContain('start="3"');
  });

  test('an ordered list reports the width of its largest number', () => {
    expect(render('9. a\n10. b')).toContain('--total-characters:2');
    expect(render('1. a\n2. b')).toContain('--total-characters:1');
  });
});

describe('mentions', () => {
  test('@everyone and @here are pills', () => {
    expect(render('@everyone')).toContain('md-mention');
    expect(render('@here')).toContain('md-mention');
  });

  test('raw mentions get generic labels', () => {
    expect(render('<@838122095404687360>')).toContain('@user');
    expect(render('<@&838122095404687360>')).toContain('@role');
    expect(render('<#838122095404687360>')).toContain('#channel');
  });

  test('a typed name stays plain text', () => {
    expect(render('@someone')).not.toContain('md-mention');
  });

  test('a guild navigation token is a pill with its label', () => {
    const html = render('<838122095404687360:customize>');
    expect(html).toContain('md-mention');
    expect(html).toContain('Channels &amp; Roles');
  });
});

describe('links', () => {
  test('a bare link is marked as unfurling', () => {
    expect(render('https://x.com')).toContain('md-link--unfurl');
  });

  test('an angle-bracketed link is a link that does not unfurl', () => {
    const html = render('<https://x.com>');
    expect(html).toContain('md-link');
    expect(html).not.toContain('md-link--unfurl');
  });

  test('a masked link with an angle-bracketed target does not unfurl', () => {
    const html = render('[t](<https://x.com>)');
    expect(html).toContain('href="https://x.com"');
    expect(html).not.toContain('md-link--unfurl');
  });

  test('a masked link shows its label and links to its target', () => {
    const html = render('[this thread](https://x.com/a?b=1&c=2)');
    expect(html).toContain('this thread');
    expect(html).toContain('href="https://x.com/a?b=1&amp;c=2"');
    expect(html).toContain('md-link--unfurl');
  });

  test('a URL used as a masked link label is text, not a second link', () => {
    const html = render('[https://a.com](<https://a.com>)');
    expect(html.match(/<a /g)).toHaveLength(1);
    expect(html).not.toContain('md-link--unfurl');
  });

  test('a URL label on an unsuppressed masked link links to the target only', () => {
    const html = render('[https://a.com](https://b.com)');
    expect(html.match(/<a /g)).toHaveLength(1);
    expect(html).toContain('href="https://b.com"');
  });

  test('a javascript: masked link has no href and keeps its label', () => {
    const html = render('[x](javascript:alert(1))');
    expect(html).not.toContain('href');
    expect(html).toContain('x');
  });

  test('a data: masked link has no href', () => {
    expect(render('[x](data:text/html,hi)')).not.toContain('href');
  });

  test('an angle-bracketed javascript: link has no href', () => {
    expect(render('<javascript://%0aalert(1)>')).not.toContain('href');
  });
});

describe('timestamps', () => {
  const now = new Date('2023-11-14T22:13:20Z');

  test('relative format at the same instant reads now', () => {
    expect(render('<t:1700000000:R>', { now })).toContain('now');
  });

  test('relative format two hours later', () => {
    const later = new Date('2023-11-15T00:13:20Z');
    expect(render('<t:1700000000:R>', { now: later })).toContain('2 hours ago');
  });

  test('full format in UTC', () => {
    const html = render('<t:1700000000:F>', { now, timeZone: 'UTC' });
    expect(html).toContain('Tuesday, November 14, 2023');
    expect(html).toContain('md-timestamp');
  });

  test('short time in UTC', () => {
    expect(render('<t:1700000000:t>', { now, timeZone: 'UTC' })).toContain('10:13');
  });
});

describe('emoji', () => {
  test('a custom emoji is an image on the Discord CDN', () => {
    const html = render('<:name:838122095404687360>');
    expect(html).toContain('<img');
    expect(html).toContain('src="https://cdn.discordapp.com/emojis/838122095404687360.webp?size=48"');
  });

  test('an animated custom emoji uses the same CDN host', () => {
    expect(render('<a:dance:838122095404687360>')).toContain('https://cdn.discordapp.com/emojis/838122095404687360');
  });
});

describe('untrusted text', () => {
  test('script and img tags are shown as text', () => {
    const html = render('<script>alert(1)</script> <img src=x onerror=alert(1)>');
    expect(html).toContain('&lt;script&gt;');
    expect(html).toContain('&lt;img');
    expect(html).not.toContain('<script');
    expect(html).not.toContain('<img');
  });

  test('quotes in text are escaped', () => {
    expect(render('say "hi"')).toContain('&quot;hi&quot;');
  });
});

describe('code keeps its markup literal', () => {
  test('@everyone in inline code is not a pill', () => {
    const html = render('`@everyone`');
    expect(html).toContain('md-code-inline');
    expect(html).not.toContain('md-mention');
  });

  test('a fenced block keeps bold markers literal', () => {
    const html = render('```\n**bold**\n```');
    expect(html).toContain('md-code-block');
    expect(html).toContain('**bold**');
    expect(html).not.toContain('<strong');
  });
});
