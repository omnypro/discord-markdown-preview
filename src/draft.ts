import { findUnfurlingLinks } from './links';
import { parseDraft } from './parse';
import { type RenderOptions, escapeHtml, renderHtml } from './render';

export type ProcessedDraft = { html: string; unfurlLinks: string[] };

export function processDraft(text: string, options?: RenderOptions): ProcessedDraft {
  try {
    const nodes = parseDraft(text);
    return { html: renderHtml(nodes, options), unfurlLinks: findUnfurlingLinks(nodes) };
  } catch {
    return { html: escapeHtml(text), unfurlLinks: [] };
  }
}
