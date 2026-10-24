import './style.css';
import { LIMITS, countCharacters } from './counter';
import { processDraft } from './draft';
import type { TypedMention } from './mentions';
import { DRAFT_KEY, LIMIT_KEY, readStored, writeStored } from './storage';

function byId<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Missing #${id}`);
  return element as T;
}

const draft = byId<HTMLTextAreaElement>('draft');
const limitToggle = byId<HTMLInputElement>('limit-toggle');
const counter = byId('counter');
const limitStatus = byId('limit-status');
const preview = byId('preview');
const unfurlCount = byId('unfurl-count');
const mentionNotes = byId('mention-notes');

let wasOver = false;

function note(text: string): HTMLParagraphElement {
  const paragraph = document.createElement('p');
  paragraph.textContent = text;
  return paragraph;
}

function renderMentionNotes(mentions: TypedMention[]): void {
  const converting = mentions.filter((mention) => mention.converts).map((mention) => mention.text);
  const failing = mentions.filter((mention) => !mention.converts).map((mention) => mention.text);

  mentionNotes.replaceChildren();
  if (converting.length > 0) {
    mentionNotes.append(note(`Check that these become mentions before posting: ${converting.join(' · ')}`));
  }
  if (failing.length > 0) {
    mentionNotes.append(note(`These won't convert when pasted: ${failing.join(' · ')}. A name needs a space or a colon right after it.`));
  }
}

function update(): void {
  const { html, unfurlLinks, mentions } = processDraft(draft.value);
  preview.innerHTML = html;
  renderMentionNotes(mentions);

  const links = unfurlLinks.length;
  unfurlCount.textContent =
    links === 0 ? 'No links will unfurl in this message.' : `${links} ${links === 1 ? 'link' : 'links'} will unfurl in this message.`;

  const limit = limitToggle.checked ? LIMITS.nitro : LIMITS.standard;
  const count = countCharacters(draft.value);
  const over = count > limit;
  counter.textContent = `${count} / ${limit}`;
  counter.classList.toggle('is-over', over);

  if (over !== wasOver) {
    limitStatus.textContent = over ? 'Over the character limit.' : '';
    wasOver = over;
  }
}

draft.addEventListener('input', () => {
  update();
  writeStored(DRAFT_KEY, draft.value);
});

limitToggle.addEventListener('change', () => {
  update();
  writeStored(LIMIT_KEY, limitToggle.checked ? 'nitro' : 'standard');
});

preview.addEventListener('click', (event) => {
  const spoiler = (event.target as HTMLElement).closest('.md-spoiler');
  if (spoiler) spoiler.classList.add('is-revealed');
});

draft.value = readStored(DRAFT_KEY) ?? '';
limitToggle.checked = readStored(LIMIT_KEY) === 'nitro';
update();
