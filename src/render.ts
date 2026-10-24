import { isSafeUrl, isUnfurling, withTrailingSlash } from './links';
import type { Node } from './parse';

export type RenderOptions = { now?: Date; timeZone?: string };

type Context = { now: Date; timeZone?: string; inLink?: boolean };

const EMOJI_SIZE = 48;

const TIMESTAMP_FORMATS: Record<string, Intl.DateTimeFormatOptions> = {
  t: { timeStyle: 'short' },
  T: { timeStyle: 'medium' },
  d: { year: 'numeric', month: '2-digit', day: '2-digit' },
  D: { dateStyle: 'long' },
  f: { dateStyle: 'long', timeStyle: 'short' },
  F: { dateStyle: 'full', timeStyle: 'short' },
};

const RELATIVE_UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 31536000],
  ['month', 2592000],
  ['day', 86400],
  ['hour', 3600],
  ['minute', 60],
  ['second', 1],
];

const GUILD_NAVIGATION_LABELS: Record<string, string> = {
  customize: 'Channels & Roles',
  browse: 'Browse Channels',
  guide: 'Server Guide',
  'linked-roles': 'Linked Roles',
};

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatRelative(date: Date, now: Date): string {
  const seconds = Math.round((date.getTime() - now.getTime()) / 1000);
  const [unit, size] = RELATIVE_UNITS.find(([, size]) => Math.abs(seconds) >= size) ?? ['second', 1];
  return new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(Math.round(seconds / size), unit);
}

function renderTimestamp(node: Node, context: Context): string {
  const date = new Date(Number(node.timestamp) * 1000);
  const format: string = node.format ?? 'f';

  if (Number.isNaN(date.getTime())) {
    return escapeHtml(`<t:${node.timestamp}${node.format ? `:${node.format}` : ''}>`);
  }

  const text =
    format === 'R'
      ? formatRelative(date, context.now)
      : new Intl.DateTimeFormat('en-US', {
          ...(TIMESTAMP_FORMATS[format] ?? TIMESTAMP_FORMATS.f),
          timeZone: context.timeZone,
        }).format(date);

  return `<span class="md-timestamp">${escapeHtml(text)}</span>`;
}

function renderLinkLabel(node: Node, context: Context): string {
  return node.type === 'maskedLink' ? renderNodes(node.content, context) : escapeHtml(node.target);
}

function renderLink(node: Node, context: Context): string {
  if (context.inLink) return renderLinkLabel(node, context);

  const target: string = node.target;
  const unfurls = isUnfurling(node);
  const labelContext = { ...context, inLink: true };

  if (!isSafeUrl(target)) {
    if (node.type === 'maskedLink') {
      const wrapped = node.suppressed ? `&lt;${escapeHtml(target)}&gt;` : escapeHtml(target);
      return `[${renderNodes(node.content, labelContext)}](${wrapped})`;
    }
    return escapeHtml(node.type === 'autolink' ? `<${target}>` : target);
  }

  const label = node.type === 'url' ? escapeHtml(withTrailingSlash(target)) : renderLinkLabel(node, labelContext);
  const classes = unfurls ? 'md-link md-link--unfurl' : 'md-link';
  return `<a class="${classes}" href="${escapeHtml(target)}" target="_blank" rel="noopener noreferrer">${label}</a>`;
}

function renderNode(node: Node, context: Context): string {
  switch (node.type) {
    case 'text':
      return escapeHtml(node.content);
    case 'br':
      return '<br>';
    case 'strong':
      return `<strong>${renderNodes(node.content, context)}</strong>`;
    case 'em':
      return `<em>${renderNodes(node.content, context)}</em>`;
    case 'underline':
      return `<u>${renderNodes(node.content, context)}</u>`;
    case 'strikethrough':
      return `<s>${renderNodes(node.content, context)}</s>`;
    case 'spoiler':
      return `<span class="md-spoiler"><span class="md-spoiler-content">${renderNodes(node.content, context)}</span></span>`;
    case 'inlineCode':
      return `<code class="md-code-inline">${escapeHtml(node.content)}</code>`;
    case 'codeBlock':
      return `<pre class="md-code-block"><code>${escapeHtml(node.content)}</code></pre>`;
    case 'heading':
      return `<div class="md-h${node.level}">${renderNodes(node.content, context)}</div>`;
    case 'subtext':
      return `<div class="md-subtext">${renderNodes(node.content, context)}</div>`;
    case 'blockQuote': {
      const content: Node[] = node.content;
      const trimmed = content.at(-1)?.type === 'br' ? content.slice(0, -1) : content;
      return `<blockquote class="md-quote">${renderNodes(trimmed, context)}</blockquote>`;
    }
    case 'list': {
      const items = (node.items as Node[][]).map((item) => `<li>${renderNodes(item, context)}</li>`).join('');
      if (!node.ordered) return `<ul class="md-list">${items}</ul>`;

      const start: number = node.start ?? 1;
      const startAttribute = start === 1 ? '' : ` start="${start}"`;
      const width = String(start + node.items.length - 1).length;
      return `<ol class="md-list"${startAttribute} style="--total-characters:${width}">${items}</ol>`;
    }
    case 'url':
    case 'autolink':
    case 'maskedLink':
      return renderLink(node, context);
    case 'everyone':
      return '<span class="md-mention">@everyone</span>';
    case 'here':
      return '<span class="md-mention">@here</span>';
    case 'user':
      return '<span class="md-mention">@user</span>';
    case 'role':
      return '<span class="md-mention">@role</span>';
    case 'channel':
      return '<span class="md-mention">#channel</span>';
    case 'guildNavigation':
      return `<span class="md-mention">${escapeHtml(GUILD_NAVIGATION_LABELS[node.navigation] ?? node.navigation)}</span>`;
    case 'slashCommand':
      return `<span class="md-mention">/${escapeHtml(node.fullName)}</span>`;
    case 'emoji': {
      const extension = node.animated ? 'gif' : 'webp';
      const src = `https://cdn.discordapp.com/emojis/${escapeHtml(node.id)}.${extension}?size=${EMOJI_SIZE}`;
      return `<img class="md-emoji" src="${src}" alt=":${escapeHtml(node.name)}:" draggable="false">`;
    }
    case 'twemoji':
      return escapeHtml(node.name);
    case 'timestamp':
      return renderTimestamp(node, context);
    default:
      if (typeof node.content === 'string') return escapeHtml(node.content);
      if (Array.isArray(node.content)) return renderNodes(node.content, context);
      return '';
  }
}

function renderNodes(nodes: Node[], context: Context): string {
  return nodes.map((node) => renderNode(node, context)).join('');
}

export function renderHtml(nodes: Node[], options: RenderOptions = {}): string {
  return renderNodes(nodes, { now: options.now ?? new Date(), timeZone: options.timeZone });
}
