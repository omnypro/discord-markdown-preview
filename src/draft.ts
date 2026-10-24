import { findUnfurlingLinks } from './links';
import { type TypedMention, findTypedMentions } from './mentions';
import { parseDraft } from './parse';
import { type RenderOptions, escapeHtml, renderHtml } from './render';

export type ProcessedDraft = { html: string; unfurlLinks: string[]; mentions: TypedMention[] };

export function processDraft(text: string, options?: RenderOptions): ProcessedDraft {
  const mentions = findTypedMentions(text);

  try {
    const nodes = parseDraft(text);
    return { html: renderHtml(nodes, options), unfurlLinks: findUnfurlingLinks(nodes), mentions };
  } catch {
    return { html: escapeHtml(text), unfurlLinks: [], mentions };
  }
}
