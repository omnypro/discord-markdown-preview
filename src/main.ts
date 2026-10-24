import './style.css';
import { LIMITS, countCharacters } from './counter';
import { findUnfurlingLinks } from './links';
import { parseDraft } from './parse';
import { renderHtml } from './render';
import { DRAFT_KEY, LIMIT_KEY, readStored, writeStored } from './storage';

function byId<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Missing #${id}`);
  return element as T;
}

const draft = byId<HTMLTextAreaElement>('draft');
const limitToggle = byId<HTMLInputElement>('limit-toggle');
const counter = byId('counter');
const preview = byId('preview');
const unfurlCount = byId('unfurl-count');

function update(): void {
  const nodes = parseDraft(draft.value);
  preview.innerHTML = renderHtml(nodes);

  const links = findUnfurlingLinks(nodes).length;
  unfurlCount.textContent =
    links === 0 ? 'No links will unfurl in this message.' : `${links} ${links === 1 ? 'link' : 'links'} will unfurl in this message.`;

  const limit = limitToggle.checked ? LIMITS.nitro : LIMITS.standard;
  const count = countCharacters(draft.value);
  counter.textContent = `${count} / ${limit}`;
  counter.classList.toggle('is-over', count > limit);
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
  if (spoiler) spoiler.classList.toggle('is-revealed');
});

draft.value = readStored(DRAFT_KEY) ?? '';
limitToggle.checked = readStored(LIMIT_KEY) === 'nitro';
update();
