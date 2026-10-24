import { SimpleMarkdown, parse, rules } from 'discord-markdown-parser';

export type Node = ReturnType<typeof parse>[number];

type Rule = (typeof rules)[string];

const LIST_REGEX = /^( *(?:[-*]|\d+\.) [^\n]*(?:\n *(?:[-*]|\d+\.) [^\n]*)*)\n?/;
const LIST_MARKER_REGEX = /^ *(?:[-*]|\d+\.) /;

const maskedLink: Rule = {
  ...SimpleMarkdown.defaultRules.link,
  parse: (capture, nestedParse, state) => ({
    content: nestedParse(capture[1], state),
    target: SimpleMarkdown.unescapeUrl(capture[2]),
    suppressed: /^\(\s*</.test(capture[0].slice(capture[1].length + 2)),
  }),
};

const list: Rule = {
  order: rules.blockQuote.order + 0.5,
  match: (source, _state, prevCapture) =>
    /^$|\n *$/.test(prevCapture) ? LIST_REGEX.exec(source) : null,
  parse: (capture, nestedParse, state) => {
    const lines = capture[1].split('\n');
    return {
      ordered: /^ *\d/.test(lines[0]),
      items: lines.map((line) => nestedParse(line.replace(LIST_MARKER_REGEX, ''), state)),
    };
  },
};

const atLineStart = (rule: Rule): Rule => ({
  ...rule,
  match: (source, state, prevCapture) =>
    /^$|\n$/.test(prevCapture) ? rule.match(source, { ...state, prevCapture: null }, prevCapture) : null,
});

const parser = SimpleMarkdown.parserFor({
  ...rules,
  heading: atLineStart(rules.heading),
  subtext: atLineStart(rules.subtext),
  maskedLink,
  list,
});

export function parseDraft(text: string): Node[] {
  return parser(text, { inline: true });
}
