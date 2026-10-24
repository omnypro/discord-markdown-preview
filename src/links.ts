import type { Node } from './parse';

const LINK_TYPES = new Set(['url', 'autolink', 'maskedLink']);

export function isSafeUrl(target: string): boolean {
  return /^https?:\/\//i.test(target.trim());
}

export function isUnfurling(node: Node): boolean {
  return node.type === 'url' || (node.type === 'maskedLink' && !node.suppressed && isSafeUrl(node.target));
}

export function withTrailingSlash(url: string): string {
  return /^https?:\/\/[^/?#]+$/i.test(url) ? `${url}/` : url;
}

function collectUnfurlingLinks(nodes: Node[]): string[] {
  const found: string[] = [];

  for (const node of nodes) {
    if (LINK_TYPES.has(node.type)) {
      if (isUnfurling(node)) found.push(node.target);
    } else if (Array.isArray(node.content)) {
      found.push(...collectUnfurlingLinks(node.content));
    } else if (Array.isArray(node.items)) {
      for (const item of node.items) found.push(...collectUnfurlingLinks(item));
    }
  }

  return found;
}

export function findUnfurlingLinks(nodes: Node[]): string[] {
  const byKey = new Map<string, string>();

  for (const target of collectUnfurlingLinks(nodes)) {
    const key = withTrailingSlash(target);
    if (!byKey.has(key)) byKey.set(key, target);
  }

  return [...byKey.values()];
}
